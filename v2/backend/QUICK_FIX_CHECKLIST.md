# ⚡ Quick Fix Checklist - Backend Architecture

## 🔥 Day 1: Stop the Bleeding (8 hours)

### Morning (4 hours)
- [ ] **Task 1.1**: Replace ModerationService Maps with Redis (1h)
  ```typescript
  // Remove: private blockedUsers: Map<string, Date>
  // Add: await redis.set(`blocked:${userId}`, date)
  ```
- [ ] **Task 1.2**: Replace ViewerService Maps with Redis (1h)
- [ ] **Task 2.1**: Remove ALL setTimeout() calls (30m)
- [ ] **Task 2.2**: Add proper onModuleInit() (30m)
- [ ] **Quick Test**: Verify services start without errors (1h)

### Afternoon (4 hours)
- [ ] **Task 6.1**: Fix auth.service.spec.ts
  ```typescript
  // Change: avatarUrl: null → avatarUrl: undefined
  ```
- [ ] **Task 6.2**: Fix stream-domain.service.spec.ts
- [ ] **Task 6.3**: Fix analytics-domain.service.spec.ts
- [ ] **Task 6.4**: Fix redis.service.spec.ts
- [ ] **Run Tests**: `npm test` - should have 0 failures

---

## 📦 Day 2: Clean Architecture (8 hours)

### Morning (4 hours)
- [ ] **Task 3.1**: Create domain interfaces
  ```typescript
  // domain/repositories/cache.repository.interface.ts
  export interface ICacheRepository {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
  }
  ```
- [ ] **Task 3.2**: Create infrastructure implementations
- [ ] **Task 3.3**: Wire up dependency injection
  ```typescript
  { provide: 'CACHE_REPOSITORY', useClass: RedisCacheRepository }
  ```

### Afternoon (4 hours)
- [ ] **Task 4.1**: Move /auth to layers
  - [ ] Entities → /domain/entities
  - [ ] Services → /application/services
  - [ ] Controllers → /presentation/controllers
- [ ] **Task 4.2**: Move /stream to layers
- [ ] **Task 4.3**: Move /comment to layers
- [ ] **Delete**: Empty directories

---

## 🧪 Day 3: Test Coverage (8 hours)

### Morning (4 hours)
- [ ] **Domain Tests** (Target: 80%)
  ```bash
  npm test -- src/domain --coverage
  ```
  - [ ] Entity tests
  - [ ] Value object tests
  - [ ] Domain service tests

### Afternoon (4 hours)
- [ ] **Application Tests** (Target: 70%)
  - [ ] Service tests with mocked repositories
- [ ] **Infrastructure Tests** (Target: 60%)
  - [ ] Repository tests with test database
- [ ] **Check Coverage**: `npm test -- --coverage`
  - [ ] Should be >50% minimum

---

## 🚀 Day 4: Production Prep (8 hours)

### Morning (4 hours)
- [ ] **Error Handling**
  ```typescript
  @UseFilters(new GlobalExceptionFilter())
  ```
- [ ] **Logging**
  ```typescript
  private logger = new Logger(MyService.name);
  ```
- [ ] **Health Checks**
  ```typescript
  @Get('/health')
  health() { return { status: 'ok' }; }
  ```

### Afternoon (4 hours)
- [ ] **Performance**
  - [ ] Add Redis connection pooling
  - [ ] Add database indexes
  - [ ] Enable query caching
- [ ] **Documentation**
  - [ ] Update README.md
  - [ ] Add API docs
  - [ ] Create deployment guide

---

## 🎯 Quick Wins (Do These First!)

### 1. Fix Race Condition (5 min)
```typescript
// ❌ DELETE THIS
setTimeout(() => this.loadBlockedUsers(), 100);

// ✅ ADD THIS
async onModuleInit() {
  await this.loadBlockedUsers();
}
```

### 2. Fix Test Avatar Issue (2 min)
```typescript
// In auth.service.spec.ts
// Change: avatarUrl: null
// To: avatarUrl: undefined
```

### 3. Add Missing Redis Methods (10 min)
```typescript
// Add to RedisService
async get(key: string): Promise<string | null> {
  return this.client.get(key);
}
async set(key: string, value: string): Promise<void> {
  await this.client.set(key, value);
}
```

---

## 🛠️ Command Reference

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- auth.service.spec.ts

# Run watch mode
npm test -- --watch
```

### Linting & Formatting
```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

### Build & Run
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

---

## 📊 Progress Tracker

### Phase 1: Critical ⬜⬜⬜⬜⬜ 0%
### Phase 2: Architecture ⬜⬜⬜⬜⬜ 0%
### Phase 3: Testing ⬜⬜⬜⬜⬜ 0%
### Phase 4: Production ⬜⬜⬜⬜⬜ 0%

**Overall**: 0/20 tasks completed

---

## ⚠️ Don't Forget!

1. **Commit Often**: Small, atomic commits
2. **Test After Each Change**: Don't accumulate broken tests
3. **Document As You Go**: Update comments and README
4. **Ask for Help**: If stuck >30 min, ask team
5. **Take Breaks**: 10 min every 2 hours

---

## 🆘 Stuck? Try This:

### Test Failing?
1. Check error message carefully
2. Look at git diff for recent changes
3. Revert last commit and try again
4. Ask for pair programming help

### Import Errors?
1. Check file moved to correct location
2. Update barrel exports (index.ts)
3. Search & replace old imports
4. Restart TypeScript server

### Redis Connection Issues?
1. Check Redis is running: `redis-cli ping`
2. Check connection string in .env
3. Check firewall/network
4. Use Redis GUI to debug

---

*Last Updated: 2024-01-07*  
*Estimated Time: 32 hours (4 days)*  
*Difficulty: Medium-High*