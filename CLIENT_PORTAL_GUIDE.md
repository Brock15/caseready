# Client Portal - Complete Guide

The Client Portal feature allows lawyers to create secure upload links for clients to submit documents without requiring an account or login.

## 🎯 Features

### For Lawyers:
- **Portal Management**: Create unlimited client portals for different matters or clients
- **Secure Token System**: Each portal has a unique, unguessable access token
- **Upload Tracking**: View all client uploads with status tracking (pending, reviewed, approved, rejected)
- **Matter Integration**: Link portals to specific matters for organization
- **Expiration Control**: Set optional expiration dates for portals
- **Portal Control**: Activate/deactivate portals at any time
- **Client Information**: Track client name and email for each portal

### For Clients:
- **No Account Required**: Clients access portals via a simple link
- **Drag-and-Drop Upload**: Modern file upload interface with progress tracking
- **Multiple Files**: Upload multiple files at once
- **Upload History**: Clients can see their previous uploads and their status
- **Mobile Friendly**: Works perfectly on phones and tablets

## 📋 Setup Instructions

### Step 1: Run Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `DATABASE_CLIENT_PORTAL.md`
4. Copy all the SQL commands
5. Paste into SQL Editor and click **Run**

This creates three tables:
- `client_portals` - Portal configuration and access tokens
- `client_uploads` - Uploaded files tracking
- `client_messages` - Two-way messaging (future feature)

### Step 2: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it exactly: `client-uploads`
4. Make it **Public**
5. Go to **Policies** tab for the bucket
6. Add the following policies (from DATABASE_CLIENT_PORTAL.md):
   - Allow public uploads
   - Allow public reads
   - Allow authenticated users to delete

### Step 3: Test the Feature

1. Start your Next.js app: `npm run dev`
2. Sign in to your account
3. Navigate to `/portal`
4. Click **New Portal** to create a test portal
5. Copy the portal link and test it in an incognito window

## 🚀 How to Use

### Creating a Client Portal

1. **Navigate to Portal Page**
   - Go to `/portal` from your dashboard
   - Or visit directly: `http://localhost:3000/portal`

2. **Click "New Portal"**
   - Fill in the portal details:
     - **Portal Name** (required): e.g., "Discovery Documents Upload"
     - **Description** (optional): Instructions for your client
     - **Client Name** (optional): e.g., "John Doe"
     - **Client Email** (optional): Track who the portal is for
     - **Link to Matter** (optional): Associate with a specific case
     - **Expires In** (optional): Set how many days until expiration

3. **Click "Create Portal"**
   - Portal is created with a unique access token
   - Portal is automatically set to "Active"

### Sharing with Clients

1. **Find the Portal** in your portals list
2. **Click "Copy Link"** button
3. **Share the link** with your client via:
   - Email
   - Text message
   - Secure messaging app

The link format: `https://yourdomain.com/client/[unique-token]`

### Managing Uploads

1. **Select a Portal** from your portals list
2. **View Uploads** in the right panel
3. **Update Status** for each upload:
   - **Pending**: Just uploaded, not yet reviewed
   - **Reviewed**: You've looked at it
   - **Approved**: Accepted for use
   - **Rejected**: Not suitable/incorrect file

### Deactivating or Deleting Portals

- **Deactivate**: Click "Deactivate" to temporarily disable access (clients see "portal deactivated" message)
- **Delete**: Click "Delete" to permanently remove (also deletes all uploads and messages)

## 📱 Client Experience

When clients click on a portal link:

1. **Welcome Screen**
   - See portal name and personalized greeting
   - Read any instructions you provided

2. **Upload Interface**
   - Enter their name (required)
   - Optionally enter email
   - Drag and drop files or click to browse
   - See upload progress for each file
   - Remove files before uploading

3. **Track Uploads**
   - View all previously uploaded files
   - See status of each upload (pending, reviewed, etc.)
   - Know exactly what's been received

## 🔒 Security Features

### Access Control
- **Unique Tokens**: 64-character random tokens (impossible to guess)
- **No Directory Listing**: Clients can only access their specific portal
- **Expiration**: Optional time-based access control
- **Active/Inactive**: Instant portal disabling

### Data Protection
- **Row Level Security (RLS)**: Database enforces data isolation
- **User-scoped Access**: Lawyers only see their own portals
- **Public Upload, Private View**: Clients can upload, but only you manage status

