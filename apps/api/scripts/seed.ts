import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create default roles
  const roles = [
    { name: 'Admin', description: 'Full system access including user management and audit logs' },
    { name: 'Editor', description: 'Can create and modify content, manage settings' },
    { name: 'Viewer', description: 'Read-only access to view data' },
  ]

  console.log('Creating roles...')
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    })
    console.log(`  ✓ ${roleData.name}`)
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
          ],
          Resources: ['res:*'],
        },
      ],
    },
  ]

  console.log('Creating policies...')
  for (const policyData of policies) {
    await prisma.policy.upsert({
      where: { name: policyData.name },
      update: {},
      create: policyData,
    })
    console.log(`  ✓ ${policyData.name}`)
  }

  // Attach policies to roles
  const rolePolicyMappings = [
    { roleName: 'Admin', policyName: 'AdminFullAccess' },
    { roleName: 'Editor', policyName: 'EditorAccess' },
    { roleName: 'Viewer', policyName: 'ViewerAccess' },
  ]

  console.log('Attaching policies to roles...')
  for (const mapping of rolePolicyMappings) {
    const role = await prisma.role.findUnique({ where: { name: mapping.roleName } })
    const policy = await prisma.policy.findUnique({ where: { name: mapping.policyName } })

    if (role && policy) {
      await prisma.rolePolicy.upsert({
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
      console.log(`  ✓ Attached ${mapping.policyName} to ${mapping.roleName}`)
    }
  }

  // Clean up old roles and policies if they exist
  const oldRoles = ['Manager', 'Contributor', 'ReadOnly']
  const oldPolicies = ['ManagerAccess', 'ContributorAccess', 'ReadOnlyAccess']

  console.log('Cleaning up old roles and policies...')
  for (const oldRole of oldRoles) {
    const deleted = await prisma.role.deleteMany({ where: { name: oldRole } })
    if (deleted.count > 0) {
      console.log(`  ✓ Deleted role: ${oldRole}`)
    }
  }

  for (const oldPolicy of oldPolicies) {
    const deleted = await prisma.policy.deleteMany({ where: { name: oldPolicy } })
    if (deleted.count > 0) {
      console.log(`  ✓ Deleted policy: ${oldPolicy}`)
    }
  }

  // Find the first user (you) and assign Admin role
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (firstUser) {
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } })

    if (adminRole) {
      await prisma.userRole.upsert({
        where: {
          unique_user_role: {
            userId: firstUser.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: firstUser.id,
          roleId: adminRole.id,
        },
      })
      console.log(`  ✓ Assigned Admin role to user: ${firstUser.email}`)
    }
  }

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
