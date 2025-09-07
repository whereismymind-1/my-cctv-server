"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(id, username, email, passwordHash, avatarUrl, level, createdAt, updatedAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.avatarUrl = avatarUrl;
        this.level = level;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(username, email, passwordHash) {
        const now = new Date();
        return new User('', username, email, passwordHash, null, 1, now, now);
    }
    updateProfile(username, avatarUrl) {
        if (username)
            this.username = username;
        if (avatarUrl !== undefined)
            this.avatarUrl = avatarUrl;
        this.updatedAt = new Date();
    }
    validatePassword(passwordHash) {
        return this.passwordHash === passwordHash;
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map