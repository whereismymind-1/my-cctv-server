"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
let ModerationService = class ModerationService {
    constructor(redisService) {
        this.redisService = redisService;
        this.initializeBannedWords();
        this.initializeSpamPatterns();
        this.blockedUsers = new Map();
        this.userViolations = new Map();
        setTimeout(() => this.loadBlockedUsersFromRedis(), 100);
    }
    initializeBannedWords() {
        this.bannedWords = new Set([
            'spam',
            'scam',
            'hack',
            'cheat',
            'exploit',
            'バカ',
            'アホ',
        ]);
    }
    initializeSpamPatterns() {
        this.spamPatterns = [
            /https?:\/\/[^\s]+/gi,
            /(.)\1{10,}/g,
            /^[A-Z\s]{20,}$/,
            /^\d{10,}$/,
            /discord\.gg\/[a-zA-Z0-9]+/gi,
            /t\.me\/[a-zA-Z0-9]+/gi,
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        ];
    }
    async loadBlockedUsersFromRedis() {
        const blocked = await this.redisService.getBlockedUsers();
        if (blocked) {
            blocked.forEach(user => {
                this.blockedUsers.set(user.userId, new Date(user.blockedUntil));
            });
        }
    }
    async moderateComment(text, userId, streamId) {
        if (userId && this.isUserBlocked(userId)) {
            return {
                isAllowed: false,
                reason: 'User is blocked',
                severity: 'high',
            };
        }
        const bannedWordCheck = this.checkBannedWords(text);
        if (!bannedWordCheck.isAllowed) {
            this.recordViolation(userId, 'medium');
            return bannedWordCheck;
        }
        const spamCheck = this.checkSpamPatterns(text);
        if (!spamCheck.isAllowed) {
            this.recordViolation(userId, 'low');
            return spamCheck;
        }
        if (userId) {
            const floodCheck = await this.checkFloodProtection(userId, streamId);
            if (!floodCheck.isAllowed) {
                this.recordViolation(userId, 'low');
                return floodCheck;
            }
        }
        const similarityCheck = await this.checkMessageSimilarity(text, userId, streamId);
        if (!similarityCheck.isAllowed) {
            this.recordViolation(userId, 'low');
            return similarityCheck;
        }
        return { isAllowed: true };
    }
    checkBannedWords(text) {
        const lowerText = text.toLowerCase();
        for (const word of this.bannedWords) {
            if (lowerText.includes(word.toLowerCase())) {
                return {
                    isAllowed: false,
                    reason: 'Message contains inappropriate content',
                    severity: 'medium',
                    suggestedAction: 'warn',
                };
            }
        }
        return { isAllowed: true };
    }
    checkSpamPatterns(text) {
        for (const pattern of this.spamPatterns) {
            if (pattern.test(text)) {
                return {
                    isAllowed: false,
                    reason: 'Message appears to be spam',
                    severity: 'low',
                    suggestedAction: 'warn',
                };
            }
        }
        return { isAllowed: true };
    }
    async checkFloodProtection(userId, streamId) {
        const key = `flood:${userId}:${streamId}`;
        const count = await this.redisService.incrementWithExpiry(key, 60);
        if (count > 10) {
            return {
                isAllowed: false,
                reason: 'Sending messages too quickly',
                severity: 'low',
                suggestedAction: 'warn',
            };
        }
        return { isAllowed: true };
    }
    async checkMessageSimilarity(text, userId, streamId) {
        if (!userId)
            return { isAllowed: true };
        const key = `recent:${userId}:${streamId}`;
        const recentMessages = await this.redisService.getRecentUserMessages(key);
        if (recentMessages && recentMessages.length > 0) {
            const similarCount = recentMessages.filter(msg => this.calculateSimilarity(msg, text) > 0.8).length;
            if (similarCount >= 3) {
                return {
                    isAllowed: false,
                    reason: 'Duplicate message detected',
                    severity: 'low',
                    suggestedAction: 'warn',
                };
            }
        }
        await this.redisService.addRecentUserMessage(key, text, 300);
        return { isAllowed: true };
    }
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    async blockUser(userId, duration = 3600000) {
        const until = new Date(Date.now() + duration);
        this.blockedUsers.set(userId, until);
        await this.redisService.blockUser(userId, until);
    }
    async unblockUser(userId) {
        this.blockedUsers.delete(userId);
        await this.redisService.unblockUser(userId);
    }
    isUserBlocked(userId) {
        const blockExpiry = this.blockedUsers.get(userId);
        if (!blockExpiry)
            return false;
        if (blockExpiry > new Date()) {
            return true;
        }
        else {
            this.blockedUsers.delete(userId);
            return false;
        }
    }
    recordViolation(userId, severity) {
        if (!userId)
            return;
        const existing = this.userViolations.get(userId);
        if (existing) {
            existing.count++;
            existing.lastViolation = new Date();
            existing.severity = severity;
            if (existing.count >= 5) {
                const duration = existing.count * 600000;
                this.blockUser(userId, duration);
            }
        }
        else {
            this.userViolations.set(userId, {
                userId,
                count: 1,
                lastViolation: new Date(),
                severity,
            });
        }
    }
    async reportComment(commentId, reporterId, reason) {
        await this.redisService.addReport({
            commentId,
            reporterId,
            reason,
            timestamp: new Date(),
        });
    }
    async getModerationStats() {
        return {
            blockedUsers: this.blockedUsers.size,
            activeViolations: this.userViolations.size,
            bannedWords: this.bannedWords.size,
            reports: await this.redisService.getReportCount(),
        };
    }
    addBannedWord(word) {
        this.bannedWords.add(word.toLowerCase());
    }
    removeBannedWord(word) {
        this.bannedWords.delete(word.toLowerCase());
    }
    getBannedWords() {
        return Array.from(this.bannedWords);
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map