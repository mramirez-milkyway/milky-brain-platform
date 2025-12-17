import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration
const BATCH_SIZE = 1000
const DEFAULT_COUNT = 100000

// Data pools for realistic distribution
const PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const
const GENDERS = ['male', 'female'] as const
const CATEGORIES = [
  'beauty',
  'fashion',
  'gaming',
  'food',
  'travel',
  'fitness',
  'tech',
  'music',
  'comedy',
  'lifestyle',
  'education',
  'sports',
  'art',
  'photography',
  'parenting',
] as const
const COUNTRIES = [
  'US',
  'ES',
  'MX',
  'AR',
  'CO',
  'BR',
  'UK',
  'FR',
  'DE',
  'IT',
  'PT',
  'CL',
  'PE',
  'EC',
  'VE',
] as const
const LANGUAGES = ['en', 'es', 'pt', 'fr', 'de', 'it'] as const
const TIERS = ['nano', 'micro', 'mid', 'macro', 'mega'] as const

// Follower ranges by tier
const FOLLOWER_RANGES: Record<string, { min: number; max: number }> = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  mid: { min: 100000, max: 500000 },
  macro: { min: 500000, max: 1000000 },
  mega: { min: 1000000, max: 50000000 },
}

function generateCreator() {
  const gender = faker.helpers.arrayElement(GENDERS)
  const country = faker.helpers.arrayElement(COUNTRIES)
  const categories = faker.helpers.arrayElements(CATEGORIES, {
    min: 1,
    max: 3,
  })
  const languages = faker.helpers.arrayElements(LANGUAGES, { min: 1, max: 2 })

  return {
    fullName: faker.person.fullName({ sex: gender }),
    gender,
    country,
    city: faker.location.city(),
    email: faker.internet.email().toLowerCase(),
    phoneNumber: faker.phone.number(),
    characteristics: faker.helpers.maybe(() => faker.lorem.sentence(), {
      probability: 0.3,
    }),
    pastClients: faker.helpers.maybe(() => faker.company.name() + ', ' + faker.company.name(), {
      probability: 0.2,
    }),
    pastCampaigns: faker.helpers.maybe(() => faker.lorem.words(3), {
      probability: 0.2,
    }),
    comments: faker.helpers.maybe(() => faker.lorem.paragraph(), {
      probability: 0.1,
    }),
    isActive: faker.datatype.boolean({ probability: 0.95 }),
    languages: JSON.stringify(languages),
    categories: JSON.stringify(categories),
    internalTags: faker.helpers.maybe(
      () =>
        JSON.stringify(
          faker.helpers.arrayElements(['VIP', 'priority', 'new', 'verified'], { min: 1, max: 2 })
        ),
      { probability: 0.2 }
    ),
    isBlacklisted: faker.datatype.boolean({ probability: 0.05 }), // 5% blacklisted
    blacklistReason: null as string | null,
    agencyName: faker.helpers.maybe(() => faker.company.name(), {
      probability: 0.3,
    }),
    managerName: faker.helpers.maybe(() => faker.person.fullName(), {
      probability: 0.2,
    }),
    billingInfo: faker.helpers.maybe(() => faker.lorem.sentence(), {
      probability: 0.1,
    }),
    lastBrand: faker.helpers.maybe(() => faker.company.name(), {
      probability: 0.4,
    }),
    campaignsActive: faker.number.int({ min: 0, max: 5 }),
    lastCampaignCompleted: faker.helpers.maybe(() => faker.date.past({ years: 1 }), {
      probability: 0.5,
    }),
    lastFee: faker.helpers.maybe(
      () => faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
      { probability: 0.4 }
    ),
    lastFeeDate: faker.helpers.maybe(() => faker.date.past({ years: 1 }), {
      probability: 0.3,
    }),
    lastFeeContentType: faker.helpers.maybe(
      () => faker.helpers.arrayElement(['post', 'story', 'reel', 'video']),
      { probability: 0.3 }
    ),
    lastCpv: faker.helpers.maybe(
      () => faker.number.float({ min: 0.01, max: 1, fractionDigits: 3 }),
      { probability: 0.2 }
    ),
    lastCpm: faker.helpers.maybe(() => faker.number.float({ min: 1, max: 50, fractionDigits: 2 }), {
      probability: 0.2,
    }),
    internalRating: faker.helpers.maybe(
      () => faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
      { probability: 0.6 }
    ),
  }
}

