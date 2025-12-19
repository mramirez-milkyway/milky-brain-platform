'use client'

import { useState, useCallback, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import { useUpdateCreator, type UpdateCreatorInput } from '../hooks/useCreatorMutations'

interface CreatorSocial {
  id: number
  socialMedia: string
  handle: string
  followers: number | null
  tier: string | null
  socialLink: string | null
}

interface CreatorData {
  id: number
  fullName: string
  gender: string | null
  country: string | null
  city: string | null
  email: string | null
  phoneNumber: string | null
  characteristics: string | null
  pastClients: string | null
  pastCampaigns: string | null
  comments: string | null
  isActive: boolean
  languages: string | null
  categories: string | null
  internalTags: string | null
  isBlacklisted: boolean
  blacklistReason: string | null
  agencyName: string | null
  managerName: string | null
  billingInfo: string | null
  internalRating: number | null
  creatorSocials: CreatorSocial[]
}

interface EditInfluencerModalProps {
  isOpen: boolean
  onClose: () => void
  creator: CreatorData | null
  onSuccess?: () => void
}

interface FormData {
  fullName: string
  gender: 'male' | 'female' | 'organization' | ''
  country: string
  city: string
  email: string
  phoneNumber: string
  categories: string
  languages: string
  internalTags: string
  characteristics: string
  pastClients: string
  pastCampaigns: string
  comments: string
  agencyName: string
  managerName: string
  billingInfo: string
  internalRating: number | ''
  isActive: boolean
  isBlacklisted: boolean
  blacklistReason: string
}

// Parse JSON string or comma-separated list
function parseToString(value: string | null): string {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.join(', ') : value
  } catch {
    return value
  }
}

