# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tenista Admin Panel** - A comprehensive web-based administrative interface for managing the Tenista tennis league platform. Currently in initial setup phase with Phase 1 MVP features planned.

### Tech Stack
- **Next.js 15.4.6** with App Router architecture
- **React 19.1.0** 
- **TypeScript** with strict mode
- **Tailwind CSS v4** (currently) - will migrate to v3.4 for shadcn/ui compatibility
- **Supabase** for backend services (auth, database, RLS)

### Required Libraries (To Be Installed)
- **shadcn/ui** - Component library with sidebar layout
- **TanStack Table v8** - Advanced data tables
- **TanStack Query v5** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Recharts** - Dashboard analytics
- **date-fns** - Date manipulation
- **Sonner** - Toast notifications

## Essential Commands

```bash
# Development
npm run dev      # Start development server with Turbopack (User runs this in separate terminal)

# Code Quality
npm run lint     # Run ESLint with Next.js TypeScript rules

# Production
npm run build    # Create production build
npm run start    # Start production server
```

## Development Notes
- The user runs `npm run dev` in a separate terminal window
- Do not attempt to run the dev server programmatically

## Current Implementation Status

### ✅ Completed
- Basic Next.js 15 project setup
- Supabase environment variables configured
- BRD document with full requirements

### 🔄 Phase 1 MVP Features (To Implement)

#### 1. Foundation Setup
- [ ] Install required dependencies (shadcn/ui, TanStack, etc.)
- [ ] Set up Supabase client (browser/server/admin)
- [ ] Configure middleware for auth protection
- [ ] Initialize shadcn/ui components

#### 2. Admin Authentication
- [ ] Login page with Supabase auth
- [ ] Admin role checking with admin_users table
- [ ] Protected routes with middleware
- [ ] Audit logging for admin actions

#### 3. Match Management
- [ ] View all matches with advanced filtering
- [ ] Edit match results with score validation
- [ ] Status updates (completed/cancelled/forfeit)
- [ ] Points calculation and audit trail

#### 4. Court Management
- [ ] CRUD operations for tennis courts
- [ ] Comprehensive court details (amenities, hours, etc.)
- [ ] Soft delete with dependency checking
- [ ] Grid/list view toggle

## Architecture

### Directory Structure (Target)
```
tenista-admin/
├── app/
│   ├── (auth)/              # Public auth routes
│   │   └── login/
│   ├── (admin)/             # Protected admin routes
│   │   ├── dashboard/
│   │   ├── matches/
│   │   ├── courts/
│   │   └── layout.tsx       # Admin layout with sidebar
│   └── api/admin/           # API routes
├── components/
│   ├── ui/                  # shadcn components
│   ├── layout/              # Admin layout components
│   ├── tables/              # Data table components
│   ├── forms/               # Form components
│   └── dashboard/           # Dashboard widgets
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── actions/             # Server actions
│   ├── validations/         # Zod schemas
│   └── utils/               # Utilities
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript definitions
└── middleware.ts            # Auth middleware
```

### Database Schema Requirements

```sql
-- Admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('super_admin', 'league_admin', 'support')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies needed for admin access
-- Will implement is_admin() and get_admin_role() functions
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=<already configured>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<already configured>
SUPABASE_SERVICE_ROLE_KEY=<needed for admin operations>
```

## Development Guidelines

### Component Patterns
- Server Components by default
- "use client" only when needed
- Server Actions for mutations (Next.js 15 pattern)
- Middleware for auth protection

### Data Fetching
- TanStack Query for client-side caching
- Server Actions for mutations
- Revalidation with revalidatePath()
- Optimistic updates where appropriate

### Form Handling
- React Hook Form for complex forms
- Zod schemas for validation
- Server-side validation in actions
- Toast notifications for feedback

### Security Requirements
- All admin actions must be logged
- RLS policies for data access
- Server-side validation mandatory
- Session timeout after inactivity

## Key Features to Implement

### Match Management
- Filter by: league, date range, status, player
- Edit: winner, score (set-by-set), status, date/time, court
- Validation: tennis score format, winner logic
- Export to CSV functionality

### Court Management
- Basic info: name, city, address
- Details: type, surface, lighting, public/private
- Amenities: parking, restrooms, pro shop, etc.
- Operating hours and pricing
- Soft delete with dependency checking

### Admin Dashboard
- Stats cards for key metrics
- Recent activity feed
- Quick action buttons
- Basic analytics charts

## Implementation Approach

1. **Use Server Actions** (Next.js 15 pattern) for all data mutations
2. **Implement RLS policies** for security at database level
3. **Create audit trail** for all admin modifications
4. **Use optimistic updates** for better UX
5. **Implement proper error handling** with error boundaries
6. **Add loading states** with skeletons
7. **Ensure mobile responsiveness** for all interfaces

## Notes for Implementation

- The project uses Supabase from the main Tenista app (same instance)
- Admin panel will be deployed to admin.tenista.app
- Must maintain audit log for compliance
- Performance target: <2 second page loads
- All features must work on mobile devices
- Consider using Vercel Analytics for monitoring

## References

- Full requirements: See TENISTA_ADMIN_BRD.md
- Supabase Docs: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Next.js 15 Docs: https://nextjs.org/docs