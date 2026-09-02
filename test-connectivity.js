/**
 * Frontend-Backend Connectivity Test
 * Tests all critical API endpoints and frontend services
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://teamcal-mr7g.onrender.com/api';
const TIMEOUT = 10000;

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// ANSI colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addResult(type, test, details) {
  results[type].push({ test, details, timestamp: new Date().toISOString() });
}

// Test 1: Backend Health Check
async function testBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: TIMEOUT });
    if (response.data.status === 'ok') {
      addResult('passed', 'Backend Health', 'Server is responding correctly');
      return true;
    }
    addResult('failed', 'Backend Health', 'Unexpected response format');
    return false;
  } catch (error) {
    addResult('failed', 'Backend Health', `Cannot connect to backend: ${error.message}`);
    return false;
  }
}

// Test 2: CORS Configuration
async function testCORS() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: TIMEOUT,
      headers: { 'Origin': 'http://localhost:8081' }
    });
    if (response.headers['access-control-allow-origin']) {
      addResult('passed', 'CORS Configuration', 'CORS headers present for Expo Web');
      return true;
    }
    addResult('warnings', 'CORS Configuration', 'CORS headers missing');
    return false;
  } catch (error) {
    addResult('failed', 'CORS Configuration', error.message);
    return false;
  }
}

// Test 3: Authentication Endpoint
async function testAuthEndpoints() {
  try {
    // Test invalid login (should return validation error)
    const response = await axios.post(`${BACKEND_URL}/auth/login`, 
      { email: 'test', password: '' },
      { timeout: TIMEOUT, validateStatus: () => true }
    );
    
    if (response.status === 422) {
      addResult('passed', 'Auth Validation', 'Auth endpoints validating input correctly');
      return true;
    }
    addResult('warnings', 'Auth Validation', `Unexpected status: ${response.status}`);
    return false;
  } catch (error) {
    addResult('failed', 'Auth Validation', error.message);
    return false;
  }
}

// Test 4: Protected Routes
async function testProtectedRoutes() {
  try {
    const response = await axios.get(`${BACKEND_URL}/auth/me`, {
      timeout: TIMEOUT,
      validateStatus: () => true
    });
    
    if (response.status === 401 && response.data.message === 'No token provided') {
      addResult('passed', 'Protected Routes', 'JWT middleware working correctly');
      return true;
    }
    addResult('failed', 'Protected Routes', 'Unexpected auth behavior');
    return false;
  } catch (error) {
    addResult('failed', 'Protected Routes', error.message);
    return false;
  }
}

// Test 5: Frontend Service Files
async function testFrontendServices() {
  const serviceFiles = [
    'src/services/api/client.ts',
    'src/services/api/auth.service.ts',
    'src/services/api/posts.service.ts',
    'src/services/api/challenges.service.ts',
    'src/services/api/channels.service.ts',
    'src/services/api/blogs.service.ts',
    'src/services/api/showcase.service.ts',
    'src/services/api/tracker.service.ts',
    'src/services/api/live.service.ts'
  ];
  
  let allExist = true;
  const missing = [];
  
  for (const file of serviceFiles) {
    if (!fs.existsSync(file)) {
      allExist = false;
      missing.push(file);
    }
  }
  
  if (allExist) {
    addResult('passed', 'Frontend Services', 'All API service files present');
    return true;
  } else {
    addResult('warnings', 'Frontend Services', `Missing files: ${missing.join(', ')}`);
    return false;
  }
}

// Test 6: API Client Configuration
async function testAPIClientConfig() {
  try {
    const clientFile = fs.readFileSync('src/services/api/client.ts', 'utf8');
    
    // Check for proper imports
    if (!clientFile.includes('axios') || !clientFile.includes('AsyncStorage')) {
      addResult('failed', 'API Client Config', 'Missing required imports');
      return false;
    }
    
    // Check for interceptors
    if (!clientFile.includes('interceptors.request') || !clientFile.includes('interceptors.response')) {
      addResult('warnings', 'API Client Config', 'Missing request/response interceptors');
      return false;
    }
    
    // Check for auth token handling
    if (!clientFile.includes('Authorization') && !clientFile.includes('Bearer')) {
      addResult('failed', 'API Client Config', 'No JWT token handling found');
      return false;
    }
    
    addResult('passed', 'API Client Config', 'Client properly configured');
    return true;
  } catch (error) {
    addResult('failed', 'API Client Config', error.message);
    return false;
  }
}

// Test 7: Environment Variables
async function testEnvironmentConfig() {
  const requiredEnvVars = ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_FIREBASE_API_KEY'];
  const envContent = fs.readFileSync('.env', 'utf8');
  const missing = [];
  
  for (const varName of requiredEnvVars) {
    if (!envContent.includes(varName)) {
      missing.push(varName);
    }
  }
  
  if (missing.length === 0) {
    addResult('passed', 'Environment Config', 'All required env vars present');
    return true;
  } else {
    addResult('failed', 'Environment Config', `Missing: ${missing.join(', ')}`);
    return false;
  }
}

// Test 8: Backend Routes Check
async function testBackendRoutes() {
  const criticalRoutes = [
    '/health',
    '/auth/login',
    '/auth/register',
    '/posts/feed',
    '/challenges',
    '/workouts',
    '/marketplace/products',
    '/channels'
  ];
  
  let passCount = 0;
  
  for (const route of criticalRoutes) {
    try {
      const response = await axios.get(`${BACKEND_URL}${route}`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // 200, 401, or 422 are all acceptable (means route exists)
      if ([200, 401, 422].includes(response.status)) {
        passCount++;
      }
    } catch (error) {
      // Route might not exist or server error
    }
  }
  
  if (passCount === criticalRoutes.length) {
    addResult('passed', 'Backend Routes', `All ${criticalRoutes.length} critical routes responding`);
    return true;
  } else if (passCount > criticalRoutes.length / 2) {
    addResult('warnings', 'Backend Routes', `${passCount}/${criticalRoutes.length} routes responding`);
    return false;
  } else {
    addResult('failed', 'Backend Routes', `Only ${passCount}/${criticalRoutes.length} routes responding`);
    return false;
  }
}

// Test 9: TypeScript Types Check
async function testTypeScriptTypes() {
  try {
    const typesFile = fs.readFileSync('src/types/api.ts', 'utf8');
    
    if (typesFile.length < 100) {
      addResult('warnings', 'TypeScript Types', 'Types file seems incomplete');
      return false;
    }
    
    addResult('passed', 'TypeScript Types', 'API types defined');
    return true;
  } catch (error) {
    addResult('failed', 'TypeScript Types', 'Cannot read types file');
    return false;
  }
}

// Test 10: Check for Common Issues
async function testCommonIssues() {
  const issues = [];
  
  // Check if localhost is used instead of LAN IP
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('localhost:3001') || envContent.includes('127.0.0.1:3001')) {
    issues.push('API_URL uses localhost - won\'t work on physical devices');
  }
  
  // Check client timeout
  const clientFile = fs.readFileSync('src/services/api/client.ts', 'utf8');
  if (!clientFile.includes('timeout')) {
    issues.push('No timeout configured in API client');
  }
  
  if (issues.length === 0) {
    addResult('passed', 'Common Issues Check', 'No common configuration issues found');
    return true;
  } else {
    addResult('warnings', 'Common Issues Check', issues.join('; '));
    return false;
  }
}

// Run all tests
async function runAllTests() {
  log('\n='.repeat(60), 'blue');
  log('TEAMCAL CONNECTIVITY TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');
  log(`Backend URL: ${BACKEND_URL}\n`, 'blue');
  
  const tests = [
    { name: 'Backend Health Check', fn: testBackendHealth },
    { name: 'CORS Configuration', fn: testCORS },
    { name: 'Authentication Endpoints', fn: testAuthEndpoints },
    { name: 'Protected Routes', fn: testProtectedRoutes },
    { name: 'Frontend Service Files', fn: testFrontendServices },
    { name: 'API Client Configuration', fn: testAPIClientConfig },
    { name: 'Environment Configuration', fn: testEnvironmentConfig },
    { name: 'Backend Routes', fn: testBackendRoutes },
    { name: 'TypeScript Types', fn: testTypeScriptTypes },
    { name: 'Common Issues', fn: testCommonIssues }
  ];
  
  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    const result = await test.fn();
    log(result ? '✓ PASS' : '✗ FAIL', result ? 'green' : 'red');
  }
  
  // Print summary
  log('\n' + '='.repeat(60), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  log(`\n✓ Passed: ${results.passed.length}`, 'green');
  if (results.passed.length > 0) {
    results.passed.forEach(r => log(`  - ${r.test}: ${r.details}`, 'green'));
  }
  
  log(`\n⚠ Warnings: ${results.warnings.length}`, 'yellow');
  if (results.warnings.length > 0) {
    results.warnings.forEach(r => log(`  - ${r.test}: ${r.details}`, 'yellow'));
  }
  
  log(`\n✗ Failed: ${results.failed.length}`, 'red');
  if (results.failed.length > 0) {
    results.failed.forEach(r => log(`  - ${r.test}: ${r.details}`, 'red'));
  }
  
  // Overall status
  log('\n' + '='.repeat(60), 'blue');
  const totalTests = results.passed.length + results.warnings.length + results.failed.length;
  const passRate = (results.passed.length / totalTests * 100).toFixed(1);
  
  if (results.failed.length === 0) {
    log(`\n✓ ALL CRITICAL TESTS PASSED (${passRate}% success rate)`, 'green');
    log('Frontend and backend are properly connected!\n', 'green');
  } else {
    log(`\n✗ ${results.failed.length} CRITICAL ISSUES FOUND`, 'red');
    log('Please fix the failed tests before deploying.\n', 'red');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    backendUrl: BACKEND_URL,
    summary: {
      total: totalTests,
      passed: results.passed.length,
      warnings: results.warnings.length,
      failed: results.failed.length,
      passRate: `${passRate}%`
    },
    results
  };
  
  fs.writeFileSync('connectivity-test-report.json', JSON.stringify(report, null, 2));
  log('Detailed report saved to: connectivity-test-report.json', 'blue');
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