// Counter for unique handle generation
let handleCounter = 0

function generateCreatorSocial(creatorId: number) {
  // Each creator has 1-3 social accounts
  const numSocials = faker.number.int({ min: 1, max: 3 })
  const platforms = faker.helpers.arrayElements(PLATFORMS, numSocials)

  return platforms.map((platform) => {
    const tier = faker.helpers.weightedArrayElement([
      { value: 'nano', weight: 40 },
      { value: 'micro', weight: 30 },
      { value: 'mid', weight: 15 },
      { value: 'macro', weight: 10 },
      { value: 'mega', weight: 5 },
    ])
    const range = FOLLOWER_RANGES[tier]
    const followers = faker.number.int({ min: range.min, max: range.max })

    // Generate unique handle with counter suffix
    handleCounter++
    const baseHandle = faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
    const handle = `@${baseHandle}_${handleCounter}`

    return {
      creatorId,
      socialMedia: platform,
      handle,
      followers,
      tier,
      socialLink: `https://${platform}.com/${baseHandle}_${handleCounter}`,
    }
  })
}

function generateAudienceAge(creatorSocialId: number) {
  // Generate audience demographics that sum to ~100%
  const pctWomen = faker.number.float({ min: 20, max: 80, fractionDigits: 2 })
  const pctMen = 100 - pctWomen

  // Age distribution (should roughly sum to 100)
  const ages = {
    pctAge1824: faker.number.float({ min: 5, max: 40, fractionDigits: 2 }),
    pctAge2534: faker.number.float({ min: 10, max: 40, fractionDigits: 2 }),
    pctAge3544: faker.number.float({ min: 5, max: 30, fractionDigits: 2 }),
    pctAge4554: faker.number.float({ min: 2, max: 20, fractionDigits: 2 }),
    pctAge5564: faker.number.float({ min: 1, max: 10, fractionDigits: 2 }),
    pctAge65Plus: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
  }

  return {
    creatorSocialId,
    engagementRate: faker.number.float({ min: 0.5, max: 15, fractionDigits: 2 }),
    pctWomen,
    pctMen,
    ...ages,
    followersCredibility: faker.number.float({
      min: 50,
      max: 100,
      fractionDigits: 2,
    }),
    dataSource: 'faker-seed',
  }
}

function generateAudienceCountry(creatorSocialId: number) {
  // Top 3-5 countries for this creator's audience
  const numCountries = faker.number.int({ min: 3, max: 5 })
  const countries = faker.helpers.arrayElements(COUNTRIES, numCountries)
  let remainingPct = 100

  return countries.map((country, index) => {
    const isLast = index === countries.length - 1
    const pct = isLast
      ? remainingPct
      : faker.number.float({
          min: 5,
          max: Math.min(50, remainingPct - 5 * (countries.length - index - 1)),
          fractionDigits: 2,
        })
    remainingPct -= pct

    return {
      creatorSocialId,
      rank: index + 1,
      country,
      pct,
      city: faker.location.city(),
    }
  })
}

