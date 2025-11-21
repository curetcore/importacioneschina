-- Migration: Add thread support to comments table
-- Date: 2025-11-21
-- Description: Adds parentId field to enable nested comment replies (threads)

-- Add parent_id column to comments table
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_id TEXT;

-- Add foreign key constraint for self-referential relation
ALTER TABLE comments
ADD CONSTRAINT fk_comments_parent
FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Create index for performance on parent_id lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Add comments for documentation
COMMENT ON COLUMN comments.parent_id IS 'ID of parent comment for threaded replies. NULL for root-level comments';
