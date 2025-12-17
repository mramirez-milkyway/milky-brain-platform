# creator-directory Specification

## Purpose
Provides browsing and filtering capabilities for the influencer/creator directory, enabling users to find specific profiles matching campaign criteria.

## ADDED Requirements

### Requirement: Platform-Based Filtering
The system SHALL require users to select a social media platform (Instagram, TikTok, or YouTube) before applying other filters, as most metrics are platform-specific.

#### Scenario: Default platform selection
- **WHEN** a user navigates to the Influencers list without a platform parameter
- **THEN** the system defaults to Instagram as the selected platform
- **AND** displays only creators with Instagram social accounts

#### Scenario: User selects different platform
- **WHEN** a user selects TikTok from the platform dropdown
- **THEN** the URL updates to include `?platform=tiktok`
- **AND** the list shows only creators with TikTok social accounts
- **AND** platform-specific metrics (TikTok Views, Saves, Shares) become available in filters

#### Scenario: Platform filter is mandatory
- **WHEN** a user attempts to clear the platform filter
- **THEN** the system prevents clearing and keeps the current platform selected
- **AND** shows a tooltip: "Platform selection is required"

### Requirement: Blacklist Exclusion Filter
The system SHALL exclude blacklisted influencers by default, with an option for users to include them if needed.

#### Scenario: Default blacklist exclusion
- **WHEN** a user first loads the Influencers list
- **THEN** the `excludeBlacklisted=true` filter is active by default
- **AND** only non-blacklisted creators are displayed
- **AND** the filter UI shows "Blacklisted: Excluded" as active

#### Scenario: User includes blacklisted creators
- **WHEN** a user unchecks the "Exclude Blacklisted" filter
- **THEN** the URL updates to `excludeBlacklisted=false`
- **AND** blacklisted creators appear in the list with a visual indicator (red badge)
- **AND** the filter shows "Blacklisted: Included"

#### Scenario: Clear all filters resets to default
- **WHEN** a user clicks "Clear All Filters"
- **THEN** all filters are reset to defaults
- **AND** `excludeBlacklisted=true` is restored
- **AND** platform remains at current selection (or defaults to Instagram)

### Requirement: Handle Search Filter
The system SHALL allow users to search for creators by their social media handle with partial matching.

#### Scenario: Search by exact handle
- **WHEN** a user enters "@janedoe" in the handle search field
- **THEN** the system searches for handles matching "@janedoe" (case-insensitive)
- **AND** returns creators whose handle on the selected platform contains the search term

#### Scenario: Search by partial handle
- **WHEN** a user enters "jane" in the handle search field
- **THEN** the system returns all creators whose handle contains "jane"
- **AND** results are ordered by relevance (exact match first, then partial)

#### Scenario: Handle search with debounce
- **WHEN** a user types in the handle search field
- **THEN** the system waits 300ms after the user stops typing before executing the search
- **AND** shows a loading indicator while searching

### Requirement: Location Filters
The system SHALL allow filtering by creator country and audience country with percentage thresholds.

#### Scenario: Filter by creator country
- **WHEN** a user selects "United States" and "Spain" from the country filter
- **THEN** the URL updates to `country=US,ES`
- **AND** only creators from US or Spain are displayed

#### Scenario: Maximum country selection
- **WHEN** a user has selected 5 countries and attempts to add another
- **THEN** the system prevents selection
- **AND** shows message: "Maximum 5 countries allowed"

#### Scenario: Filter by audience country with threshold
- **WHEN** a user selects audience country "Brazil" with minimum 20%
- **THEN** the URL updates to `audienceCountry=BR&audienceCountryMinPercent=20`
- **AND** only creators with >=20% Brazilian audience are displayed

### Requirement: Demographics Filters
The system SHALL allow filtering by creator and audience demographics including gender, language, and age.

#### Scenario: Filter by creator gender
- **WHEN** a user selects "Female" from the gender filter
- **THEN** the URL updates to `gender=female`
- **AND** only female creators are displayed

#### Scenario: Filter by audience gender with threshold
- **WHEN** a user selects audience gender "Male" with minimum 50%
- **THEN** the URL updates to `audienceGender=male&audienceGenderMinPercent=50`
- **AND** only creators with >=50% male audience are displayed

#### Scenario: Filter by creator language
- **WHEN** a user selects "Spanish" from the language filter
- **THEN** the URL updates to `language=es`
- **AND** only creators who speak Spanish are displayed

#### Scenario: Filter by creator age range
- **WHEN** a user selects age range 25-35
- **THEN** the URL updates to `minAge=25&maxAge=35`
- **AND** only creators aged 25-35 are displayed

#### Scenario: Filter by audience age with threshold
- **WHEN** a user selects audience age 18-24 with minimum 30%
- **THEN** the URL updates to `audienceMinAge=18&audienceMaxAge=24&audienceAgeMinPercent=30`
- **AND** only creators with >=30% audience aged 18-24 are displayed

### Requirement: Performance Metrics Filters
The system SHALL allow filtering by performance metrics including followers, engagement rate, and platform-specific metrics.

#### Scenario: Filter by follower count range
- **WHEN** a user enters minimum 50,000 and maximum 350,000 followers
- **THEN** the URL updates to `minFollowers=50000&maxFollowers=350000`
- **AND** only creators with 50K-350K followers on the selected platform are displayed

