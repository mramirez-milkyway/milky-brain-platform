import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
})

let isRefreshing = false
let isRedirecting = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })

  failedQueue = []
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(/csrf_token=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Request interceptor: Add CSRF token to mutation requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase()

    // Add CSRF token to mutation requests
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Redirect to login page (prevents multiple redirects)
 */
function redirectToLogin() {
  if (typeof window !== 'undefined' && !isRedirecting) {
    isRedirecting = true
    window.location.href = '/login?error=session_expired'
  }
}

/**
 * Response interceptor: Handle 401 with token refresh and CSRF errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If already redirecting, reject immediately without further processing
    if (isRedirecting) {
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh attempt for the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh token
        await apiClient.post('/auth/refresh')

        // Refresh successful, process queued requests
        processQueue()
        isRefreshing = false

        // Retry original request
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear queue and redirect to login
        processQueue(refreshError as Error)
        isRefreshing = false
        redirectToLogin()

        return Promise.reject(refreshError)
      }
    }

    // Handle 403 Forbidden - might be CSRF error
    if (error.response?.status === 403) {
      const errorMessage = (error.response.data as { message?: string })?.message || ''

      if (errorMessage.includes('CSRF')) {
        // CSRF token invalid - try refreshing once
        if (!originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Refresh to get new CSRF token
            await apiClient.post('/auth/refresh')

            // Retry original request with new CSRF token
            return apiClient(originalRequest)
          } catch (refreshError) {
            // Show error to user
            if (typeof window !== 'undefined') {
              console.error('CSRF validation failed after refresh')
            }
            return Promise.reject(error)
          }
        }
      }
    }

    // For other errors, just reject
    return Promise.reject(error)
  }
)
