export declare class User {
    readonly id: string;
    username: string;
    email: string;
    passwordHash: string;
    avatarUrl: string | null;
    level: number;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, username: string, email: string, passwordHash: string, avatarUrl: string | null, level: number, createdAt: Date, updatedAt: Date);
    static create(username: string, email: string, passwordHash: string): User;
    updateProfile(username?: string, avatarUrl?: string): void;
    validatePassword(passwordHash: string): boolean;
}
