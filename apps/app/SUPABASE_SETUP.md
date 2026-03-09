# Supabase Authentication Setup

This guide will help you set up Supabase authentication in your Expo app.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Expo CLI installed

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name and database password
5. Select a region close to your users
6. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon public key

### 3. Configure Environment Variables

Create a `.env` file in your project root and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual values from step 2.

### 4. Enable Email Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Under "Auth Providers", make sure "Email" is enabled
3. Configure your email settings:
   - **Enable email confirmations** (recommended for production)
   - **Enable email change confirmations** (recommended)
   - **Enable secure email change** (recommended)

### 5. Configure Email Templates (Optional)

1. Go to Authentication > Email Templates
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Email change confirmation

### 6. Set Up Row Level Security (RLS)

If you plan to store user data, set up RLS policies:

1. Go to Authentication > Policies
2. Create policies for your tables to ensure users can only access their own data

## Testing the Authentication

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. Test the authentication flow:
   - Sign up with a new email
   - Check your email for confirmation (if enabled)
   - Sign in with your credentials
   - Test password reset functionality
   - Test sign out

## Authentication Features Included

- ✅ Email/password sign up
- ✅ Email/password sign in
- ✅ Password reset via email
- ✅ Automatic session management
- ✅ Secure token storage using Expo SecureStore
- ✅ Authentication state management with React Context
- ✅ Route protection and automatic redirects
- ✅ Loading states and error handling

## File Structure

```
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── contexts/
│   └── AuthContext.tsx      # Authentication context and hooks
├── components/
│   └── AuthGuard.tsx        # Route protection component
├── app/
│   ├── (auth)/              # Authentication screens
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── forgot-password.tsx
│   └── (tabs)/              # Protected app screens
└── .env                     # Environment variables (create this)
```

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Double-check your environment variables
   - Ensure you're using the anon public key, not the service role key

2. **Email not sending**
   - Check your Supabase email settings
   - Verify your email provider configuration
   - Check spam folder

3. **Authentication not persisting**
   - Ensure Expo SecureStore is properly configured
   - Check that the AuthProvider wraps your entire app

4. **TypeScript errors**
   - Make sure all dependencies are installed
   - Run `npm install` to ensure all packages are up to date

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Discord Community](https://discord.supabase.com/)

## Next Steps

- Add user profiles and additional user data
- Implement social authentication (Google, Apple, etc.)
- Add role-based access control
- Set up database tables with RLS policies
- Add email verification flow
- Implement password strength requirements 