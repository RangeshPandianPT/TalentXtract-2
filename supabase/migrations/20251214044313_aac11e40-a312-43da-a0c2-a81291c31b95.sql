-- Create extraction history table
CREATE TABLE public.extraction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_description_excerpt TEXT NOT NULL,
  keywords JSONB NOT NULL,
  total_keywords INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.extraction_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own extraction history
CREATE POLICY "Users can view their own extractions"
ON public.extraction_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own extractions
CREATE POLICY "Users can create their own extractions"
ON public.extraction_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own extractions
CREATE POLICY "Users can delete their own extractions"
ON public.extraction_history
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_extraction_history_user_id ON public.extraction_history(user_id);
CREATE INDEX idx_extraction_history_created_at ON public.extraction_history(created_at DESC);