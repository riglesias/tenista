import * as Sentry from '@sentry/react-native'

// Strongly typed error interfaces
export interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
  originalError?: Error
  timestamp: string
  userId?: string
}

export type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR'
  | 'COMPONENT_ERROR'

export interface ApiResponse<T> {
  data: T | null
  error: AppError | null
  loading?: boolean
}

// Error transformation utilities
export function transformError(error: unknown, context?: string): AppError {
  const timestamp = new Date().toISOString()
  
  // Handle known error types
  if (error instanceof Error) {
    // Supabase errors
    if ('code' in error) {
      return {
        code: getErrorCodeFromSupabase(error.message),
        message: getUserFriendlyMessage(error.message),
        details: { supabaseCode: (error as any).code },
        originalError: error,
        timestamp,
      }
    }

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection error. Please check your internet connection.',
        originalError: error,
        timestamp,
      }
    }

    // Generic Error objects
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      originalError: error,
      timestamp,
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      timestamp,
    }
  }

  // Handle object errors with message
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: String((error as any).message),
      details: error as Record<string, unknown>,
      timestamp,
    }
  }

  // Fallback for unknown error types
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: { error: String(error) },
    timestamp,
  }
}

function getErrorCodeFromSupabase(message: string): ErrorCode {
  if (message.includes('auth') || message.includes('unauthorized')) {
    return 'AUTH_ERROR'
  }
  if (message.includes('permission') || message.includes('forbidden')) {
    return 'PERMISSION_ERROR'
  }
  if (message.includes('not found') || message.includes('does not exist')) {
    return 'NOT_FOUND_ERROR'
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR'
  }
  if (message.includes('timeout')) {
    return 'TIMEOUT_ERROR'
  }
  return 'DATABASE_ERROR'
}

function getUserFriendlyMessage(message: string): string {
  // Map technical error messages to user-friendly ones
  const errorMap: Record<string, string> = {
    'auth session missing': 'Please sign in to continue',
    'permission denied': 'You don\'t have permission to perform this action',
    'network request failed': 'Network connection error. Please try again.',
    'invalid email': 'Please enter a valid email address',
    'weak password': 'Password must be at least 8 characters long',
    'email already registered': 'An account with this email already exists',
    'invalid credentials': 'Invalid email or password',
    'user not found': 'User account not found',
    'league not found': 'League not found',
    'player not found': 'Player not found',
  }

  const lowercaseMessage = message.toLowerCase()
  
  for (const [key, friendlyMessage] of Object.entries(errorMap)) {
    if (lowercaseMessage.includes(key)) {
      return friendlyMessage
    }
  }

  return message
}

// Centralized error logging
export function logError(error: AppError, context?: string) {
  // Console logging for development
  console.error(`[${error.code}] ${error.message}`, {
    timestamp: error.timestamp,
    context,
    details: error.details,
    originalError: error.originalError,
  })

  // Sentry logging for production
  if (error.code !== 'COMPONENT_ERROR') {
    Sentry.captureException(error.originalError || new Error(error.message), {
      tags: {
        errorCode: error.code,
        context,
      },
      extra: {
        errorDetails: error.details,
        timestamp: error.timestamp,
      },
    })
  }
}

// Error reporting utilities
export function reportError(error: unknown, context?: string): AppError {
  const appError = transformError(error, context)
  logError(appError, context)
  return appError
}

// Custom hook for error handling
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    return reportError(error, context)
  }

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<ApiResponse<T>> => {
    try {
      const data = await asyncFn()
      return { data, error: null }
    } catch (error) {
      const appError = handleError(error, context)
      return { data: null, error: appError }
    }
  }

  return { handleError, handleAsyncError }
}