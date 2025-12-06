# Job Processor Lambda - Developer Guide

This Lambda function provides a **generic, extensible async job processing system** using the Strategy pattern. It can handle any job type by registering custom handlers.

## Architecture Overview

```
API → S3 (upload file) → SQS (publish message) → Lambda (process job) → Database (update status)
```

### Key Design Principles

1. **Generic & Extensible**: Core processor has ZERO job-specific logic
2. **Strategy Pattern**: Each job type = one handler class
3. **Loose Coupling**: Handlers are independent, swappable modules
4. **Single Responsibility**: One handler per job type
5. **Interface-Driven**: All handlers implement `IJobHandler`

---

## Project Structure

```
lambdas/job-processor/
├── src/
│   ├── index.ts                    # Lambda entry point (SQS handler)
│   ├── job-processor.ts            # Core processor (generic)
│   ├── types/
│   │   └── index.ts                # Interfaces (IJobHandler, JobContext)
│   ├── handlers/
│   │   ├── base-handler.ts         # Abstract base class with helpers
│   │   ├── handler-registry.ts     # Strategy pattern registry
│   │   ├── example-handler.ts      # Example implementation
│   │   └── [your-handler].ts       # Your custom handlers
│   ├── database/
│   │   └── client.ts               # Prisma singleton
│   └── services/
│       ├── s3.service.ts           # S3 file operations
│       └── logger.service.ts       # Structured logging
├── package.json
├── tsconfig.json
└── build.sh                        # Build script
```

---

## Creating a New Job Handler

### Step 1: Create Handler Class

Create a new file in `src/handlers/your-job-handler.ts`:

```typescript
import { BaseJobHandler } from './base-handler';
import { JobContext } from '../types';

export class YourJobHandler extends BaseJobHandler {
  async execute(context: JobContext): Promise<any> {
    await this.logInfo(context, 'Starting your job');

    // 1. Access payload
    const { columnMapping, options } = context.payload;

    // 2. Access file (if uploaded)
    if (context.fileBuffer) {
      await this.logInfo(
        context,
        `Processing file: ${context.fileName} (${context.fileBuffer.length} bytes)`,
      );

      // Parse file (CSV, JSON, etc.)
      const data = parseYourFile(context.fileBuffer);
    }

    // 3. Validate payload
    this.validatePayload(context.payload, ['requiredField1', 'requiredField2']);

    // 4. Use database
    const records = await context.prisma.yourModel.findMany();

    // 5. Log progress
    await this.logInfo(context, `Found ${records.length} records`);

    // 6. Process data with error handling
    for (let i = 0; i < records.length; i++) {
      try {
        // Process record
        await context.prisma.yourModel.update({
          where: { id: records[i].id },
          data: { processed: true },
        });

        await this.logInfo(context, `Processed record ${i + 1}`, undefined, i + 1);
      } catch (error: unknown) {
        await this.logError(
          context,
          `Failed to process record ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          undefined,
          i + 1,
        );
      }
    }

    await this.logInfo(context, 'Job completed successfully');

    // 7. Return structured result
    return {
      success: true,
      processedCount: records.length,
      summary: 'All records processed',
    };
  }
}
```

### Step 2: Register Handler

Add your handler to `src/handlers/handler-registry.ts`:

```typescript
import { YourJobHandler } from './your-job-handler';

constructor() {
  this.register('example', new ExampleHandler());
  
  // ADD YOUR HANDLER HERE:
  this.register('your_job_type', new YourJobHandler());
}
```

### Step 3: Build and Deploy

```bash
# Build Lambda package
make lambda-build

# Deploy to QA
make lambda-deploy ENV=qa

