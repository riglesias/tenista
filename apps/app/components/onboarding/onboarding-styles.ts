import { Platform } from 'react-native';
import { getThemeColors } from '@/lib/utils/theme';

// Theme-aware onboarding styles factory
export const createOnboardingStyles = (isDark: boolean) => {
  const colors = getThemeColors(isDark);
  
  return {
    // Layout
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    // Typography
    title: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'left' as const,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginBottom: 32,
      lineHeight: 22,
      textAlign: 'left' as const,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.foreground,
      marginBottom: 16,
    },
    
    // Buttons
    buttonContainer: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row' as const,
      padding: 24,
      gap: 16,
      backgroundColor: colors.background,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    continueButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 56,
    },
    continueButtonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    backButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'transparent',
      minHeight: 56,
    },
    backButtonText: {
      color: colors.foreground,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    iconBackButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'transparent',
    },
    disabledButton: {
      opacity: 0.6,
    },
    
    // Form elements
    input: {
      backgroundColor: colors.input,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontSize: 16,
      color: colors.foreground,
      marginBottom: 8,
      fontWeight: '600' as const,
    },
    fieldContainer: {
      marginBottom: 24,
    },
    
    // Cards and containers
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    
    // Loading states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    loadingText: {
      color: colors.foreground,
      fontSize: 16,
      marginTop: 16,
    },
    
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: colors.foreground,
    },
    modalCloseButton: {
      padding: 4,
    },
    
    // Search
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.input,
      borderRadius: 8,
      paddingHorizontal: 16,
      margin: 24,
      marginTop: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
    },
    
    // Empty states
    emptyContainer: {
      padding: 40,
      alignItems: 'center' as const,
    },
    emptyText: {
      color: colors.mutedForeground,
      fontSize: 16,
    },
  };
};

// Legacy export for backward compatibility (will be removed)
export const onboardingStyles = createOnboardingStyles(false); 