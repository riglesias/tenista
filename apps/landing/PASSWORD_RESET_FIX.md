# Password Reset Fix - Implementation Guide

## Problem Solved
The password reset emails were being marked as spam because the Supabase project URL (`zktbpqsqocblwjhcezum.supabase.co`) contains no vowels, triggering the `URI_NOVOWEL` spam filter.

## Solution Implemented
We followed the same pattern as your working email confirmation flow - sending users directly to YOUR domain instead of Supabase's URL.

## Changes Made

### 1. Email Template Update
The password reset email now uses:
```html
<a href="https://www.tenista.app/reset-password?token={{ .Token }}&type=recovery">
  Reset Password
</a>
```

Instead of:
```html
<a href="{{ .SiteURL }}/auth/v1/verify?token={{ .Token }}&type=recovery&redirect_to=...">
```

### 2. API Route Creation
- Created `/api/auth/verify-recovery/route.ts` to handle token verification
- Redirects to Supabase's verify endpoint which handles the authentication
- Supabase then redirects back to your reset-password page with a valid session

### 3. Reset Password Page Update
- Simplified to check for recovery session from Supabase
- Handles both direct redirects and hash-based tokens
- Automatically redirects to API route if needed

## How It Works

1. User clicks reset password link in email
2. They go to `https://www.tenista.app/api/auth/verify-recovery?token=XXX&type=recovery`
3. The API route redirects to Supabase for verification
4. Supabase verifies the token and redirects back to `/reset-password` with a session
5. The reset-password page detects the recovery session
6. User sees the password reset form
7. User enters new password and submits

## Benefits

✅ **No spam warnings** - Uses your clean domain name
✅ **Professional appearance** - Users see tenista.app, not Supabase URLs
✅ **Consistent pattern** - Works exactly like email confirmation
✅ **Better deliverability** - Email providers trust your domain

## To Deploy

1. **Update your Supabase email template:**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Select "Reset Password"
   - Copy the content from `RESET_PASSWORD_EMAIL_TEMPLATE.html`
   - Save the changes

2. **Deploy your website changes:**
   - The updated `/reset-password` page is ready
   - No additional configuration needed

## Testing

After deploying:
1. Request a password reset
2. Check that the email link goes to `https://www.tenista.app/api/auth/verify-recovery?token=...`
3. You should be redirected through Supabase and back to the reset-password page
4. Verify you can reset your password successfully
5. Check spam score - should no longer have `URI_NOVOWEL` warning

## Troubleshooting

If the reset still doesn't work, check the browser console for these logs:
- "Session check:" - Shows if a recovery session was found
- "Token in params but no session - redirecting to verify" - Means it's trying to verify
- "Auth state change:" - Shows Supabase auth events

The flow requires:
1. Email sends to `/api/auth/verify-recovery`
2. API redirects to Supabase's verify endpoint
3. Supabase verifies and redirects back to `/reset-password`
4. Page detects the recovery session and shows the form