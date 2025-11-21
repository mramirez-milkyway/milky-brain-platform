import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { InviteUserDto, UpdateUserDto } from './dto/user.dto'
import { EmailService } from '../notifications/email/email.service'
import { SessionService } from '../auth/services/session.service'
import { randomBytes } from 'crypto'

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
    private sessionService: SessionService
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  async invite(
    inviteDto: InviteUserDto,
    inviterUserId: number,
    inviterEmail: string,
    inviterName: string
  ) {
    // Validate inviter's domain
    this.validateInviterDomain(inviterEmail)

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: inviteDto.email },
    })

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists')
    }

    // Use transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: inviteDto.email,
          name: inviteDto.name || inviteDto.email,
          status: 'INVITED',
        },
      })

      // Assign role if provided
      if (inviteDto.roleId) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: inviteDto.roleId,
          },
        })
      }

      // Generate invitation token
      const token = this.generateInvitationToken()
      const expiryDays = this.configService.get<number>('INVITATION_EXPIRY_DAYS') || 30
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)

      await tx.userInvitation.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      })

      // Get role name for email
      let roleName = 'User'
      if (inviteDto.roleId) {
        const role = await tx.role.findUnique({
          where: { id: inviteDto.roleId },
        })
        roleName = role?.name || 'User'
      }

      // Send invitation email
      try {
        await this.emailService.sendInvitationEmail(
          inviteDto.email,
          token,
          roleName,
          inviterName,
          inviterUserId
        )
      } catch (error) {
        // Rollback transaction by throwing
        throw new Error(`Failed to send invitation email: ${error.message}`)
      }

      return user
    })
  }

  async resendInvitation(userId: number, inviterUserId: number, inviterName: string) {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (user.status !== 'INVITED') {
      throw new BadRequestException('Cannot resend invitation for non-invited users')
    }

    return await this.prisma.$transaction(async (tx) => {
      // Delete old invitation token
      await tx.userInvitation.deleteMany({
        where: { userId },
      })

      // Generate new token
      const token = this.generateInvitationToken()
      const expiryDays = this.configService.get<number>('INVITATION_EXPIRY_DAYS') || 30
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)

      await tx.userInvitation.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      })

      // Get role name
      const roleName = user.userRoles[0]?.role.name || 'User'

      // Send new invitation email
      try {
        await this.emailService.sendInvitationEmail(
          user.email,
          token,
          roleName,
          inviterName,
          inviterUserId
        )
      } catch (error) {
        throw new Error(`Failed to send invitation email: ${error.message}`)
      }

      return { success: true, message: 'Invitation resent successfully' }
    })
  }

  async cancelInvitation(userId: number, currentUserId: number) {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (user.status !== 'INVITED') {
      throw new BadRequestException('Cannot cancel invitation for non-invited users')
    }

    // Delete user and invitation token (cascade will handle invitation)
    await this.prisma.user.delete({
      where: { id: userId },
    })

    return { success: true, message: 'Invitation canceled successfully' }
  }

  async update(id: number, updateDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateDto,
    })
  }

  async deactivate(id: number, currentUserId: number) {
    // Prevent self-deactivation
    if (id === currentUserId) {
      throw new BadRequestException(
        'You cannot deactivate your own account. Please contact another administrator.'
      )
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Update user status
    await this.prisma.user.update({
      where: { id },
      data: { status: 'DEACTIVATED' },
    })

    // Revoke all active sessions and refresh tokens if user is ACTIVE
    if (user.status === 'ACTIVE') {
      await this.sessionService.revokeAllUserSessions(id, 'User deactivated')
      await this.sessionService.revokeAllRefreshTokens(id)
    }

    // Invalidate invitation tokens if user is INVITED
    if (user.status === 'INVITED') {
      await this.prisma.userInvitation.deleteMany({
        where: { userId: id },
      })
    }

    return { success: true, message: 'User deactivated successfully' }
  }

  async getUserRoles(userId: number) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })
    return userRoles.map((ur) => ur.role)
  }

  async assignRole(userId: number, roleId: number) {
    // Get user to check status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Check if role assignment already exists
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
    })

    if (existing) {
      throw new BadRequestException('User already has this role')
    }

    // Assign role
    await this.prisma.userRole.create({
      data: { userId, roleId },
    })

    // Revoke sessions and refresh tokens only for ACTIVE users
    if (user.status === 'ACTIVE') {
      await this.sessionService.revokeAllUserSessions(userId, 'Role changed')
      await this.sessionService.revokeAllRefreshTokens(userId)
    }

    return { success: true, message: 'Role assigned successfully' }
  }

  async removeRole(userId: number, roleId: number) {
    // Get user to check status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Remove role
    const result = await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    })

    if (result.count === 0) {
      throw new NotFoundException('User does not have this role')
    }

    // Revoke sessions and refresh tokens only for ACTIVE users
    if (user.status === 'ACTIVE') {
      await this.sessionService.revokeAllUserSessions(userId, 'Role changed')
      await this.sessionService.revokeAllRefreshTokens(userId)
    }

    return { success: true, message: 'Role removed successfully' }
  }

  private validateInviterDomain(inviterEmail: string): void {
    const allowedDomainsStr = this.configService.get<string>('ALLOWED_INVITE_DOMAINS')

    // If not configured, allow all (fallback behavior)
    if (!allowedDomainsStr) {
      return
    }

    const allowedDomains = allowedDomainsStr.split(',').map((d) => d.trim())
    const inviterDomain = inviterEmail.split('@')[1]

    if (!allowedDomains.includes(inviterDomain)) {
      throw new ForbiddenException('Invitations restricted to authorized domains')
    }
  }

  private generateInvitationToken(): string {
    // Generate 32 random bytes and encode as base64url
    return randomBytes(32).toString('base64url')
  }
}
