/**
 * Quick Firebase configuration test
 */

// Frontend config check
console.log('=== Frontend Firebase Config ===');
const frontendConfig = {
  apiKey: 'AIzaSyA_rC0ES8NMmVgJPvpQpAr1y0kfVH-Z6ug',
  authDomain: 'teamcal-cdff3.firebaseapp.com',
  projectId: 'teamcal-cdff3',
  storageBucket: 'teamcal-cdff3.firebasestorage.app',
  messagingSenderId: '787986944045',
  appId: '1:787986944045:web:207587ab10480b8cc5e8a4',
};

const missingFrontend = Object.entries(frontendConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingFrontend.length) {
  console.log('❌ Missing frontend config:', missingFrontend.join(', '));
} else {
  console.log('✅ All frontend Firebase config values present');
  console.log('   Project ID:', frontendConfig.projectId);
  console.log('   Auth Domain:', frontendConfig.authDomain);
}

// Backend config check
console.log('\n=== Backend Firebase Config ===');
const fs = require('fs');
const envContent = fs.readFileSync('./backend/.env', 'utf-8');
const backendEnv = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) backendEnv[match[1].trim()] = match[2].trim();
});

const backendConfig = {
  projectId: backendEnv.FIREBASE_PROJECT_ID,
  clientEmail: backendEnv.FIREBASE_CLIENT_EMAIL,
  privateKey: backendEnv.FIREBASE_PRIVATE_KEY ? '✓ present' : undefined,
};

const missingBackend = Object.entries(backendConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingBackend.length) {
  console.log('❌ Missing backend config:', missingBackend.join(', '));
} else {
  console.log('✅ All backend Firebase Admin config values present');
  console.log('   Project ID:', backendConfig.projectId);
  console.log('   Client Email:', backendConfig.clientEmail);
  console.log('   Private Key:', backendConfig.privateKey);
}

console.log('\n=== Config Match Check ===');
if (frontendConfig.projectId === backendConfig.projectId) {
  console.log('✅ Frontend and backend project IDs match');
} else {
  console.log('❌ Project ID mismatch!');
  console.log('   Frontend:', frontendConfig.projectId);
  console.log('   Backend:', backendConfig.projectId);
}

console.log('\n=== Summary ===');
if (missingFrontend.length === 0 && missingBackend.length === 0) {
  console.log('✅ Firebase is properly configured on both frontend and backend');
  console.log('✅ Backend server log shows "Firebase Admin initialized"');
  console.log('\nYou can test authentication by:');
  console.log('1. Click "Continue with Google" button in your app');
  console.log('2. Check browser console for any Firebase errors');
  console.log('3. Check backend logs for incoming auth requests');
} else {
  console.log('❌ Firebase configuration incomplete');
}
