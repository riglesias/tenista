# iOS Build Instructions for Testing Account Linking

## Quick Build Command

To create an iOS build for testing on your device, run one of these commands:

### For Device Testing (Requires Apple Developer Account)
```bash
eas build --platform ios --profile preview
```

### For Simulator Testing (No Apple Account Required)
```bash
eas build --platform ios --profile development-simulator
```

### For Development Build (Requires Expo Dev Client)
```bash
eas build --platform ios --profile development
```

## What to Test

The account linking functionality has been implemented. Here's what to test:

### Test Scenario 1: Same Email, Different Auth Methods
1. **Create account with email/password** using `test@example.com`
2. **Complete onboarding** (set name, location, etc.)
3. **Sign out**
4. **Sign in with Apple** using the same email `test@example.com`
5. **Expected result**: Should see the same profile data, no need to re-onboard

### Test Scenario 2: Account Deletion and Recreation
1. **Sign in with Apple** using `test2@example.com`
2. **Complete onboarding**
3. **Delete account** from Settings
4. **Sign in with email/password** using the same `test2@example.com`
5. **Expected result**: Should go through onboarding again (account truly deleted)

### Test Scenario 3: Profile Merging
1. **Create account with email** `test3@example.com`, add some profile info
2. **Sign out**
3. **Sign in with Apple** using same email, should see merged profile data

## Debug Information

The following debug logs will appear in the console during account linking:

- `🔗 Attempting account linking for email@example.com (provider)`
- `🔗 Account linked successfully: old_id -> new_id`
- `✅ New user confirmed: email@example.com`

## Files Modified

1. **Server-side**: `supabase/functions/link-accounts/index.ts` - Account linking logic
2. **Client-side**: `contexts/AuthContext.tsx` - Integration with auth flow
3. **Clean-up**: Removed debug code from `app/(tabs)/settings.tsx`

## Current Build Status

A simulator build is currently in progress: https://expo.dev/accounts/riglesias/projects/tenista-app/builds/18d0b467-3b60-4b1a-9c75-680b6a40ef39

You can monitor the build progress and download it when complete.