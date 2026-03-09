import React from 'react'
import { Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'

interface FormFieldProps extends TextInputProps {
  label?: string
  error?: string
  required?: boolean
  style?: ViewStyle
  inputStyle?: ViewStyle
  variant?: 'default' | 'outlined' | 'filled'
}

const FormField = React.memo(function FormField({
  label,
  error,
  required = false,
  style,
  inputStyle,
  variant = 'outlined',
  ...inputProps
}: FormFieldProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const getVariantStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.muted,
          borderWidth: 0,
          borderRadius: 8,
        }
      case 'default':
        return {
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: error ? colors.destructive : colors.border,
          borderRadius: 0,
        }
      default:
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          borderRadius: 8,
        }
    }
  }

  const variantStyle = getVariantStyle()

  return (
    <View style={style}>
      {label && (
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: colors.foreground,
          marginBottom: 6,
        }}>
          {label}
          {required && (
            <Text style={{ color: colors.destructive }}> *</Text>
          )}
        </Text>
      )}
      
      <TextInput
        style={[
          {
            ...variantStyle,
            paddingHorizontal: variant === 'default' ? 0 : 12,
            paddingVertical: variant === 'default' ? 8 : 12,
            fontSize: 16,
            color: colors.foreground,
            minHeight: 48,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...inputProps}
      />
      
      {error && (
        <Text style={{
          fontSize: 12,
          color: colors.destructive,
          marginTop: 4,
        }}>
          {error}
        </Text>
      )}
    </View>
  )
})

export default FormField