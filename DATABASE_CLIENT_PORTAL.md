# Client Portal Database Setup

This document contains the SQL commands to set up the database tables for the Client Portal feature.

## Required Tables

Run these SQL commands in your Supabase SQL Editor to create the necessary tables for Client Portals, Client Uploads, and Client Messages.

### 1. Client Portals Table

```sql
CREATE TABLE IF NOT EXISTS client_portals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  access_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  client_name TEXT,
  client_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_client_portals_user_id ON client_portals(user_id);
CREATE INDEX idx_client_portals_matter_id ON client_portals(matter_id);
CREATE INDEX idx_client_portals_access_token ON client_portals(access_token);

-- Enable Row Level Security
ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own portals"
  ON client_portals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portals"
  ON client_portals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portals"
  ON client_portals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portals"
  ON client_portals FOR DELETE
  USING (auth.uid() = user_id);

-- Public access policy for clients (no auth required)
CREATE POLICY "Public can view active portals by token"
  ON client_portals FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
```

### 2. Client Uploads Table

```sql
CREATE TABLE IF NOT EXISTS client_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  uploaded_by_name TEXT,
  uploaded_by_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_client_uploads_portal_id ON client_uploads(portal_id);
CREATE INDEX idx_client_uploads_status ON client_uploads(status);

-- Enable Row Level Security
ALTER TABLE client_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for lawyers to view uploads
CREATE POLICY "Users can view uploads from their portals"
  ON client_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_uploads.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update uploads from their portals"
  ON client_uploads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_uploads.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete uploads from their portals"
  ON client_uploads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_uploads.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

-- Public access for clients to insert uploads
CREATE POLICY "Public can insert uploads to active portals"
  ON client_uploads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_uploads.portal_id
      AND client_portals.is_active = true
      AND (client_portals.expires_at IS NULL OR client_portals.expires_at > NOW())
    )
  );

-- Public access for clients to view their own uploads
CREATE POLICY "Public can view uploads from active portals"
  ON client_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_uploads.portal_id
      AND client_portals.is_active = true
      AND (client_portals.expires_at IS NULL OR client_portals.expires_at > NOW())
    )
  );
```

### 3. Client Messages Table

```sql
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('lawyer', 'client')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_client_messages_portal_id ON client_messages(portal_id);
CREATE INDEX idx_client_messages_created_at ON client_messages(created_at);

-- Enable Row Level Security
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;

-- Policies for lawyers
CREATE POLICY "Users can view messages from their portals"
  ON client_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_messages.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their portals"
  ON client_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_messages.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their portals"
  ON client_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_messages.portal_id
      AND client_portals.user_id = auth.uid()
    )
  );

-- Public access for clients
CREATE POLICY "Public can view messages from active portals"
  ON client_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_messages.portal_id
      AND client_portals.is_active = true
      AND (client_portals.expires_at IS NULL OR client_portals.expires_at > NOW())
    )
  );

CREATE POLICY "Public can insert messages to active portals"
  ON client_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_portals
      WHERE client_portals.id = client_messages.portal_id
      AND client_portals.is_active = true
      AND (client_portals.expires_at IS NULL OR client_portals.expires_at > NOW())
    )
  );
```

### 4. Update Triggers

```sql
-- Auto-update timestamp for client_portals
CREATE TRIGGER update_client_portals_updated_at BEFORE UPDATE ON client_portals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Storage Bucket Setup

You also need to create a storage bucket for client uploads:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `client-uploads`
3. Set it to **Public** (so clients can upload without auth)
4. Add the following policy:

```sql
-- Allow public uploads to client-uploads bucket
CREATE POLICY "Public can upload to client-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-uploads');

-- Allow public to view their uploads
CREATE POLICY "Public can view client-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-uploads');

-- Allow authenticated users to delete from client-uploads
CREATE POLICY "Authenticated users can delete client-uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'client-uploads' AND auth.role() = 'authenticated');
```

## How to Run

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL commands above
5. Click **Run** to execute
6. Set up the storage bucket as described above

## Features Enabled

Once these tables are set up, the Client Portal will have:

- **Secure Portal Links**: Generate unique access tokens for clients
- **File Uploads**: Clients can upload documents without creating an account
- **Message System**: Two-way communication between lawyer and client
- **Upload Management**: Review, approve, or reject client uploads
- **Expiration Control**: Set expiration dates for portal access
- **Matter Integration**: Link portals to specific matters
- **Status Tracking**: Track upload review status
- **Row Level Security**: All data is properly isolated and secured
