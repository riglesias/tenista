import React from 'react'

// Utility for deep comparison of props (useful for React.memo)
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  
  if (a == null || b == null) return false
  
  if (typeof a !== typeof b) return false
  
  if (typeof a !== 'object') return false
  
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }
  
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  
  if (keysA.length !== keysB.length) return false
  
  return keysA.every(key => deepEqual(a[key], b[key]))
}

// Custom React.memo with deep comparison
export function memoDeep<T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): T {
  return React.memo(Component, propsAreEqual || deepEqual) as T
}

// Memoization for expensive calculations
export function useMemoDeep<T>(factory: () => T, deps: React.DependencyList): T {
  return React.useMemo(factory, deps)
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instances = new Map<string, number>()
  
  static start(label: string): void {
    this.instances.set(label, performance.now())
  }
  
  static end(label: string, logThreshold = 100): number {
    const startTime = this.instances.get(label)
    if (!startTime) {
      return 0
    }
    
    const duration = performance.now() - startTime
    this.instances.delete(label)
    
    return duration
  }
  
  static measure<T>(label: string, fn: () => T, logThreshold = 100): T {
    this.start(label)
    const result = fn()
    this.end(label, logThreshold)
    return result
  }
  
  static async measureAsync<T>(
    label: string, 
    fn: () => Promise<T>, 
    logThreshold = 100
  ): Promise<T> {
    this.start(label)
    const result = await fn()
    this.end(label, logThreshold)
    return result
  }
}

// Hook for monitoring component render performance
export function useRenderPerformance(componentName: string, props?: any) {
  React.useEffect(() => {
    const label = `${componentName}_render`
    PerformanceMonitor.start(label)
    
    return () => {
      PerformanceMonitor.end(label, 16) // 16ms threshold for 60fps
    }
  })
  
  // Props change tracking available in development via React DevTools
}

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for performance optimization
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value)
  const lastRun = React.useRef<number>(Date.now())

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= limit) {
        setThrottledValue(value)
        lastRun.current = Date.now()
      }
    }, limit - (Date.now() - lastRun.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}