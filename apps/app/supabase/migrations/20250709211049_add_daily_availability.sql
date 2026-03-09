-- Add daily availability feature to players table
BEGIN;

-- Add columns for daily availability
ALTER TABLE public.players
ADD COLUMN available_today BOOLEAN DEFAULT false,
ADD COLUMN available_today_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of available players
CREATE INDEX idx_players_available_today 
ON public.players(available_today, city_id) 
WHERE available_today = true;

-- Add comment for documentation
COMMENT ON COLUMN public.players.available_today IS 'Indicates if the player has marked themselves as available to play today';
COMMENT ON COLUMN public.players.available_today_updated_at IS 'Timestamp when available_today was last updated, used for automatic daily reset';

COMMIT;