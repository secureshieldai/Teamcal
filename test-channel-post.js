/**
 * Test script to verify channel post creation
 * Run with: node test-channel-post.js
 */

const axios = require('axios');

// Configuration - Update these values
const API_URL = 'https://teamcal-backend.onrender.com'; // or http://localhost:5001 for local
const TEST_EMAIL = 'test@example.com'; // Replace with your test account email
const TEST_PASSWORD = 'password123';    // Replace with your test password

async function testChannelPost() {
  console.log('\n🧪 Testing Channel Post Creation\n');
  console.log('API URL:', API_URL);

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log('✅ Logged in as:', loginRes.data.user.email);
    console.log('   User ID:', userId);

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Get user's channels
    console.log('\n2️⃣ Fetching user channels...');
    const channelsRes = await axios.get(`${API_URL}/api/channels/my/channels`, { headers });
    console.log('✅ Found', channelsRes.data.data.length, 'channels');
    
    if (channelsRes.data.data.length === 0) {
      console.log('\n⚠️  No channels found. Creating a test channel...');
      const createRes = await axios.post(`${API_URL}/api/channels`, {
        name: 'Test Channel',
        username: 'testchannel' + Date.now(),
        description: 'A test channel for posting',
        category: 'general',
        is_public: true,
      }, { headers });
      
      console.log('✅ Created channel:', createRes.data.data.name);
      channelsRes.data.data.push(createRes.data.data);
    }

    const channel = channelsRes.data.data[0];
    console.log('   Using channel:', channel.name, '(ID:', channel.id, ')');
    console.log('   Owner ID:', channel.owner_id);
    console.log('   Is owner:', channel.owner_id === userId);

    // Step 3: Try to create a post
    console.log('\n3️⃣ Creating test post...');
    const postData = {
      content_type: 'text',
      text_content: 'Test post from script at ' + new Date().toISOString(),
      media_url: null,
      is_announcement: false,
    };

    try {
      const postRes = await axios.post(
        `${API_URL}/api/channels/${channel.id}/posts`,
        postData,
        { headers }
      );
      console.log('✅ Post created successfully!');
      console.log('   Post ID:', postRes.data.data.id);
      console.log('   Content:', postRes.data.data.text_content);
    } catch (postError) {
      console.error('❌ Failed to create post');
      console.error('   Status:', postError.response?.status);
      console.error('   Message:', postError.response?.data?.message);
      console.error('   Full error:', postError.response?.data);
      
      // Step 4: Debug - check channel members
      if (postError.response?.status === 403) {
        console.log('\n4️⃣ Checking channel members (permissions issue)...');
        try {
          const membersRes = await axios.get(
            `${API_URL}/api/channels/${channel.id}/members`,
            { headers }
          );
          console.log('   Channel members:', membersRes.data.data.length);
          const currentUser = membersRes.data.data.find(m => m.user_id === userId);
          if (currentUser) {
            console.log('   Your role:', currentUser.role);
            console.log('   Can post:', currentUser.can_post);
          } else {
            console.log('   You are not a member of this channel');
          }
        } catch (membersError) {
          console.log('   Could not fetch members');
        }
      }
    }

    console.log('\n✨ Test complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testChannelPost();
