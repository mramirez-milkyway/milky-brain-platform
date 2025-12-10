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
      description: 'Full access to all resources including audit logs and integrations',
      statements: [{ Effect: 'Allow', Actions: ['*'], Resources: ['*'] }],
    },
    {
      name: 'EditorAccess',
      description: 'Can create, read, update content',
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
            'notification:Read',
            'notification:Write',
            'navigation:Read',
            'influencer:Read',
            'influencer:Export',
            'influencer:Import',
            'client:Import',
            'job:Create',
            'job:Read',
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
            'job:Read',
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
      update: {
        description: policyData.description,
        statements: policyData.statements,
      },
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

  // Create default export control settings for each role
  const exportControlSettings = [
    // Admin: Unlimited access, no watermark, no time limits
    {
      roleName: 'Admin',
      exportType: 'all',
      rowLimit: -1,
      enableWatermark: false,
      dailyLimit: null,
      monthlyLimit: null,
    },
    // Editor: 100 rows, watermark enabled, 20/day, 200/month
    {
      roleName: 'Editor',
      exportType: 'all',
      rowLimit: 100,
      enableWatermark: true,
      dailyLimit: 20,
      monthlyLimit: 200,
    },
    // Viewer: 50 rows, watermark enabled, 10/day, 50/month
    {
      roleName: 'Viewer',
      exportType: 'all',
      rowLimit: 50,
      enableWatermark: true,
      dailyLimit: 10,
      monthlyLimit: 50,
    },
  ]

  console.log('Creating default export control settings...')
  for (const setting of exportControlSettings) {
    const role = await prisma.role.findUnique({ where: { name: setting.roleName } })

    if (role) {
      await prisma.exportControlSettings.upsert({
        where: {
          unique_role_export_type: {
            roleId: role.id,
            exportType: setting.exportType,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          exportType: setting.exportType,
          rowLimit: setting.rowLimit,
          enableWatermark: setting.enableWatermark,
          dailyLimit: setting.dailyLimit,
          monthlyLimit: setting.monthlyLimit,
        },
      })
      console.log(`  ✓ Created export control setting for ${setting.roleName}`)
    }
  }

  // Create mock influencer data for testing
  const mockInfluencers = [
    {
      name: 'Sarah Johnson',
      platform: 'Instagram',
      followers: 125000,
      engagement: 4.2,
      category: 'Fashion',
    },
    {
      name: 'Mike Chen',
      platform: 'YouTube',
      followers: 890000,
      engagement: 6.8,
      category: 'Technology',
    },
    {
      name: 'Emma Rodriguez',
      platform: 'TikTok',
      followers: 2100000,
      engagement: 8.5,
      category: 'Lifestyle',
    },
    {
      name: 'Alex Thompson',
      platform: 'Instagram',
      followers: 450000,
      engagement: 5.1,
      category: 'Fitness',
    },
    {
      name: 'Lisa Park',
      platform: 'YouTube',
      followers: 320000,
      engagement: 4.9,
      category: 'Beauty',
    },
    {
      name: 'David Kim',
      platform: 'TikTok',
      followers: 1500000,
      engagement: 7.3,
      category: 'Comedy',
    },
    {
      name: 'Rachel Green',
      platform: 'Instagram',
      followers: 680000,
      engagement: 5.6,
      category: 'Travel',
    },
    {
      name: 'Tom Wilson',
      platform: 'YouTube',
      followers: 1200000,
      engagement: 6.2,
      category: 'Gaming',
    },
    {
      name: 'Sophie Brown',
      platform: 'Instagram',
      followers: 290000,
      engagement: 4.8,
      category: 'Food',
    },
    {
      name: 'Chris Lee',
      platform: 'TikTok',
      followers: 950000,
      engagement: 7.1,
      category: 'Music',
    },
    {
      name: 'Maya Patel',
      platform: 'Instagram',
      followers: 540000,
      engagement: 5.3,
      category: 'Fashion',
    },
    {
      name: 'Jake Anderson',
      platform: 'YouTube',
      followers: 780000,
      engagement: 5.9,
      category: 'Technology',
    },
    {
      name: 'Olivia Martinez',
      platform: 'TikTok',
      followers: 1800000,
      engagement: 8.2,
      category: 'Dance',
    },
    {
      name: 'Ryan Taylor',
      platform: 'Instagram',
      followers: 410000,
      engagement: 4.6,
      category: 'Fitness',
    },
    {
      name: 'Jessica White',
      platform: 'YouTube',
      followers: 620000,
      engagement: 5.4,
      category: 'Education',
    },
    {
      name: 'Kevin Garcia',
      platform: 'Instagram',
      followers: 850000,
      engagement: 6.1,
      category: 'Sports',
    },
    {
      name: 'Amanda Scott',
      platform: 'TikTok',
      followers: 1100000,
      engagement: 7.5,
      category: 'Lifestyle',
    },
    {
      name: 'Daniel Harris',
      platform: 'YouTube',
      followers: 490000,
      engagement: 5.2,
      category: 'DIY',
    },
    {
      name: 'Nicole Clark',
      platform: 'Instagram',
      followers: 730000,
      engagement: 5.8,
      category: 'Beauty',
    },
    {
      name: 'Brandon Lewis',
      platform: 'TikTok',
      followers: 1300000,
      engagement: 7.8,
      category: 'Comedy',
    },
  ]

  console.log('Creating mock influencer data...')
  const existingInfluencers = await prisma.influencer.count()

  if (existingInfluencers === 0) {
    for (const influencer of mockInfluencers) {
      await prisma.influencer.create({
        data: influencer,
      })
    }
    console.log(`  ✓ Created ${mockInfluencers.length} mock influencers`)
  } else {
    console.log(`  ℹ Skipped - ${existingInfluencers} influencers already exist`)
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
