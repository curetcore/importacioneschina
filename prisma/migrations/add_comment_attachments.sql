-- Migration: Add attachments column to comments table
-- Date: 2025-11-21
-- Description: Adds JSON field for file attachments in comments

-- Add attachments column (JSON array, defaults to empty array)
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN comments.attachments IS 'Array of attachment objects: [{ url, name, type, size }]';
