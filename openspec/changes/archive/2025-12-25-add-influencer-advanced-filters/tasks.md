# Tasks: Add Influencer Advanced Filters

## 1. Database & Schema
- [x] 1.1 Add database indexes for filter performance on Creator table (isBlacklisted, country, gender, internalRating)
- [x] 1.2 Add database indexes for CreatorSocial table (socialMedia, followers)
- [x] 1.3 Add composite indexes for common filter combinations
- [x] 1.4 Run prisma migrate to generate migration file

## 2. Seeder Script
- [x] 2.1 Install @faker-js/faker as dev dependency in api package
- [x] 2.2 Create seed-influencers.ts script under apps/api/prisma/seeds/
- [x] 2.3 Implement Creator generation with realistic fake data
- [x] 2.4 Implement CreatorSocial generation (1-3 platforms per creator)
- [x] 2.5 Implement CreatorSocialAudienceAge generation with demographic data
- [x] 2.6 Implement CreatorSocialAudienceCountry generation
- [x] 2.7 Add configurable count parameter (default 100,000)
- [x] 2.8 Add batch insert logic for performance (1000 records per batch)
- [x] 2.9 Add seed:influencers script to package.json

## 3. Backend API - Filter DTOs
- [x] 3.1 Create CreatorFilterDto with all filter parameters
- [x] 3.2 Add validation decorators (IsOptional, IsEnum, IsInt, Min, Max)
- [x] 3.3 Add platform filter as required single-select enum
- [x] 3.4 Add handle filter as optional string (partial match)
- [x] 3.5 Add country filter as optional string array (max 5)
- [x] 3.6 Add gender filter as optional enum
- [x] 3.7 Add language filter as optional string
- [x] 3.8 Add age range filter (minAge, maxAge)
- [x] 3.9 Add followers range filter (minFollowers, maxFollowers)
- [x] 3.10 Add engagement rate range filter
- [x] 3.11 Add categories filter as optional string array
- [x] 3.12 Add excludeBlacklisted filter (default: true)
- [x] 3.13 Add minInternalRating filter
- [x] 3.14 Add hasWorkedWithUs filter as optional boolean
- [x] 3.15 Add audience demographic filters with percentage thresholds

## 4. Backend API - Repository Layer
- [x] 4.1 Update findAll method to accept filter parameters
- [x] 4.2 Build dynamic Prisma where clause from filters
- [x] 4.3 Add platform filter (join with CreatorSocial)
- [x] 4.4 Add handle partial match filter (case-insensitive)
- [x] 4.5 Add country IN filter
- [x] 4.6 Add gender filter
- [x] 4.7 Add language filter (JSON array contains)
- [x] 4.8 Add categories filter (JSON array contains any)
- [x] 4.9 Add blacklist exclusion filter
- [x] 4.10 Add followers range filter
- [x] 4.11 Add internal rating filter (>=)
- [x] 4.12 Add hasWorkedWithUs filter (EXISTS subquery)
- [x] 4.13 Add audience demographic filters with percentage thresholds
- [x] 4.14 Optimize query with raw SQL if Prisma performance is insufficient
- [x] 4.15 Update count method to use same filter logic

## 5. Backend API - Service & Controller
- [x] 5.1 Update CreatorQueryDto to extend/include CreatorFilterDto
- [x] 5.2 Update controller to parse all filter query parameters
- [x] 5.3 Update service findAll to pass filters to repository
- [x] 5.4 Add request logging for filter usage analytics

## 6. Frontend - Filter State Management
- [x] 6.1 Create useInfluencerFilters hook with URL param sync
- [x] 6.2 Define filter state interface matching backend DTOs
- [x] 6.3 Implement URL searchParams read on mount
- [x] 6.4 Implement URL update on filter change (without page reload)
- [x] 6.5 Set default excludeBlacklisted=true on initial load
- [x] 6.6 Add "Clear All" function that resets to default state

## 7. Frontend - Filter UI Components
- [x] 7.1 Create FilterBar container component
- [x] 7.2 Create PlatformSelector component (required single-select)
- [x] 7.3 Create HandleSearch component (text input with debounce)
- [x] 7.4 Create CountryFilter component (multi-select, max 5)
- [x] 7.5 Create GenderFilter component (single-select dropdown)
- [x] 7.6 Create LanguageFilter component (single-select dropdown)
- [x] 7.7 Create AgeRangeFilter component (two dropdowns for min/max)
- [x] 7.8 Create FollowersRangeFilter component (two text inputs)
- [x] 7.9 Create EngagementRateFilter component (percentage range)
- [x] 7.10 Create CategoriesFilter component (multi-select)
- [x] 7.11 Create BlacklistToggle component (checkbox, default checked)
- [x] 7.12 Create InternalRatingFilter component (slider or dropdown)
- [x] 7.13 Create HasWorkedWithUsFilter component (checkbox)
- [x] 7.14 Create ClearFiltersButton component
- [x] 7.15 Create ActiveFiltersIndicator component (shows applied filters)
- [x] 7.16 Add collapsible filter sections for Demographics/Performance/Internal

## 8. Frontend - Integration
- [x] 8.1 Update influencers page.tsx to include FilterBar
- [x] 8.2 Update TanStack Query to include filters in queryKey
- [x] 8.3 Update API call to pass filter params
- [x] 8.4 Reset to page 1 when filters change
- [x] 8.5 Add loading state while filters are being applied
- [x] 8.6 Add "No results" message with clear filters suggestion

## 9. Testing
- [x] 9.1 Add unit tests for CreatorFilterDto validation
- [ ] 9.2 Add unit tests for repository filter query building
- [ ] 9.3 Add unit tests for service filter logic
- [ ] 9.4 Add frontend tests for useInfluencerFilters hook
- [ ] 9.5 Add frontend tests for filter components

## 10. Performance Verification
- [ ] 10.1 Run seeder with 100,000 influencers
- [ ] 10.2 Test filter queries with EXPLAIN ANALYZE
- [ ] 10.3 Verify response times <500ms for common filter combinations
- [x] 10.4 Add raw SQL queries if Prisma generates suboptimal plans
