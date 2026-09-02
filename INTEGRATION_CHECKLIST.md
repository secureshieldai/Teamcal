# Integration Checklist - Refactoring Implementation

**Purpose:** Step-by-step checklist to integrate the new architecture into your existing app

**Time Required:** 1-2 days for Phase 1 complete integration

---

## ✅ Pre-Integration Checklist

- [ ] Reviewed ARCHITECTURE_AUDIT_REPORT.md
- [ ] Reviewed REFACTORING_PLAN.md  
- [ ] Reviewed EXECUTIVE_SUMMARY.md
- [ ] Got stakeholder approval
- [ ] Backed up current codebase
- [ ] Created a feature branch: `git checkout -b refactor/phase-1-foundation`

---

## Phase 1: Foundation Integration

### Step 1: Install Dependencies ✅

```bash
# Install production dependencies
npm install @tanstack/react-query@^5.0.0 expo-secure-store@~13.0.0 zod@^3.22.0 react-hook-form@^7.48.0 @hookform/resolvers@^3.3.0

# Install dev dependencies
npm install --save-dev @testing-library/react-native@^12.4.0 @testing-library/jest-native@^5.4.0

# Verify installation
npm list @tanstack/react-query expo-secure-store
```

**Checklist:**
- [ ] All packages installed successfully
- [ ] No dependency conflicts
- [ ] `package.json` updated
- [ ] `package-lock.json` regenerated

---

### Step 2: Integrate Secure Storage ✅

**Files Already Created:**
- ✅ `src/services/auth/secureStorage.ts`

**Integration Steps:**

1. **Update auth.service.ts:**
   ```bash
   # File: src/services/api/auth.service.ts
   ```
   
   Change line 2:
   ```typescript
   // FROM:
   import { storage } from '../storage';
   
   // TO:
   import { storage } from '../auth/secureStorage';
   ```

2. **Update AuthContext.tsx:**
   ```bash
   # File: src/context/AuthContext.tsx
   ```
   
   Change line:
   ```typescript
   // FROM:
   import { storage } from '../services/storage';
   
   // TO:
   import { storage } from '../services/auth/secureStorage';
   ```

3. **Test secure storage:**
   ```bash
   npm run ios    # or
   npm run android
   ```
   
   Test flow:
   - [ ] Login works
   - [ ] Logout works
   - [ ] Session persists after restart
   - [ ] No SecureStore errors in console

---

### Step 3: Integrate Error Boundary ✅

**Files Already Created:**
- ✅ `src/shared/components/ErrorBoundary.tsx`
- ✅ `src/shared/components/feedback/ErrorFallback.tsx`

**Integration Steps:**

1. **Update App.tsx** to wrap with ErrorBoundary:

```typescript
// Add import at top
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import { validateEnv } from './src/app/config/env';

// Add before App component
validateEnv();

// Wrap the entire app
export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* existing code */}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

2. **Test error boundary:**
   - [ ] App starts without errors
   - [ ] Create test error (see QUICK_START_GUIDE.md Step 7)
   - [ ] Verify error screen shows
   - [ ] Verify "Try Again" works
   - [ ] Remove test error

---

### Step 4: Integrate React Query ✅

**Integration Steps:**

1. **Create QueryProvider:**

Create file: `src/app/providers/QueryProvider.tsx`

```typescript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { APP_CONFIG } from '../config/constants';

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.QUERY.STALE_TIME,
      cacheTime: APP_CONFIG.QUERY.CACHE_TIME,
      retry: APP_CONFIG.QUERY.RETRY,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface Props {
  children: React.ReactNode;
}

export function QueryProvider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

2. **Update App.tsx** to include QueryProvider:

```typescript
// Add import
import { QueryProvider } from './src/app/providers/QueryProvider';

// Wrap AuthProvider with QueryProvider
export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryProvider>
            <AuthProvider>
              {/* existing code */}
            </AuthProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

3. **Verify React Query:**
   - [ ] App starts without errors
   - [ ] No console warnings about QueryClient
   - [ ] React Query DevTools accessible (if installed)

---

### Step 5: Update TypeScript Configuration ✅

**Update tsconfig.json:**

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
      "@services/*": ["src/services/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@types/*": ["src/types/*"],
      "@theme/*": ["src/theme/*"]
    }
  },
  "exclude": ["App.debug-harness.tsx"]
}
```