# View logs
make lambda-logs ENV=qa
```

---

## JobContext API

The `JobContext` provides everything your handler needs:

| Property | Type | Description |
|----------|------|-------------|
| `taskId` | `string` | Unique job identifier (UUID) |
| `jobType` | `string` | Type of job (e.g., 'csv_import') |
| `payload` | `any` | Job-specific data (passed from API) |
| `fileBuffer` | `Buffer?` | Uploaded file contents |
| `fileName` | `string?` | Original filename |
| `prisma` | `PrismaClient` | Database client |
| `logger` | `function` | Logging function |

---

## BaseJobHandler Helper Methods

Extend `BaseJobHandler` to get these utilities:

### Logging Methods

```typescript
// Log at different levels
await this.logInfo(context, 'Processing started');
await this.logWarning(context, 'Optional field missing');
await this.logError(context, 'Failed to process row', undefined, rowNumber);
await this.logDebug(context, 'Detailed debug info');
```

### Validation Helpers

```typescript
// Validate required fields
this.validatePayload(context.payload, ['field1', 'field2']);
// Throws error if fields are missing

// Safe JSON parse
const data = this.safeJsonParse<MyType>(jsonString, defaultValue);
```

---

## Example: CSV Import Handler

```typescript
import { BaseJobHandler } from './base-handler';
import { JobContext } from '../types';
import * as Papa from 'papaparse';

export class CsvImportHandler extends BaseJobHandler {
  async execute(context: JobContext): Promise<any> {
    // 1. Validate payload
    this.validatePayload(context.payload, ['columnMapping', 'duplicateHandling']);

    // 2. Parse CSV
    const csvData = context.fileBuffer!.toString('utf-8');
    const parsed = Papa.parse(csvData, { header: true });

    await this.logInfo(context, `Parsing ${parsed.data.length} rows`);

    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    // 3. Process each row
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];

      try {
        // Map columns
        const mapped = this.mapRow(row, context.payload.columnMapping);

        // Check for duplicates
        const existing = await context.prisma.creator.findUnique({
          where: { handle: mapped.handle },
        });

        if (existing) {
          if (context.payload.duplicateHandling === 'skip') {
            await this.logWarning(context, `Duplicate: ${mapped.handle}`, undefined, i + 1);
            duplicateCount++;
            continue;
          } else {
            // Update existing
            await context.prisma.creator.update({
              where: { handle: mapped.handle },
              data: mapped,
            });
          }
        } else {
          // Create new
          await context.prisma.creator.create({ data: mapped });
        }

        successCount++;
      } catch (error: unknown) {
        await this.logError(
          context,
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          undefined,
          i + 1,
        );
        errorCount++;
      }
    }

    return {
      totalRows: parsed.data.length,
      successCount,
      errorCount,
      duplicateCount,
    };
  }

  private mapRow(row: any, mapping: any): any {
    const result: any = {};
    for (const [csvColumn, dbField] of Object.entries(mapping)) {
      result[dbField as string] = row[csvColumn];
    }
    return result;
  }
}
```

---

## Testing Your Handler

### Unit Test Example

```typescript
// src/handlers/__tests__/your-handler.spec.ts
import { YourJobHandler } from '../your-job-handler';
import { JobContext } from '../../types';
import { PrismaClient, LogLevel } from '@prisma/client';

