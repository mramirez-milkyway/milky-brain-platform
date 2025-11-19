import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
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
    private sessionService: SessionService
  ) {}

  async validateGoogleUser(profile: { email: string; name: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    })

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          status: 'ACTIVE',
        },
      })
    }

    // Update last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    })

    return user
  }

  async login(user: User, ipAddress?: string, userAgent?: string) {
    const jti = uuidv4()
    const payload = {
      email: user.email,
      sub: user.id,
      jti,
    }

    const access_token = this.jwtService.sign(payload)

    // Record session in Redis
    await this.sessionService.recordSession(user.id, jti, {
      ipAddress,
      userAgent,
      issuedAt: Math.floor(Date.now() / 1000),
    })

    return {
      access_token,
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
    await this.prisma.$transaction(async (tx) => {
      // Update user status and name
      await tx.user.update({
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
    })

    // Return the activated user
    return this.prisma.user.findUnique({
      where: { id: invitation.userId },
    })
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