### File Storage
- **Supabase Storage**: Enterprise-grade file storage
- **Unique Filenames**: Timestamped to prevent collisions
- **Public URLs**: Files are accessible only via specific URLs

## 💡 Use Cases

### Discovery Phase
```
Portal Name: "Discovery Documents - Smith v. Jones"
Description: "Please upload all requested discovery documents, including medical records, photographs, and witness statements."
Expires In: 30 days
```

### Client Intake
```
Portal Name: "New Client Documents"
Description: "Welcome! Please upload your signed engagement letter and any relevant case documents."
Link to Matter: [Select existing matter]
```

### Ongoing Case Work
```
Portal Name: "Additional Evidence Upload"
Description: "Please upload the photos we discussed in our last meeting."
Expires In: 7 days
```

## 🔧 Troubleshooting

### Portal Link Not Working

**Issue**: Client sees "Invalid or expired portal link"

**Solutions**:
1. Check if portal is Active (not deactivated)
2. Check if expiration date has passed
3. Verify the full URL was copied correctly
4. Check that database tables were created correctly

### Files Not Uploading

**Issue**: Upload fails or hangs

**Solutions**:
1. Verify `client-uploads` storage bucket exists
2. Check storage bucket is set to Public
3. Verify storage policies are correctly applied
4. Check browser console for errors
5. Ensure files aren't too large (check Supabase limits)

### Uploads Not Appearing

**Issue**: Files upload but don't show in lawyer's portal

**Solutions**:
1. Refresh the portal page
2. Check database RLS policies are correctly set
3. Verify `client_uploads` table was created
4. Check browser console for database errors

## 📊 Database Schema

### client_portals
```sql
- id (UUID)
- user_id (UUID) - References lawyer account
- matter_id (UUID, optional) - Link to specific matter
- name (TEXT) - Portal display name
- description (TEXT, optional) - Instructions for client
- access_token (TEXT, unique) - 64-char security token
- is_active (BOOLEAN) - Enable/disable portal
- expires_at (TIMESTAMPTZ, optional) - Expiration date
- client_name (TEXT, optional) - Client's name
- client_email (TEXT, optional) - Client's email
- created_at / updated_at (TIMESTAMPTZ)
```

### client_uploads
```sql
- id (UUID)
- portal_id (UUID) - References client_portals
- file_name (TEXT) - Original filename
- file_url (TEXT) - Supabase storage URL
- file_size (BIGINT) - Size in bytes
- file_type (TEXT) - MIME type
- uploaded_by_name (TEXT) - Client's name
- uploaded_by_email (TEXT, optional) - Client's email
- status (TEXT) - pending|reviewed|approved|rejected
- notes (TEXT, optional) - Internal notes
- created_at (TIMESTAMPTZ)
```

## 🎨 Customization Ideas

### Add Email Notifications
When a file is uploaded, send email to lawyer:
```typescript
// In client upload page after successful upload
await fetch('/api/notify-upload', {
  method: 'POST',
  body: JSON.stringify({
    portalId: portal.id,
    fileName: file.name,
  })
});
```

### Add File Size Limits
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
if (file.size > MAX_FILE_SIZE) {
  alert(`File ${file.name} is too large. Max size is 50MB.`);
  continue;
}
```

### Add Allowed File Types
```typescript
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
if (!ALLOWED_TYPES.includes(file.type)) {
  alert(`File type ${file.type} not allowed`);
  continue;
}
```

## 🚦 Next Steps

The basic client portal is now fully functional! Optional enhancements:

1. **Email Notifications**: Notify when files are uploaded
2. **Two-way Messaging**: Add chat between lawyer and client
3. **File Preview**: Show thumbnails for images/PDFs
4. **Bulk Actions**: Approve/reject multiple uploads at once
5. **Analytics**: Track portal usage and client engagement
6. **Custom Branding**: Add your law firm's logo and colors

## 📞 Support

If you run into issues:
1. Check the DATABASE_CLIENT_PORTAL.md for correct SQL setup
2. Verify all environment variables are set
3. Check Supabase dashboard for any error logs
4. Test with browser dev tools console open for errors

---

**Congratulations!** You now have a professional client portal system integrated into your legal workspace. Clients can securely upload documents without creating accounts, and you have full control over access and upload management.
