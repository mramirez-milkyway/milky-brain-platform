# Design: Add Influencer Advanced Filters

## Context
The Influencer Directory currently supports only pagination. Users need to filter through 100k+ influencers based on demographics, performance metrics, and internal status. The filtering engine must mirror IMAI's dashboard behavior while adding internal-only filters (blacklist, internal rating, etc.).

Key constraints:
- PostgreSQL database with Prisma ORM
- Must handle 100k+ records with sub-500ms response times
- Filters stored in URL for bookmarking/sharing
- Platform filter is mandatory and single-select
- Blacklist exclusion must be ON by default

## Goals / Non-Goals

**Goals:**
- Implement all filters from IMAI spec plus internal filters
- Maintain query performance at scale (100k+ creators)
- Persist filters in URL query parameters
- Provide clear UI indicating active filters
- Default to safe state (exclude blacklisted)

**Non-Goals:**
- Saving "Filter Sets" for later use
- Complex text search (fuzzy matching)
- Real-time filter suggestions/autocomplete
- Export filtered results (handled by existing export feature)

## Decisions

### Decision 1: Filter Architecture - Query Parameter Based
**What:** Store all active filters in URL query parameters
**Why:** Enables bookmarking, sharing filtered views, and browser back/forward navigation
**Example:** `/influencers?platform=instagram&excludeBlacklisted=true&minFollowers=10000&country=US,ES`

### Decision 2: Platform as Required Filter
**What:** The social media platform filter (instagram/tiktok/youtube) is mandatory and single-select
**Why:** Most metrics (followers, engagement, views) are platform-specific. Querying without a platform would require complex multi-join queries and confusing mixed results.
**Default:** `instagram` when no platform specified

### Decision 3: AND Logic for All Filters
**What:** All filters combine with AND logic (not OR)
**Why:** Users expect narrowing behavior - each filter should reduce results. OR logic creates confusion and unexpected result expansion.
**Example:** `country=US AND gender=female AND minFollowers=10000`

### Decision 4: Prisma with Raw SQL Fallback
**What:** Use Prisma query builder for simple filters; raw SQL for complex joins/aggregations
**Why:** Prisma generates acceptable queries for basic filters but may produce suboptimal plans for:
- JSON array contains queries (categories, languages)
- Audience demographic percentage thresholds
- EXISTS subqueries (hasWorkedWithUs)

**Implementation:**
```typescript
// Simple filters: Prisma
const where = {
  isBlacklisted: excludeBlacklisted ? false : undefined,
  country: countries ? { in: countries } : undefined,
  gender: gender ?? undefined,
};

// Complex filters: Raw SQL via Prisma.$queryRaw
if (hasAudienceFilters) {
  return this.prisma.$queryRaw`
    SELECT c.* FROM "Creator" c
    JOIN "CreatorSocial" cs ON cs."creatorId" = c.id
    JOIN "CreatorSocialAudienceAge" aa ON aa."creatorSocialId" = cs.id
    WHERE cs."socialMedia" = ${platform}
    AND aa."genderFemale" >= ${minFemalePercent}
    ...
  `;
}
```

### Decision 5: Database Indexes
**What:** Add targeted indexes for filter columns

```sql
-- Creator table
CREATE INDEX idx_creator_blacklisted ON "Creator" ("isBlacklisted") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_creator_country ON "Creator" ("country") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_creator_gender ON "Creator" ("gender") WHERE "deletedAt" IS NULL;
CREATE INDEX idx_creator_rating ON "Creator" ("internalRating") WHERE "deletedAt" IS NULL;

-- CreatorSocial table  
CREATE INDEX idx_creator_social_platform ON "CreatorSocial" ("socialMedia", "creatorId");
CREATE INDEX idx_creator_social_followers ON "CreatorSocial" ("followers");
CREATE INDEX idx_creator_social_handle ON "CreatorSocial" ("handle");

-- Composite index for common filter combination
CREATE INDEX idx_creator_common_filters ON "Creator" ("isBlacklisted", "country", "gender") WHERE "deletedAt" IS NULL;
```

### Decision 6: Filter DTO Structure
**What:** Single flat DTO with all filter parameters, grouped by category in comments

