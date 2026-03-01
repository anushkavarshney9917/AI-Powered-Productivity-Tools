-- =============================================
-- Schema Update: Add position field for task ordering
-- Run this in Supabase SQL Editor
-- =============================================

-- Add position column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for position-based ordering
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(user_id, position);

-- Update existing tasks to have sequential positions
WITH ranked_tasks AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as new_position
  FROM tasks
)
UPDATE tasks 
SET position = ranked_tasks.new_position
FROM ranked_tasks 
WHERE tasks.id = ranked_tasks.id;
