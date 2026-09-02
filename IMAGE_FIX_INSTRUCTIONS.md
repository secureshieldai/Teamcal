# 🖼️ Fix Images Not Showing on Mobile

## Problem
Images appear as black rectangles on mobile but work on web browser.

## Root Cause
**Supabase storage bucket is likely private or RLS policies are blocking public access.**

---

## 🚀 Quick Fix (3 Steps)

### Step 1: Make Bucket Public
1. Go to **Supabase Dashboard** → **Storage** → **Buckets**
2. Find `teamcal-uploads` bucket
3. Click the **Settings** icon (⚙️)
4. Toggle **Public bucket** to **ON**
5. Click **Save**

### Step 2: Apply RLS Policies
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `backend/supabase/storage_fix.sql`
3. Copy the entire SQL script
4. Paste into SQL Editor
5. Click **Run**

This will:
- ✅ Allow public viewing of images
- ✅ Allow authenticated users to upload images
- ✅ Allow users to delete their own images

### Step 3: Test
```bash
# Terminal 1: Test storage configuration
cd backend
npm install @supabase/supabase-js  # if not already installed
node test-storage.js

# Expected output:
# ✅ Bucket exists
# ✅ Upload successful  
# ✅ URL is publicly accessible
```

---

## 🔍 Verify the Fix

### Check Mobile Logs
```bash
# Android
npx react-native log-android

# iOS  
npx react-native log-ios

# Look for:
✓ Image loaded successfully
  Post: [id] | Index: 0
  URL: https://[project].supabase.co/storage/v1/...
```

### Test in App
1. Rebuild APK: `npx eas build --platform android --profile preview`
2. Install on device
3. Create a new post with image
4. Check if image displays correctly
5. Scroll feed - all images should load

---

## 🐛 Still Not Working?

### Debug Checklist

#### 1. Check Image URLs
Open mobile browser and paste the image URL directly:
```
https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/teamcal-uploads/social/[USER-ID]/[UUID].jpg
```

- ✅ **Loads** → App issue, check React Native Image component
- ❌ **403 Forbidden** → Bucket is private or RLS blocking
- ❌ **404 Not Found** → Image wasn't uploaded or wrong URL

#### 2. Verify Bucket Settings
In Supabase Dashboard → Storage → `teamcal-uploads`:
- [ ] Public bucket: **ON**
- [ ] File size limit: **None** (or reasonable like 10MB)
- [ ] Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

#### 3. Check RLS Policies
In Supabase Dashboard → Authentication → Policies → storage.objects:

Should see 3 policies:
- [ ] **"Public can view images"** - SELECT - public
- [ ] **"Authenticated users can upload images"** - INSERT - authenticated
- [ ] **"Users can delete their own images"** - DELETE - authenticated

#### 4. Backend Environment Variables
Check `backend/.env`:
```env
SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key]  # NOT anon key!
SUPABASE_UPLOAD_BUCKET=teamcal-uploads
```

#### 5. Network Security (Android)
If using HTTP (dev only), add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

---

## 📱 Mobile-Specific Issues

### Android
**Issue:** Images don't load but web works
**Cause:** Network security policy blocking HTTP or untrusted certificates
**Fix:** 
1. Ensure Supabase URL is HTTPS
2. Check `network_security_config.xml` allows your domain

### iOS
**Issue:** Images require authentication
**Cause:** iOS App Transport Security (ATS) requirements
**Fix:** Already using HTTPS, should work. If not, check Info.plist

---

## 🔧 Advanced Debugging

### Enable Detailed Logs

The code already has detailed logging. When you create/view a post with images, you'll see:

**On Upload:**
```
PostsService uploadImage - URI: file:///...
PostsService uploadImage - mimeType: image/jpeg
PostsService uploadImage - fileName: image.jpg
Publishing post with 1 images
Image 1 uploaded, URL: https://...
```

**On Display:**
```
✓ Image loaded successfully
  Post: post-123 | Index: 0
  URL: https://[project].supabase.co/storage/...
```

**On Error:**
```
═══ IMAGE LOAD ERROR ═══
Post ID: post-123
Image Index: 0
Image URL: https://...
Error: Failed to load resource
═══════════════════════════
```

### Test Upload Directly

Create a test script:
```javascript
// test-upload.js
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('image', fs.createReadStream('./test-image.jpg'));

fetch('http://localhost:5000/api/posts/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
  },
  body: form,
})
.then(r => r.json())
.then(data => console.log('URL:', data.url));
```

---

## ✅ Success Criteria

After applying fixes, you should see:

- [ ] Storage test script passes all checks
- [ ] Image URLs are publicly accessible in browser
- [ ] Mobile logs show "Image loaded successfully"
- [ ] Feed displays images correctly (no black rectangles)
- [ ] New posts with images upload and display immediately
- [ ] No "Unable to load" error messages

---

## 📚 Reference

- **Supabase Storage Docs:** https://supabase.com/docs/guides/storage
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security
- **React Native Image:** https://reactnative.dev/docs/image

## 🆘 Need Help?

1. Run `node backend/test-storage.js` and share the output
2. Check mobile logs and share any error messages
3. Verify Supabase bucket is public
4. Confirm RLS policies are applied
