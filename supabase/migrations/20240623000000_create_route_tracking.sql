
-- Create the route_tracking table
CREATE TABLE IF NOT EXISTS public.route_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  feedback_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS route_tracking_user_id_idx ON public.route_tracking(user_id);

-- Row level security policies
ALTER TABLE public.route_tracking ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own route tracking data
CREATE POLICY "Users can view their own route tracking"
  ON public.route_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own route tracking data
CREATE POLICY "Users can insert their own route tracking"
  ON public.route_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own route tracking data
CREATE POLICY "Users can update their own route tracking"
  ON public.route_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);