```typescript
export class CreatorFilterDto {
  // === Required ===
  @IsEnum(['instagram', 'tiktok', 'youtube'])
  platform: string = 'instagram';

  // === Basic ===
  @IsOptional() @IsString()
  handle?: string;

  // === Demographics - Creator ===
  @IsOptional() @IsArray() @MaxLength(5, { each: false })
  country?: string[];
  
  @IsOptional() @IsEnum(['any', 'male', 'female', 'organization'])
  gender?: string;
  
  @IsOptional() @IsString()
  language?: string;
  
  @IsOptional() @IsInt() @Min(13)
  minAge?: number;
  
  @IsOptional() @IsInt() @Max(100)
  maxAge?: number;

  // === Demographics - Audience ===
  @IsOptional() @IsArray()
  audienceCountry?: string[];
  
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  audienceCountryMinPercent?: number;
  
  // ... similar for audienceGender, audienceAge, audienceLanguage

  // === Performance ===
  @IsOptional() @IsInt() @Min(0)
  minFollowers?: number;
  
  @IsOptional() @IsInt()
  maxFollowers?: number;
  
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  minEngagementRate?: number;
  
  // ... similar for reelsPlays, tiktokViews, saves, shares, credibility

  // === Internal ===
  @IsOptional() @IsArray()
  categories?: string[];
  
  @IsOptional() @Transform(({ value }) => value !== 'false')
  excludeBlacklisted?: boolean = true;
  
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  minInternalRating?: number;
  
  @IsOptional() @IsBoolean()
  hasWorkedWithUs?: boolean;

  // === Pagination (inherited) ===
  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;
  
  @IsOptional() @IsInt() @Min(1) @Max(100)
  pageSize?: number = 20;
}
```

### Decision 7: Frontend Filter Hook Pattern
**What:** Custom hook that syncs filter state with URL parameters

```typescript
export function useInfluencerFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current filters from URL
  const filters = useMemo(() => ({
    platform: searchParams.get('platform') || 'instagram',
    excludeBlacklisted: searchParams.get('excludeBlacklisted') !== 'false',
    // ... parse all filter params
  }), [searchParams]);

  // Update URL when filters change
  const setFilters = useCallback((newFilters: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });
    params.set('page', '1'); // Reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const clearFilters = useCallback(() => {
    router.push(`${pathname}?platform=instagram&excludeBlacklisted=true`);
  }, [router, pathname]);

  return { filters, setFilters, clearFilters };
}
```

### Decision 8: Seeder Implementation
**What:** Faker-based seeder with batch inserts for 100k+ records

```typescript
// apps/api/prisma/seeds/seed-influencers.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const BATCH_SIZE = 1000;
const platforms = ['instagram', 'tiktok', 'youtube'];
const genders = ['male', 'female'];
const categories = ['beauty', 'fashion', 'gaming', 'food', 'travel', 'fitness', 'tech', 'music', 'comedy', 'lifestyle'];
const countries = ['US', 'ES', 'MX', 'AR', 'CO', 'BR', 'UK', 'FR', 'DE', 'IT'];

async function seedInfluencers(count: number) {
  const prisma = new PrismaClient();
  
  for (let batch = 0; batch < count / BATCH_SIZE; batch++) {
    const creators = Array.from({ length: BATCH_SIZE }, () => ({
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      gender: faker.helpers.arrayElement(genders),
      country: faker.helpers.arrayElement(countries),
      city: faker.location.city(),
      categories: JSON.stringify(faker.helpers.arrayElements(categories, { min: 1, max: 3 })),
      languages: JSON.stringify([faker.helpers.arrayElement(['en', 'es', 'pt', 'fr', 'de'])]),
      isBlacklisted: faker.datatype.boolean({ probability: 0.05 }), // 5% blacklisted
      internalRating: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
      // ... other fields
    }));
    
    await prisma.creator.createMany({ data: creators });
    
    // Create socials for each creator in this batch
    // ... (nested loop with createMany for CreatorSocial)
  }
}
```

**Package.json script:**
```json
{
  "scripts": {
    "seed:influencers": "ts-node prisma/seeds/seed-influencers.ts"
  }
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Prisma query performance at scale | Use raw SQL for complex joins; add proper indexes; test with EXPLAIN ANALYZE |
| URL length limits with many filters | Filters are short strings; worst case ~500 chars well under 2000 char limit |
| Default excludeBlacklisted may confuse users | Clear visual indicator showing "Blacklisted: Excluded" filter is active |
| Platform-specific metrics require platform selection | Make platform filter prominent and required with clear messaging |
| JSON array filtering (categories, languages) | Use GIN indexes if performance is insufficient |

## Migration Plan

1. Add database indexes (non-blocking, CREATE INDEX CONCURRENTLY)
2. Deploy backend filter support (backward compatible - no filters = current behavior except blacklist default)
3. Deploy frontend filter UI
4. Run seeder in staging for performance testing
5. Monitor query performance in production

## Open Questions

1. **Content Cost filter** - TBD by Blanca. Currently excluded from implementation; will add when spec is provided.
2. **Audience filter data availability** - Depends on IMAI data import. Filters will show "No data" if audience demographics not populated.
3. **Filter preset/saved views** - Explicitly out of scope but may be requested later.