async function seedInfluencers(count: number) {
  console.log(`Starting seed of ${count.toLocaleString()} influencers...`)
  const startTime = Date.now()

  const totalBatches = Math.ceil(count / BATCH_SIZE)

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchSize = Math.min(BATCH_SIZE, count - batch * BATCH_SIZE)
    const batchStart = Date.now()

    // Generate creators for this batch
    const creators = Array.from({ length: batchSize }, () => generateCreator())

    // Add blacklist reason for blacklisted creators
    creators.forEach((c) => {
      if (c.isBlacklisted) {
        c.blacklistReason = faker.helpers.arrayElement([
          'Poor content quality',
          'Missed deadlines repeatedly',
          'Fake followers detected',
          'Contract violation',
          'Unprofessional behavior',
        ])
      }
    })

    // Insert creators
    const createdCreators = await prisma.creator.createManyAndReturn({
      data: creators,
      select: { id: true },
    })

    // Generate and insert socials for each creator
    const allSocials: ReturnType<typeof generateCreatorSocial> = []
    for (const creator of createdCreators) {
      allSocials.push(...generateCreatorSocial(creator.id))
    }

    // Batch insert socials
    const createdSocials = await prisma.creatorSocial.createManyAndReturn({
      data: allSocials,
      select: { id: true },
    })

    // Generate audience data for each social
    const allAudienceAges = createdSocials.map((s) => generateAudienceAge(s.id))
    const allAudienceCountries = createdSocials.flatMap((s) => generateAudienceCountry(s.id))

    // Batch insert audience data
    await prisma.creatorSocialAudienceAge.createMany({
      data: allAudienceAges,
    })

    await prisma.creatorSocialAudienceCountry.createMany({
      data: allAudienceCountries,
    })

    const batchTime = ((Date.now() - batchStart) / 1000).toFixed(2)
    const progress = (((batch + 1) / totalBatches) * 100).toFixed(1)
    console.log(
      `Batch ${batch + 1}/${totalBatches} (${progress}%) - ${batchSize} creators in ${batchTime}s`
    )

    // Log progress every 10 batches
    if ((batch + 1) % 10 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(2)
      const remaining =
        (((Date.now() - startTime) / (batch + 1)) * (totalBatches - batch - 1)) / 1000 / 60
      console.log(
        `  Progress: ${((batch + 1) * BATCH_SIZE).toLocaleString()} creators, ${elapsed} min elapsed, ~${remaining.toFixed(2)} min remaining`
      )
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2)
  console.log(`\nSeed complete! ${count.toLocaleString()} creators in ${totalTime} minutes`)

  // Print summary stats
  const stats = await prisma.creator.aggregate({
    _count: true,
    _avg: { internalRating: true },
  })
  const blacklistedCount = await prisma.creator.count({
    where: { isBlacklisted: true },
  })
  const socialCount = await prisma.creatorSocial.count()

  console.log('\nSummary:')
  console.log(`  Total creators: ${stats._count.toLocaleString()}`)
  console.log(
    `  Blacklisted: ${blacklistedCount.toLocaleString()} (${((blacklistedCount / stats._count) * 100).toFixed(1)}%)`
  )
  console.log(`  Social accounts: ${socialCount.toLocaleString()}`)
  console.log(`  Avg internal rating: ${stats._avg.internalRating?.toFixed(1) ?? 'N/A'}`)
}

async function main() {
  const args = process.argv.slice(2)
  let count = DEFAULT_COUNT

  // Parse --count argument
  const countArg = args.find((a) => a.startsWith('--count='))
  if (countArg) {
    count = parseInt(countArg.split('=')[1], 10)
    if (isNaN(count) || count < 1) {
      console.error('Invalid count. Using default:', DEFAULT_COUNT)
      count = DEFAULT_COUNT
    }
  }

  // Check for --clear flag
  if (args.includes('--clear')) {
    console.log('Clearing existing creator data...')
    await prisma.creatorSocialAudienceCity.deleteMany({})
    await prisma.creatorSocialAudienceCountry.deleteMany({})
    await prisma.creatorSocialAudienceAge.deleteMany({})
    await prisma.creatorSocial.deleteMany({})
    await prisma.creator.deleteMany({})
    console.log('Cleared.')
  }

  await seedInfluencers(count)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
