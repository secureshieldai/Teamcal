/**
 * Channel API Diagnostic Test
 * Run this to check if channels API is working
 */

const axios = require('axios');

// Config - Update these if needed
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || ''; // Add a valid JWT token here

async function testChannelsAPI() {
  console.log('\n📡 Testing Channels API...\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Token: ${TEST_TOKEN ? '✓ Present' : '✗ Missing'}\n`);

  const tests = [
    {
      name: 'Discover Channels (Public)',
      method: 'GET',
      url: '/channels/discover',
      requiresAuth: false,
    },
    {
      name: 'Get Following Channels',
      method: 'GET',
      url: '/channels/my/following',
      requiresAuth: true,
    },
    {
      name: 'Get My Channels',
      method: 'GET',
      url: '/channels/my/channels',
      requiresAuth: true,
    },
  ];

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${API_URL}${test.url}`,
        headers: {},
      };

      if (test.requiresAuth) {
        if (!TEST_TOKEN) {
          console.log(`⏭️  ${test.name}: SKIPPED (no token)`);
          continue;
        }
        config.headers.Authorization = `Bearer ${TEST_TOKEN}`;
      }

      const response = await axios(config);
      console.log(`✅ ${test.name}: SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data count: ${response.data?.data?.length || 0} items`);
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.log(`   Error: Cannot reach server (${error.message})`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('✨ Test complete!\n');
  console.log('Troubleshooting tips:');
  console.log('1. Make sure backend server is running (npm start in /backend)');
  console.log('2. Check .env file has correct API_URL');
  console.log('3. Make sure database schema is loaded');
  console.log('4. Export a valid token: export TEST_TOKEN="your-jwt-token"');
}

testChannelsAPI().catch(console.error);
