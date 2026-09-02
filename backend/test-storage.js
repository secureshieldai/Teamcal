/**
 * Test Supabase Storage Configuration
 * 
 * Run: node backend/test-storage.js
 * 
 * This script verifies:
 * - Supabase connection
 * - Bucket exists and is public
 * - Can upload test file
 * - Can access uploaded file URL
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'teamcal-uploads';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testStorage() {
  console.log('\n🧪 Testing Supabase Storage Configuration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Check bucket exists
  console.log('1️⃣  Checking if bucket exists...');
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(BUCKET);
  
  if (bucketError) {
    console.error('   ❌ Bucket error:', bucketError.message);
    console.log('\n   💡 Creating bucket...');
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: null,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });
    
    if (createError) {
      console.error('   ❌ Failed to create bucket:', createError.message);
      return;
    }
    console.log('   ✅ Bucket created successfully');
  } else {
    console.log('   ✅ Bucket exists:', BUCKET);
    console.log('   📊 Public:', bucketData.public);
    console.log('   📊 File size limit:', bucketData.file_size_limit || 'unlimited');
  }

  // Test 2: Create a test image
  console.log('\n2️⃣  Creating test image...');
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  const testPath = `test/storage-test-${Date.now()}.png`;
  
  console.log('   📁 Upload path:', testPath);
  
  // Test 3: Upload test image
  console.log('\n3️⃣  Uploading test image...');
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(testPath, testImageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
    });
  
  if (uploadError) {
    console.error('   ❌ Upload failed:', uploadError.message);
    return;
  }
  console.log('   ✅ Upload successful');

  // Test 4: Get public URL
  console.log('\n4️⃣  Getting public URL...');
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(testPath);
  
  const publicUrl = urlData.publicUrl;
  console.log('   🔗 Public URL:', publicUrl);

  // Test 5: Try to access the URL
  console.log('\n5️⃣  Testing URL accessibility...');
  try {
    const response = await fetch(publicUrl);
    if (response.ok) {
      console.log('   ✅ URL is publicly accessible');
      console.log('   📊 Status:', response.status);
      console.log('   📊 Content-Type:', response.headers.get('content-type'));
    } else {
      console.error('   ❌ URL returned error:', response.status, response.statusText);
      console.log('\n   💡 This usually means:');
      console.log('      - Bucket is not public');
      console.log('      - RLS policies are blocking access');
      console.log('      - CORS is not configured');
    }
  } catch (error) {
    console.error('   ❌ Failed to fetch URL:', error.message);
  }

  // Test 6: Clean up
  console.log('\n6️⃣  Cleaning up test file...');
  const { error: deleteError } = await supabase.storage
    .from(BUCKET)
    .remove([testPath]);
  
  if (deleteError) {
    console.error('   ⚠️  Cleanup failed:', deleteError.message);
  } else {
    console.log('   ✅ Test file deleted');
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Summary:\n');
  console.log('   Bucket:', BUCKET);
  console.log('   Status:', bucketData?.public ? '✅ PUBLIC' : '❌ PRIVATE');
  console.log('   URL:', publicUrl);
  console.log('\n💡 Next Steps:\n');
  console.log('   1. If bucket is PRIVATE, make it public in Supabase dashboard');
  console.log('   2. Run backend/supabase/storage_fix.sql to set up RLS policies');
  console.log('   3. Test image upload in the app');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testStorage().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
