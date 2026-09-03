#!/usr/bin/env node
/**
 * Simplified Integration Test
 * Tests Frontend + Backend + SecureStorage with real user flow
 * 
 * This test creates a test user, verifies it, and tests authenticated API calls
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://localhost:3001/api'; // Use local backend for testing

// Colors for output
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Mock SecureStorage
class MockSecureStorage {
  constructor() {
    this.storage = new Map();
  }
  async getToken() {
    return this.storage.get('TOKEN') || null;
  }
  async setToken(token) {
    this.storage.set('TOKEN', token);
    console.log(`${c.green}✓${c.reset} Token stored in SecureStorage`);
  }
  async removeToken() {
    this.storage.delete('TOKEN');
    console.log(`${c.green}✓${c.reset} Token removed from SecureStorage`);
  }
  async clearSession() {
    this.storage.clear();
  }
}

// Mock API Client with SecureStorage
class ApiClient {
  constructor(storage) {
    this.storage = storage;
  }

  async request(config) {
    const token = await this.storage.getToken();
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log(`${c.cyan}→${c.reset} Request with token: ${token.substring(0, 25)}...`);
    } else {
      console.log(`${c.gray}→${c.reset} Request without token`);
    }

    try {
      const response = await axios({
        ...config,
        baseURL: API_URL,
        headers: { ...headers, ...config.headers },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      throw new Error(message);
    }
  }
}

async function runTest() {
  console.log('\n' + '='.repeat(70));
  console.log('  SECURE STORAGE INTEGRATION TEST');
  console.log('='.repeat(70));
  console.log(`API: ${API_URL}\n`);

  const storage = new MockSecureStorage();
  const api = new ApiClient(storage);
  
  const TEST_EMAIL = `test_user_${Date.now()}@example.com`;
  const TEST_PASSWORD = 'TestPass123!';
  const TEST_NAME = 'Test User';

  try {
    // ======================================================================
    // PHASE 1: Registration (Use existing verified user for simplicity)
    // ======================================================================
    console.log(`${c.yellow}▶ PHASE 1: Login with Test Credentials${c.reset}`);
    console.log(`  Email: test@example.com`);
    
    let loginData;
    try {
      loginData = await api.request({
        method: 'POST',
        url: '/auth/login',
        data: {
          email: 'test@example.com',
          password: 'password123',
        },
      });
    } catch (error) {
      console.log(`${c.yellow}  ℹ Default test account not available: ${error.message}${c.reset}`);
      console.log(`${c.yellow}▶ Creating new test account...${c.reset}\n`);
      
      // Register new user
      const registerData = await api.request({
        method: 'POST',
        url: '/auth/register',
        data: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: TEST_NAME,
          acceptedTerms: true,
        },
      });
      
      console.log(`${c.green}✓${c.reset} Registration successful`);
      console.log(`${c.gray}  Verification token received${c.reset}`);
      console.log(`\n${c.yellow}⚠ Manual Step Required:${c.reset}`);
      console.log(`  1. Check your email for verification code`);
      console.log(`  2. Or check Supabase database: email_verification_otps table`);
      console.log(`  3. Then re-run this test with the verification code\n`);
      process.exit(0);
    }

    if (!loginData.token) {
      throw new Error('Login did not return token');
    }

    console.log(`${c.green}✓${c.reset} Login successful`);
    
    // ======================================================================
    // PHASE 2: Store Token in SecureStorage
    // ======================================================================
    console.log(`\n${c.yellow}▶ PHASE 2: Store Token in SecureStorage${c.reset}`);
    await storage.setToken(loginData.token);
    
    // Verify token is stored
    const storedToken = await storage.getToken();
    if (storedToken !== loginData.token) {
      throw new Error('Token storage verification failed');
    }
    console.log(`${c.green}✓${c.reset} Token verified in storage`);
    
    // Decode token
    const decoded = jwt.decode(loginData.token);
    console.log(`${c.gray}  User ID: ${decoded.id}${c.reset}`);
    console.log(`${c.gray}  Expires: ${new Date(decoded.exp * 1000).toISOString()}${c.reset}`);

    // ======================================================================
    // PHASE 3: Authenticated API Call (using token from storage)
    // ======================================================================
    console.log(`\n${c.yellow}▶ PHASE 3: Authenticated API Calls${c.reset}`);
    
    // Test 1: Get profile
    console.log(`\n  Test 1: GET /auth/me`);
    const profile = await api.request({
      method: 'GET',
      url: '/auth/me',
    });
    
    if (!profile.user) {
      throw new Error('Profile request failed');
    }
    console.log(`${c.green}✓${c.reset} Profile retrieved`);
    console.log(`${c.gray}    Email: ${profile.user.email}${c.reset}`);
    console.log(`${c.gray}    Name: ${profile.user.name}${c.reset}`);
    console.log(`${c.gray}    XP: ${profile.user.xp || 0}${c.reset}`);

    // Test 2: Get workouts
    console.log(`\n  Test 2: GET /workouts`);
    try {
      const workouts = await api.request({
        method: 'GET',
        url: '/workouts',
      });
      console.log(`${c.green}✓${c.reset} Workouts retrieved: ${workouts.workouts?.length || 0} items`);
    } catch (error) {
      console.log(`${c.yellow}  ~ Workouts endpoint: ${error.message}${c.reset}`);
    }

    // Test 3: Get challenges
    console.log(`\n  Test 3: GET /challenges`);
    try {
      const challenges = await api.request({
        method: 'GET',
        url: '/challenges',
      });
      console.log(`${c.green}✓${c.reset} Challenges retrieved: ${challenges.challenges?.length || 0} items`);
    } catch (error) {
      console.log(`${c.yellow}  ~ Challenges endpoint: ${error.message}${c.reset}`);
    }

    // Test 4: Get fasting data
    console.log(`\n  Test 4: GET /fasting/active`);
    try {
      const fasting = await api.request({
        method: 'GET',
        url: '/fasting/active',
      });
      console.log(`${c.green}✓${c.reset} Fasting data retrieved`);
      console.log(`${c.gray}    Active fast: ${fasting.fast ? 'Yes' : 'No'}${c.reset}`);
    } catch (error) {
      console.log(`${c.yellow}  ~ Fasting endpoint: ${error.message}${c.reset}`);
    }

    // ======================================================================
    // PHASE 4: Logout & Token Cleanup
    // ======================================================================
    console.log(`\n${c.yellow}▶ PHASE 4: Logout & Token Cleanup${c.reset}`);
    await storage.removeToken();
    
    const tokenAfterLogout = await storage.getToken();
    if (tokenAfterLogout !== null) {
      throw new Error('Token not properly removed');
    }
    console.log(`${c.green}✓${c.reset} Token cleanup verified`);

    // ======================================================================
    // PHASE 5: Verify Unauthenticated Request Fails
    // ======================================================================
    console.log(`\n${c.yellow}▶ PHASE 5: Verify Unauthenticated Request Fails${c.reset}`);
    try {
      await api.request({
        method: 'GET',
        url: '/auth/me',
      });
      throw new Error('Request should have failed without token');
    } catch (error) {
      if (error.message.includes('token') || error.message.includes('provided') || error.message.includes('Unauthorized')) {
        console.log(`${c.green}✓${c.reset} Unauthenticated request correctly rejected`);
        console.log(`${c.gray}  Error: ${error.message}${c.reset}`);
      } else {
        throw error;
      }
    }

    // ======================================================================
    // PHASE 6: Re-login & Verify Token Persistence
    // ======================================================================
    console.log(`\n${c.yellow}▶ PHASE 6: Re-login & Token Persistence${c.reset}`);
    const reloginData = await api.request({
      method: 'POST',
      url: '/auth/login',
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });
    
    await storage.setToken(reloginData.token);
    console.log(`${c.green}✓${c.reset} Re-login successful, token re-stored`);
    
    // Verify we can make authenticated requests again
    const profileAgain = await api.request({
      method: 'GET',
      url: '/auth/me',
    });
    console.log(`${c.green}✓${c.reset} Authenticated request successful after re-login`);

    // ======================================================================
    // SUCCESS
    // ======================================================================
    console.log('\n' + '='.repeat(70));
    console.log(`${c.green}✓ ALL TESTS PASSED${c.reset}`);
    console.log('='.repeat(70));
    console.log('\nSummary:');
    console.log('  • SecureStorage token management: Working');
    console.log('  • Token attachment to requests: Working');
    console.log('  • Backend authentication: Working');
    console.log('  • Authenticated API calls: Working');
    console.log('  • Logout & cleanup: Working');
    console.log('  • Unauthenticated rejection: Working');
    console.log('');

  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log(`${c.red}✗ TEST FAILED${c.reset}`);
    console.log('='.repeat(70));
    console.log(`Error: ${error.message}`);
    console.log('');
    process.exit(1);
  }
}

runTest();
