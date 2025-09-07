export interface ICacheRepository {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    increment(key: string): Promise<number>;
    decrement(key: string): Promise<number>;
    addToSet(key: string, member: string): Promise<void>;
    removeFromSet(key: string, member: string): Promise<void>;
    getSetSize(key: string): Promise<number>;
    getSetMembers(key: string): Promise<string[]>;
    pushToList(key: string, value: string): Promise<void>;
    getListRange(key: string, start: number, end: number): Promise<string[]>;
    trimList(key: string, start: number, end: number): Promise<void>;
}
