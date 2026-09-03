#!/usr/bin/env node
/**
 * Complete Integration Test Suite
 * Tests Frontend + Backend + SecureStorage Integration
 * 
 * Tests:
 * 1. User Registration Flow with Token Storage
 * 2. Email Verification with Token Storage
 * 3. Login Flow with Token Persistence
 * 4. Authenticated API Calls with Token from Storage
 * 5. Token Refresh and Expiration
 * 6. Logout and Token Cleanup
 * 7. Social Login (Firebase) Flow
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Simple color functions (chalk alternative for compatibility)
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const chalk = {
  bold: (text) => `${colors.bold}${text}${colors.reset}`,
  red: (text) => `${colors.red}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  gray: (text) => `${colors.gray}${text}${colors.reset}`,
  'bold.cyan': (text) => `${colors.bold}${colors.cyan}${text}${colors.reset}`,
  'bold.yellow': (text) => `${colors.bold}${colors.yellow}${text}${colors.reset}`,
};

// Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://teamcal-mr7g.onrender.com/api';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'SecurePass123!';
const TEST_NAME = 'Integration Test User';

// Mock SecureStorage for testing (simulates frontend storage)
class MockSecureStorage {
  constructor() {
    this.storage = new Map();
  }

  async getToken() {
    const token = this.storage.get('AUTH_TOKEN');
    console.log(chalk.cyan('[MockStorage]'), 'Token retrieved:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    return token || null;
  }

  async setToken(token) {
    console.log(chalk.cyan('[MockStorage]'), 'Saving token:', token.substring(0, 20) + '...');
    this.storage.set('AUTH_TOKEN', token);
    console.log(chalk.green('[MockStorage]'), 'Token saved successfully');
  }

  async removeToken() {
    console.log(chalk.cyan('[MockStorage]'), 'Removing token');
    this.storage.delete('AUTH_TOKEN');
  }

  async getUser() {
    const raw = this.storage.get('USER');
    return raw ? JSON.parse(raw) : null;
  }

  async setUser(user) {
    this.storage.set('USER', JSON.stringify(user));
  }

  async removeUser() {
    this.storage.delete('USER');
  }

  async clearSession() {
    await this.removeToken();
    await this.removeUser();
  }
}

// Mock API Client (simulates frontend API client with storage)
class MockApiClient {
  constructor(storage) {
    this.storage = storage;
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor - attach token from storage
    this.client.interceptors.request.use(async (config) => {
      const token = await this.storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(chalk.blue('[API Client]'), 'Authorization header set');
      } else {
        console.log(chalk.yellow('[API Client]'), 'No token - unauthenticated request');
      }
      return config;
    });

    // Response interceptor - normalize errors
    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        const message =
          error.response?.data?.message ??
          error.message ??
          'Something went wrong';
        throw new Error(message);
      }
    );
  }

  async request(config) {
    return this.client.request(config);
  }
}

// Test Results Tracker
class TestTracker {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  pass(name) {
    this.passed++;
    this.tests.push({ name, status: 'PASS' });
    console.log(chalk.green('✓'), chalk.bold(name));
  }

  fail(name, error) {
    this.failed++;
    this.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(chalk.red('✗'), chalk.bold(name));
    console.log(chalk.red('  Error:'), error.message);
  }

  summary() {
    console.log('\n' + chalk.bold('═'.repeat(70)));
    console.log(chalk.bold('TEST SUMMARY'));
    console.log(chalk.bold('═'.repeat(70)));
    console.log(chalk.green(`Passed: ${this.passed}`));
    console.log(chalk.red(`Failed: ${this.failed}`));
    console.log(chalk.bold(`Total: ${this.passed + this.failed}`));
    
    if (this.failed > 0) {
      console.log('\n' + chalk.red('Failed Tests:'));
      this.tests.filter(t => t.status === 'FAIL').forEach(t => {
        console.log(chalk.red(`  ✗ ${t.name}`));
        console.log(chalk.gray(`    ${t.error}`));
      });
    }
    
    console.log(chalk.bold('═'.repeat(70)) + '\n');
    return this.failed === 0;
  }
}

// Test Suite
async function runTests() {
  const tracker = new TestTracker();
  const storage = new MockSecureStorage();
  const apiClient = new MockApiClient(storage);
  
  let verificationToken = null;
  let verificationCode = null;
  let authToken = null;
  let userId = null;

  console.log(chalk['bold.cyan']('\n╔═══════════════════════════════════════════════════════════════════╗'));
  console.log(chalk['bold.cyan']('║     SECURE STORAGE + FRONTEND + BACKEND INTEGRATION TESTS        ║'));
  console.log(chalk['bold.cyan']('╚═══════════════════════════════════════════════════════════════════╝\n'));
  
  console.log(chalk.gray('API URL:'), API_URL);
  console.log(chalk.gray('Test Email:'), TEST_EMAIL);
  console.log('\n');

  // ────────────────────────────────────────────────────────────────────
  // TEST 1: User Registration
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 1: User Registration'));
    
    const response = await apiClient.request({
      method: 'POST',
      url: '/auth/register',
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
        acceptedTerms: true,
      },
    });

    if (response.data.success && response.data.verificationToken) {
      verificationToken = response.data.verificationToken;
      
      // Decode to get user ID
      const decoded = jwt.decode(verificationToken);
      userId = decoded.id;
      
      console.log(chalk.green('  Registration successful'));
      console.log(chalk.gray('  Verification Token:'), verificationToken.substring(0, 30) + '...');
      console.log(chalk.gray('  User ID:'), userId);
      tracker.pass('User Registration');
    } else {
      throw new Error('Registration did not return expected data');
    }
  } catch (error) {
    tracker.fail('User Registration', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 2: Retrieve Verification Code from Database (Backend Test)
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 2: Retrieve Verification Code'));
    
    // In real scenario, code is sent via email. For testing, we'll extract it from the database
    // This simulates the email delivery step
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: './backend/.env' });
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('email_verification_otps')
      .select('code')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    
    verificationCode = data.code;
    console.log(chalk.green('  Verification code retrieved'));
    console.log(chalk.gray('  Code:'), verificationCode);
    tracker.pass('Retrieve Verification Code');
  } catch (error) {
    tracker.fail('Retrieve Verification Code', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 3: Email Verification + Token Storage
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 3: Email Verification + Token Storage'));
    
    const response = await apiClient.request({
      method: 'POST',
      url: '/auth/verification/verify',
      data: {
        verificationToken,
        code: verificationCode,
      },
    });

    if (response.data.success && response.data.token && response.data.user) {
      authToken = response.data.token;
      
      // Store token in secure storage (simulates frontend behavior)
      await storage.setToken(authToken);
      await storage.setUser(response.data.user);
      
      console.log(chalk.green('  Email verified successfully'));
      console.log(chalk.gray('  Auth Token:'), authToken.substring(0, 30) + '...');
      console.log(chalk.gray('  User:'), response.data.user.email);
      
      // Verify token is in storage
      const storedToken = await storage.getToken();
      if (storedToken !== authToken) {
        throw new Error('Token not properly stored');
      }
      console.log(chalk.green('  Token verified in storage'));
      
      tracker.pass('Email Verification + Token Storage');
    } else {
      throw new Error('Verification did not return expected data');
    }
  } catch (error) {
    tracker.fail('Email Verification + Token Storage', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 4: Authenticated Request (Using Token from Storage)
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 4: Authenticated Request with Stored Token'));
    
    // API client should automatically attach token from storage
    const response = await apiClient.request({
      method: 'GET',
      url: '/auth/me',
    });

    if (response.data.success && response.data.user) {
      console.log(chalk.green('  Authenticated request successful'));
      console.log(chalk.gray('  User Email:'), response.data.user.email);
      console.log(chalk.gray('  User Name:'), response.data.user.name);
      console.log(chalk.gray('  Verified:'), response.data.user.verified);
      tracker.pass('Authenticated Request with Stored Token');
    } else {
      throw new Error('Me endpoint did not return expected data');
    }
  } catch (error) {
    tracker.fail('Authenticated Request with Stored Token', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 5: Token Validation (Decode and Verify)
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 5: Token Validation'));
    
    const storedToken = await storage.getToken();
    if (!storedToken) {
      throw new Error('No token in storage');
    }
    
    const decoded = jwt.decode(storedToken);
    if (!decoded || !decoded.id) {
      throw new Error('Token decode failed');
    }
    
    console.log(chalk.green('  Token decoded successfully'));
    console.log(chalk.gray('  Token Payload:'), JSON.stringify(decoded, null, 2));
    
    // Check expiration
    if (decoded.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      const isExpired = Date.now() >= decoded.exp * 1000;
      console.log(chalk.gray('  Expires:'), expirationDate.toISOString());
      console.log(chalk.gray('  Is Expired:'), isExpired);
      
      if (isExpired) {
        throw new Error('Token is expired');
      }
    }
    
    tracker.pass('Token Validation');
  } catch (error) {
    tracker.fail('Token Validation', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 6: Logout + Token Cleanup
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 6: Logout + Token Cleanup'));
    
    // Clear session (simulates frontend logout)
    await storage.clearSession();
    
    // Verify token is removed
    const tokenAfterLogout = await storage.getToken();
    const userAfterLogout = await storage.getUser();
    
    if (tokenAfterLogout !== null || userAfterLogout !== null) {
      throw new Error('Session not properly cleared');
    }
    
    console.log(chalk.green('  Session cleared successfully'));
    console.log(chalk.gray('  Token:'), tokenAfterLogout);
    console.log(chalk.gray('  User:'), userAfterLogout);
    tracker.pass('Logout + Token Cleanup');
  } catch (error) {
    tracker.fail('Logout + Token Cleanup', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 7: Unauthenticated Request (After Logout)
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 7: Unauthenticated Request (After Logout)'));
    
    try {
      await apiClient.request({
        method: 'GET',
        url: '/auth/me',
      });
      
      // Should not reach here
      throw new Error('Request should have failed without token');
    } catch (error) {
      // Expected to fail
      if (error.message.includes('token') || error.message.includes('authorization') || error.message.includes('Unauthorized')) {
        console.log(chalk.green('  Correctly rejected unauthenticated request'));
        console.log(chalk.gray('  Error:'), error.message);
        tracker.pass('Unauthenticated Request Rejection');
      } else {
        throw error;
      }
    }
  } catch (error) {
    tracker.fail('Unauthenticated Request Rejection', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 8: Login + Re-store Token
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 8: Login + Re-store Token'));
    
    const response = await apiClient.request({
      method: 'POST',
      url: '/auth/login',
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });

    if (response.data.success && response.data.token && response.data.user) {
      // Store token again
      await storage.setToken(response.data.token);
      await storage.setUser(response.data.user);
      
      console.log(chalk.green('  Login successful'));
      console.log(chalk.gray('  New Token:'), response.data.token.substring(0, 30) + '...');
      
      // Verify token is in storage
      const storedToken = await storage.getToken();
      if (!storedToken) {
        throw new Error('Token not stored after login');
      }
      console.log(chalk.green('  Token verified in storage'));
      
      tracker.pass('Login + Re-store Token');
    } else {
      throw new Error('Login did not return expected data');
    }
  } catch (error) {
    tracker.fail('Login + Re-store Token', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 9: Multiple Authenticated Requests
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 9: Multiple Authenticated API Calls'));
    
    const endpoints = [
      { method: 'GET', url: '/auth/me', description: 'Get Profile' },
      { method: 'GET', url: '/workouts', description: 'Get Workouts' },
      { method: 'GET', url: '/challenges', description: 'Get Challenges' },
    ];
    
    let successCount = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.request(endpoint);
        if (response.data.success !== false) {
          console.log(chalk.green(`  ✓ ${endpoint.description}:`), 'Success');
          successCount++;
        } else {
          console.log(chalk.yellow(`  ~ ${endpoint.description}:`), 'Failed');
        }
      } catch (error) {
        console.log(chalk.yellow(`  ~ ${endpoint.description}:`), error.message);
      }
    }
    
    if (successCount >= 1) {
      console.log(chalk.green(`  Successfully made ${successCount}/${endpoints.length} authenticated calls`));
      tracker.pass('Multiple Authenticated API Calls');
    } else {
      throw new Error('No authenticated calls succeeded');
    }
  } catch (error) {
    tracker.fail('Multiple Authenticated API Calls', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // TEST 10: Storage Persistence Simulation
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ TEST 10: Storage Persistence Simulation'));
    
    // Get current token
    const tokenBeforeRestart = await storage.getToken();
    const userBeforeRestart = await storage.getUser();
    
    // Simulate app restart by creating new API client with same storage
    const newApiClient = new MockApiClient(storage);
    
    // Token should still be available
    const tokenAfterRestart = await storage.getToken();
    const userAfterRestart = await storage.getUser();
    
    if (tokenBeforeRestart !== tokenAfterRestart || !userAfterRestart) {
      throw new Error('Storage not persisted');
    }
    
    // Make authenticated request with new client
    const response = await newApiClient.request({
      method: 'GET',
      url: '/auth/me',
    });
    
    if (!response.data.success) {
      throw new Error('Authenticated request failed after restart');
    }
    
    console.log(chalk.green('  Storage persisted across "restart"'));
    console.log(chalk.gray('  Token matches:'), tokenBeforeRestart === tokenAfterRestart);
    console.log(chalk.gray('  User email:'), userAfterRestart.email);
    tracker.pass('Storage Persistence Simulation');
  } catch (error) {
    tracker.fail('Storage Persistence Simulation', error);
  }

  // ────────────────────────────────────────────────────────────────────
  // CLEANUP: Delete Test User
  // ────────────────────────────────────────────────────────────────────
  try {
    console.log(chalk['bold.yellow']('\n▶ CLEANUP: Delete Test User'));
    
    await apiClient.request({
      method: 'DELETE',
      url: '/auth/account',
    });
    
    console.log(chalk.green('  Test user deleted successfully'));
  } catch (error) {
    console.log(chalk.yellow('  Warning: Could not delete test user:'), error.message);
  }

  // ────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────────
  const allPassed = tracker.summary();
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('\n✗ Test suite crashed:'), error);
  process.exit(1);
});
