import { createOrUpdatePlayerProfile } from '@/lib/actions/player.actions';
import { Alert } from 'react-native';

/**
 * Common error handler for onboarding screens
 */
export function handleOnboardingError(error: any, context: string) {
  console.error(`${context} error:`, error);
  Alert.alert('Error', `Failed to ${context}. Please try again.`);
}

/**
 * Save profile data and handle errors
 */
export async function saveProfileData(
  userId: string,
  data: any,
  context: string
): Promise<{ success: boolean }> {
  try {
    const { error } = await createOrUpdatePlayerProfile(userId, data);
    
    if (error) {
      handleOnboardingError(error, context);
      return { success: false };
    }
    
    return { success: true };
  } catch (error) {
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    console.error(`${context} exception:`, error);
    return { success: false };
  }
}

/**
 * Format phone codes mapping - simplified version
 * In production, you'd want a complete mapping
 */
export const PHONE_CODES: Record<string, string> = {
  'US': '+1', 'GB': '+44', 'FR': '+33', 'DE': '+49', 'IT': '+39', 'ES': '+34',
  'PT': '+351', 'NL': '+31', 'BE': '+32', 'CH': '+41', 'AT': '+43', 'SE': '+46',
  'NO': '+47', 'DK': '+45', 'FI': '+358', 'IE': '+353', 'PL': '+48', 'CZ': '+420',
  'GR': '+30', 'TR': '+90', 'RU': '+7', 'UA': '+380', 'IN': '+91', 'CN': '+86',
  'JP': '+81', 'KR': '+82', 'AU': '+61', 'NZ': '+64', 'ZA': '+27', 'EG': '+20',
  'MA': '+212', 'NG': '+234', 'KE': '+254', 'GH': '+233', 'TN': '+216', 'DZ': '+213',
  'SA': '+966', 'AE': '+971', 'IL': '+972', 'JO': '+962', 'LB': '+961', 'KW': '+965',
  'QA': '+974', 'BH': '+973', 'OM': '+968', 'IQ': '+964', 'IR': '+98', 'SY': '+963',
  'YE': '+967', 'LY': '+218', 'SD': '+249', 'ET': '+251', 'SO': '+252', 'DJ': '+253',
  'MX': '+52', 'CA': '+1', 'BR': '+55', 'AR': '+54', 'CL': '+56', 'CO': '+57',
  'PE': '+51', 'VE': '+58', 'EC': '+593', 'BO': '+591', 'PY': '+595', 'UY': '+598',
  'GY': '+592', 'SR': '+597', 'GF': '+594', 'FK': '+500', 'CR': '+506', 'PA': '+507',
  'NI': '+505', 'HN': '+504', 'SV': '+503', 'GT': '+502', 'BZ': '+501', 'DO': '+1',
  'HT': '+509', 'JM': '+1', 'CU': '+53', 'BS': '+1', 'BB': '+1', 'TT': '+1',
};

export function getPhoneCode(countryCode: string): string {
  return PHONE_CODES[countryCode] || '+1';
}

/**
 * Format phone number based on country
 */
export function formatPhoneNumber(text: string, phoneCountryCode: string): string {
  // Remove all non-numeric characters
  const cleaned = text.replace(/\D/g, '');
  
  // Format based on US number pattern (you can adjust for other countries)
  if (phoneCountryCode === '+1') {
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  return cleaned;
} 