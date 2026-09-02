/**
 * Phase 1 Verification Script
 * Checks that all Phase 1 changes are properly integrated
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    checks.passed.push(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    checks.failed.push(`❌ ${description}: ${filePath} NOT FOUND`);
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  if (!fs.existsSync(filePath)) {
    checks.failed.push(`❌ ${description}: ${filePath} NOT FOUND`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchString)) {
    checks.passed.push(`✅ ${description}`);
    return true;
  } else {
    checks.failed.push(`❌ ${description}: Not found in ${filePath}`);
    return false;
  }
}

function checkDependency(packageName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps[packageName]) {
      checks.passed.push(`✅ Dependency installed: ${packageName}@${deps[packageName]}`);
      return true;
    } else {
      checks.failed.push(`❌ Missing dependency: ${packageName}`);
      return false;
    }
  } catch (error) {
    checks.failed.push(`❌ Could not read package.json: ${error.message}`);
    return false;
  }
}

console.log('=========================================');
console.log('Phase 1 Verification');
console.log('=========================================\n');

// Check new files created
console.log('Checking new architecture files...\n');
checkFile('src/app/config/env.ts', 'Environment config');
checkFile('src/app/config/constants.ts', 'Constants config');
checkFile('src/app/config/api.config.ts', 'API config');
checkFile('src/services/auth/secureStorage.ts', 'Secure storage service');
checkFile('src/shared/components/ErrorBoundary.tsx', 'Error boundary component');
checkFile('src/shared/components/feedback/ErrorFallback.tsx', 'Error fallback components');
checkFile('src/app/providers/AppProviders.tsx', 'App providers wrapper');
checkFile('src/shared/hooks/api/useNotifications.ts', 'React Query example hook');

// Check integration in existing files
console.log('\nChecking integrations...\n');
checkFileContains('App.tsx', 'AppProviders', 'App.tsx uses AppProviders');
checkFileContains('App.tsx', 'import { AppProviders }', 'App.tsx imports AppProviders');
checkFileContains('src/context/AuthContext.tsx', 'services/auth/secureStorage', 'AuthContext uses secure storage');
checkFileContains('src/services/api/auth.service.ts', 'services/auth/secureStorage', 'auth.service uses secure storage');
checkFileContains('src/services/api/client.ts', 'app/config/env', 'API client uses centralized config');
checkFileContains('tsconfig.json', '@app/*', 'TypeScript path aliases configured');

// Check dependencies
console.log('\nChecking dependencies...\n');
checkDependency('@tanstack/react-query');
checkDependency('expo-secure-store');
checkDependency('zod');
checkDependency('react-hook-form');
checkDependency('@hookform/resolvers');

// Check documentation
console.log('\nChecking documentation...\n');
checkFile('ARCHITECTURE_AUDIT_REPORT.md', 'Architecture audit report');
checkFile('REFACTORING_PLAN.md', 'Refactoring plan');
checkFile('EXECUTIVE_SUMMARY.md', 'Executive summary');
checkFile('QUICK_START_GUIDE.md', 'Quick start guide');
checkFile('INTEGRATION_CHECKLIST.md', 'Integration checklist');

// Print results
console.log('\n=========================================');
console.log('Results');
console.log('=========================================\n');

if (checks.passed.length > 0) {
  console.log(`✅ PASSED (${checks.passed.length}):\n`);
  checks.passed.forEach(check => console.log(`  ${check}`));
  console.log('');
}

if (checks.warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${checks.warnings.length}):\n`);
  checks.warnings.forEach(check => console.log(`  ${check}`));
  console.log('');
}

if (checks.failed.length > 0) {
  console.log(`❌ FAILED (${checks.failed.length}):\n`);
  checks.failed.forEach(check => console.log(`  ${check}`));
  console.log('');
}

// Summary
console.log('=========================================');
const total = checks.passed.length + checks.failed.length + checks.warnings.length;
const passRate = ((checks.passed.length / total) * 100).toFixed(1);
console.log(`Total Checks: ${total}`);
console.log(`Pass Rate: ${passRate}%`);
console.log('=========================================\n');

if (checks.failed.length === 0) {
  console.log('🎉 Phase 1 Integration Complete!\n');
  console.log('Next steps:');
  console.log('1. Run: npm start');
  console.log('2. Test authentication flow');
  console.log('3. Verify no console errors');
  console.log('4. Start Phase 2: Auth feature migration\n');
  process.exit(0);
} else {
  console.log('⚠️  Phase 1 Integration Incomplete\n');
  console.log('Please fix the failed checks above and run this script again.\n');
  console.log('For help, see:');
  console.log('- QUICK_START_GUIDE.md');
  console.log('- INTEGRATION_CHECKLIST.md\n');
  process.exit(1);
}
