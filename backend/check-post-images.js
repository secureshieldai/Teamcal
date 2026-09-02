/**
 * Check Post Images in Database
 * 
 * Run: node backend/check-post-images.js
 * 
 * This script checks:
 * - Posts with images in the database
 * - Format of image URLs
 * - Accessibility of image URLs
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkPostImages() {
  console.log('\n🔍 Checking Post Images in Database\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get posts with images
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, user_id, text, image, image_urls, created_at')
    .not('image_urls', 'is', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching posts:', error.message);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('📭 No posts with images found in database\n');
    console.log('💡 This means:');
    console.log('   - No images have been uploaded yet');
    console.log('   - Or all posts were deleted');
    console.log('\n✅ Try uploading a new post with an image to test\n');
    return;
  }

  console.log(`📊 Found ${posts.length} posts with images\n`);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const imageUrls = post.image_urls || (post.image ? [post.image] : []);
    
    console.log(`${i + 1}. Post: ${post.id.substring(0, 8)}...`);
    console.log(`   Created: ${new Date(post.created_at).toLocaleString()}`);
    console.log(`   Text: ${(post.text || '').substring(0, 50)}${post.text?.length > 50 ? '...' : ''}`);
    console.log(`   Images: ${imageUrls.length}`);

    for (let j = 0; j < imageUrls.length; j++) {
      const url = imageUrls[j];
      console.log(`\n   Image ${j + 1}:`);
      console.log(`   URL: ${url}`);

      // Check URL format
      if (!url.includes('supabase.co/storage')) {
        console.log('   ⚠️  URL does not look like Supabase storage URL');
        continue;
      }

      // Check if URL is public
      if (!url.includes('/public/')) {
        console.log('   ❌ URL is not public (missing /public/ in path)');
        continue;
      }

      // Try to fetch the image
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`   ✅ Accessible (${response.status})`);
          console.log(`   📊 Type: ${response.headers.get('content-type')}`);
          console.log(`   📊 Size: ${response.headers.get('content-length')} bytes`);
        } else {
          console.log(`   ❌ Not accessible (${response.status} ${response.statusText})`);
          if (response.status === 403) {
            console.log('   💡 403 = Forbidden (bucket might be private or RLS blocking)');
          } else if (response.status === 404) {
            console.log('   💡 404 = Not Found (file was deleted or never uploaded)');
          }
        }
      } catch (error) {
        console.log(`   ❌ Fetch failed: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

checkPostImages().catch(error => {
  console.error('\n❌ Check failed:', error);
  process.exit(1);
});
