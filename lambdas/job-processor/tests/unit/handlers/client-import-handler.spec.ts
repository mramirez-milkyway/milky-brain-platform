import { LogLevel } from '@prisma/client'
import { ClientImportHandler } from '../../../src/handlers/client-import-handler'
import { JobContext } from '../../../src/types'

interface ImportResult {
  totalRows: number
  successCount: number
  errorCount: number
  skippedCount: number
  duplicateCount: number
  createdClients: number
  updatedClients: number
}

describe('ClientImportHandler', () => {
  let handler: ClientImportHandler
  let mockContext: JobContext
  let mockPrisma: {
    customer: {
      findFirst: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
  }
  let loggedMessages: { level: LogLevel; message: string; meta?: unknown; rowNumber?: number }[]

  beforeEach(() => {
    handler = new ClientImportHandler()
    loggedMessages = []

    mockPrisma = {
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    }

    mockContext = {
      taskId: 'test-task-id',
      jobType: 'client_import',
      payload: {
        columnMapping: {
          name: 'name',
          industry: 'industry',
          country: 'country',
          contact_name: 'contactName',
          contact_email: 'contactEmail',
          contact_phone: 'contactPhone',
          notes: 'notes',
        },
        duplicateHandling: 'skip',
      },
      fileBuffer: undefined,
      fileName: 'test.csv',
      prisma: mockPrisma as unknown as JobContext['prisma'],
      logger: jest.fn(async (level, message, meta, rowNumber) => {
        loggedMessages.push({ level, message, meta, rowNumber })
      }),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('should throw error when payload is missing', async () => {
      mockContext.payload = null

      await expect(handler.execute(mockContext)).rejects.toThrow(
        'Invalid payload: expected object with columnMapping'
      )
    })

    it('should throw error when columnMapping is missing', async () => {
      mockContext.payload = {}

      await expect(handler.execute(mockContext)).rejects.toThrow(
        'Missing required field: columnMapping'
      )
    })

    it('should throw error when file buffer is missing', async () => {
      mockContext.fileBuffer = undefined

      await expect(handler.execute(mockContext)).rejects.toThrow('No file uploaded for import')
    })

    it('should create new clients from CSV', async () => {
      const csvContent = `name,industry,country,contact_name,contact_email,contact_phone,notes
Acme Corp,Technology,US,John Doe,john@acme.com,+1234567890,Key account
Beta Inc,Manufacturing,DE,Jane Smith,jane@beta.com,+4912345678,New client`

      mockContext.fileBuffer = Buffer.from(csvContent)
      mockPrisma.customer.findFirst.mockResolvedValue(null)
      mockPrisma.customer.create.mockResolvedValue({ id: 1, name: 'Acme Corp' })

      const result = (await handler.execute(mockContext)) as ImportResult

      expect(result.totalRows).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.createdClients).toBe(2)
      expect(result.errorCount).toBe(0)
      expect(mockPrisma.customer.create).toHaveBeenCalledTimes(2)
    })

    it('should skip duplicate clients when duplicateHandling is skip', async () => {
      const csvContent = `name,industry
Acme Corp,Technology`

      mockContext.fileBuffer = Buffer.from(csvContent)
      mockContext.payload.duplicateHandling = 'skip'
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 1, name: 'Acme Corp' })

      const result = (await handler.execute(mockContext)) as ImportResult

      expect(result.totalRows).toBe(1)
      expect(result.duplicateCount).toBe(1)
      expect(result.successCount).toBe(0)
      expect(result.createdClients).toBe(0)
      expect(mockPrisma.customer.create).not.toHaveBeenCalled()
    })

    it('should update duplicate clients when duplicateHandling is update', async () => {
      const csvContent = `name,industry,country
Acme Corp,Retail,UK`

      mockContext.fileBuffer = Buffer.from(csvContent)
      mockContext.payload.duplicateHandling = 'update'
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 1, name: 'Acme Corp' })
      mockPrisma.customer.update.mockResolvedValue({ id: 1, name: 'Acme Corp', industry: 'Retail' })

      const result = (await handler.execute(mockContext)) as ImportResult

      expect(result.totalRows).toBe(1)
      expect(result.duplicateCount).toBe(1)
      expect(result.updatedClients).toBe(1)
      expect(result.successCount).toBe(1)
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          industry: 'Retail',
          country: 'UK',
        }),
      })
    })

    it('should skip empty rows', async () => {
      const csvContent = `name,industry
Acme Corp,Technology
,
Beta Inc,Manufacturing`

      mockContext.fileBuffer = Buffer.from(csvContent)
      mockPrisma.customer.findFirst.mockResolvedValue(null)
      mockPrisma.customer.create.mockResolvedValue({ id: 1, name: 'Test' })

      const result = (await handler.execute(mockContext)) as ImportResult

      expect(result.totalRows).toBe(3)
      expect(result.skippedCount).toBe(1)
      expect(result.createdClients).toBe(2)
    })

    it('should log error for rows missing required name field', async () => {
      const csvContent = `name,industry
,Technology
Acme Corp,Manufacturing`

      mockContext.fileBuffer = Buffer.from(csvContent)
      mockPrisma.customer.findFirst.mockResolvedValue(null)
      mockPrisma.customer.create.mockResolvedValue({ id: 1, name: 'Acme Corp' })

      const result = (await handler.execute(mockContext)) as ImportResult

      expect(result.errorCount).toBe(1)
      expect(result.createdClients).toBe(1)

      const errorLog = loggedMessages.find(
        (log) =>
          log.level === LogLevel.ERROR && log.message.includes("Missing required field 'name'")
      )
      expect(errorLog).toBeDefined()
    })

    it('should log error for invalid email format', async () => {
      const csvContent = `name,contact_email
Acme Corp,not-an-email`

      mockContext.fileBuffer = Buffer.from(csvContent)

      const result = (await handler.execute(mockContext)) as ImportResult

      expect(result.errorCount).toBe(1)

      const errorLog = loggedMessages.find(
        (log) => log.level === LogLevel.ERROR && log.message.includes('Invalid email format')
      )
      expect(errorLog).toBeDefined()
    })

    it('should default to skip mode when duplicateHandling not specified', async () => {
      const csvContent = `name,industry
Acme Corp,Technology`

      mockContext.fileBuffer = Buffer.from(csvContent)
      delete mockContext.payload.duplicateHandling
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 1, name: 'Acme Corp' })

      const result = (await handler.execute(mockContext)) as ImportResult

      expect(result.duplicateCount).toBe(1)
      expect(result.successCount).toBe(0)
      expect(mockPrisma.customer.update).not.toHaveBeenCalled()
    })

    it('should handle all customer fields correctly', async () => {
      const csvContent = `name,industry,country,contact_name,contact_email,contact_phone,notes
Full Client,Tech,USA,John Doe,john@test.com,+1234567890,Important notes`

      mockContext.fileBuffer = Buffer.from(csvContent)
      mockPrisma.customer.findFirst.mockResolvedValue(null)
      mockPrisma.customer.create.mockResolvedValue({ id: 1, name: 'Full Client' })

      await handler.execute(mockContext)

      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          name: 'Full Client',
          industry: 'Tech',
          country: 'USA',
          contactName: 'John Doe',
          contactEmail: 'john@test.com',
          contactPhone: '+1234567890',
          notes: 'Important notes',
        },
      })
    })
  })
})
