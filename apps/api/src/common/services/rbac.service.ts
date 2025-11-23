import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

interface PolicyStatement {
  Effect: 'Allow' | 'Deny'
  Actions: string[]
  Resources: string[]
  Conditions?: Record<string, unknown>
}

interface UserWithRelations {
  id: number
  status: string
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
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async checkPermission(userId: number, action: string, resource: string): Promise<boolean> {
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

    if (!user || user.status !== 'ACTIVE') {
      return false
    }

    const typedUser = user as unknown as UserWithRelations

    // Collect all policies
    const policies = [
      ...typedUser.userRoles.flatMap((ur) => ur.role.rolePolicies.map((rp) => rp.policy)),
      ...typedUser.userPolicies.map((up) => up.policy),
    ]

    // Evaluate policies (default deny)
    let hasAllow = false
    let hasDeny = false

    for (const policy of policies) {
      if (!Array.isArray(policy.statements)) {
        continue
      }

      const statements = policy.statements as PolicyStatement[]
      for (const statement of statements) {
        if (
          this.matchesPattern(action, statement.Actions) &&
          this.matchesPattern(resource, statement.Resources)
        ) {
          if (statement.Effect === 'Allow') hasAllow = true
          if (statement.Effect === 'Deny') hasDeny = true
        }
      }
    }

    return hasDeny ? false : hasAllow
  }

  private matchesPattern(value: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return regex.test(value)
    })
  }

  async initializeDefaultRolesAndPolicies() {
    // Create default roles
    const roles = [
      { name: 'Admin', description: 'Full system access including user management and audit logs' },
      { name: 'Editor', description: 'Can create and modify content, manage settings' },
      { name: 'Viewer', description: 'Read-only access to view data' },
    ]

    for (const roleData of roles) {
      await this.prisma.role.upsert({
        where: { name: roleData.name },
        update: { description: roleData.description },
        create: roleData,
      })
    }

    // Create default policies
    const policies = [
      {
        name: 'AdminFullAccess',
        description: 'Full access to all resources including audit logs',
        statements: [{ Effect: 'Allow', Actions: ['*'], Resources: ['*'] }],
      },
      {
        name: 'EditorAccess',
        description: 'Can create, read, update content and manage settings',
        statements: [
          {
            Effect: 'Allow',
            Actions: [
              'user:Read',
              'user:Write',
              'user:Update',
              'user:Invite',
              'role:Read',
              'policy:Read',
              'settings:Read',
              'settings:Write',
              'settings:Update',
              'notification:Read',
              'notification:Write',
              'navigation:Read',
              'influencer:Read',
              'influencer:Export',
            ],
            Resources: ['res:*'],
          },
        ],
      },
      {
        name: 'ViewerAccess',
        description: 'Read-only access to view data',
        statements: [
          {
            Effect: 'Allow',
            Actions: [
              'user:Read',
              'role:Read',
              'policy:Read',
              'settings:Read',
              'notification:Read',
              'navigation:Read',
              'influencer:Read',
              'influencer:Export',
            ],
            Resources: ['res:*'],
          },
        ],
      },
    ]

    for (const policyData of policies) {
      await this.prisma.policy.upsert({
        where: { name: policyData.name },
        update: {
          description: policyData.description,
          statements: policyData.statements,
        },
        create: policyData,
      })
    }

    // Attach policies to roles
    const rolePolicyMappings = [
      { roleName: 'Admin', policyName: 'AdminFullAccess' },
      { roleName: 'Editor', policyName: 'EditorAccess' },
      { roleName: 'Viewer', policyName: 'ViewerAccess' },
    ]

    for (const mapping of rolePolicyMappings) {
      const role = await this.prisma.role.findUnique({ where: { name: mapping.roleName } })
      const policy = await this.prisma.policy.findUnique({ where: { name: mapping.policyName } })

      if (role && policy) {
        await this.prisma.rolePolicy.upsert({
          where: {
            unique_role_policy: {
              roleId: role.id,
              policyId: policy.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            policyId: policy.id,
          },
        })
      }
    }

    // Clean up old roles and policies if they exist
    const oldRoles = ['Manager', 'Contributor', 'ReadOnly']
    const oldPolicies = ['ManagerAccess', 'ContributorAccess', 'ReadOnlyAccess']

    for (const oldRole of oldRoles) {
      await this.prisma.role.deleteMany({ where: { name: oldRole } }).catch(() => {})
    }

    for (const oldPolicy of oldPolicies) {
      await this.prisma.policy.deleteMany({ where: { name: oldPolicy } }).catch(() => {})
    }
  }
}
