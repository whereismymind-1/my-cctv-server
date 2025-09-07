import { User } from '../entities/user.entity';
export interface UserFilter {
    level?: number;
    minLevel?: number;
    search?: string;
    isActive?: boolean;
}
export interface UserStats {
    totalStreams: number;
    totalComments: number;
    totalWatchTime: number;
    lastActiveAt: Date;
}
export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findAll(filter?: UserFilter): Promise<User[]>;
    save(user: User): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    findByRefreshToken(token: string): Promise<User | null>;
    updateRefreshToken(id: string, token: string | null): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    updateExperience(id: string, exp: number): Promise<void>;
    updateLevel(id: string, level: number): Promise<void>;
    getTopUsers(limit: number): Promise<User[]>;
    getUserStats(id: string): Promise<UserStats>;
    updateWatchTime(id: string, seconds: number): Promise<void>;
    incrementStreamCount(id: string): Promise<void>;
    incrementCommentCount(id: string): Promise<void>;
    verifyEmail(id: string): Promise<void>;
    updatePassword(id: string, hashedPassword: string): Promise<void>;
    exists(email: string): Promise<boolean>;
    existsByUsername(username: string): Promise<boolean>;
}
