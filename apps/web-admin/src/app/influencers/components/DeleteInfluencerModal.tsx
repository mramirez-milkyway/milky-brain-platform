'use client'

import { useCallback } from 'react'
import { Modal } from '@/components/ui/modal'
import { useDeleteCreator } from '../hooks/useCreatorMutations'

interface CreatorBasicInfo {
  id: number
  fullName: string
  creatorSocials?: Array<{
    socialMedia: string
    handle: string
  }>
}

interface DeleteInfluencerModalProps {
  isOpen: boolean
  onClose: () => void
  creator: CreatorBasicInfo | null
  onSuccess?: () => void
}

export function DeleteInfluencerModal({
  isOpen,
  onClose,
  creator,
  onSuccess,
}: DeleteInfluencerModalProps) {
  const deleteCreator = useDeleteCreator()

  const handleConfirm = useCallback(async () => {
    if (!creator) return

    try {
      await deleteCreator.mutateAsync(creator.id)
      onClose()
      onSuccess?.()
    } catch {
      // Error handling is done by the mutation
    }
  }, [creator, deleteCreator, onClose, onSuccess])

  if (!creator) return null

  const primaryHandle = creator.creatorSocials?.[0]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[558px] m-5 sm:m-0 rounded-3xl bg-white p-6 overflow-hidden lg:p-10 dark:bg-gray-900"
    >
      <div className="text-center">
        {/* Warning Icon */}
        <div className="relative z-1 mb-7 flex items-center justify-center">
          <svg
            className="fill-error-50 dark:fill-error-500/15"
            width="90"
            height="90"
            viewBox="0 0 90 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z"
              fill=""
              fillOpacity=""
            />
          </svg>

          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg
              className="fill-error-600 dark:fill-error-500"
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M19 6.33337C11.6362 6.33337 5.66666 12.3029 5.66666 19.6667C5.66666 27.0305 11.6362 33 19 33C26.3638 33 32.3333 27.0305 32.3333 19.6667C32.3333 12.3029 26.3638 6.33337 19 6.33337ZM19 13.0001C19.6904 13.0001 20.25 13.5597 20.25 14.2501V20.9167C20.25 21.6071 19.6904 22.1667 19 22.1667C18.3096 22.1667 17.75 21.6071 17.75 20.9167V14.2501C17.75 13.5597 18.3096 13.0001 19 13.0001ZM19 24.6667C18.3096 24.6667 17.75 25.2263 17.75 25.9167C17.75 26.6071 18.3096 27.1667 19 27.1667C19.6904 27.1667 20.25 26.6071 20.25 25.9167C20.25 25.2263 19.6904 24.6667 19 24.6667Z"
                fill=""
              />
            </svg>
          </span>
        </div>

        <h4 className="sm:text-title-sm mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Delete Influencer?
        </h4>

        <div className="mb-4">
          <p className="text-base font-medium text-gray-800 dark:text-white/90">
            {creator.fullName}
          </p>
          {primaryHandle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{primaryHandle.handle} on {primaryHandle.socialMedia}
            </p>
          )}
        </div>

        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          This will remove the influencer from your directory. The record can be restored
          if you add them again using the same social media handle.
        </p>

        {/* Error message */}
        {deleteCreator.isError && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            {(deleteCreator.error as Error)?.message || 'Failed to delete. Please try again.'}
          </div>
        )}

        <div className="mt-8 flex w-full items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteCreator.isPending}
            className="shadow-theme-xs flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            No, Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleteCreator.isPending}
            className="shadow-theme-xs flex justify-center rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteCreator.isPending ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteInfluencerModal
