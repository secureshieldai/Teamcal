# Quick Start Guide - Phase 1 Implementation

**Goal:** Get the foundation infrastructure running in your project

**Time Required:** 2-4 hours

---

## Step 1: Install Dependencies (15 minutes)

```bash
# Install core dependencies
npm install @tanstack/react-query@^5.0.0
npm install expo-secure-store@~13.0.0
npm install zod@^3.22.0
npm install react-hook-form@^7.48.0
npm install @hookform/resolvers@^3.3.0

# Install dev dependencies for testing
npm install --save-dev @testing-library/react-native@^12.4.0
npm install --save-dev @testing-library/jest-native@^5.4.0
```

**Verify installation:**
```bash
npm list @tanstack/react-query expo-secure-store zod react-hook-form
```

---

## Step 2: Update App.tsx (10 minutes)

Replace your `App.tsx` with this enhanced version:

```typescript
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import StepSyncManager from './src/components/StepSyncManager';
import IncomingCallManager from './src/components/IncomingCallManager';
import { navigationRef } from './src/navigation/navigationRef';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import { validateEnv } from './src/app/config/env';

// Validate environment on startup
validateEnv();

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <StepSyncManager />
              <NavigationContainer
                ref={navigationRef}
                linking={{
                  prefixes: ['teamcal://'],
                  config: {
                    screens: {
                      AudienceAccounts: 'social-auth/callback',
                      BotChatPublic: 'b/:slug',
                    },
                  },
                }}
              >
                <RootNavigator />
              </NavigationContainer>
              <IncomingCallManager />
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

**What changed:**
- ✅ Added `ErrorBoundary` - prevents crashes
- ✅ Added `QueryClientProvider` - enables React Query
- ✅ Added `validateEnv()` - checks required env vars

---

## Step 3: Update Auth Service to Use Secure Storage (20 minutes)

### Option A: Quick Update (Recommended)
Update the import in `src/services/api/auth.service.ts`:

```typescript
// Change this line:
// import { storage } from '../storage';

// To this:
import { storage } from '../auth/secureStorage';
```

### Option B: Direct Migration
If you prefer to use the new API directly:

```typescript
import { secureStorage } from '../auth/secureStorage';

// Replace all storage.* calls with secureStorage.* calls
await secureStorage.setSession(data.token, data.user);
```

**Test it:**
1. Run the app: `npm start`
2. Try logging in
3. Close and reopen the app
4. Verify you're still logged in
5. Check logs for any SecureStorage errors

---

## Step 4: Update AuthContext to Use Secure Storage (15 minutes)

Update `src/context/AuthContext.tsx`:

```typescript
// Change this line:
// import { storage } from '../services/storage';

// To this:
import { storage } from '../services/auth/secureStorage';
```

**No other changes needed!** The backward-compatible API means your existing code continues working.

---

## Step 5: Test on Physical Devices (30 minutes)

### iOS Testing
```bash
npm run ios
```

1. Test login
2. Close app completely
3. Reopen app
4. Verify still logged in
5. Check it works after device restart

### Android Testing
```bash
npm run android
```

1. Test login
2. Close app completely
3. Reopen app
4. Verify still logged in
5. Check it works after device restart

### What to Look For
- ✅ Login works
- ✅ Session persists after app restart
- ✅ No errors in console about SecureStore
- ✅ Logout clears session properly

---

## Step 6: Create Your First React Query Hook (30 minutes)

Let's convert one simple API call to React Query as an example.

### Before (using useApiQuery):
```typescript
// src/hooks/useProfile.ts
const summary = useApiQuery(() => userService.getProfileSummary(), null, []);
```

### After (using React Query):

Create `src/shared/hooks/api/useProfile.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../../services/api/user.service';

