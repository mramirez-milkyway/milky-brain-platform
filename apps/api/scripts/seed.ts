import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default roles
  const roles = [
    { name: 'Admin', description: 'Full system access' },
    { name: 'Manager', description: 'Manage modules and data' },
    { name: 'Contributor', description: 'Day-to-day work' },
    { name: 'ReadOnly', description: 'Read-only access' },
  ];

  console.log('Creating roles...');
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`  ✓ ${roleData.name}`);
  }

  // Create default policies
  const policies = [
    {
      name: 'AdminFullAccess',
      description: 'Full access to all resources',
      statements: [{ Effect: 'Allow', Actions: ['*'], Resources: ['*'] }],
    },
    {
      name: 'ManagerAccess',
      description: 'Manage modules and data',
      statements: [
        {
          Effect: 'Allow',
          Actions: ['user:Read', 'role:Read', 'settings:*', 'audit:Read', 'policy:Read'],
          Resources: ['res:*'],
        },
      ],
    },
    {
      name: 'ContributorAccess',
      description: 'Day-to-day work',
      statements: [
        {
          Effect: 'Allow',
          Actions: ['user:Read', 'role:Read', 'policy:Read'],
          Resources: ['res:*'],
        },
      ],
    },
    {
      name: 'ReadOnlyAccess',
      description: 'Read-only access',
      statements: [
        {
          Effect: 'Allow',
          Actions: ['user:Read', 'role:Read', 'policy:Read', 'audit:Read'],
          Resources: ['res:*'],
        },
      ],
    },
  ];

  console.log('Creating policies...');
  for (const policyData of policies) {
    await prisma.policy.upsert({
      where: { name: policyData.name },
      update: {},
      create: policyData,
    });
    console.log(`  ✓ ${policyData.name}`);
  }

  // Attach AdminFullAccess policy to Admin role
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const adminPolicy = await prisma.policy.findUnique({ where: { name: 'AdminFullAccess' } });

  if (adminRole && adminPolicy) {
    await prisma.rolePolicy.upsert({
      where: {
        unique_role_policy: {
          roleId: adminRole.id,
          policyId: adminPolicy.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        policyId: adminPolicy.id,
      },
    });
    console.log('Attached AdminFullAccess policy to Admin role');
  }

  // Attach ManagerAccess policy to Manager role
  const managerRole = await prisma.role.findUnique({ where: { name: 'Manager' } });
  const managerPolicy = await prisma.policy.findUnique({ where: { name: 'ManagerAccess' } });

  if (managerRole && managerPolicy) {
    await prisma.rolePolicy.upsert({
      where: {
        unique_role_policy: {
          roleId: managerRole.id,
          policyId: managerPolicy.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        policyId: managerPolicy.id,
      },
    });
    console.log('Attached ManagerAccess policy to Manager role');
  }

  // Find the first user (you) and assign Admin role
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (firstUser && adminRole) {
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
    });
    console.log(`Assigned Admin role to user: ${firstUser.email}`);
  }

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
