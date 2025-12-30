# Database Setup Instructions

This document contains the SQL commands to set up the database tables for the CaseReady workspace features.

## Required Tables

Run these SQL commands in your Supabase SQL Editor to create the necessary tables for Notes, Tasks, and Exhibits tracking.

### 1. Notes Table

```sql
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_notes_matter_id ON notes(matter_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);
```

### 2. Tasks Table

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_tasks_matter_id ON tasks(matter_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Exhibits Table

```sql
CREATE TABLE IF NOT EXISTS exhibits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_exhibits_matter_id ON exhibits(matter_id);
CREATE INDEX idx_exhibits_user_id ON exhibits(user_id);

-- Enable Row Level Security
ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own exhibits
CREATE POLICY "Users can view their own exhibits"
  ON exhibits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exhibits"
  ON exhibits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exhibits"
  ON exhibits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exhibits"
  ON exhibits FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Update Function for Notes (Optional - Auto-update timestamp)

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## How to Run

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste each section above (one at a time or all together)
5. Click **Run** to execute

## Verification

After running the SQL commands, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('notes', 'tasks', 'exhibits');

-- Check row level security policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('notes', 'tasks', 'exhibits');
```

## Features Enabled

Once these tables are set up, the Matter Workspace will have:

- **Notes**: Create, read, update, and delete notes for each matter
- **Tasks**: Manage tasks with priority levels, status tracking, and due dates
- **Exhibits**: Track exhibit files associated with matters
- **Row Level Security**: All data is isolated per user for security
- **Cascade Deletes**: When a matter is deleted, all associated notes, tasks, and exhibits are automatically removed

## Integration with Existing Code

The frontend code at `/app/matters/[id]/page.tsx` is already set up to work with these tables. Once you run the SQL above, the workspace features will be fully functional.

## Notes

- The `user_id` field is automatically populated using Supabase's `auth.uid()` function
- All timestamps use `TIMESTAMPTZ` for timezone-aware dates
- Indexes are created on foreign keys for optimal query performance
- Row Level Security (RLS) ensures users can only access their own data
