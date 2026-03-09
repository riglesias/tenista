import { Platform } from 'react-native'

/**
 * Countries where WhatsApp is the preferred messaging method
 */
export const WHATSAPP_PREFERRED_COUNTRIES = ['CL']

/**
 * Check if WhatsApp should be used for a given country code
 */
export function shouldUseWhatsApp(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false
  return WHATSAPP_PREFERRED_COUNTRIES.includes(countryCode.toUpperCase())
}

/**
 * Format phone number for WhatsApp (E.164 without the "+" prefix)
 * @param phoneCountryCode - The country code with or without "+" (e.g., "+56" or "56")
 * @param phoneNumber - The phone number (may contain dashes or spaces)
 * @returns Formatted phone number (e.g., "56912345678") or null if invalid
 */
export function formatPhoneForWhatsApp(
  phoneCountryCode: string | null | undefined,
  phoneNumber: string | null | undefined
): string | null {
  if (!phoneCountryCode || !phoneNumber) return null

  // Strip "+" from country code
  const cleanCountryCode = phoneCountryCode.replace(/^\+/, '')

  // Strip all non-digits from phone number
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '')

  if (!cleanCountryCode || !cleanPhoneNumber) return null

  return `${cleanCountryCode}${cleanPhoneNumber}`
}

/**
 * Build WhatsApp URL with pre-filled message
 * @param phone - Phone number in E.164 format without "+" (e.g., "56912345678")
 * @param message - Optional message to pre-fill
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const baseUrl = `https://wa.me/${phone}`
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`
  }
  return baseUrl
}

/**
 * Build SMS URL (platform-specific)
 * @param phone - Phone number (can include country code with +)
 * @param message - Optional message to pre-fill
 */
export function buildSmsUrl(phone: string, message?: string): string {
  if (message) {
    // iOS uses & as separator, Android uses ?
    const separator = Platform.OS === 'ios' ? '&' : '?'
    return `sms:${phone}${separator}body=${encodeURIComponent(message)}`
  }
  return `sms:${phone}`
}