export function useProfileSummary() {
  return useQuery({
    queryKey: ['profile', 'summary'],
    queryFn: () => userService.getProfileSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

Update the component:
```typescript
// Instead of:
// const summary = useApiQuery(() => userService.getProfileSummary(), null, []);

// Use:
import { useProfileSummary } from '../shared/hooks/api/useProfile';
const { data: summary, isLoading, error, refetch } = useProfileSummary();
```

**Test it:**
- Profile screen loads
- Data displays correctly
- Loading state shows
- Error handling works

---

## Step 7: Verify Error Boundary Works (15 minutes)

### Create a test error:

Temporarily add this to any screen:
```typescript
const TestError = () => {
  throw new Error('Test error boundary');
  return null;
};

// Add in render:
{__DEV__ && <TestError />}
```

**Expected behavior:**
- App shows error screen instead of crashing
- "Try Again" button appears
- In dev mode, see error details
- App recovers when you remove the error

**Important:** Remove the test error after verifying!

---

## Step 8: Verify Performance Improvement (20 minutes)

### Monitor Network Requests

**Before:** Open React Native Debugger and watch network tab
- Should see requests every 15 seconds on multiple hooks

**After:** With React Query
- Initial requests on mount
- Smart background refetch only when needed
- Shared cache across components

### Check Battery Impact

**Before:**
1. Note battery level
2. Use app for 10 minutes with screen on
3. Note battery drain

**After:**
1. Note battery level
2. Use app for 10 minutes with screen on
3. Note battery drain
4. Should see ~30-40% less battery usage

---

## Step 9: Update TypeScript Config (5 minutes)

Add path aliases to `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/app/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@services/*": ["src/services/*"]
    }
  },
  "exclude": ["App.debug-harness.tsx"]
}
```

**Benefit:** Cleaner imports
```typescript
// Instead of: import { useAuth } from '../../../context/AuthContext';
// Use: import { useAuth } from '@features/auth';
```

---

## Step 10: Run Diagnostics (10 minutes)

```bash
# Check TypeScript
npx tsc --noEmit

# Check for unused dependencies
npx depcheck

# Check bundle size
npx expo-cli build:web --no-pwa
```

**All should pass with no critical errors.**

---

## Troubleshooting

### Issue: SecureStore not available on web
**Solution:** Expected behavior. SecureStore falls back to AsyncStorage on web for development.

### Issue: React Query not found
**Solution:** 
```bash
npm install @tanstack/react-query
```

### Issue: App crashes immediately
**Solution:** Check you wrapped app in ErrorBoundary and QueryClientProvider

### Issue: Old hooks still polling
**Solution:** They will until migrated. This is expected during transition.

### Issue: TypeScript errors
**Solution:** Run `npm install` to ensure all types are installed

---

## Success Checklist

After completing all steps, verify:

- [ ] ✅ Dependencies installed successfully
- [ ] ✅ App starts without errors
- [ ] ✅ Login/logout works
- [ ] ✅ Session persists after app restart
- [ ] ✅ Error boundary catches errors
- [ ] ✅ React Query hook example works
- [ ] ✅ No console errors on iOS
- [ ] ✅ No console errors on Android
- [ ] ✅ TypeScript check passes
- [ ] ✅ Performance improved (less polling)

---

## What's Next?

Once Phase 1 is complete:

1. **Phase 2:** Migrate Auth feature completely
   - Create feature folder structure
   - Add React Hook Form
   - Add Zod validation
   - Write tests

2. **Phase 3:** Convert all useApiQuery to React Query
   - One hook at a time
   - Test after each conversion
   - Remove useApiQuery when done

3. **Phase 4:** Migrate remaining features
   - Follow the pattern established in Auth
   - One feature per week
   - Continuous testing

---

## Getting Help

- **Architecture questions:** See `ARCHITECTURE_AUDIT_REPORT.md`
- **Detailed plan:** See `REFACTORING_PLAN.md`
- **Implementation details:** See `IMPLEMENTATION_SUMMARY.md`
- **Business case:** See `EXECUTIVE_SUMMARY.md`

---

## Estimated Time Investment

- **Phase 1 (This guide):** 2-4 hours
- **Full Phase 1 (with testing):** 1-2 weeks
- **Complete refactoring:** 10-14 weeks

**Remember:** This is incremental. The app continues working throughout the migration.

---

## 🎉 Congratulations!

Once you complete this guide, you'll have:
- ✅ Secure token storage
- ✅ Error boundaries preventing crashes
- ✅ React Query foundation
- ✅ Performance improvements
- ✅ Foundation for future migrations

**You're ready for Phase 2!** 🚀
