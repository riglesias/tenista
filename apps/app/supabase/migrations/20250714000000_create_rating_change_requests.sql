-- Create rating_change_requests table
CREATE TABLE rating_change_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    current_rating DECIMAL(2,1) NOT NULL,
    requested_rating DECIMAL(2,1) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_rating_change_requests_player_id ON rating_change_requests(player_id);
CREATE INDEX idx_rating_change_requests_status ON rating_change_requests(status);
CREATE INDEX idx_rating_change_requests_created_at ON rating_change_requests(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE rating_change_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Players can only see their own rating change requests
CREATE POLICY "Users can view their own rating change requests" 
ON rating_change_requests FOR SELECT 
USING (player_id = auth.uid());

-- Players can only insert their own rating change requests
CREATE POLICY "Users can insert their own rating change requests" 
ON rating_change_requests FOR INSERT 
WITH CHECK (player_id = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_change_requests_updated_at 
    BEFORE UPDATE ON rating_change_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();