-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE STORAGE FIX - Allow Public Image Access
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Run this in Supabase SQL Editor to fix image loading issues
--
-- This will:
-- 1. Enable RLS on storage.objects (if not already enabled)
-- 2. Allow public SELECT (viewing) of images in teamcal-uploads bucket
-- 3. Allow authenticated users to INSERT (upload) images
-- 4. Allow users to DELETE their own images
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images in teamcal-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- ───────────────────────────────────────────────────────────────────────────
-- PUBLIC SELECT - Allow anyone to view/download images
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'teamcal-uploads' );

-- ───────────────────────────────────────────────────────────────────────────
-- AUTHENTICATED INSERT - Allow logged-in users to upload images
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( 
  bucket_id = 'teamcal-uploads' 
  AND auth.role() = 'authenticated'
);

-- ───────────────────────────────────────────────────────────────────────────
-- USER DELETE - Allow users to delete only their own uploads
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( 
  bucket_id = 'teamcal-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ───────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ───────────────────────────────────────────────────────────────────────────

-- Check that policies were created successfully
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Expected output should show:
-- 1. "Public can view images" - SELECT - public
-- 2. "Authenticated users can upload images" - INSERT - authenticated  
-- 3. "Users can delete their own images" - DELETE - authenticated
