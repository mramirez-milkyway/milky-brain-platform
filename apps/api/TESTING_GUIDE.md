# API Testing Guide

This guide covers testing for the Milky Way Admin Panel API.

## Test Structure

Tests are organized in the `tests/` directory, mirroring the `src/` structure:

```
apps/api/
├── src/
│   ├── jobs/
│   │   ├── jobs.service.ts
│   │   ├── jobs.repository.ts
│   │   └── ...
│   └── common/
│       └── services/
│           ├── s3.service.ts
│           └── sqs.service.ts
└── tests/
    ├── setup.ts                    # Global test setup
    └── unit/
        ├── jobs/
        │   ├── jobs.service.spec.ts
        │   └── jobs.repository.spec.ts
        └── common/
            └── services/
                ├── s3.service.spec.ts
                └── sqs.service.spec.ts
```

## Running Tests

### Install Dependencies

First, ensure all dependencies are installed:

```bash
# From project root
npm install

# Or from api directory
cd apps/api && npm install
```

### Run All Tests

```bash
# From project root
npm run test

# From api directory
cd apps/api && npm test
```

### Watch Mode

Automatically re-run tests on file changes:

```bash
cd apps/api && npm run test:watch
```

### Coverage Report

Generate test coverage report:

```bash
cd apps/api && npm run test:cov
```

Coverage reports will be generated in `apps/api/coverage/`:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI tools

## Test Configuration

### Jest Configuration

Configuration is in `apps/api/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // ... more configuration
};
```

### Global Setup

`tests/setup.ts` runs before all tests and sets up:
- Environment variables for testing
- Mock AWS credentials
- Test timeouts

## Writing Tests

### Test File Naming

- Test files must end with `.spec.ts`
- Place tests in `tests/` directory matching source structure
- Example: `src/jobs/jobs.service.ts` → `tests/unit/jobs/jobs.service.spec.ts`

### Basic Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceToTest } from '../../../src/path/to/service';

describe('ServiceToTest', () => {
  let service: ServiceToTest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceToTest,
        {
          provide: DependencyService,
          useValue: {
            method: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceToTest>(ServiceToTest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking Dependencies

#### Mocking Prisma

```typescript
const mockPrisma = {
  job: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  jobLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    JobsRepository,
    {
      provide: PrismaClient,
      useValue: mockPrisma,
    },
  ],
}).compile();
```

#### Mocking AWS Services

```typescript
// Mock the AWS SDK modules
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-sqs');

// In your test
const mockS3Client = {
  send: jest.fn(),
} as any;

(service as any).s3Client = mockS3Client;

mockS3Client.send.mockResolvedValue({});
```

#### Mocking ConfigService

```typescript
{
  provide: ConfigService,
  useValue: {
    get: jest.fn((key: string) => {
      const config = {
        'AWS_REGION': 'eu-south-2',
        'S3_JOBS_BUCKET_NAME': 'test-bucket',
      };
      return config[key];
    }),
  },
}
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  // Mock async result
  mockService.asyncMethod.mockResolvedValue({ data: 'test' });

  const result = await service.methodUnderTest();

  expect(result).toEqual({ data: 'test' });
  expect(mockService.asyncMethod).toHaveBeenCalled();
});
```

### Testing Error Handling

```typescript
it('should throw error when something fails', async () => {
  const error = new Error('Test error');
  mockService.method.mockRejectedValue(error);

  await expect(service.methodUnderTest()).rejects.toThrow('Test error');
});

it('should throw NotFoundException', async () => {
  mockRepository.findById.mockResolvedValue(null);

  await expect(service.getJobById(999)).rejects.toThrow(NotFoundException);
});
```

## Test Coverage Guidelines

### Minimum Coverage Targets

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### What to Test

✅ **Do test:**
- Business logic in services
- Data access logic in repositories
- Error handling and edge cases
- Input validation
- Permission checks
- State transitions

❌ **Don't test:**
- DTOs (pure data structures)
- Interfaces
- Configuration files
- Third-party library functionality

### Example Test Coverage

```typescript
describe('createJob', () => {
  it('should create job without file upload');          // Happy path
  it('should create job with file upload');             // Happy path variant
  it('should use custom maxAttempts if provided');      // Configuration
  it('should use custom queue if provided');            // Configuration
  it('should propagate S3 upload errors');              // Error handling
});
```

## Common Testing Patterns

### Arrange-Act-Assert Pattern

```typescript
it('should process data correctly', async () => {
  // Arrange - Set up test data and mocks
  const input = { test: 'data' };
  mockRepository.create.mockResolvedValue({ id: 1, ...input });

  // Act - Execute the method under test
  const result = await service.createJob(1, input);

  // Assert - Verify expectations
  expect(result.id).toBe(1);
  expect(mockRepository.create).toHaveBeenCalledWith(
    expect.objectContaining(input)
  );
});
```

### Testing Multiple Scenarios

```typescript
describe.each([
  ['PENDING', JobStatus.PENDING],
  ['RUNNING', JobStatus.RUNNING],
  ['COMPLETED', JobStatus.COMPLETED],
  ['FAILED', JobStatus.FAILED],
])('when status is %s', (statusName, status) => {
  it(`should filter jobs by ${statusName}`, async () => {
    mockRepository.findMany.mockResolvedValue([[mockJob], 1]);

    await service.listJobs({ status });

    expect(mockRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ status })
    );
  });
});
```

### Snapshot Testing

```typescript
it('should return correctly formatted response', async () => {
  const result = await service.getJobById(1);

  expect(result).toMatchSnapshot();
});
```

## Mock Service Files

Pre-configured mock services are available for common testing scenarios:

### S3 Service Mock

```typescript
// apps/api/src/common/services/s3.service.mock.ts
export const mockS3Service = {
  uploadJobFile: jest.fn().mockResolvedValue({
    key: 'jobs/test/file.csv',
    url: 's3://bucket/jobs/test/file.csv',
  }),
  downloadFile: jest.fn().mockResolvedValue(Buffer.from('test data')),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url'),
};
```

### SQS Service Mock

```typescript
// apps/api/src/common/services/sqs.service.mock.ts
export const mockSqsService = {
  sendJobMessage: jest.fn().mockResolvedValue(undefined),
};
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- jobs.service.spec.ts
```

### Run Single Test Suite

```bash
npm test -- --testNamePattern="createJob"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

## Continuous Integration

Tests run automatically in CI/CD pipeline on:
- Pull request creation
- Push to main branch
- Manual workflow dispatch

CI configuration checks:
- All tests pass
- Coverage thresholds met
- No linting errors

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clarity**: Test names should clearly describe what they test
3. **Fast**: Mock external dependencies (databases, APIs, file systems)
4. **Comprehensive**: Cover happy paths, edge cases, and error scenarios
5. **Maintainable**: Keep tests simple and follow DRY principle
6. **Deterministic**: Tests should always produce the same result

## Common Issues

### Issue: "Cannot find module" errors

**Solution**: Ensure you've run `npm install` and paths in imports are correct.

### Issue: Tests timeout

**Solution**: Increase timeout in `tests/setup.ts`:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Issue: Prisma client not generated

**Solution**: Run Prisma generate:
```bash
cd apps/api && npm run prisma:generate
```

### Issue: AWS SDK mocks not working

**Solution**: Ensure you're mocking at the module level:
```typescript
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-sqs');
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://testingjavascript.com/)
