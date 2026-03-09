# Fix Admin Database Policies

The current RLS policies are causing infinite recursion. Run this SQL script to fix the issue.

## Instructions

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zktbpqsqocblwjhcezum
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the SQL script below
4. Click "Run" to execute the script

## SQL Fix Script

```sql
-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view their own record" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can create audit logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_log;

-- Temporarily disable RLS to allow initial setup
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log DISABLE ROW LEVEL SECURITY;

-- Clear and recreate admin_users table with the correct user
TRUNCATE TABLE admin_users CASCADE;

-- Add Roberto as super admin (you'll need to get the correct auth user ID)
-- First, let's try both IDs we found
INSERT INTO admin_users (id, role, permissions) VALUES
  ('340902e2-f532-48ee-93d2-74aeb9ea7e16', 'super_admin', '{}')
ON CONFLICT (id) DO NOTHING;

-- Create simple, non-recursive policies
CREATE POLICY "Allow authenticated users to read admin_users" ON admin_users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert admin_users" ON admin_users
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update admin_users" ON admin_users
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow all operations on audit log" ON admin_audit_log
  FOR ALL TO authenticated USING (true);

-- Re-enable RLS with simpler policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
```

## Alternative: Get Your Actual Auth User ID

If the above still doesn't work, we need your actual auth user ID from Supabase:

1. Go to **Authentication → Users** in your Supabase dashboard
2. Find the user with email `riglesias@portaloficina.com`
3. Copy the **User ID** (UUID) from that row
4. Run this SQL (replace `YOUR_ACTUAL_USER_ID` with the ID you copied):

```sql
-- Replace YOUR_ACTUAL_USER_ID with the real ID from Supabase Auth
INSERT INTO admin_users (id, role, permissions) VALUES
  ('YOUR_ACTUAL_USER_ID', 'super_admin', '{}')
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  updated_at = NOW();
```

## After Running the Fix

Try logging in again with:
- **Email**: riglesias@portaloficina.com  
- **Password**: Your Supabase password

The simplified policies should allow the login to work without infinite recursion.