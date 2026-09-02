# Test Image Loading in Mobile App

## Summary of Tests Performed

✅ **Backend Storage:** Working perfectly
✅ **Supabase Bucket:** Public and accessible  
✅ **Image URLs in Database:** All returning 200 OK
✅ **Image Format:** Correct (JPEG/PNG with proper content-type)

## Problem Identified

Images show as **black rectangles** on mobile, which means:
- URLs are being received by the Image component
- Images are NOT displaying (but no error is shown)
- This is a **React Native Image rendering issue**, not a network/permission issue

## Most Likely Causes

### 1. Image Component Issue on Android
React Native's Image component on Android sometimes fails silently with certain URLs.

### 2. Cached Black Images
Old failed attempts might be cached.

### 3. Image Size Too Large
Some images are 280KB+ which might timeout on slow connections.

## Solutions to Try

### Solution 1: Clear App Cache & Reinstall

```bash
# Uninstall old APK from device
adb uninstall com.teamcal.app

# Build fresh APK
npx eas build --platform android --profile preview --clear-cache

# Install and test
```

### Solution 2: Add Explicit Headers to Image Component

Update PostCard.tsx Image source:

```typescript
<Image
  source={{ 
    uri,
    headers: {
      'Accept': 'image/*',
    },
  }}
  style={sizeStyle}
  resizeMode="cover"
  // ... rest of props
/>
```

### Solution 3: Use FastImage Instead

Install:
```bash
npm install react-native-fast-image
```

Replace in PostCard.tsx:
```typescript
import FastImage from 'react-native-fast-image';

// Replace <Image> with:
<FastImage
  source={{ 
    uri,
    priority: FastImage.priority.normal,
  }}
  style={sizeStyle}
  resizeMode={FastImage.resizeMode.cover}
  onError={() => {
    console.error('FastImage load error:', uri);
    setImageErrors(prev => ({ ...prev, [i]: true }));
  }}
  onLoadEnd={() => {
    console.log('✓ FastImage loaded:', uri);
  }}
/>
```

### Solution 4: Test with a Known Working Image

Add a test post with a simple, small image:

```javascript
// In SocialFeedTab or test file
const TEST_IMAGE = 'https://via.placeholder.com/150';

// Or use one of the working Supabase URLs:
const TEST_IMAGE = 'https://sitsdsqdahzwlqczntir.supabase.co/storage/v1/object/public/teamcal-uploads/posts/04cee833-7914-4a3a-ae37-7d665fc19b96/ab739d34-f258-4c47-bc95-0eb2cc217c6e.jpg';
```

## Quick Test in App

Add this temporary component to SocialFeedTab to test image loading:

```tsx
// Add at the top of SocialFeedTab component
const [testImage] = useState('https://sitsdsqdahzwlqczntir.supabase.co/storage/v1/object/public/teamcal-uploads/posts/04cee833-7914-4a3a-ae37-7d665fc19b96/ab739d34-f258-4c47-bc95-0eb2cc217c6e.jpg');

// Add before the feed list
<View style={{ padding: 20, backgroundColor: '#f0f0f0' }}>
  <Text>Test Image Loading:</Text>
  <Image 
    source={{ uri: testImage }}
    style={{ width: 200, height: 200, marginTop: 10, backgroundColor: 'red' }}
    onError={(e) => console.log('TEST IMAGE ERROR:', e.nativeEvent)}
    onLoad={() => console.log('TEST IMAGE LOADED')}
  />
</View>
```

If this test image loads:
- ✅ React Native Image works fine
- ❌ PostCard implementation has an issue

If this test image DOESN'T load:
- ❌ System-level issue (network, Android config, etc.)

## Console Commands to Check

When running the app, check console output:

```bash
# Look for these in the logs:
✓ Image loaded successfully
  Post: [id] | Index: 0
  URL: https://...

# Or errors:
═══ IMAGE LOAD ERROR ═══
Post ID: [id]
Image URL: https://...
Error: [error message]
```

## Expected Outcome

After clearing cache and rebuilding:
- Images should display correctly
- No black rectangles
- Console shows "✓ Image loaded successfully"
