import { SetMetadata } from '@nestjs/common'

/**
 * Decorator to skip CSRF validation for specific routes
 * Use this sparingly and only for routes that don't perform mutations
 */
export const SkipCsrf = () => SetMetadata('skipCsrf', true)
