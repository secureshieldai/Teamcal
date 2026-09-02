# TeamCal Architecture Refactoring Plan

## Target Architecture

### Feature-Based Modular Architecture

```
src/
├── app/                          # App-level configuration
│   ├── config/                   # Environment, constants
│   ├── navigation/               # Root navigation setup
│   ├── providers/                # Global providers wrapper
│   └── bootstrap/                # App initialization
│
├── features/                     # Feature modules (by domain)
│   ├── auth/
│   │   ├── api/                  # Auth API calls
│   │   ├── components/           # Auth-specific components
│   │   ├── hooks/                # Auth hooks
│   │   ├── screens/              # Auth screens
│   │   ├── store/                # Auth state (if needed)
│   │   ├── types/                # Auth types
│   │   ├── utils/                # Auth utilities
│   │   └── index.ts              # Public API
│   │
│   ├── home/                     # Home feature
│   ├── profile/                  # Profile feature
│   ├── social/                   # Social features
│   ├── health/                   # Health tracking
│   │   ├── fasting/
│   │   ├── water/
│   │   ├── steps/
│   │   ├── sleep/
│   │   ├── weight/
│   │   └── supplements/
│   ├── fitness/                  # Fitness features
│   │   ├── workouts/
│   │   ├── challenges/
│   │   └── progress/
│   ├── nutrition/                # Nutrition features
│   │   ├── meals/
│   │   ├── recipes/
│   │   └── meal-planner/
│   ├── community/                # Community features
│   │   ├── groups/
│   │   ├── channels/
│   │   ├── posts/
│   │   └── messaging/
│   ├── earn/                     # Monetization features
│   │   ├── marketplace/
│   │   ├── memberships/
│   │   ├── content/
│   │   └── store/
│   └── settings/                 # Settings & preferences
│
├── shared/                       # Shared across features
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Base UI (Button, Input, etc.)
│   │   ├── layout/               # Layout components
│   │   ├── feedback/             # Loading, Error, Empty states
│   │   └── forms/                # Form components
│   ├── hooks/                    # Shared hooks
│   ├── utils/                    # Utility functions
│   ├── constants/                # App constants
│   ├── types/                    # Shared types
│   └── validation/               # Validation schemas
│
├── services/                     # External services
│   ├── api/                      # API client & services
│   │   ├── client.ts             # Axios configuration
│   │   ├── interceptors.ts       # Request/response handling
│   │   ├── types.ts              # API types
│   │   └── endpoints/            # API endpoints by domain
│   ├── auth/                     # Auth service (secure storage)
│   ├── storage/                  # Local storage abstraction
│   ├── analytics/                # Analytics service
│   ├── notifications/            # Push notifications
│   ├── realtime/                 # WebSocket/realtime
│   └── platform/                 # Platform-specific APIs
│
├── store/                        # Global state (if needed)
│   ├── slices/                   # State slices
│   └── index.ts                  # Store configuration
│
├── theme/                        # Design system
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
│
└── assets/                       # Static assets
    ├── images/
    ├── fonts/
    └── animations/
```

---

## Phase 1: Foundation Setup (Critical Path)

### 1.1 Install Core Dependencies

