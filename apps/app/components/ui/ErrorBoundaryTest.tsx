import React, { useState } from 'react'
import { Button, Text, View } from 'react-native'
import { ErrorBoundary, useErrorBoundary } from '../ErrorBoundary'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'

// Test component that can throw errors
function BuggyComponent() {
  const [shouldThrow, setShouldThrow] = useState(false)
  const { captureError } = useErrorBoundary()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  if (shouldThrow) {
    throw new Error('Test error from BuggyComponent!')
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ color: colors.foreground, marginBottom: 16 }}>
        Error Boundary Test Component
      </Text>
      
      <View style={{ gap: 12 }}>
        <Button
          title="Throw Error (Component)"
          onPress={() => setShouldThrow(true)}
        />
        
        <Button
          title="Capture Error (Hook)"
          onPress={() => {
            captureError(new Error('Test error from useErrorBoundary hook!'))
          }}
        />
        
        <Button
          title="Async Error"
          onPress={async () => {
            try {
              await new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Async test error!')), 100)
              )
            } catch (error) {
              captureError(error as Error)
            }
          }}
        />
      </View>
    </View>
  )
}

// Main test component with error boundary
export default function ErrorBoundaryTest() {
  const [key, setKey] = useState(0)

  const handleRetry = () => {
    setKey(prev => prev + 1)
  }

  return (
    <ErrorBoundary
      key={key}
      onError={(error) => {
        console.log('Error boundary test caught error:', error)
      }}
      fallback={({ error, retry }) => (
        <View style={{ padding: 20 }}>
          <Text style={{ color: 'red', marginBottom: 16 }}>
            Error Boundary Caught: {error.message}
          </Text>
          <Button title="Retry" onPress={retry} />
          <Button title="Reset Test" onPress={handleRetry} />
        </View>
      )}
    >
      <BuggyComponent />
    </ErrorBoundary>
  )
}