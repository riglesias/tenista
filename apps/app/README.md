# Tenista - Tennis League App 🎾

A modern React Native app built with Expo that connects tennis players, manages leagues, and tracks match results.

## Features

✅ **Authentication & User Management**
- Complete Supabase authentication flow
- User profile management with photos
- Secure session management

✅ **Player Onboarding**
- Location and court selection
- Tennis rating assessment
- Availability scheduling
- Profile customization

✅ **League Management**
- Join and manage tennis leagues
- View league standings and statistics
- Track match history and performance

✅ **Match & Results**
- Submit match results
- View recent matches
- Player statistics dashboard

✅ **Community Features**
- Discover players in your area
- Filter by skill level and availability
- Connect with other tennis enthusiasts

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: Tailwind CSS with NativeWind
- **Icons**: Lucide React Native
- **Navigation**: Expo Router

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.template .env
   # Add your Supabase credentials to .env
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

## Environment Setup

Create a `.env` file with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `SUPABASE_SETUP.md` for detailed Supabase configuration instructions.

## Development

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Run linter
npm run lint
```

## Production Deployment

Ready to deploy your app? See `DEPLOYMENT.md` for comprehensive production deployment instructions including:

- EAS Build configuration
- App Store submission process
- Production environment setup
- Over-the-air updates
- Monitoring and analytics

### Quick Deploy Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Initialize EAS project
eas init

# Build for production
npm run build:production

# Submit to app stores
npm run submit:all
```

## Project Structure

```
├── app/                     # App screens (Expo Router)
│   ├── (auth)/             # Authentication screens
│   ├── (tabs)/             # Main app tabs
│   └── onboarding/         # User onboarding flow
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components
│   ├── community/          # Community-specific components
│   ├── league/             # League-specific components
│   └── onboarding/         # Onboarding components
├── lib/                    # Utilities and actions
│   ├── actions/            # Server actions
│   └── utils/              # Helper functions
├── contexts/               # React contexts
├── hooks/                  # Custom React hooks
├── constants/              # App constants
├── types/                  # TypeScript definitions
└── supabase/              # Database migrations
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- `SUPABASE_SETUP.md` - Supabase configuration guide
- `DEPLOYMENT.md` - Production deployment guide
- `docs/` - Additional technical documentation

## Support

For support, email support@tenista.app or join our community Discord.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for the tennis community**