export function EditInfluencerModal({
  isOpen,
  onClose,
  creator,
  onSuccess,
}: EditInfluencerModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    gender: '',
    country: '',
    city: '',
    email: '',
    phoneNumber: '',
    categories: '',
    languages: '',
    internalTags: '',
    characteristics: '',
    pastClients: '',
    pastCampaigns: '',
    comments: '',
    agencyName: '',
    managerName: '',
    billingInfo: '',
    internalRating: '',
    isActive: true,
    isBlacklisted: false,
    blacklistReason: '',
  })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const updateCreator = useUpdateCreator()

  // Populate form when creator data changes
  useEffect(() => {
    if (creator) {
      setFormData({
        fullName: creator.fullName || '',
        gender: (creator.gender as FormData['gender']) || '',
        country: creator.country || '',
        city: creator.city || '',
        email: creator.email || '',
        phoneNumber: creator.phoneNumber || '',
        categories: parseToString(creator.categories),
        languages: parseToString(creator.languages),
        internalTags: parseToString(creator.internalTags),
        characteristics: creator.characteristics || '',
        pastClients: creator.pastClients || '',
        pastCampaigns: creator.pastCampaigns || '',
        comments: creator.comments || '',
        agencyName: creator.agencyName || '',
        managerName: creator.managerName || '',
        billingInfo: creator.billingInfo || '',
        internalRating: creator.internalRating ?? '',
        isActive: creator.isActive,
        isBlacklisted: creator.isBlacklisted,
        blacklistReason: creator.blacklistReason || '',
      })
      setFormErrors({})
    }
  }, [creator])

  // Handle close
  const handleClose = useCallback(() => {
    setFormErrors({})
    onClose()
  }, [onClose])

  // Handle form field change
  const handleFieldChange = useCallback(
    (field: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target
        let value: string | number | boolean

        if (target.type === 'checkbox') {
          value = (target as HTMLInputElement).checked
        } else if (target.type === 'number') {
          value = target.value === '' ? '' : Number(target.value)
        } else {
          value = target.value
        }

        setFormData((prev) => ({ ...prev, [field]: value }))

        // Clear error when field is edited
        if (formErrors[field]) {
          setFormErrors((prev) => ({ ...prev, [field]: undefined }))
        }
      },
    [formErrors]
  )

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (
      formData.internalRating !== '' &&
      (formData.internalRating < 0 || formData.internalRating > 100)
    ) {
      errors.internalRating = 'Rating must be between 0 and 100'
    }
    if (formData.isBlacklisted && !formData.blacklistReason.trim()) {
      errors.blacklistReason = 'Reason is required when blacklisting'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!creator || !validateForm()) return

    const payload: UpdateCreatorInput = {
      fullName: formData.fullName,
      gender: formData.gender || undefined,
      country: formData.country || undefined,
      city: formData.city || undefined,
      email: formData.email || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      categories: formData.categories || undefined,
      languages: formData.languages || undefined,
      internalTags: formData.internalTags || undefined,
      characteristics: formData.characteristics || undefined,
      pastClients: formData.pastClients || undefined,
      pastCampaigns: formData.pastCampaigns || undefined,
      comments: formData.comments || undefined,
      agencyName: formData.agencyName || undefined,
      managerName: formData.managerName || undefined,
      billingInfo: formData.billingInfo || undefined,
      internalRating: formData.internalRating !== '' ? formData.internalRating : undefined,
      isActive: formData.isActive,
      isBlacklisted: formData.isBlacklisted,
      blacklistReason: formData.isBlacklisted ? formData.blacklistReason : undefined,
    }

    try {
      await updateCreator.mutateAsync({ id: creator.id, data: payload })
      handleClose()
      onSuccess?.()
    } catch {
      // Error handling is done by the mutation
    }
  }, [creator, validateForm, formData, updateCreator, handleClose, onSuccess])

  if (!creator) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="relative w-full max-w-[700px] m-5 sm:m-0 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 lg:p-8">
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Edit Influencer
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the details for {creator.fullName}
            </p>
          </div>

          {/* Error message */}
          {updateCreator.isError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
              {(updateCreator.error as Error)?.message ||
                'Failed to update influencer. Please try again.'}
            </div>
          )}

          {/* Social accounts info (read-only) */}
          {creator.creatorSocials.length > 0 && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Social Accounts
              </h5>
              <div className="space-y-2">
                {creator.creatorSocials.map((social) => (
                  <div
                    key={social.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {social.socialMedia}: @{social.handle}
                    </span>
                    {social.followers && (
                      <span className="text-gray-500 dark:text-gray-500">
                        {social.followers.toLocaleString()} followers
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
          >
            {/* Basic Info */}
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Basic Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={handleFieldChange('fullName')}
                    error={!!formErrors.fullName}
                    hint={formErrors.fullName}
                    required
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select
                    value={formData.gender}
                    onChange={handleFieldChange('gender')}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>
                <div>
                  <Label>Internal Rating (0-100)</Label>
                  <Input
                    type="number"
                    value={formData.internalRating}
                    onChange={handleFieldChange('internalRating')}
                    min="0"
                    max="100"
                    error={!!formErrors.internalRating}
                    hint={formErrors.internalRating}
                  />
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleFieldChange('isActive')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Country</Label>
                  <Input
                    type="text"
                    value={formData.country}
                    onChange={handleFieldChange('country')}
                    placeholder="e.g., United States"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={handleFieldChange('city')}
                    placeholder="e.g., Los Angeles"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contact Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={handleFieldChange('email')}
                    placeholder="influencer@example.com"
                    error={!!formErrors.email}
                    hint={formErrors.email}
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={handleFieldChange('phoneNumber')}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>

            {/* Categories & Languages */}
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Categories & Languages
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Categories</Label>
                  <Input
                    type="text"
                    value={formData.categories}
                    onChange={handleFieldChange('categories')}
                    placeholder="e.g., fashion, beauty, lifestyle"
                  />
                </div>
                <div>
                  <Label>Languages</Label>
                  <Input
                    type="text"
                    value={formData.languages}
                    onChange={handleFieldChange('languages')}
                    placeholder="e.g., English, Spanish"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Internal Tags</Label>
                  <Input
                    type="text"
                    value={formData.internalTags}
                    onChange={handleFieldChange('internalTags')}
                    placeholder="e.g., vip, priority, new"
                  />
                </div>
              </div>
            </div>

            {/* Agency Info */}
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Agency Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Agency Name</Label>
                  <Input
                    type="text"
                    value={formData.agencyName}
                    onChange={handleFieldChange('agencyName')}
                    placeholder="Agency name if applicable"
                  />
                </div>
                <div>
                  <Label>Manager Name</Label>
                  <Input
                    type="text"
                    value={formData.managerName}
                    onChange={handleFieldChange('managerName')}
                    placeholder="Manager/agent name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Billing Info</Label>
                  <Input
                    type="text"
                    value={formData.billingInfo}
                    onChange={handleFieldChange('billingInfo')}
                    placeholder="Billing/payment information"
                  />
                </div>
              </div>
            </div>

            {/* Professional History */}
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Professional History
              </h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Past Clients</Label>
                  <textarea
                    value={formData.pastClients}
                    onChange={handleFieldChange('pastClients')}
                    placeholder="List of past clients..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <Label>Past Campaigns</Label>
                  <textarea
                    value={formData.pastCampaigns}
                    onChange={handleFieldChange('pastCampaigns')}
                    placeholder="List of past campaigns..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Additional Notes
              </h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Characteristics</Label>
                  <textarea
                    value={formData.characteristics}
                    onChange={handleFieldChange('characteristics')}
                    placeholder="Notable characteristics or style..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <Label>Comments</Label>
                  <textarea
                    value={formData.comments}
                    onChange={handleFieldChange('comments')}
                    placeholder="Internal comments or notes..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>

            {/* Blacklist Section */}
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h5 className="text-sm font-semibold text-red-600 dark:text-red-400">
                Blacklist Status
              </h5>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBlacklisted}
                    onChange={handleFieldChange('isBlacklisted')}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mark as Blacklisted
                  </span>
                </label>
                {formData.isBlacklisted && (
                  <div>
                    <Label>Blacklist Reason *</Label>
                    <textarea
                      value={formData.blacklistReason}
                      onChange={handleFieldChange('blacklistReason')}
                      placeholder="Reason for blacklisting..."
                      rows={2}
                      className={`w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                        formErrors.blacklistReason
                          ? 'border-red-500 focus:border-red-300 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800'
                      }`}
                    />
                    {formErrors.blacklistReason && (
                      <p className="mt-1.5 text-xs text-red-500">{formErrors.blacklistReason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleClose} disabled={updateCreator.isPending}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={updateCreator.isPending}>
                {updateCreator.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}

export default EditInfluencerModal
