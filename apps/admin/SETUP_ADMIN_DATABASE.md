# Admin Database Setup

This document contains the SQL script needed to set up the admin tables and permissions for the Tenista Admin Panel.

## Instructions

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zktbpqsqocblwjhcezum
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the SQL script below
4. Click "Run" to execute the script

## SQL Script

```sql
-- Create admin_users table for role management
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'league_admin', 'support')),
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit log for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
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

-- Create helper functions for permission checking
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

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin users can read their own record
CREATE POLICY "Admins can view their own record" ON admin_users
  FOR SELECT USING (auth.uid() = id);

-- Only super_admins can insert/update/delete admin users
CREATE POLICY "Super admins can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Admins can insert audit logs
CREATE POLICY "Admins can create audit logs" ON admin_audit_log
  FOR INSERT WITH CHECK (is_admin());

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
  FOR SELECT USING (is_admin());

-- Grant permissions
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON admin_audit_log TO authenticated;

-- Insert the first super admin (Roberto Iglesias)
INSERT INTO admin_users (id, role, permissions)
VALUES ('340902e2-f532-48ee-93d2-74aeb9ea7e16', 'super_admin', '{}')
ON CONFLICT (id) DO NOTHING;
```

## What This Script Does

1. **Creates `admin_users` table** - Stores admin user roles and permissions
2. **Creates `admin_audit_log` table** - Tracks all admin actions for compliance
3. **Creates helper functions** - `is_admin()` and `get_admin_role()` for permission checks
4. **Sets up Row Level Security (RLS)** - Ensures data security at the database level
5. **Creates security policies** - Controls who can access what data
6. **Adds Roberto as super_admin** - Sets up the first admin user

## Admin Roles

- **super_admin**: Full access to all features and user management
- **league_admin**: Can manage leagues, matches, and courts
- **support**: Limited access for customer support tasks

## After Running the Script

You can log in to the admin panel with:
- **Email**: riglesias@portaloficina.com
- **Password**: Your existing Supabase auth password

The login will verify that your user ID exists in the `admin_users` table before granting access.

## Troubleshooting

If you still can't log in after running the script:

1. Check that the script executed without errors
2. Verify your user exists in Supabase Auth (Settings → Authentication → Users)
3. Run the `check-admin-setup.js` script to verify the setup
4. Make sure you're using the correct password for your Supabase account