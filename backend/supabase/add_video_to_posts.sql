-- Add video column to posts table for video support
-- Run this migration to enable video uploads in feed posts

ALTER TABLE posts ADD COLUMN IF NOT EXISTS video text;

-- Create index for video posts
CREATE INDEX IF NOT EXISTS idx_posts_video ON posts(video) WHERE video IS NOT NULL;

-- Comment
COMMENT ON COLUMN posts.video IS 'URL to uploaded video file (optional)';
