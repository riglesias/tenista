# Database Migration Guide

This guide will help you add the missing `available_today` and `available_today_updated_at` columns to your Supabase database.

## Problem

Your app is failing with the error: `column players.available_today does not exist`

This happens because the TypeScript types and application code expect these columns to exist, but they haven't been created in the database yet.

## Solution Options

### Option 1: Manual SQL Execution (Recommended - Fastest)

1. **Open your Supabase SQL Editor**:
   - Go to https://zktbpqsqocblwjhcezum.supabase.co/project/default/sql
   - Or navigate to your Supabase dashboard → SQL Editor

2. **Execute the migration script**:
   - Open the file `supabase_migration_available_today.sql` in this directory
   - Copy the entire SQL content
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute

3. **Verify the migration**:
   ```bash
   node verify_migration.js
   ```

### Option 2: Using Supabase CLI (Optional)

If you want to use the Supabase CLI for future migrations:

1. **Install Supabase CLI**:
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Initialize local project** (optional):
   ```bash
   supabase init
   ```

4. **Execute migration**:
   ```bash
   supabase db push --db-url "postgresql://postgres:[YOUR_DB_PASSWORD]@db.zktbpqsqocblwjhcezum.supabase.co:5432/postgres"
   ```

## What the Migration Does

The migration script will:

1. **Add two new columns to the `players` table**:
   - `available_today` (BOOLEAN, defaults to false)
   - `available_today_updated_at` (TIMESTAMP WITH TIME ZONE)

2. **Create an optimized index**:
   - `idx_players_available_today` for efficient querying of available players by city

3. **Add documentation**:
   - Comments explaining what these columns are for

## Expected SQL Output

After running the migration, you should see:
```
ALTER TABLE
ALTER TABLE
CREATE INDEX
COMMENT
COMMENT
```

And the verification queries should return the new column information.

## Affected Files

These application files are currently failing due to missing columns:

- `lib/actions/daily-availability.actions.ts` (lines 10-11, 28)
- `lib/actions/availability.actions.ts` (lines 140-141, 173-174)
- `lib/database.types.ts` (lines 26-27, 50-51, 74-75)

## Testing

After the migration:

1. **Run the verification script**:
   ```bash
   node verify_migration.js
   ```

2. **Test your app**:
   ```bash
   npm start
   ```

3. **Check that daily availability features work**:
   - Setting availability status
   - Viewing available players
   - Filtering by availability

## Troubleshooting

### If the migration fails:

1. **Check your database permissions**:
   - Ensure you're logged into the correct Supabase project
   - Verify you have admin access to the database

2. **Check for existing columns**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'players' 
   AND column_name IN ('available_today', 'available_today_updated_at');
   ```

3. **If columns already exist but the app still fails**:
   - The columns might have different data types
   - Run the verification script to test functionality

### If the verification script fails:

1. **Check your environment variables**:
   - Ensure `.env` file has correct Supabase URL and key
   - Verify the values are not placeholder text

2. **Check database connection**:
   - Test basic connectivity in Supabase dashboard
   - Verify RLS policies aren't blocking access

## Row Level Security (RLS)

The new columns will inherit the existing RLS policies for the `players` table. No additional security configuration is needed.

## Index Performance

The created index `idx_players_available_today` will significantly improve query performance when:
- Filtering players by `available_today = true`
- Combined with city-based filtering
- Used in the availability actions

This is especially important as your user base grows.

## Next Steps

After successful migration:

1. ✅ Test all availability-related features
2. ✅ Monitor application logs for any remaining database errors
3. ✅ Consider implementing automatic daily reset of `available_today` flags
4. ✅ Update any additional queries that might benefit from the new columns

## Support

If you encounter any issues:
- Check the Supabase dashboard logs
- Review the verification script output
- Test basic database connectivity
- Ensure all environment variables are correctly set