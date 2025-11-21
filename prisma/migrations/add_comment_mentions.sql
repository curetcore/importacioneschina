-- Migration: Add mentions column to comments table
-- Date: 2025-11-21
-- Description: Adds array field for user mentions (@username) in comments

-- Add mentions column (array of user IDs, defaults to empty array)
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS mentions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for better query performance when searching by mentions
CREATE INDEX IF NOT EXISTS idx_comments_mentions ON comments USING GIN (mentions);

-- Add comment for documentation
COMMENT ON COLUMN comments.mentions IS 'Array of user IDs that were mentioned in this comment with @ syntax';
