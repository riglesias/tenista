# Tenista Admin Panel - Business Requirements Document (BRD)

## Executive Summary

The Tenista Admin Panel is a web-based administrative interface for managing the Tenista tennis league platform. This document outlines the requirements, technical architecture, and implementation plan for the admin panel that will enable efficient management of leagues, matches, courts, and users.

## Project Overview

### Purpose
Create a comprehensive admin panel to manage all aspects of the Tenista platform, starting with core league management features and expanding to full platform administration.

### Scope - Phase 1 (MVP)
- League match management and result editing
- Court facility management
- Basic admin authentication and authorization

### Tech Stack

#### Core Framework
- **Next.js 15** - Latest React framework with App Router
- **React 19/18.3** - UI library
- **TypeScript 5.3+** - Type safety
- **Tailwind CSS v3.4** - Utility-first CSS
- **shadcn/ui** - Component library with sidebar layout
- **Supabase** - Backend (same instance as main app)

#### Additional Libraries
- **TanStack Table v8** - Advanced data tables with sorting, filtering, pagination
- **React Hook Form + Zod** - Form handling and validation
- **TanStack Query v5** - Server state management and caching
- **Recharts** - Dashboard charts and analytics
- **date-fns** - Date manipulation
- **Sonner** - Toast notifications

## Feature Requirements

### Phase 1: Core League Admin Features

#### 1. League Match Management

**View All Matches**
- Comprehensive list view with advanced filtering:
  - Filter by league
  - Filter by date range
  - Filter by status (pending, completed, cancelled)
  - Filter by player name (search)
- Display columns:
  - Match ID
  - League name
  - Player 1 vs Player 2
  - Current score
  - Match status
  - Date played
  - Court location
  - Actions (Edit/View/Delete)
- Pagination and sorting capabilities
- Export to CSV functionality

**Edit Match Results**
- Inline editing or modal form with:
  - Winner selection dropdown
  - Score entry with set-by-set breakdown
  - Match status update (pending/completed/cancelled/forfeit/no-show)
  - Date and time played
  - Court selection
  - Points calculation (auto or manual override)
  - Notes/comments field
- Validation:
  - Valid tennis score format
  - Winner must match score logic
  - Date cannot be in future
- Auto-save draft changes
- Audit trail for all modifications

#### 2. Court Management

**View All Courts**
- Grid and list view toggle
- Display information:
  - Court name
  - City/location
  - Full address
  - Type (indoor/outdoor)
  - Surface (clay/hard/grass/artificial)
  - Number of courts
  - Lighting availability
  - Public/private status
  - Contact information
  - Active/inactive status

**Add New Court**
- Comprehensive form:
  - Basic Information:
    - Name (required)
    - City selection (dropdown from cities table)
    - Full address with map preview
  - Court Details:
    - Court type (indoor/outdoor/covered)
    - Surface type (clay/hard/grass/artificial)
    - Number of courts
    - Has lights (yes/no)
    - Is public (yes/no)
  - Contact Information:
    - Phone number
    - Email
    - Website
    - Booking link
  - Amenities (multi-select):
    - Parking
    - Restrooms
    - Pro shop
    - Restaurant/cafe
    - Locker rooms
    - Showers
  - Operating hours
  - Pricing information

**Edit Court**
- All fields from Add Court
- Change history tracking
- Ability to mark as temporarily closed
- Seasonal availability settings

**Delete/Deactivate Court**
- Soft delete (mark as inactive)
- Check for dependencies:
  - Upcoming matches scheduled
  - Active leagues using court
- Require confirmation with reason
- Option to reassign matches to new court

### Phase 2: Extended Features (Future)

#### User Management
- View all players with search and filters
- Edit player profiles and ratings
- Manage user roles and permissions
- Handle rating change requests
- Account suspension/reactivation

#### League Administration
- Create and manage leagues
- Tournament bracket management
- Automated scheduling
- Playoff configuration
- Division management

#### Analytics Dashboard
- Player participation metrics
- League completion rates
- Court utilization statistics
- Revenue tracking
- Custom report builder

## Technical Implementation

### Database Architecture

#### Admin User Management
Using the same Supabase instance with dedicated admin tables:

```sql
-- Admin users table for role management
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'league_admin', 'support')),
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper functions for permission checking
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for admin access
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Admin read access to all matches
CREATE POLICY "Admins can view all matches" ON league_matches
  FOR SELECT USING (is_admin());

-- Admin write access to all matches
CREATE POLICY "Admins can update all matches" ON league_matches
  FOR UPDATE USING (is_admin());

-- Admin full access to courts
CREATE POLICY "Admins can manage all courts" ON courts
  FOR ALL USING (is_admin());
```

### Project Structure

```
tenista-admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (admin)/
│   │   ├── layout.tsx              # Protected layout with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── matches/
│   │   │   ├── page.tsx            # All matches view
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   ├── courts/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   └── leagues/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── matches/
│   │               └── page.tsx
│   └── api/
│       └── admin/
│           ├── auth/
│           │   └── route.ts
│           └── export/
│               └── route.ts
├── components/
│   ├── ui/                         # shadcn components
│   │   ├── sidebar.tsx
│   │   ├── data-table.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── [other components]
│   ├── layout/
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   ├── admin-nav.tsx
│   │   └── breadcrumbs.tsx
│   ├── tables/
│   │   ├── matches-table.tsx
│   │   ├── courts-table.tsx
│   │   └── columns/
│   │       ├── match-columns.tsx
│   │       └── court-columns.tsx
│   ├── forms/
│   │   ├── match-edit-form.tsx
│   │   ├── court-form.tsx
│   │   ├── score-input.tsx
│   │   └── form-fields/
│   │       ├── court-amenities.tsx
│   │       └── court-hours.tsx
│   └── dashboard/
│       ├── stats-cards.tsx
│       └── activity-feed.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── admin.ts                # Admin-specific utilities
│   ├── actions/                    # Next.js 15 Server Actions
│   │   ├── match-actions.ts
│   │   ├── court-actions.ts
│   │   ├── auth-actions.ts
│   │   └── audit-actions.ts
│   ├── validations/
│   │   ├── match-schema.ts
│   │   └── court-schema.ts
│   └── utils/
│       ├── formatting.ts
│       └── permissions.ts
├── hooks/
│   ├── use-admin-auth.ts
│   ├── use-permissions.ts
│   └── use-audit-log.ts
├── types/
│   ├── database.types.ts
│   └── admin.types.ts
├── middleware.ts                   # Auth middleware
└── .env.local                      # Environment variables
```

