# Change: Add Influencer Advanced Filters

## Why
Users need to filter the influencer list to find specific profiles matching campaign criteria and avoid blacklisted accounts. The current implementation only supports pagination without any filtering capabilities. This feature will mirror IMAI's filtering dashboard behavior, enabling users to efficiently search through large datasets (100k+ influencers) based on demographics, performance metrics, and internal status.

## What Changes
- Add comprehensive filtering engine to the Creator API endpoint
- Implement filter bar UI in the Influencer List view with multiple filter types
- Store filters in URL query parameters for bookmarking/sharing
- Add "Exclude Blacklisted" filter as active by default
- Create seeder script for generating 100k+ test influencers using Faker
- Add database indexes for optimized filter queries
- **BREAKING**: Default behavior changes - blacklisted influencers are now excluded by default

## Impact
- Affected specs: `creator-directory` (new capability to be created)
- Affected code:
  - `apps/api/src/creators/creators.controller.ts` - Add filter query parameters
  - `apps/api/src/creators/creators.service.ts` - Add filter logic
  - `apps/api/src/creators/creators.repository.ts` - Add optimized filter queries
  - `apps/api/src/creators/dto/` - Add filter DTOs
  - `apps/api/prisma/schema.prisma` - Add indexes for filter performance
  - `apps/api/prisma/seeds/` - Add faker-based seeder script
  - `apps/web-admin/src/app/influencers/page.tsx` - Add filter UI components
  - `apps/web-admin/src/app/influencers/components/` - New filter components
  - `package.json` - Add seed:influencers command

## Filter Categories (from IMAI spec)

### Basic Filters
| Filter | DB Field | Type | Notes |
|--------|----------|------|-------|
| Platform | `creatorSocial.socialMedia` | Single-select (required) | instagram, tiktok, youtube |
| Handle | `creatorSocial.handle` | Text search | Exact/contains search |

### Demographics (Platform-specific)
| Filter | DB Field | Type | Notes |
|--------|----------|------|-------|
| Location (Creator) | `creator.country` | Multi-select | Max 5 countries |
| Location (Audience) | `audienceCountry.country` | Multi-select + % threshold | |
| Gender (Creator) | `creator.gender` | Single-select | any, male, female, organization |
| Gender (Audience) | `audienceAge.genderMale/genderFemale` | Single-select + % threshold | |
| Language (Creator) | `creator.languages` | Single-select | JSON array field |
| Language (Audience) | `audienceAge.language` | Single-select + % threshold | |
| Age (Creator) | `creator.age` | Range | Brackets: 18, 25, 35, 45, 65 |
| Age (Audience) | `audienceAge.age*` columns | Range + % threshold | |

### Performance Metrics (Platform-specific)
| Filter | DB Field | Type | Notes |
|--------|----------|------|-------|
| Followers | `creatorSocial.followers` | Range (min/max) | Text input |
| Engagements | `socialStats*.engagementRate` | Range (min/max) | Percentage |
| Reels Plays (IG only) | `socialStatsIgReel.plays` | Range | |
| TikTok Views | `socialStatsTtVideo.views` | Range | Brackets: 1K-1M |
| Saves | `socialStats*.saves` | Range | |
| Shares | `socialStats*.shares` | Range | |
| Followers Credibility | `audienceAge.credibility` | Range | IMAI data |

### Internal Filters (Custom)
| Filter | DB Field | Type | Notes |
|--------|----------|------|-------|
| Categories | `creator.categories` | Multi-select | JSON array field |
| Blacklisted | `creator.isBlacklisted` | Boolean (exclude) | **Default: exclude** |
| Internal Rating | `creator.internalRating` | Range (>=) | 0-100 scale |
| Content Cost | `campaignCreator.contentCost` | Range | TBD by Blanca |
| Has Worked With Us | `campaignCreator` existence | Boolean | Derived field |
