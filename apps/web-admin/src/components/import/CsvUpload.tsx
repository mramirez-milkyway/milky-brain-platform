'use client'

import { useState, useRef, ChangeEvent } from 'react'
import Button from '@/components/ui/button/Button'
import { apiClient } from '@/lib/api-client'

export type ImportType = 'influencer_import' | 'client_import'

interface CsvUploadProps {
  onSuccess: () => void
  importType: ImportType
}

interface ColumnMapping {
  csvColumn: string
  dbField: string
}

interface FieldDefinition {
  value: string
  label: string
  required?: boolean
}

const INFLUENCER_DB_FIELDS: FieldDefinition[] = [
  { value: '', label: 'Skip this column' },
  { value: 'creatorId', label: 'Creator ID *', required: true },
  { value: 'fullName', label: 'Full Name *', required: true },
  { value: 'handle', label: 'Handle *', required: true },
  { value: 'socialMedia', label: 'Social Media *', required: true },
  { value: 'followers', label: 'Followers' },
  { value: 'gender', label: 'Gender' },
  { value: 'country', label: 'Country' },
  { value: 'city', label: 'City' },
  { value: 'email', label: 'Email' },
  { value: 'phoneNumber', label: 'Phone Number' },
  { value: 'tier', label: 'Tier' },
  { value: 'socialLink', label: 'Social Link' },
  { value: 'categories', label: 'Categories' },
  { value: 'languages', label: 'Languages' },
  { value: 'agencyName', label: 'Agency Name' },
  { value: 'managerName', label: 'Manager Name' },
  { value: 'characteristics', label: 'Characteristics' },
  { value: 'pastClients', label: 'Past Clients' },
  { value: 'comments', label: 'Comments' },
]

const CLIENT_DB_FIELDS: FieldDefinition[] = [
  { value: '', label: 'Skip this column' },
  { value: 'name', label: 'Company Name *', required: true },
  { value: 'industry', label: 'Industry' },
  { value: 'country', label: 'Country' },
  { value: 'contactName', label: 'Contact Name' },
  { value: 'contactEmail', label: 'Contact Email' },
  { value: 'contactPhone', label: 'Contact Phone' },
  { value: 'notes', label: 'Notes' },
]

const IMPORT_CONFIG = {
  influencer_import: {
    title: 'Import Creators from CSV',
    fields: INFLUENCER_DB_FIELDS,
    requiredFields: ['creatorId', 'fullName', 'handle', 'socialMedia'],
    requiredColumnsHelp: [
      'creator_id - Temporary ID to group rows by creator',
      "full_name - Creator's full name",
      'handle - Social media handle',
      'social_media - Platform (instagram, tiktok, youtube, etc.)',
    ],
  },
  client_import: {
    title: 'Import Clients from CSV',
    fields: CLIENT_DB_FIELDS,
    requiredFields: ['name'],
    requiredColumnsHelp: [
      'name - Company/client name (required)',
      'industry - Business industry',
      'country - Country',
      'contact_name - Primary contact name',
      'contact_email - Contact email',
      'contact_phone - Contact phone',
      'notes - Additional notes',
    ],
  },
}

export default function CsvUpload({ onSuccess, importType }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = IMPORT_CONFIG[importType]
  const dbFields = config.fields

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter((line) => line.trim())
    return lines.map((line) => {
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      return values
    })
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setSuccess(null)

    // Validate file type
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      setError('Please upload a CSV or TXT file')
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)

    // Read and parse CSV
    const text = await selectedFile.text()
    const parsed = parseCSV(text)

    if (parsed.length < 2) {
      setError('CSV file must contain at least a header row and one data row')
      return
    }

    const headers = parsed[0]
    const data = parsed.slice(1)

    setCsvHeaders(headers)
    setCsvData(data)

    // Auto-map columns based on header names
    const autoMappings: ColumnMapping[] = headers.map((header) => {
      // Normalize header to snake_case
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_')

      // Convert snake_case to camelCase for matching
      const toCamelCase = (str: string): string => {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      }

      const camelCaseHeader = toCamelCase(normalizedHeader)

      // Additional mappings for common CSV header variations
      const headerAliases: Record<string, string> = {
        // Client field aliases
        company: 'name',
        company_name: 'name',
        client: 'name',
        client_name: 'name',
        organization: 'name',
        contact: 'contactName',
        contact_person: 'contactName',
        email: importType === 'client_import' ? 'contactEmail' : 'email',
        phone: importType === 'client_import' ? 'contactPhone' : 'phoneNumber',
        telephone: importType === 'client_import' ? 'contactPhone' : 'phoneNumber',
        // Influencer field aliases
        creator_id: 'creatorId',
        full_name: 'fullName',
        social_media: 'socialMedia',
        phone_number: 'phoneNumber',
        social_link: 'socialLink',
        agency_name: 'agencyName',
        manager_name: 'managerName',
        past_clients: 'pastClients',
      }

      // Check alias mapping first
      const aliasMatch = headerAliases[normalizedHeader]
      if (aliasMatch && dbFields.some((f) => f.value === aliasMatch)) {
        return {
          csvColumn: header,
          dbField: aliasMatch,
        }
      }

      const matchingField = dbFields.find(
        (field) =>
          field.value &&
          (field.value === camelCaseHeader ||
            field.value.toLowerCase() === normalizedHeader.replace(/_/g, ''))
      )
      return {
        csvColumn: header,
        dbField: matchingField?.value || '',
      }
    })

    setColumnMappings(autoMappings)
    setStep('map')
  }

  const handleMappingChange = (index: number, dbField: string) => {
    const newMappings = [...columnMappings]
    newMappings[index].dbField = dbField
    setColumnMappings(newMappings)
  }

  const validateMappings = (): boolean => {
    const requiredFields = config.requiredFields
    const mappedFields = columnMappings.map((m) => m.dbField).filter((f) => f)

    for (const required of requiredFields) {
      if (!mappedFields.includes(required)) {
        const fieldDef = dbFields.find((f) => f.value === required)
        setError(`Required field missing: ${fieldDef?.label || required}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateMappings()) return

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Build column mapping object
      const columnMapping: Record<string, string> = {}
      columnMappings.forEach((mapping) => {
        if (mapping.dbField) {
          columnMapping[mapping.csvColumn] = mapping.dbField
        }
      })

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file!)
      formData.append('jobType', importType)
      formData.append('payload', JSON.stringify({ columnMapping }))

      const response = await apiClient.post('/jobs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setSuccess(`Import job created successfully! Job ID: ${response.data.taskId}`)

      // Reset form
      setTimeout(() => {
        setFile(null)
        setCsvHeaders([])
        setCsvData([])
        setColumnMappings([])
        setStep('upload')
        setSuccess(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onSuccess()
      }, 2000)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setFile(null)
    setCsvHeaders([])
    setCsvData([])
    setColumnMappings([])
    setStep('upload')
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{config.title}</h3>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="mt-4">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <span>Upload a file</span>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">CSV or TXT up to 10MB</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
                {importType === 'client_import' ? 'Supported Columns:' : 'Required Columns:'}
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {config.requiredColumnsHelp.map((text, idx) => (
                  <li key={idx}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Map CSV Columns</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Match your CSV columns to database fields
                </p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {csvData.length} rows detected
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      CSV Column
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      Sample Data
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      Maps To
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {columnMappings.map((mapping, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {mapping.csvColumn}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {csvData[0]?.[index] || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={mapping.dbField}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          {dbFields.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Start Import'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
