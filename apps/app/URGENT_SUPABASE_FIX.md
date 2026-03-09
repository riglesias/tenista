# URGENT: Fix Supabase Localhost Redirect Issue

## Problem
Email confirmation links redirect to `http://localhost:3000` instead of the mobile app.

**Current URL from your test:**
```
https://zktbpqsqocblwjhcezum.supabase.co/auth/v1/verify?token=e053fecaf7738afeabfc48e1dd6186effa2c601579e5458146371f21&type=signup&redirect_to=http://localhost:3000
```

## Root Cause
Your Supabase project has `http://localhost:3000` configured as the Site URL instead of the mobile app scheme.

## Immediate Fix (5 minutes)

### Step 1: Update Supabase Dashboard Settings

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/zktbpqsqocblwjhcezum
   - Navigate to: **Authentication** → **URL Configuration**

2. **Update Site URL:**
   - **Current:** `http://localhost:3000`
   - **Change to:** `tenistaapp://`

3. **Update Redirect URLs:**
   Add these to the **Redirect URLs** list:
   ```
   tenistaapp://auth/confirm
   tenistaapp://
   exp://localhost:8081
   exp://192.168.1.100:8081
   http://localhost:3000
   ```

### Step 2: Update Email Template (Critical)

1. **Go to:** Authentication → **Email Templates** → **Confirm signup**

2. **Find this line in the template:**
   ```html
   <a href="{{ .ConfirmationURL }}">Confirm your email</a>
   ```

3. **Replace with:**
   ```html
   <a href="tenistaapp://auth/confirm?token={{ .Token }}&type=signup">Confirm your email</a>
   ```

### Step 3: Test the Fix

1. **Clear your app data/cache**
2. **Register a new test account**
3. **Check the email - the link should now be:**
   ```
   tenistaapp://auth/confirm?token=...&type=signup
   ```
4. **Click the link - it should open your app**

## Alternative Quick Fix (If Above Doesn't Work)

If the email template change doesn't work immediately, try this simpler approach:

1. **Just update the Site URL to:** `tenistaapp://`
2. **Keep the existing email template**
3. **The redirect_to parameter will automatically use the Site URL**

## Verification

After making changes:

1. **Register a new test user**
2. **Check the email source** - look for the confirmation link
3. **The URL should start with:** `tenistaapp://` instead of `http://localhost:3000`
4. **Test the link** - it should open your app

## Troubleshooting

**If the link still shows localhost:**
- Wait 5-10 minutes for Supabase to propagate changes
- Try clearing browser cache and re-registering
- Double-check that Site URL was saved correctly

**If the app doesn't open:**
- Ensure your app is installed on the device
- Test the deep link manually: `tenistaapp://auth/confirm`
- Check that the URL scheme in app.json matches: `"scheme": "tenistaapp"`

## Expected Result

**Before Fix:**
```
https://...supabase.co/auth/v1/verify?...&redirect_to=http://localhost:3000
```

**After Fix:**
```
tenistaapp://auth/confirm?token=...&type=signup
```

This fix will resolve the localhost redirect issue and properly open your mobile app when users click the email confirmation link.