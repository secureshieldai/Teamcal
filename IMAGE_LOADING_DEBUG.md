# Image Loading Issue - Debugging Guide

## Problem
Images appear as black/blank on mobile but work on web browser.

## Root Causes (Most Likely)

### 1. Supabase Storage Bucket Not Public
The storage bucket needs to be public for images to load.

**Fix in Supabase Dashboard:**
1. Go to Storage → Buckets
2. Find `teamcal-uploads` bucket
3. Make sure it's set to **Public**
4. If not, click the bucket → Settings → Make public

### 2. CORS Configuration
Supabase storage needs CORS configured to allow mobile app access.

**Fix in Supabase Dashboard:**
1. Go to Storage → Policies
2. Add CORS policy for the bucket
3. Or use Supabase API to set CORS:

```bash
# Add allowed origins including your mobile app
```

### 3. RLS (Row Level Security) Blocking Access
If RLS is enabled on the storage bucket, anonymous users can't view images.

**Check RLS Policies:**
```sql
-- In Supabase SQL Editor
-- Allow public SELECT on storage.objects
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'teamcal-uploads' );
```

### 4. Image URL Format
Check if the URLs being generated are correct.

**Expected Format:**
```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/teamcal-uploads/social/[USER_ID]/[UUID].jpg
```

## Debugging Steps

### Step 1: Check Console Logs
Since we added debug logging, check the mobile logs:

```bash
# Run: npx react-native log-android
# Or: npx react-native log-ios

# Look for:
- "PostsService uploadImage - returned URL:"
- "Image loaded successfully:" 
- "Image load error for post"
```

### Step 2: Test Image URL Directly
1. Copy an image URL from the console logs
2. Paste it in a mobile browser
3. If it loads → app issue
4. If it doesn't load → Supabase configuration issue

### Step 3: Check Supabase Storage Settings

**In Supabase Dashboard:**
1. Storage → Configuration
2. Verify:
   - Bucket is PUBLIC
   - File size limits are reasonable (not 0)
   - MIME types include: image/jpeg, image/png, image/webp, image/gif

### Step 4: Verify Backend Environment Variables

**Check `backend/.env`:**
```env
SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key]
SUPABASE_UPLOAD_BUCKET=teamcal-uploads
```

## Quick Fix Options

### Option A: Make Bucket Public (Recommended)
```javascript
// backend/src/services/storage.service.js already has this:
const bucketOptions = {
  public: true,  // ← Make sure this is true
  fileSizeLimit: null,
  allowedMimeTypes: [...],
};
```

### Option B: Add Storage RLS Policy
Run this SQL in Supabase:

```sql
-- Allow anyone to view images
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'teamcal-uploads' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'teamcal-uploads' );
```

### Option C: Check Expo Network Permissions
In `app.json`, ensure network permissions:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "INTERNET",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## Testing

After applying fixes:

1. **Test upload:**
   - Create a new post with image
   - Check console for URL
   - Verify URL is accessible

2. **Test display:**
   - Reload feed
   - Images should appear
   - No black rectangles

3. **Test on device:**
   - Build new APK
   - Install and test
   - Check if images load properly

## Common Issues

### Black Rectangle but No Error
- Image URL is returning 403 Forbidden
- Bucket is private or RLS is blocking
- **Fix:** Make bucket public

### "Unable to load" Error Shown
- Network request failed
- URL is malformed
- CORS blocking the request
- **Fix:** Check CORS and URL format

### Images Load on Web But Not Mobile
- Android network security config
- HTTPS certificate issue
- **Fix:** Check network_security_config.xml

### Images Take Long to Load
- Large file sizes
- Slow network
- **Fix:** Compress images before upload (quality: 0.8 already set)

## Next Steps

1. ✅ Check Supabase bucket is PUBLIC
2. ✅ Verify RLS policies allow SELECT
3. ✅ Test image URL in browser
4. ✅ Check mobile console logs
5. ✅ Rebuild APK and test