#### Scenario: Filter by engagement rate
- **WHEN** a user sets minimum engagement rate to 4%
- **THEN** the URL updates to `minEngagementRate=4`
- **AND** only creators with >=4% engagement rate are displayed

#### Scenario: Filter by Instagram Reels plays
- **WHEN** platform is Instagram and user sets Reels plays range 100K-500K
- **THEN** the URL updates to `minReelsPlays=100000&maxReelsPlays=500000`
- **AND** only creators with Reels plays in that range are displayed

#### Scenario: Filter by TikTok views
- **WHEN** platform is TikTok and user selects views bracket "50K-100K"
- **THEN** the URL updates to `minTiktokViews=50000&maxTiktokViews=100000`
- **AND** only creators with average TikTok views in that range are displayed

#### Scenario: Filter by credibility
- **WHEN** a user sets minimum follower credibility to 70%
- **THEN** the URL updates to `minCredibility=70`
- **AND** only creators with >=70% follower credibility are displayed

### Requirement: Internal Filters
The system SHALL provide internal-only filters for categories, internal rating, and campaign history.

#### Scenario: Filter by categories
- **WHEN** a user selects categories "Beauty" and "Fashion"
- **THEN** the URL updates to `categories=beauty,fashion`
- **AND** only creators tagged with Beauty OR Fashion are displayed

#### Scenario: Filter by internal rating
- **WHEN** a user sets minimum internal rating to 80
- **THEN** the URL updates to `minInternalRating=80`
- **AND** only creators with internal rating >=80 are displayed

#### Scenario: Filter by campaign history
- **WHEN** a user enables "Has Worked With Us" filter
- **THEN** the URL updates to `hasWorkedWithUs=true`
- **AND** only creators who have participated in at least one campaign are displayed

### Requirement: Filter URL Persistence
The system SHALL store all active filters in URL query parameters for bookmarking and sharing.

#### Scenario: Bookmark filtered view
- **WHEN** a user applies filters: platform=instagram, country=US, minFollowers=10000
- **THEN** the URL reflects all filters: `/influencers?platform=instagram&country=US&minFollowers=10000&excludeBlacklisted=true`
- **AND** sharing this URL with another user shows the same filtered results

#### Scenario: Load filters from URL
- **WHEN** a user navigates to `/influencers?platform=tiktok&gender=female&minFollowers=50000`
- **THEN** the filter UI reflects all URL parameters
- **AND** the list displays filtered results matching those criteria

#### Scenario: Browser back navigation
- **WHEN** a user applies a filter and then clicks browser Back button
- **THEN** the previous filter state is restored from browser history
- **AND** the list updates to show previous results

### Requirement: Filter Interaction
The system SHALL provide clear filter interaction patterns including filter updates without page reload and visual indicators.

#### Scenario: Filter updates without page reload
- **WHEN** a user changes any filter value
- **THEN** the list updates via AJAX without full page reload
- **AND** shows a loading indicator during the request
- **AND** maintains scroll position after update

#### Scenario: Clear individual filter
- **WHEN** a user clicks the X button on an active filter chip
- **THEN** that specific filter is removed
- **AND** the URL updates to remove that parameter
- **AND** the list refreshes with remaining filters

#### Scenario: Active filters indicator
- **WHEN** filters are applied beyond the defaults
- **THEN** a count badge shows "X filters active" near the filter bar
- **AND** each active filter is shown as a removable chip

#### Scenario: No results found
- **WHEN** applied filters return zero results
- **THEN** the system displays "No creators match your filters"
- **AND** shows a "Clear Filters" button
- **AND** optionally suggests removing specific restrictive filters

### Requirement: Filter Query Performance
The system SHALL execute filter queries efficiently, returning results within 500ms for datasets up to 100,000 creators.

#### Scenario: Large dataset query performance
- **WHEN** the database contains 100,000 creators
- **AND** a user applies common filters (platform + country + follower range)
- **THEN** the API returns results within 500ms
- **AND** the response includes proper pagination metadata

#### Scenario: Complex filter combination
- **WHEN** a user applies 5+ filters including audience demographics
- **THEN** the query uses optimized indexes and/or raw SQL
- **AND** returns results within 1000ms

#### Scenario: Pagination with filters
- **WHEN** a user navigates to page 2 with active filters
- **THEN** the same filters are applied to page 2 results
- **AND** total count reflects filtered results, not all creators

### Requirement: Test Data Seeding
The system SHALL provide a seeder script to generate realistic test data for filter testing.

#### Scenario: Run influencer seeder
- **WHEN** a developer runs `npm run seed:influencers -- --count=100000`
- **THEN** the system generates 100,000 creator records with realistic data
- **AND** each creator has 1-3 social media accounts
- **AND** ~5% of creators are marked as blacklisted
- **AND** data distribution allows testing all filter types

#### Scenario: Seeder batch processing
- **WHEN** generating large datasets (>10,000 records)
- **THEN** the seeder uses batch inserts (1000 records per batch)
- **AND** logs progress every 10,000 records
- **AND** completes within reasonable time (<5 minutes for 100K)
