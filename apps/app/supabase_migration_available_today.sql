-- Migration: Add available_today columns to players table
-- Execute this in your Supabase SQL Editor: https://zktbpqsqocblwjhcezum.supabase.co/project/default/sql

-- Step 1: Add the new columns to the players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS available_today BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS available_today_updated_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Create an index for efficient querying of available players by city
CREATE INDEX IF NOT EXISTS idx_players_available_today 
ON public.players(available_today, city_id) 
WHERE available_today = true;

-- Step 3: Add a comment to document the purpose of these columns
COMMENT ON COLUMN public.players.available_today IS 'Indicates if the player is available to play today';
COMMENT ON COLUMN public.players.available_today_updated_at IS 'Timestamp when available_today was last updated';

-- Step 4: Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'players' 
  AND column_name IN ('available_today', 'available_today_updated_at');

-- Step 5: Verify the index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'players' 
  AND indexname = 'idx_players_available_today';