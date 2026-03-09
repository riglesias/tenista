# 🚀 Tenista App Launch Checklist

## Immediate Next Steps (Today)

### 1. Environment Configuration
- [ ] Create production Supabase project
- [ ] Copy production credentials to `.env` file
- [ ] Test authentication flow with production database
- [ ] Apply all database migrations to production
- [ ] Configure Row Level Security policies

### 2. EAS Setup
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Initialize EAS project: `eas init`
- [ ] Update `app.json` with your actual EAS project ID

### 3. App Store Preparation
- [ ] Create Apple Developer account ($99/year)
- [ ] Create Google Play Console account ($25 one-time)
- [ ] Prepare app screenshots (required sizes)
- [ ] Write app description and metadata
- [ ] Create privacy policy and terms of service

## This Week

### 4. First Build
- [ ] Create preview build: `npm run build:preview`
- [ ] Test preview build thoroughly on real devices
- [ ] Fix any issues found during testing
- [ ] Create production build: `npm run build:production`

### 5. App Store Setup
- [ ] Create app record in App Store Connect
- [ ] Create app listing in Google Play Console
- [ ] Upload screenshots and marketing materials
- [ ] Configure pricing and availability
- [ ] Set up app store optimization (ASO)

### 6. Final Testing
- [ ] Complete end-to-end user flow testing
- [ ] Test on multiple devices and screen sizes
- [ ] Verify all features work in production environment
- [ ] Performance testing and optimization
- [ ] Security review of authentication flow

## Next Week

### 7. Submission
- [ ] Submit to Apple App Store: `npm run submit:ios`
- [ ] Submit to Google Play Store: `npm run submit:android`
- [ ] Monitor submission status
- [ ] Respond to any reviewer feedback

### 8. Launch Preparation
- [ ] Set up monitoring and analytics
- [ ] Prepare customer support channels
- [ ] Create marketing materials
- [ ] Plan launch announcement strategy
- [ ] Set up social media accounts

## Environment Template

Copy this to your `.env` file:

```env
# Production Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_NAME="Tenista - Tennis League"
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## Quick Commands Reference

```bash
# Setup
npm install -g eas-cli
eas login
eas init

# Build
npm run build:preview      # For testing
npm run build:production   # For release

# Submit
npm run submit:all         # Both platforms
npm run submit:ios         # iOS only
npm run submit:android     # Android only

# Updates (post-launch)
npm run update:production  # OTA update
```

## Critical Requirements

### Apple App Store
- [ ] Screenshots for all required device sizes
- [ ] App preview videos (optional but recommended)
- [ ] Privacy policy URL
- [ ] App description (max 4,000 characters)
- [ ] Keywords for App Store optimization
- [ ] Age rating questionnaire completed

### Google Play Store
- [ ] Feature graphic (1024 x 500)
- [ ] Phone screenshots (minimum 2)
- [ ] Tablet screenshots (if supporting tablets)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Store listing details

## Support Contacts

- **Expo Support**: [docs.expo.dev](https://docs.expo.dev)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Apple Developer**: [developer.apple.com/support](https://developer.apple.com/support)
- **Google Play**: [support.google.com/googleplay](https://support.google.com/googleplay)

---

**🎾 You're ready to serve up your tennis app to the world!**

Check off each item as you complete it. Most apps can be submitted within 1-2 weeks following this checklist.

Good luck with your launch! 🚀 