/**
 * Debug Token Flow
 * Run this to check token storage and retrieval
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function debugTokenFlow() {
  console.log('='.repeat(50));
  console.log('DEBUG: Token Flow Analysis');
  console.log('='.repeat(50));
  console.log('');

  // Check for old keys
  console.log('1. Checking for OLD keys (should be removed):');
  const oldKeys = [
    '@teamcal:auth_token',
    '@teamcal:user',
    'auth_token',
    'auth_user'
  ];

  for (const key of oldKeys) {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`   ${key}: ${value ? '❌ FOUND (should be removed!)' : '✅ Not found'}`);
    } catch (e) {
      console.log(`   ${key}: Error checking -`, e.message);
    }
  }

  console.log('');
  console.log('2. Checking for NEW keys (should exist after login):');
  const newKeys = [
    'teamcal_auth_token',
    'teamcal_user'
  ];

  for (const key of newKeys) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log(`   ${key}: ✅ Found (${value.length} chars)`);
      } else {
        console.log(`   ${key}: ⚠️  Not found (login required)`);
      }
    } catch (e) {
      console.log(`   ${key}: Error checking -`, e.message);
    }
  }

  console.log('');
  console.log('3. All AsyncStorage keys:');
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(`   Total keys: ${allKeys.length}`);
    const authRelated = allKeys.filter(k => 
      k.includes('token') || k.includes('user') || k.includes('auth') || k.includes('teamcal')
    );
    console.log(`   Auth-related keys:`);
    authRelated.forEach(k => console.log(`      - ${k}`));
  } catch (e) {
    console.log('   Error:', e.message);
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('DIAGNOSIS:');
  console.log('');
  console.log('If you see:');
  console.log('  ✅ teamcal_auth_token: Found → Token is stored correctly');
  console.log('  ⚠️  teamcal_auth_token: Not found → Need to login again');
  console.log('  ❌ Old keys found → Migration did not run properly');
  console.log('');
  console.log('To fix:');
  console.log('  1. Stop app completely');
  console.log('  2. Clear app data OR uninstall/reinstall');
  console.log('  3. Restart: npm start -- --reset-cache');
  console.log('  4. Login again');
  console.log('='.repeat(50));
}

// Only run in development
if (__DEV__) {
  debugTokenFlow().catch(console.error);
}

module.exports = { debugTokenFlow };