```bash
npm install @tanstack/react-query expo-secure-store zod react-hook-form
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

### 1.2 Create App Configuration

**Files to Create:**
- `src/app/config/env.ts` - Environment variables
- `src/app/config/constants.ts` - App constants
- `src/app/config/api.config.ts` - API configuration
- `src/app/providers/AppProviders.tsx` - Centralized providers

### 1.3 Implement Secure Storage

**Replace:** `src/services/storage.ts`  
**With:** `src/services/auth/secureStorage.ts`  
**Change:** AsyncStorage → SecureStore for tokens

### 1.4 Set Up React Query

**Create:**
- `src/app/providers/QueryProvider.tsx`
- `src/shared/hooks/useQuery.ts` - Typed React Query hooks
- `src/shared/hooks/useMutation.ts` - Typed mutation hooks

### 1.5 Error Boundaries

**Create:**
- `src/shared/components/ErrorBoundary.tsx`
- `src/shared/components/feedback/ErrorFallback.tsx`

### 1.6 Testing Setup

**Create:**
- `jest.config.js`
- `jest.setup.js`
- `__tests__/setup.ts`

---

## Phase 2: Auth Feature Migration (Pilot)

**Why Auth First?**
- Critical foundation
- Isolated domain
- Tests migration pattern
- Lower risk

### 2.1 Create Auth Feature Structure

```
src/features/auth/
├── api/
│   └── auth.api.ts           # React Query hooks for auth
├── components/
│   ├── AuthButton.tsx        # Move from src/components/auth/
│   ├── AuthLayout.tsx
│   ├── AuthTextField.tsx
│   ├── OrDivider.tsx
│   ├── OtpInput.tsx
│   └── SocialButton.tsx
├── hooks/
│   ├── useAuth.ts            # Replace context consumer
│   ├── useAuthForm.ts        # Form logic with React Hook Form
│   └── useAuthValidation.ts  # Zod schemas
├── screens/
│   ├── LoginScreen.tsx       # Refactored
│   ├── SignUpScreen.tsx      # Refactored
│   ├── ForgotPasswordScreen.tsx
│   ├── VerifyCodeScreen.tsx
│   └── ResetPasswordScreen.tsx
├── store/
│   └── authStore.ts          # Replace AuthContext
├── types/
│   └── auth.types.ts         # Auth-specific types
├── utils/
│   └── auth.utils.ts         # Auth utilities
└── index.ts                  # Public exports
```

### 2.2 Migration Steps

1. **Create new auth API with React Query**
```typescript
// src/features/auth/api/auth.api.ts
export const useLogin = () => useMutation(...)
export const useRegister = () => useMutation(...)
export const useLogout = () => useMutation(...)
```

2. **Create auth store** (lightweight, not everything needs global state)
```typescript
// src/features/auth/store/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({...}))
```

3. **Migrate screens one by one**
4. **Add tests for each screen**
5. **Remove old code only after verification**

---

## Phase 3: API Layer Refactoring

### 3.1 Enhanced API Client

**Create:** `src/services/api/client/`
```
client/
├── axios.config.ts           # Base axios instance
├── interceptors/
│   ├── auth.interceptor.ts   # Token handling
│   ├── retry.interceptor.ts  # Retry logic
│   ├── error.interceptor.ts  # Error normalization
│   └── logger.interceptor.ts # Request logging
├── types.ts                  # API types
└── index.ts
```

### 3.2 React Query Integration

**Replace all** `useApiQuery` usage with React Query:

```typescript
// Before
const data = useApiQuery(() => api.getSomething(), initialData, [deps]);

// After
const { data, isLoading, error } = useQuery({
  queryKey: ['something', deps],
  queryFn: api.getSomething,
});
```

### 3.3 API Service Migration

For each existing service in `src/services/api/`:
1. Keep the service file (API calls)
2. Create corresponding React Query hooks in feature folders
3. Remove `useApiQuery` usage
4. Add proper cache invalidation

---

## Phase 4: Feature Migration Strategy

### 4.1 Priority Order

1. ✅ **Auth** (completed in Phase 2)
2. **Home** - High traffic, relatively simple
3. **Profile** - Isolated, well-defined
4. **Health Tracking** (water, steps, fasting, sleep, weight)
5. **Social** (posts, comments, messaging)
6. **Fitness** (workouts, challenges)
7. **Nutrition** (meals, recipes, meal planner)
8. **Community** (groups, channels)
9. **Earn** (marketplace, content, memberships)
10. **Settings** - Last, rarely changes

### 4.2 Per-Feature Migration Checklist

For each feature:
- [ ] Create feature folder structure
- [ ] Move/refactor components
- [ ] Create React Query hooks
- [ ] Migrate screens
- [ ] Extract business logic from screens
- [ ] Add validation schemas (Zod)
- [ ] Add form handling (React Hook Form)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update navigation
- [ ] Remove old code
- [ ] Update documentation

---

## Phase 5: Navigation Refactoring

### 5.1 Split Navigation

```typescript
// src/app/navigation/
├── RootNavigator.tsx         # App entry point
├── AuthNavigator.tsx         # Auth flow
├── AppNavigator.tsx          # Main app (tabs + stacks)
├── types.ts                  # Navigation types
└── linking.ts                # Deep linking config