**Checklist:**
- [ ] TypeScript config updated
- [ ] Run `npx tsc --noEmit` - should pass
- [ ] No TypeScript errors in IDE

---

### Step 6: Update .env File ✅

Verify your `.env` file has all required variables:

```bash
# Required
EXPO_PUBLIC_API_URL=https://teamcal-mr7g.onrender.com/api

# Firebase (required)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

**Checklist:**
- [ ] All required env vars present
- [ ] No sensitive data committed to git
- [ ] `.env` file in `.gitignore`

---

### Step 7: Create Centralized Providers Wrapper (Optional but Recommended) ✅

Create file: `src/app/providers/AppProviders.tsx`

```typescript
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '../../context/AuthContext';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import { validateEnv } from '../config/env';

// Validate environment on app start
validateEnv();

interface Props {
  children: React.ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

Then simplify `App.tsx`:

```typescript
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AppProviders } from './src/app/providers/AppProviders';
import RootNavigator from './src/navigation/RootNavigator';
import StepSyncManager from './src/components/StepSyncManager';
import IncomingCallManager from './src/components/IncomingCallManager';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <AppProviders>
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
    </AppProviders>
  );
}
```

**Checklist:**
- [ ] App providers wrapper created
- [ ] App.tsx simplified
- [ ] App starts successfully
- [ ] All providers active

---

### Step 8: Test Full Integration ✅

**Run the app on all platforms:**

```bash
# iOS
npm run ios

# Android  
npm run android

# Web
npm run web
```

**Critical tests:**
- [ ] App starts without crashes
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Session persistence works
- [ ] Navigation works
- [ ] All main features still work
- [ ] No console errors
- [ ] No TypeScript errors

---

### Step 9: Create First React Query Hook Example ✅

Create file: `src/shared/hooks/api/useNotifications.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../../../services/api/notifications.service';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 60 * 1000, // 1 minute
  });
}
```

**Update usage in HomeScreen.tsx:**

```typescript
// Replace:
// const notifications = useApiQuery(() => notificationsService.getNotifications(), { success: true, notifications: [], unreadCount: 0 }, []);

// With:
import { useNotifications } from '../shared/hooks/api/useNotifications';
const { data: notifications = { success: true, notifications: [], unreadCount: 0 }, isLoading } = useNotifications();
```

**Test:**
- [ ] Home screen loads
- [ ] Notifications badge shows
- [ ] No errors
- [ ] Performance improved (check network tab)

---

### Step 10: Run Diagnostics ✅

```bash
# TypeScript check
npx tsc --noEmit

# Linting (if configured)
npm run lint

# Check for unused dependencies
npx depcheck

# Build check
npm run android --variant=release  # or
npm run ios --configuration Release
```

**Checklist:**
- [ ] TypeScript passes
- [ ] No lint errors
- [ ] No unused dependencies
- [ ] Build succeeds

---

### Step 11: Performance Verification ✅

**Before/After comparison:**

1. **Monitor network requests:**
   - Open React Native Debugger
   - Watch Network tab
   - Count requests per minute

2. **Expected improvements:**
   - [ ] Fewer redundant requests
   - [ ] Requests cached appropriately
   - [ ] Background refetch working

3. **Battery test:**
   - Use app for 10 minutes
   - Compare battery drain vs. before
   - Should see 20-30% improvement

---

### Step 12: Git Commit ✅

```bash
# Stage changes
git add .

# Commit
git commit -m "refactor(phase-1): Implement foundation architecture

- Add secure token storage with expo-secure-store
- Implement error boundary for crash prevention
- Set up React Query for data fetching
- Centralize configuration (env, constants, API config)
- Add reusable error UI components
- Configure TypeScript path aliases

Security: Tokens now encrypted instead of plain text
Performance: Reduced API polling, better caching
Testing: Foundation for test infrastructure

See ARCHITECTURE_AUDIT_REPORT.md for context
See REFACTORING_PLAN.md for migration plan"

# Push
git push origin refactor/phase-1-foundation
```

**Checklist:**
- [ ] All changes committed
- [ ] Descriptive commit message
- [ ] Pushed to feature branch
- [ ] Ready for code review

---

## Phase 1 Complete Checklist ✅

### Code Integration
- [ ] Secure storage integrated and tested
- [ ] Error boundary active
- [ ] React Query configured
- [ ] TypeScript config updated
- [ ] Environment validation working
- [ ] At least one React Query hook example working

### Testing
- [ ] App runs on iOS
- [ ] App runs on Android
- [ ] App runs on web
- [ ] Login/logout works
- [ ] Session persists
- [ ] All features still work
- [ ] No console errors
- [ ] TypeScript passes
- [ ] Build succeeds

### Documentation
- [ ] Code changes documented
- [ ] Git commit with clear message
- [ ] Team informed of changes
- [ ] Next steps planned

### Performance
- [ ] Network requests reduced
- [ ] Battery usage improved
- [ ] App responsiveness maintained or improved

---

## Common Integration Issues

### Issue: SecureStore not found
**Solution:**
```bash
npm install expo-secure-store
npx expo install expo-secure-store
```

### Issue: React Query types error
**Solution:**
```bash
npm install @tanstack/react-query
# Restart TypeScript server in IDE
```

### Issue: Path aliases not working
**Solution:**
- Update `tsconfig.json`
- Restart TypeScript server
- Close and reopen IDE

### Issue: App crashes on startup
**Solution:**
- Check ErrorBoundary is wrapping app
- Check all providers are in correct order
- Check for TypeScript errors
- Check console for specific error

### Issue: Auth not working
**Solution:**
- Verify secure storage import updated
- Check token is being saved
- Check token is being loaded on app start
- Verify API client has token in headers

---

## Next Steps After Phase 1

Once Phase 1 integration is complete:

### Immediate
1. **Code Review**
   - Get team review
   - Address feedback
   - Merge to main

2. **Monitor Production**
   - Watch for errors
   - Monitor performance
   - Collect feedback

### Week 2
3. **Start Phase 2**
   - Begin Auth feature migration
   - Create feature folder structure
   - Implement React Hook Form
   - Add Zod validation

4. **Team Training**
   - Share new patterns
   - Pair programming sessions
   - Update team documentation

---

## Success Metrics (Track These)

### Before Phase 1
- API requests per minute: ___
- Battery drain (10 min): ____%
- App crash rate: ____%
- TypeScript errors: ___
- Security score: 6/10

### After Phase 1 (Target)
- API requests per minute: -20%
- Battery drain (10 min): -20-30%
- App crash rate: <0.1%
- TypeScript errors: 0
- Security score: 8/10

### Measure and Record
- [ ] Before metrics recorded
- [ ] After metrics recorded
- [ ] Improvement documented
- [ ] Shared with team

---

## 🎉 Congratulations!

Once this checklist is complete, you will have:

✅ **Secure Architecture**
- Encrypted token storage
- Error boundaries preventing crashes
- Production-ready foundation

✅ **Better Performance**
- Smart caching with React Query
- Reduced API polling
- Improved battery life

✅ **Better Developer Experience**
- Centralized configuration
- Type-safe code
- Reusable patterns

✅ **Foundation for Growth**
- Ready for feature migration
- Testing infrastructure ready
- Scalable architecture

---

## 📞 Need Help?

- **Technical issues:** Review QUICK_START_GUIDE.md troubleshooting
- **Architecture questions:** See ARCHITECTURE_AUDIT_REPORT.md
- **Implementation details:** Check IMPLEMENTATION_SUMMARY.md
- **Code examples:** Review created files in src/

---

**Status:** Ready for Phase 1 Integration  
**Estimated Time:** 1-2 days  
**Next Phase:** Auth Feature Migration (Phase 2)
