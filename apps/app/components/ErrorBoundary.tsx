import React from 'react'
import { View } from 'react-native'
import ErrorMessage from './ui/ErrorMessage'
import { AppError, logError } from '@/lib/utils/errors'

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>
  onError?: (error: AppError) => void
  resetOnPropsChange?: boolean
  resetKeys?: (string | number)[]
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError: AppError = {
      code: 'COMPONENT_ERROR',
      message: error.message || 'A component error occurred',
      details: {
        stack: error.stack,
        componentStack: (error as any).componentStack,
      },
      originalError: error,
      timestamp: new Date().toISOString(),
    }

    return {
      hasError: true,
      error: appError,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError: AppError = {
      code: 'COMPONENT_ERROR',
      message: error.message || 'A component error occurred',
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
      originalError: error,
      timestamp: new Date().toISOString(),
    }

    // Log the error
    logError(appError, 'ErrorBoundary')

    // Call custom error handler if provided
    this.props.onError?.(appError)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys![idx] !== resetKey
      )

      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }

    // Reset error boundary when any props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary()
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    // Reset state after a brief delay to prevent immediate re-errors
    this.resetTimeoutId = setTimeout(() => {
      this.setState({ hasError: false, error: null })
    }, 100)
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback: Fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (Fallback) {
        return <Fallback error={error} retry={this.resetErrorBoundary} />
      }

      // Default error UI - TEMPORARY: Show detailed error for debugging
      return (
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <ErrorMessage
            title="Debug: Component Error"
            message={`${error.code}: ${error.message}\n\nDetails: ${JSON.stringify(error.details, null, 2)}`}
            onRetry={this.resetErrorBoundary}
            retryText="Try Again"
            variant="default"
          />
        </View>
      )
    }

    return children
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`

  return WrappedComponent
}

// Hook for manually triggering error boundary reset
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { resetError, captureError }
}

// Specific error boundary for async operations
interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  onRetry?: () => void | Promise<void>
}

export function AsyncErrorBoundary({
  onRetry,
  children,
  ...props
}: AsyncErrorBoundaryProps) {
  const handleRetry = async () => {
    try {
      await onRetry?.()
    } catch (error) {
      // silently handled
    }
  }

  const FallbackComponent = ({ error, retry }: { error: AppError; retry: () => void }) => (
    <ErrorMessage
      title="Operation Failed"
      message={error.message}
      onRetry={async () => {
        await handleRetry()
        retry()
      }}
      retryText="Try Again"
      variant="default"
    />
  )

  return (
    <ErrorBoundary {...props} fallback={FallbackComponent}>
      {children}
    </ErrorBoundary>
  )
}