describe('YourJobHandler', () => {
  let handler: YourJobHandler;
  let mockPrisma: PrismaClient;
  let logs: any[];

  beforeEach(() => {
    handler = new YourJobHandler();
    mockPrisma = {
      yourModel: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;
    logs = [];
  });

  it('should process job successfully', async () => {
    const context: JobContext = {
      taskId: 'test-123',
      jobType: 'your_job_type',
      payload: { requiredField: 'value' },
      prisma: mockPrisma,
      logger: async (level, message) => {
        logs.push({ level, message });
      },
    };

    const result = await handler.execute(context);

    expect(result.success).toBe(true);
    expect(logs.some(l => l.message.includes('completed'))).toBe(true);
  });
});
```

---

## Best Practices

### 1. Keep Handlers Focused
- One handler = one job type
- Delegate complex logic to separate utility functions
- Don't mix concerns (e.g., email sending in a CSV handler)

### 2. Error Handling
```typescript
// ✅ DO: Catch errors per row, continue processing
for (const row of rows) {
  try {
    await processRow(row);
  } catch (error) {
    await this.logError(context, `Row failed: ${error.message}`, undefined, rowNumber);
    // Continue to next row
  }
}

// ❌ DON'T: Let one error fail the entire job
for (const row of rows) {
  await processRow(row); // Uncaught error stops everything
}
```

### 3. Logging
```typescript
// ✅ DO: Log progress and details
await this.logInfo(context, `Processing 1000 records`);
await this.logInfo(context, `Completed 500/1000`, { progress: 50 });
await this.logWarning(context, `Row 42: Missing optional field 'email'`, undefined, 42);

// ❌ DON'T: Log too frequently (performance)
for (let i = 0; i < 10000; i++) {
  await this.logInfo(context, `Processing row ${i}`); // Too many logs!
}
```

### 4. Validation
```typescript
// ✅ DO: Validate early
this.validatePayload(context.payload, ['requiredField']);
if (!context.fileBuffer) {
  throw new Error('File is required for this job type');
}

// ❌ DON'T: Assume payload structure
const value = context.payload.deeply.nested.field; // May throw
```

### 5. Database Operations
```typescript
// ✅ DO: Use transactions for related operations
await context.prisma.$transaction(async (tx) => {
  const creator = await tx.creator.create({ data: creatorData });
  await tx.creatorSocial.create({ data: { creatorId: creator.id, ...socialData } });
});

// ✅ DO: Batch operations when possible
await context.prisma.creator.createMany({ data: records });

// ❌ DON'T: Create one-by-one (slow)
for (const record of records) {
  await context.prisma.creator.create({ data: record });
}
```

---

## Debugging

### View Lambda Logs
```bash
make lambda-logs ENV=qa
```

### Check Job Status via API
```bash
curl http://localhost:4000/api/jobs/1 \
  -H "Cookie: your-session-cookie"
```

### Check Job Logs via API
```bash
curl http://localhost:4000/api/jobs/1/logs \
  -H "Cookie: your-session-cookie"
```

### Database Queries
```bash
# Connect to database
make db-studio

# Query jobs
SELECT * FROM jobs WHERE status = 'FAILED';

# Query logs
SELECT * FROM job_logs WHERE job_id = 1 ORDER BY created_at;
```

---

## Performance Considerations

### File Size Limits
- Lambda timeout: 5 minutes (300 seconds)
- Memory: 1024 MB
- Recommended file size: <10MB
- Recommended row count: <10,000 rows

### Batch Processing
For large datasets, consider:
1. Splitting files into smaller chunks
2. Processing in batches of 100-1000 records
3. Using `createMany()` instead of individual `create()`

### Connection Pooling
- Prisma client is singleton (reused across Lambda invocations)
- Connections are automatically managed
- No manual connection cleanup needed

---

## Deployment

### Local Development
1. Update handler code
2. Run `make lambda-build`
3. Test locally (optional: use SAM or LocalStack)

### Deploy to QA
```bash
make lambda-build
make lambda-deploy ENV=qa
```

### Deploy to Production
```bash
make lambda-build
make lambda-deploy ENV=prod
```

---

## Troubleshooting

### Handler Not Found
**Error:** `No handler registered for job type: your_job_type`

**Solution:** Ensure handler is registered in `handler-registry.ts`:
```typescript
this.register('your_job_type', new YourJobHandler());
```

### Database Connection Failed
**Error:** `P1001: Can't reach database server`

**Solution:** Check Lambda VPC configuration and RDS security groups

### File Not Found in S3
**Error:** `NoSuchKey: The specified key does not exist`

**Solution:** Verify S3 bucket name and key in Lambda environment variables

### Timeout Errors
**Error:** `Task timed out after 300.00 seconds`

**Solution:**
1. Reduce dataset size
2. Optimize database queries
3. Increase Lambda timeout (max 15 minutes)
4. Process in smaller batches

---

## Additional Resources

- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- Project OpenSpec: `openspec/changes/add-async-job-processing/`
