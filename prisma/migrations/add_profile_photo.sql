-- Migration: Add profile_photo column to users table
-- Date: 2025-11-21
-- Description: Adds optional profile photo URL field to users

-- Add profile_photo column (nullable)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.profile_photo IS 'URL to user profile photo (optional)';
