-- Add is_active column to players table
ALTER TABLE public.players 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX idx_players_is_active ON public.players(is_active);

-- Update existing players to be active by default
UPDATE public.players 
SET is_active = true 
WHERE is_active IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.players.is_active IS 'Indicates if the player account is active and can participate in leagues and matches';