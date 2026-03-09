# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Platform-specific development
npm run ios        # iOS simulator
npm run android    # Android emulator  
npm run web        # Web browser

# Linting and code quality
npm run lint       # Run ESLint
```

### Building and Deployment
```bash
# Development builds (with expo-dev-client)
eas build --platform android --profile development
eas build --platform ios --profile development

# Preview builds (for testing)
npm run build:preview

# Production builds
npm run build:production
npm run build:ios
npm run build:android

# App store submission
npm run submit:ios
npm run submit:android
npm run submit:all

# Over-the-air updates
npm run update:preview
npm run update:production
```

## Architecture Overview

### Tech Stack
- **Frontend**: React Native with Expo 53
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS with NativeWind + Gluestack UI
- **Icons**: Lucide React Native
- **Navigation**: Expo Router with file-based routing
- **State Management**: React Context + TanStack Query
- **Type Safety**: TypeScript with strict mode

### Project Structure
```
app/                    # Expo Router screens
├── (auth)/            # Authentication flow
├── (tabs)/            # Main app navigation
└── onboarding/        # User onboarding screens

components/            # Reusable UI components
├── ui/               # Base UI components
├── community/        # Community-specific components
├── league/           # League-specific components
└── onboarding/       # Onboarding components

lib/                  # Core utilities
├── actions/          # Server actions (Supabase queries)
├── utils/           # Helper functions
└── validation/      # Zod schemas

contexts/            # React contexts (Auth, Theme)
hooks/              # Custom React hooks
constants/          # App constants
types/              # TypeScript definitions
```

### Key Architecture Patterns

**Authentication Flow**
- Supabase Auth with Google Sign-In integration
- Session management with AsyncStorage/localStorage
- AuthGuard component for protected routes
- Environment-specific storage adapters

**Data Management**
- Server actions in `lib/actions/` for all Supabase operations
- TanStack Query for caching and synchronization
- Custom hooks for data fetching (e.g., `useLeagues`)

**Navigation**
- File-based routing with Expo Router
- Tab navigation for main app screens
- Stack navigation for auth and onboarding flows

**Styling System**
- NativeWind for Tailwind CSS in React Native
- Gluestack UI for complex components
- Theme system with light/dark mode support
- Custom color palette defined in tailwind.config.js

## Development Guidelines

### Styling Rules (from .cursor/rules/styling.mdc)
- Follow atomic design and reuse components from `/components`
- Never use inline styles - always use Tailwind CSS
- Use Lucide icons exclusively
- Never hardcode colors or dimensions - use values from `theme.ts`
- Wrap every screen with appropriate layout components
- Follow React Native accessibility best practices

### Component Patterns
- Server components for initial data loading
- Client components for interactive elements
- Use existing UI components from `/components/ui/`
- Follow consistent button patterns with proper spacing

### Database Operations
- All database operations go through `lib/actions/`
- Use Zod schemas for validation
- Implement proper Row Level Security (RLS) policies
- Handle errors gracefully with try/catch blocks

### Environment Setup
Required environment variables in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Package Configuration
The app uses different package names for development and production:
- **Production Package**: `com.tenista.app`
- **Development Package**: `com.tenista.app.dev`

This allows both apps to be installed side-by-side on the same device. The package name is determined by the `APP_VARIANT` environment variable set in eas.json.

### Google Sign-In Configuration
For Google Sign-In to work, you need to register both package names in Google Cloud Console:
1. Create an Android OAuth 2.0 Client for `com.tenista.app` (production)
2. Create an Android OAuth 2.0 Client for `com.tenista.app.dev` (development)
3. Add the SHA-1 fingerprint from EAS credentials to both clients
4. Use the Web OAuth 2.0 Client ID in the code configuration

The app uses `@react-native-google-signin/google-signin` with the following configuration:
- iOS Client ID: `251208589749-gctj4up1ce36inf0l7cr99702hc8un3b.apps.googleusercontent.com`
- Web Client ID (for Android): `251208589749-revsauposkj7bqt2ofu27b4k1cf9i3a1.apps.googleusercontent.com`

### Supabase Configuration
- **Project ID**: `zktbpqsqocblwjhcezum`
- **Project Name**: Tenista
- **Region**: us-west-1
- **Status**: ACTIVE_HEALTHY

### Testing and Quality
- Run `npm run lint` before committing
- Test on multiple platforms (iOS, Android, Web)
- Use EAS Build for production builds
- Implement proper error boundaries

## Common Development Tasks

### Adding New Screens
1. Create screen file in appropriate `app/` directory
2. Follow existing patterns for layout and navigation
3. Use existing components from `/components/`
4. Add proper TypeScript types

### Database Operations
1. Add new actions to `lib/actions/`
2. Create Zod validation schemas in `lib/validation/`
3. Update TypeScript types in `lib/database.types.ts`
4. Test with proper error handling

### UI Components
1. Create in appropriate `/components/` subdirectory
2. Use Tailwind classes, never inline styles
3. Follow accessibility best practices
4. Export from appropriate index files

### State Management
1. Use React Context for global state
2. TanStack Query for server state
3. Custom hooks for complex state logic
4. Keep state close to where it's used

## Platform-Specific Considerations

### iOS
- Uses Xcode project in `/ios/`
- Requires Apple Developer account for builds
- App Store submission through EAS Submit

### Android
- Uses Gradle build system
- Requires Google Play Console for publishing
- APK builds for testing, AAB for production

### Web
- Uses Metro bundler with static output
- localStorage for session persistence
- Responsive design considerations

## Deployment Notes

- Use EAS Build for all production builds
- Environment variables must be prefixed with `EXPO_PUBLIC_`
- OTA updates work for JS/config changes, not native code
- Follow the comprehensive deployment guide in `DEPLOYMENT.md`
- Monitor builds and submissions through Expo dashboard