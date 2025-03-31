
-- Create the emergency_contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS emergency_contacts_user_id_idx ON public.emergency_contacts(user_id);

-- Row level security policies
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own emergency contacts
CREATE POLICY "Users can view their own emergency contacts"
  ON public.emergency_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own emergency contacts
CREATE POLICY "Users can insert their own emergency contacts"
  ON public.emergency_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own emergency contacts
CREATE POLICY "Users can update their own emergency contacts"
  ON public.emergency_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own emergency contacts
CREATE POLICY "Users can delete their own emergency contacts"
  ON public.emergency_contacts
  FOR DELETE
  USING (auth.uid() = user_id);
