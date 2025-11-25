import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { User } from '@prisma/client'
import { SessionService } from './services/session.service'
import { v4 as uuidv4 } from 'uuid'

interface PolicyStatement {
  Effect: 'Allow' | 'Deny'
  Actions: string[]
  Resources: string[]
  Conditions?: Record<string, unknown>
}

interface UserWithRelations {
  id: number
  email: string
  name: string
  userRoles: Array<{
    role: {
      rolePolicies: Array<{
        policy: {
          id: number
          name: string
          statements: unknown
        }
      }>
    }
  }>
  userPolicies: Array<{
    policy: {
      id: number
      name: string
      statements: unknown
    }
  }>
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService,
    private configService: ConfigService
  ) {}

  async validateGoogleUser(profile: { email: string; name: string }, allowInvited = false) {
    // Validate domain restriction
    const allowedDomains = this.configService
      .get<string>('ALLOWED_INVITE_DOMAINS')
      ?.split(',')
      .map((d) => d.trim()) || ['milkyway-agency.com']

    const userDomain = profile.email.split('@')[1]

    if (!allowedDomains.includes(userDomain)) {
      throw new UnauthorizedException('Invalid email domain. Please use an authorized domain.')
    }

    // Check if user exists and has valid invitation
    const user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    })

    if (!user) {
      throw new UnauthorizedException(
        'No invitation found. Please contact your administrator to get invited.'
      )
    }

    // Check user status
    if (user.status === 'DEACTIVATED') {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact your administrator.'
      )
    }

    // If user is INVITED, they must use the invitation acceptance flow
    // unless this is being called from the acceptance flow itself
    if (user.status === 'INVITED' && !allowInvited) {
      throw new UnauthorizedException(
        'Please accept your invitation first using the link sent to your email.'
      )
    }

    // Only ACTIVE users can log in via regular OAuth flow (or INVITED during acceptance)
    // Update last seen only for ACTIVE users
    if (user.status === 'ACTIVE') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      })
    }

    return user
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: number): { token: string; tokenId: string } {
    const tokenId = uuidv4()
    const refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      'default-refresh-secret-change-in-production'

    const refreshTokenExpiry = this.configService.get<string>('REFRESH_TOKEN_EXPIRY') || '30d'

    const payload = {
      sub: userId,
      tokenId,
      type: 'refresh',
    }

    const token = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenExpiry,
    })

    return { token, tokenId }
  }

  async login(user: User, ipAddress?: string, userAgent?: string) {
    const jti = uuidv4()
    const payload = {
      email: user.email,
      sub: user.id,
      jti,
    }

    const access_token = this.jwtService.sign(payload)

    // Generate refresh token
    const { token: refresh_token, tokenId: refreshTokenId } = this.generateRefreshToken(user.id)

    // Record session in Redis
    await this.sessionService.recordSession(user.id, jti, {
      ipAddress,
      userAgent,
      issuedAt: Math.floor(Date.now() / 1000),
    })

    // Store refresh token in Redis
    await this.sessionService.storeRefreshToken(user.id, refreshTokenId, {
      jti,
      issuedAt: Math.floor(Date.now() / 1000),
      ipAddress,
      userAgent,
    })

    return {
      access_token,
      refresh_token,
    }
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<{ userId: number; tokenId: string }> {
    const refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      'default-refresh-secret-change-in-production'

    try {
      const payload = this.jwtService.verify(token, {
        secret: refreshTokenSecret,
      }) as { sub: number; tokenId: string; type: string }

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type')
      }

      // Check if token exists in Redis
      const metadata = await this.sessionService.getRefreshToken(payload.sub, payload.tokenId)

      if (!metadata) {
        throw new UnauthorizedException('Refresh token not found or expired')
      }

      return {
        userId: payload.sub,
        tokenId: payload.tokenId,
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }
  }

  /**
   * Refresh access token with token rotation
   */
  async refreshAccessToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Validate refresh token
    const { userId, tokenId } = await this.validateRefreshToken(refreshToken)

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active')
    }

    // Check for token reuse (potential theft)
    const existingToken = await this.sessionService.getRefreshToken(userId, tokenId)

    if (!existingToken) {
      // Token was already used/deleted - possible theft
      // Revoke all user sessions as security measure
      await this.sessionService.revokeAllUserSessions(userId, 'Refresh token reuse detected')
      await this.sessionService.revokeAllRefreshTokens(userId)
      throw new UnauthorizedException('Token reuse detected. All sessions revoked.')
    }

    // Delete old refresh token
    await this.sessionService.deleteRefreshToken(userId, tokenId)

    // Blacklist old access token
    if (existingToken.jti) {
      await this.sessionService.blacklistToken(
        existingToken.jti,
        userId,
        'Token rotated',
        12 * 60 * 60 // 12 hours
      )
    }

    // Generate new tokens
    const newJti = uuidv4()
    const accessPayload = {
      email: user.email,
      sub: user.id,
      jti: newJti,
    }

    const access_token = this.jwtService.sign(accessPayload)
    const { token: new_refresh_token, tokenId: newRefreshTokenId } = this.generateRefreshToken(
      user.id
    )

    // Record new session
    await this.sessionService.recordSession(user.id, newJti, {
      ipAddress,
      userAgent,
      issuedAt: Math.floor(Date.now() / 1000),
    })

    // Store new refresh token
    await this.sessionService.storeRefreshToken(user.id, newRefreshTokenId, {
      jti: newJti,
      issuedAt: Math.floor(Date.now() / 1000),
      ipAddress,
      userAgent,
    })

    return {
      access_token,
      refresh_token: new_refresh_token,
    }
  }

  async getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    })
  }

  async getPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePolicies: {
                  include: { policy: true },
                },
              },
            },
          },
        },
        userPolicies: {
          include: { policy: true },
        },
      },
    })

    if (!user) {
      return []
    }

    const typedUser = user as unknown as UserWithRelations

    const policies = [
      ...typedUser.userRoles.flatMap((ur) => ur.role.rolePolicies.map((rp) => rp.policy)),
      ...typedUser.userPolicies.map((up) => up.policy),
    ]

    const permissions: Array<{
      policy: string
      actions: string[]
      resources: string[]
    }> = []

    for (const policy of policies) {
      if (!Array.isArray(policy.statements)) {
        continue
      }

      const statements = policy.statements as PolicyStatement[]
      for (const statement of statements) {
        if (statement.Effect === 'Allow') {
          permissions.push({
            policy: policy.name,
            actions: statement.Actions,
            resources: statement.Resources,
          })
        }
      }
    }

    return permissions
  }

  async acceptInvitation(token: string, googleProfile: { email: string; name: string }) {
    // Validate the Google user with allowInvited=true to bypass INVITED status check
    await this.validateGoogleUser(googleProfile, true)

    // Find invitation by token
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { token },
      include: {
        user: true,
      },
    })

    if (!invitation) {
      throw new UnauthorizedException('Invalid invitation token')
    }

    // Check if token is expired
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation token has expired')
    }

    // Verify email matches
    if (invitation.user.email !== googleProfile.email) {
      throw new BadRequestException('The Google account email does not match the invitation email')
    }

    // Check if user is already active
    if (invitation.user.status === 'ACTIVE') {
      throw new BadRequestException('This invitation has already been accepted')
    }

    // Activate user and delete invitation token in a transaction
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update user status and name
      const user = await tx.user.update({
        where: { id: invitation.userId },
        data: {
          status: 'ACTIVE',
          name: googleProfile.name,
          lastSeenAt: new Date(),
        },
      })

      // Delete invitation token
      await tx.userInvitation.delete({
        where: { id: invitation.id },
      })

      return user
    })

    return updatedUser
  }

  async verifyInvitationToken(token: string) {
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    })

    if (!invitation) {
      return { valid: false, error: 'Invalid invitation token' }
    }

    if (invitation.expiresAt < new Date()) {
      return { valid: false, error: 'Invitation token has expired' }
    }

    if (invitation.user.status === 'ACTIVE') {
      return { valid: false, error: 'This invitation has already been accepted' }
    }

    return {
      valid: true,
      user: {
        email: invitation.user.email,
        name: invitation.user.name,
        roles: invitation.user.userRoles.map((ur) => ur.role.name),
      },
    }
  }
}
