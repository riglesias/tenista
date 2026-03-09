# Tenista App - Production Deployment Guide

This guide covers the complete process of deploying the Tenista tennis league app to production.

## Prerequisites

1. **EAS CLI**: Install the Expo Application Services CLI
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account**: Create an account at [expo.dev](https://expo.dev)

3. **Supabase Project**: Set up a production Supabase project

4. **App Store Accounts**: 
   - Apple Developer Program membership ($99/year)
   - Google Play Console account ($25 one-time fee)

## Environment Setup

### 1. Configure Environment Variables

Create a `.env` file in your project root with your production Supabase credentials:

```env
# Production Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_NAME="Tenista - Tennis League"
EXPO_PUBLIC_APP_VERSION=1.0.0
```

**⚠️ Important**: Never commit your `.env` file to version control.

### 2. Initialize EAS Project

```bash
# Login to your Expo account
eas login

# Initialize EAS for your project
eas init

# This will update your app.json with a unique project ID
```

## Build Process

### 1. Preview Build (Testing)

Before production, create a preview build for testing:

```bash
# Build for all platforms (preview)
npm run build:preview

# Or build for specific platforms
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### 2. Production Build

```bash
# Build for all platforms (production)
npm run build:production

# Or build for specific platforms
npm run build:ios
npm run build:android
```

Build times: iOS builds typically take 10-15 minutes, Android builds 5-10 minutes.

## App Store Submission

### iOS App Store

1. **Prepare App Store Connect**:
   - Create an app record in [App Store Connect](https://appstoreconnect.apple.com)
   - Set up app metadata, descriptions, screenshots
   - Configure pricing and availability

2. **Submit the Build**:
   ```bash
   npm run submit:ios
   ```
   
   Or manually:
   ```bash
   eas submit --platform ios
   ```

3. **Review Process**: Apple's review typically takes 24-48 hours

### Google Play Store

1. **Prepare Google Play Console**:
   - Create an app in [Google Play Console](https://play.google.com/console)
   - Set up store listing, content rating, pricing
   - Upload required graphics and screenshots

2. **Submit the Build**:
   ```bash
   npm run submit:android
   ```
   
   Or manually:
   ```bash
   eas submit --platform android
   ```

3. **Review Process**: Google's review typically takes 1-3 days

## Over-the-Air Updates

After your app is live, you can push updates without going through app store review:

```bash
# Update preview channel
npm run update:preview

# Update production channel
npm run update:production
```

**Note**: OTA updates work for JavaScript, assets, and configuration changes, but not for native code changes.

## Supabase Production Setup

### 1. Database Migration

Apply all your migrations to the production database:

```bash
# Push your local migrations to production
supabase db push --project-ref your-production-project-ref
```

### 2. Row Level Security

Ensure all your tables have proper RLS policies:

```sql
-- Example: Players table RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON players
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON players
FOR UPDATE USING (auth.uid() = user_id);
```

### 3. Email Configuration

Set up production email settings in Supabase:
- Configure SMTP settings
- Set up proper email templates
- Enable email confirmations for production

## Monitoring & Analytics

### 1. Expo Analytics

Monitor your app's performance:
- Crash reports
- Performance metrics
- Usage analytics

### 2. Supabase Monitoring

Track database performance:
- Query performance
- Connection metrics
- Storage usage

### 3. Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Mixpanel or Amplitude for user analytics

## Pre-Launch Checklist

- [ ] Environment variables configured
- [ ] Supabase production database set up
- [ ] All migrations applied
- [ ] RLS policies configured
- [ ] Email authentication tested
- [ ] App store metadata prepared
- [ ] Screenshots and marketing materials ready
- [ ] Privacy policy and terms of service created
- [ ] Test the complete user flow
- [ ] Performance testing completed
- [ ] Security audit completed

## Post-Launch Tasks

1. **Monitor**: Keep an eye on crash reports and user feedback
2. **Analytics**: Track user engagement and app performance
3. **Updates**: Plan regular feature updates and bug fixes
4. **Marketing**: Execute your app promotion strategy
5. **Support**: Set up user support channels

## Useful Commands

```bash
# Check build status
eas build:list

# View project info
eas project:info

# Manage credentials
eas credentials

# View submission status
eas submission:list

# Generate app signing credentials
eas credentials:generate
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check your dependencies are compatible
   - Ensure all required permissions are declared
   - Verify bundle identifiers match your certificates

2. **Submission Rejections**:
   - Follow app store guidelines carefully
   - Ensure all required metadata is provided
   - Test thoroughly before submission

3. **OTA Update Issues**:
   - Verify channel names match your build profiles
   - Check that updates are compatible with your published version

### Getting Help

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Discord Community](https://chat.expo.dev/)
- [Supabase Support](https://supabase.com/support)

## Security Considerations

1. **API Keys**: Never expose service role keys in client code
2. **RLS**: Always use Row Level Security for data protection
3. **HTTPS**: Ensure all API calls use HTTPS
4. **Input Validation**: Validate all user inputs on the server
5. **Regular Updates**: Keep dependencies updated for security patches

---

**🎾 Ready to serve up your tennis app to the world!**

For additional support, reach out to the development team or consult the official documentation links provided above. 