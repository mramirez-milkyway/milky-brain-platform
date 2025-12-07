# Creator Import CSV Template

## Overview

This template is used to import creators and their social media accounts into the system via the async job processing feature.

## Important Rules

1. **Creator ID Column**: You MUST include a `creator_id` column to group social media accounts by creator
   - This column is NOT stored in the database
   - It's only used during import to identify which rows belong to the same creator
   - Use any unique identifier (number, text, UUID, etc.)
   - Example: If a creator has Instagram and TikTok, both rows should have the same `creator_id`

2. **Duplicate Handling**: Upsert based on `handle` + `social_media`
   - If a social account exists, it will be updated
   - **NULL Protection**: Existing non-null values will NOT be overwritten by null values in the CSV

3. **Row-Level Processing**: If one row fails validation, other rows will still be processed

## CSV Structure

### Mandatory Columns

These columns are REQUIRED and must have values:

| CSV Column | Maps To | DB Table | Type | Description | Example |
|-----------|---------|----------|------|-------------|---------|
| `creator_id` | - | (not stored) | string | Temporary ID to group rows by creator | `CR001` |
| `full_name` | `full_name` | creators | string | Creator's full name | `Sarah Johnson` |
| `handle` | `handle` | creator_socials | string | Social media username/handle | `@sarahjohnson` |
| `social_media` | `social_media` | creator_socials | string | Platform name | `instagram` |

### Creator Fields (Optional)

All these fields map to the `creators` table and are optional:

| CSV Column | Maps To | Type | Description | Example |
|-----------|---------|------|-------------|---------|
| `gender` | `gender` | string | Gender | `Female` |
| `country` | `country` | string | Country of residence | `United States` |
| `city` | `city` | string | City of residence | `Los Angeles` |
| `email` | `email` | string | Contact email | `sarah@example.com` |
| `phone_number` | `phone_number` | string | Phone number | `+1-555-0123` |
| `characteristics` | `characteristics` | text | Personal characteristics/bio | `Fashion enthusiast, lifestyle blogger` |
| `past_clients` | `past_clients` | text | Previous brand partnerships | `Nike, Adidas, Zara` |
| `past_campaigns` | `past_campaigns` | text | Campaign history | `Spring 2024 Fashion Week` |
| `comments` | `comments` | text | Internal notes | `Very professional, responds quickly` |
| `languages` | `languages` | text (JSON) | Languages spoken | `["English", "Spanish"]` |
| `categories` | `categories` | text (JSON) | Content categories | `["Fashion", "Lifestyle"]` |
| `internal_tags` | `internal_tags` | text (JSON) | Internal classification tags | `["tier1", "verified"]` |
| `is_blacklisted` | `is_blacklisted` | boolean | Blacklist status | `false` or `true` |
| `blacklist_reason` | `blacklist_reason` | text | Reason for blacklisting | `Contract violation` |
| `agency_name` | `agency_name` | string | Agency/talent manager | `Creative Talent Agency` |
| `manager_name` | `manager_name` | string | Personal manager name | `John Doe` |
| `billing_info` | `billing_info` | text | Payment/billing details | `Wire transfer - Account 123456` |

### Social Media Fields (Optional)

These fields map to the `creator_socials` table:

| CSV Column | Maps To | Type | Description | Example |
|-----------|---------|------|-------------|---------|
| `followers` | `followers` | integer | Follower count | `125000` |
| `tier` | `tier` | string | Creator tier classification | `Micro`, `Macro`, `Mega` |
| `social_link` | `social_link` | string | Direct profile URL | `https://instagram.com/sarahjohnson` |

## Supported Social Media Platforms

- `instagram`
- `tiktok`
- `youtube`
- `facebook`
- `twitter` (X)
- `linkedin`
- `twitch`
- `snapchat`

## CSV Example

```csv
creator_id,full_name,handle,social_media,gender,country,email,followers,tier,categories
CR001,Sarah Johnson,@sarahjohnson,instagram,Female,United States,sarah@example.com,125000,Macro,"[""Fashion"", ""Lifestyle""]"
CR001,Sarah Johnson,@sarahjohnson_official,tiktok,Female,United States,sarah@example.com,89000,Macro,"[""Fashion"", ""Lifestyle""]"
CR002,Mike Chen,@mikechen,youtube,Male,Canada,mike@example.com,450000,Mega,"[""Technology"", ""Gaming""]"
CR003,Emma Rodriguez,@emmarodriguez,instagram,Female,Spain,emma@example.com,75000,Micro,"[""Travel"", ""Food""]"
```

## Import Process

1. **Upload CSV**: Select your CSV file
2. **Column Mapping**: The system will auto-match columns or let you manually map them
3. **Configure Options**:
   - Duplicate handling is always "upsert" (update existing, insert new)
   - NULL protection: existing values won't be overwritten by NULL
4. **Submit Job**: Creates an async job that processes in the background
5. **Monitor Progress**: View job status and logs in real-time
6. **Review Results**: See success/error counts and detailed logs

## Validation Rules

### Required Fields Validation
- `creator_id`: Must be present and non-empty
- `full_name`: Must be present and non-empty
- `handle`: Must be present and non-empty  
- `social_media`: Must be present and non-empty

### Data Type Validation
- `followers`: Must be a valid integer if provided
- `is_blacklisted`: Must be `true`, `false`, `1`, `0`, or empty
- JSON fields (`languages`, `categories`, `internal_tags`): Must be valid JSON arrays if provided

### Business Rules
- Duplicate social accounts (`handle` + `social_media`) will trigger upsert logic
- Multiple rows with same `creator_id` will be grouped under one creator
- If creator exists (by name matching), social accounts will be added to existing creator
- Empty/null values in CSV will not overwrite existing non-null database values

## Error Handling

Errors are logged with specific row numbers:

```
Row 5: Missing required field 'handle'
Row 12: Invalid value for 'followers': expected number, got 'N/A'
Row 23: Duplicate social account @johndoe on instagram - updated successfully
```

## Tips for Best Results

1. **Clean Your Data**: Remove empty rows, ensure consistent formatting
2. **Test with Small File**: Start with 10-20 rows to verify column mapping
3. **Use Creator IDs**: Assign unique IDs to each creator for better grouping
4. **Check Encoding**: Use UTF-8 encoding for special characters
5. **Validate JSON**: Ensure arrays are properly formatted: `["value1", "value2"]`
6. **Phone Numbers**: Include country codes: `+1-555-0123`
7. **Boolean Values**: Use `true`/`false` or `1`/`0` for boolean fields

## Limits

- **File Size**: Maximum 10MB
- **File Types**: `.csv` or `.txt` only
- **Recommended Row Count**: Up to 10,000 rows per file
- **Required Permission**: `influencer:Import`