### Key Implementation Examples

#### Server Actions (Next.js 15)

```typescript
// lib/actions/match-actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateMatchSchema = z.object({
  winner_id: z.string().uuid(),
  score: z.object({
    sets: z.array(z.object({
      player1: z.number(),
      player2: z.number()
    }))
  }),
  status: z.enum(['completed', 'cancelled', 'forfeit']),
  played_at: z.string().datetime()
})

export async function updateMatchResult(
  matchId: string,
  data: z.infer<typeof updateMatchSchema>
) {
  const supabase = createServerClient()
  
  // Verify admin permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!admin) throw new Error('Admin access required')
  
  // Update match with validation
  const validatedData = updateMatchSchema.parse(data)
  
  const { data: match, error } = await supabase
    .from('league_matches')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId)
    .select()
    .single()
  
  if (error) throw error
  
  // Create audit log entry
  await supabase.from('admin_audit_log').insert({
    admin_id: user.id,
    action: 'update_match_result',
    entity_type: 'league_matches',
    entity_id: matchId,
    changes: validatedData
  })
  
  // Revalidate cached data
  revalidatePath('/matches')
  revalidatePath(`/matches/${matchId}`)
  
  return { success: true, match }
}
```

#### Middleware for Admin Protection

```typescript
// middleware.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Check admin status for admin routes
  if (request.nextUrl.pathname.startsWith('/(admin)')) {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!adminUser) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    // Add admin role to headers for use in server components
    response.headers.set('x-admin-role', adminUser.role)
  }
  
  return response
}

export const config = {
  matcher: ['/(admin)/:path*', '/api/admin/:path*']
}
```

## Security Considerations

### Authentication & Authorization
- Multi-factor authentication for admin accounts
- Role-based access control (RBAC)
- Session timeout after inactivity
- IP allowlisting for super admins (optional)

### Data Protection
- All admin actions logged in audit trail
- Sensitive data encryption at rest
- HTTPS only communication
- CORS configuration for API endpoints

### Compliance
- GDPR compliant data handling
- User consent for data modifications
- Data retention policies
- Right to be forgotten implementation

## Deployment Strategy

### Infrastructure
- **Hosting**: Vercel (optimized for Next.js)
- **Domain**: admin.tenista.app
- **Database**: Existing Supabase instance
- **CDN**: Vercel Edge Network

### Environment Configuration
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_APP_URL=https://admin.tenista.app
```

### Deployment Steps
1. Set up Vercel project
2. Configure environment variables
3. Set up custom domain
4. Enable Vercel Analytics
5. Configure monitoring and alerts

## Development Timeline

### Phase 1: Foundation (Week 1-2)
- Project setup with Next.js 15
- Supabase integration
- Admin authentication system
- Basic layout with shadcn sidebar

### Phase 2: Core Features (Week 3-4)
- Match management interface
- Match result editing
- Court CRUD operations
- Audit logging

### Phase 3: Polish & Testing (Week 5)
- UI/UX improvements
- Error handling
- Performance optimization
- User acceptance testing

### Phase 4: Deployment (Week 6)
- Production deployment
- Documentation
- Admin training
- Monitoring setup

## Success Metrics

### Key Performance Indicators (KPIs)
- Admin task completion time reduction: 50%
- Match result update accuracy: 99%+
- System uptime: 99.9%
- Page load time: <2 seconds
- Admin user satisfaction: 4.5/5

### Monitoring
- Error tracking with Sentry
- Performance monitoring with Vercel Analytics
- Database query performance tracking
- Admin action audit logs

## Maintenance & Support

### Regular Maintenance
- Weekly database backups
- Monthly security updates
- Quarterly feature reviews
- Annual security audits

### Support Structure
- Admin user documentation
- Video training materials
- In-app help system
- Discord/Slack support channel

## Future Enhancements

### Phase 2 Features
- Player management system
- Tournament bracket builder
- Automated scheduling
- Email notification system

### Phase 3 Features
- Mobile admin app
- Advanced analytics dashboard
- Payment processing
- API for third-party integrations

### Phase 4 Features
- AI-powered match predictions
- Automated dispute resolution
- Multi-language support
- White-label capabilities

## Conclusion

The Tenista Admin Panel will provide a robust, secure, and user-friendly interface for managing the tennis league platform. By leveraging modern technologies like Next.js 15 and Supabase, we can deliver a performant solution that scales with the platform's growth while maintaining security and usability.

## Appendices

### A. Database Schema
[Detailed ERD and table definitions]

### B. API Documentation
[Endpoint specifications and examples]

### C. UI/UX Mockups
[Figma designs and wireframes]

### D. Testing Plan
[Test cases and QA procedures]

---

*Document Version: 1.0*  
*Last Updated: 2025*  
*Status: Draft for Review*