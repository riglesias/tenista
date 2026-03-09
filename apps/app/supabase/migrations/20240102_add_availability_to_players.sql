-- Add availability column to players table
ALTER TABLE public.players
ADD COLUMN availability JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance on availability
CREATE INDEX idx_players_availability ON public.players USING GIN (availability);

-- Add index for city-based queries if not exists
CREATE INDEX IF NOT EXISTS idx_players_city_id ON public.players(city_id) WHERE city_id IS NOT NULL; 