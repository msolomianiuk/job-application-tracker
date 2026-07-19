-- CV storage for the "My CVs" panel
-- Run this in your Supabase SQL Editor (after schema.sql)

-- Private bucket for CV uploads; files live under <user_id>/<timestamp>-<name>
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Users can only see files in their own folder
CREATE POLICY "Users can view their own CVs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can only upload into their own folder
CREATE POLICY "Users can upload their own CVs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can only delete files in their own folder (used to enforce the 2-CV cap)
CREATE POLICY "Users can delete their own CVs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
