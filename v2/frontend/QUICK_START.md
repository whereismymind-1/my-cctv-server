# 🚀 Frontend Production - Quick Start Guide

## Day 1: Foundation Setup

### Step 1: Install Testing Dependencies (15 min)
```bash
cd /Users/lhs/Desktop/dev/my-cctv-server/v2/frontend
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom msw
```

### Step 2: Create Vitest Configuration (10 min)
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  },
});
```

### Step 3: Create Test Setup File (5 min)
Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### Step 4: Update package.json Scripts (5 min)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Step 5: Create First Test (10 min)
Create `src/App.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

---

## Critical Path Tasks (Priority Order)

### 🔴 P0 - Do Today (4 hours)
1. **Testing Setup** ✅
2. **Error Boundaries**
   - Create `src/components/ErrorBoundary.tsx`
   - Wrap App component
   - Add error logging

3. **Basic Component Tests**
   - Test VideoPlayer
   - Test CommentOverlay
   - Test authentication flow

### 🟡 P1 - Do This Week (20 hours)
1. **File Reorganization**
   - Move to Feature-Sliced Design
   - Create barrel exports
   - Update imports

2. **Performance Quick Wins**
   - Add React.memo to components
   - Implement code splitting for routes
   - Optimize bundle size

3. **Security Basics**
   - Add input sanitization
   - Secure token storage
   - Implement CSP headers

### 🟢 P2 - Do Next Week (20 hours)
1. **Monitoring & Analytics**
   - Setup Sentry
   - Add performance monitoring
   - Track user events

2. **CI/CD Pipeline**
   - GitHub Actions setup
   - Automated testing
   - Deploy automation

3. **Documentation**
   - Component documentation
   - API integration guide
   - Deployment guide

---

## Folder Structure Migration Plan

### Step 1: Create New Structure
```bash
mkdir -p src/app/{providers,styles}
mkdir -p src/pages/{home,stream,profile}
mkdir -p src/widgets/{header,player,comment-overlay}
mkdir -p src/features/{auth,stream,comment,moderation}
mkdir -p src/entities/{user,stream,comment}
mkdir -p src/shared/{api,config,lib,hooks,ui,utils,types}
```

### Step 2: Move Files (Order Matters!)
```bash
# 1. Move shared resources first
mv src/config/* src/shared/config/
mv src/services/* src/shared/api/
mv src/hooks/* src/shared/hooks/
mv src/types/* src/shared/types/

# 2. Move features
mv src/stores/authStore.ts src/features/auth/model/
mv src/stores/streamStore.ts src/features/stream/model/

# 3. Move components
mv src/components/VideoPlayer.tsx src/widgets/player/
mv src/components/CommentOverlay.tsx src/widgets/comment-overlay/
```

### Step 3: Create Index Files
Each folder needs an `index.ts`:
```typescript
// src/features/auth/index.ts
export * from './model';
export * from './ui';
export * from './api';
```

---

## Performance Checklist

### Immediate Optimizations (1 hour)
- [ ] Add `React.memo` to pure components
- [ ] Use `useMemo` for expensive calculations
- [ ] Implement `useCallback` for event handlers
- [ ] Add loading states with Suspense

### Bundle Optimization (2 hours)
- [ ] Analyze bundle with `npm run build -- --analyze`
- [ ] Remove unused dependencies
- [ ] Implement dynamic imports
- [ ] Configure code splitting

### Canvas Performance (2 hours)
- [ ] Use `requestAnimationFrame` properly
- [ ] Implement object pooling for comments
- [ ] Add FPS monitoring
- [ ] Consider WebGL for heavy scenes

---

## Testing Strategy

### Unit Tests (Coverage Target: 80%)
```typescript
// Component Test Example
describe('VideoPlayer', () => {
  it('should play video when play button clicked', async () => {
    const { user } = render(<VideoPlayer />);
    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);
    expect(screen.getByTestId('video')).toHaveAttribute('playing', 'true');
  });
});
```

### Integration Tests
```typescript
// Store Test Example
describe('AuthStore', () => {
  it('should handle login flow', async () => {
    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'pass' });
    });
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### E2E Tests (with Playwright)
```typescript
test('user can watch stream', async ({ page }) => {
  await page.goto('/stream/123');
  await expect(page.locator('video')).toBeVisible();
  await page.click('button[aria-label="Play"]');
  await expect(page.locator('.comment-overlay')).toBeVisible();
});
```

---

## Security Implementation

### XSS Protection
```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizeComment = (text: string) => {
  return DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};
```

### CSP Headers (vite.config.ts)
```typescript
export default {
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    }
  }
}
```

---

## Monitoring Setup

### Sentry Integration (30 min)
```bash
npm install @sentry/react
```

```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

### Performance Monitoring
```typescript
// hooks/usePerformance.ts
export const usePerformance = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }, []);
};
```

---

## Commands Reference

### Development
```bash
npm run dev          # Start dev server
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI
```

### Build & Analysis
```bash
npm run build        # Build for production
npm run preview      # Preview production build
npm run analyze      # Analyze bundle size
```

### Quality Checks
```bash
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm run test:coverage # Generate coverage report
```

---

## Today's Goals Checklist

### Morning (2 hours)
- [ ] Install testing dependencies
- [ ] Setup Vitest configuration
- [ ] Write first test
- [ ] Create ErrorBoundary component

### Afternoon (2 hours)
- [ ] Test 3 critical components
- [ ] Start folder reorganization
- [ ] Add performance monitoring hook
- [ ] Document changes

### End of Day Success Criteria
- [ ] ✅ Tests running successfully
- [ ] ✅ At least 5 tests passing
- [ ] ✅ Error boundary implemented
- [ ] ✅ Performance monitoring added

---

## Resources & Links

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/reference/react/memo)

---

**Start Now**: Run the installation command in Step 1 and begin your production-ready transformation! 🚀