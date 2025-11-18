import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { User } from '@prisma/client'

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
    private jwtService: JwtService
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

  async login(user: User) {
    const payload = { email: user.email, sub: user.id }
    return {
      access_token: this.jwtService.sign(payload),
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
}