// Feature navigators
src/features/*/navigation/
├── [Feature]Navigator.tsx
└── types.ts
```

### 5.2 Navigation Pattern

```typescript
// RootNavigator.tsx
export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <SplashScreen />;
  
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}
```

---

## Phase 6: Form & Validation

### 6.1 Validation Schemas

Create Zod schemas for all forms:

```typescript
// src/features/auth/validation/schemas.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

### 6.2 Form Hook Pattern

```typescript
// src/features/auth/hooks/useAuthForm.ts
export const useLoginForm = () => {
  return useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
};
```

---

## Phase 7: Testing Infrastructure

### 7.1 Test Structure

```
__tests__/
├── unit/
│   ├── hooks/
│   ├── utils/
│   └── services/
├── integration/
│   ├── features/
│   └── flows/
└── e2e/
    └── critical-paths/
```

### 7.2 Testing Strategy

- **Unit tests:** Hooks, utilities, business logic
- **Integration tests:** Feature flows
- **E2E tests:** Critical user journeys

---

## Phase 8: Performance Optimization

### 8.1 Code Splitting

- Lazy load feature navigators
- Dynamic imports for heavy screens
- Image lazy loading

### 8.2 React Query Optimization

- Proper staleTime configuration
- Background refetch strategy
- Prefetching critical data

### 8.3 Memoization

- Use React.memo strategically
- useMemo for expensive computations
- useCallback for stable references

---

## Phase 9: Security Hardening

### 9.1 Secure Storage

- [x] Use expo-secure-store for tokens
- [ ] Implement biometric authentication
- [ ] Add token encryption layer

### 9.2 Token Management

- [ ] Implement refresh token flow
- [ ] Add token expiration handling
- [ ] Implement automatic retry on 401

### 9.3 API Security

- [ ] Request signing
- [ ] Rate limiting handling
- [ ] Certificate pinning (if needed)

---

## Phase 10: Developer Experience

### 10.1 Documentation

- [ ] Architecture documentation
- [ ] Component documentation (Storybook?)
- [ ] API documentation
- [ ] Onboarding guide

### 10.2 Code Generation

- [ ] Screen templates
- [ ] Feature templates
- [ ] Component templates

### 10.3 Development Tools

- [ ] ESLint configuration
- [ ] Prettier configuration
- [ ] Husky pre-commit hooks
- [ ] VSCode snippets

---

## Migration Rules

### DO:
✅ Migrate incrementally, feature by feature  
✅ Keep old and new code running in parallel  
✅ Test thoroughly before removing old code  
✅ Maintain functionality throughout migration  
✅ Document patterns as you go  
✅ Get team buy-in at each phase  

### DON'T:
❌ Rewrite everything at once  
❌ Remove old code before new code is verified  
❌ Change functionality during migration  
❌ Skip testing  
❌ Change the UI/UX  
❌ Modify backend APIs unless absolutely necessary  

---

## Success Criteria

### Phase Completion Criteria

Each phase is complete when:
1. All planned refactoring is done
2. All tests pass
3. No functionality is broken
4. Code review completed
5. Documentation updated
6. Team trained on new patterns

### Overall Success Metrics

- ✅ Zero functionality lost
- ✅ All existing features work
- ✅ Test coverage > 70%
- ✅ Performance improved or maintained
- ✅ Developer productivity increased
- ✅ Easier to onboard new developers
- ✅ Faster feature development

---

## Timeline Estimate

- **Phase 1:** 1-2 weeks (Foundation)
- **Phase 2:** 1 week (Auth migration - pilot)
- **Phase 3:** 1 week (API refactoring)
- **Phase 4:** 4-6 weeks (Feature migration)
- **Phase 5:** 1 week (Navigation refactoring)
- **Phase 6:** 1 week (Forms & validation)
- **Phase 7:** Ongoing (Testing)
- **Phase 8:** 1 week (Performance)
- **Phase 9:** 1 week (Security)
- **Phase 10:** Ongoing (DX improvements)

**Total:** 10-14 weeks for complete migration

---

## Next Steps

1. Review this plan with the team
2. Get stakeholder approval
3. Begin Phase 1: Foundation setup
4. Implement pilot migration (Auth feature)
5. Evaluate and adjust based on pilot results
6. Continue with full migration

---

**Note:** This is a living document. Update as the migration progresses and new insights emerge.
