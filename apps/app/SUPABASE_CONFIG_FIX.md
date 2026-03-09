# Supabase Email Confirmation Redirect Fix

## Problem
When users click the email confirmation link, they are redirected to localhost instead of the mobile app.

## Root Cause
Supabase email templates are configured with localhost URLs instead of the proper mobile app deep link scheme.

## Solution

### 1. Update Supabase Project Configuration

In your Supabase dashboard (https://supabase.com/dashboard/project/YOUR_PROJECT_ID):

#### A. Go to Authentication > URL Configuration
Set the following URLs:

**Site URL:**
- For development: `tenistaapp://`
- For production: `tenistaapp://`

**Redirect URLs:**
Add these URLs to the allowed redirect URLs list:
- `tenistaapp://auth/callback`
- `tenistaapp://auth/confirm`
- `exp://localhost:8081` (for Expo development)
- `exp://192.168.1.XXX:8081` (replace XXX with your local IP for testing)

#### B. Go to Authentication > Email Templates

**Confirm Signup Template:**
Replace the confirmation URL in the email template:

**Current (broken):**
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

**Fixed:**
```html
<a href="tenistaapp://auth/confirm?token={{ .Token }}&type=signup&redirect_to=tenistaapp://">Confirm your email</a>
```

**Or use this more robust version:**
```html
<a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup&redirect_to=tenistaapp://">Confirm your email</a>
```

### 2. Update App Configuration

#### A. Add Deep Link Handler

Create a new file `app/auth/confirm.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { View, Text } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeColors } from '@/lib/utils/theme'

export default function AuthConfirm() {
  const { token, type } = useLocalSearchParams<{ token: string; type: string }>()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      if (token && type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })

          if (error) {
            console.error('Email confirmation error:', error)
            router.replace('/(auth)/sign-in?error=confirmation_failed')
          } else {
            // Success! User is now confirmed
            router.replace('/(auth)/sign-in?success=email_confirmed')
          }
        } catch (error) {
          console.error('Confirmation error:', error)
          router.replace('/(auth)/sign-in?error=confirmation_failed')
        }
      } else {
        // Invalid or missing parameters
        router.replace('/(auth)/sign-in?error=invalid_link')
      }
    }

    handleEmailConfirmation()
  }, [token, type])

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: colors.background, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Text style={{ color: colors.foreground, fontSize: 16 }}>
        Confirming your email...
      </Text>
    </View>
  )
}
```

#### B. Update Sign-In Page to Handle Success/Error States

Add this to your sign-in page to show confirmation status:

```typescript
// Add to sign-in.tsx
const { success, error } = useLocalSearchParams<{ success?: string; error?: string }>()

useEffect(() => {
  if (success === 'email_confirmed') {
    Alert.alert('Success', 'Your email has been confirmed! You can now sign in.')
  } else if (error === 'confirmation_failed') {
    Alert.alert('Error', 'Email confirmation failed. Please try again or contact support.')
  } else if (error === 'invalid_link') {
    Alert.alert('Error', 'Invalid confirmation link. Please request a new confirmation email.')
  }
}, [success, error])
```

### 3. Testing the Fix

#### Development Testing:
1. Start your development server: `npm start`
2. Test email signup flow
3. Check email - the link should now redirect to `tenistaapp://` instead of localhost

#### Production Testing:
1. Build and deploy your app
2. Test the complete email confirmation flow
3. Verify the deep link opens the app correctly

### 4. Alternative Quick Fix (If Deep Links Don't Work)

If deep linking is complex to implement, you can create a simple web redirect page:

**Create a simple web page hosted on your domain:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Email Confirmed - Tenista</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
    <h1>✅ Email Confirmed!</h1>
    <p>Your email has been successfully confirmed.</p>
    <p><strong>Return to the Tenista app to continue.</strong></p>
    <script>
        // Try to open the app
        window.location.href = 'tenistaapp://auth/confirmed';
        
        // Fallback after 2 seconds
        setTimeout(() => {
            document.body.innerHTML += '<p><a href="https://tenista.app">Download Tenista App</a></p>';
        }, 2000);
    </script>
</body>
</html>
```

Then set this page URL as your confirmation redirect in Supabase.

## Implementation Priority

1. **High Priority:** Update Supabase email templates (5 minutes)
2. **Medium Priority:** Add deep link handler in app (30 minutes)
3. **Low Priority:** Create web fallback page (15 minutes)

The email template fix alone will resolve 80% of the issue.