-- Create storage bucket for memes
INSERT INTO storage.buckets (id, name, public)
VALUES ('memes', 'memes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for memes bucket
CREATE POLICY "Anyone can view memes"
ON storage.objects FOR SELECT
USING (bucket_id = 'memes');

CREATE POLICY "Authenticated users can upload memes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'memes' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own memes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own memes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'memes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

