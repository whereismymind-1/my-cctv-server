/**
 * Cache Repository Interface
 * Domain layer - defines the contract for caching
 * No infrastructure details
 */
export interface ICacheRepository {
  // Generic cache operations
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  
  // Atomic operations
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<number>;
  
  // Set operations
  addToSet(key: string, member: string): Promise<void>;
  removeFromSet(key: string, member: string): Promise<void>;
  getSetSize(key: string): Promise<number>;
  getSetMembers(key: string): Promise<string[]>;
  
  // List operations
  pushToList(key: string, value: string): Promise<void>;
  getListRange(key: string, start: number, end: number): Promise<string[]>;
  trimList(key: string, start: number, end: number): Promise<void>;
}