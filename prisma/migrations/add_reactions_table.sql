-- Migration: Add reactions table for emoji reactions on comments
-- Date: 2025-11-21
-- Description: Creates reactions table to store user emoji reactions on comments

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_reactions_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Unique constraint: one user can only react with same emoji once per comment
  CONSTRAINT unique_user_emoji_per_comment UNIQUE (comment_id, user_id, emoji)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_emoji ON reactions(comment_id, emoji);

-- Add comment for documentation
COMMENT ON TABLE reactions IS 'User emoji reactions on comments';
COMMENT ON COLUMN reactions.emoji IS 'Emoji character (e.g., 👍, ❤️, 😊, 🎉, 🚀)';
