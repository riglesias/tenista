import { useCallback, useReducer } from 'react'

interface LoadingState {
  [key: string]: boolean
}

type LoadingAction = 
  | { type: 'START_LOADING'; key: string }
  | { type: 'STOP_LOADING'; key: string }
  | { type: 'RESET' }

function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, [action.key]: true }
    case 'STOP_LOADING':
      return { ...state, [action.key]: false }
    case 'RESET':
      return {}
    default:
      return state
  }
}

export function useLoadingState() {
  const [loadingState, dispatch] = useReducer(loadingReducer, {})

  const startLoading = useCallback((key: string) => {
    dispatch({ type: 'START_LOADING', key })
  }, [])

  const stopLoading = useCallback((key: string) => {
    dispatch({ type: 'STOP_LOADING', key })
  }, [])

  const isLoading = useCallback((key: string) => {
    return Boolean(loadingState[key])
  }, [loadingState])

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingState).some(Boolean)
  }, [loadingState])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const withLoading = useCallback(
    async <T>(key: string, asyncFn: () => Promise<T>): Promise<T> => {
      try {
        startLoading(key)
        const result = await asyncFn()
        return result
      } finally {
        stopLoading(key)
      }
    },
    [startLoading, stopLoading]
  )

  return {
    isLoading,
    isAnyLoading,
    startLoading,
    stopLoading,
    reset,
    withLoading,
    loadingStates: loadingState,
  }
}

// Specialized hook for async operations with loading, error, and success states
export function useAsyncOperation<T = any>() {
  const { withLoading, isLoading } = useLoadingState()

  const execute = useCallback(
    async (
      key: string,
      asyncFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void
        onError?: (error: Error) => void
        onFinally?: () => void
      }
    ): Promise<{ data: T | null; error: Error | null }> => {
      try {
        const data = await withLoading(key, asyncFn)
        options?.onSuccess?.(data)
        return { data, error: null }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error))
        options?.onError?.(errorObj)
        return { data: null, error: errorObj }
      } finally {
        options?.onFinally?.()
      }
    },
    [withLoading]
  )

  return {
    execute,
    isLoading,
  }
}