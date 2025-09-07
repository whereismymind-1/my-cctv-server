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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ModerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const moderation_domain_service_1 = require("../../domain/services/moderation-domain.service");
let ModerationService = ModerationService_1 = class ModerationService {
    constructor(cacheRepository, moderationDomainService) {
        this.cacheRepository = cacheRepository;
        this.moderationDomainService = moderationDomainService;
    }
    async moderateComment(text, userId, streamId) {
        if (userId && await this.isUserBlocked(userId)) {
            return {
                isAllowed: false,
                reason: 'User is blocked',
                severity: 'high',
            };
        }
        const hasBannedWords = this.moderationDomainService.containsBannedWords(text);
        const isSpam = this.moderationDomainService.isSpam(text);
        const isFlooding = userId ? await this.checkFlooding(userId, streamId, text) : false;
        const violationCount = userId ? await this.getViolationCount(userId) : 0;
        const severity = this.moderationDomainService.determineSeverity(hasBannedWords, isSpam, 0, violationCount);
        if (hasBannedWords) {
            if (userId)
                await this.recordViolation(userId, 'banned_words', streamId);
            return {
                isAllowed: false,
                reason: this.moderationDomainService.getModerationReason(true, false, false, false),
                severity,
            };
        }
        if (isSpam) {
            if (userId)
                await this.recordViolation(userId, 'spam', streamId);
            return {
                isAllowed: false,
                reason: this.moderationDomainService.getModerationReason(false, true, false, false),
                severity,
            };
        }
        if (isFlooding) {
            if (userId)
                await this.recordViolation(userId, 'flooding', streamId);
            return {
                isAllowed: false,
                reason: this.moderationDomainService.getModerationReason(false, false, true, false),
                severity,
            };
        }
        if (userId) {
            await this.storeRecentMessage(userId, streamId, text);
        }
        return { isAllowed: true };
    }
    async isUserBlocked(userId) {
        const blockedUntil = await this.cacheRepository.get(`blocked:${userId}`);
        if (!blockedUntil)
            return false;
        const blockExpiry = new Date(blockedUntil);
        if (blockExpiry > new Date()) {
            return true;
        }
        await this.cacheRepository.delete(`blocked:${userId}`);
        return false;
    }
    async checkFlooding(userId, streamId, text) {
        const key = `${ModerationService_1.RECENT_MESSAGES_PREFIX}${userId}:${streamId}`;
        const recentMessages = await this.cacheRepository.getListRange(key, 0, 9);
        const hasSimilar = recentMessages.some(msg => this.moderationDomainService.areMessagesSimilar(msg, text));
        return hasSimilar;
    }
    async storeRecentMessage(userId, streamId, text) {
        const key = `${ModerationService_1.RECENT_MESSAGES_PREFIX}${userId}:${streamId}`;
        await this.cacheRepository.pushToList(key, text);
        await this.cacheRepository.trimList(key, 0, 9);
        await this.cacheRepository.set(key, '1', 300);
    }
    async getViolationCount(userId) {
        const key = `${ModerationService_1.VIOLATIONS_PREFIX}${userId}`;
        const count = await this.cacheRepository.get(key);
        return count ? parseInt(count, 10) : 0;
    }
    async recordViolation(userId, type, streamId) {
        const key = `${ModerationService_1.VIOLATIONS_PREFIX}${userId}`;
        const newCount = await this.cacheRepository.increment(key);
        await this.cacheRepository.set(key, newCount.toString(), 86400);
        if (this.moderationDomainService.shouldAutoBlock(newCount)) {
            const blockDuration = this.moderationDomainService.calculateBlockDuration(newCount);
            await this.blockUser(userId, blockDuration);
        }
        const violationLog = JSON.stringify({
            userId,
            type,
            streamId,
            timestamp: new Date().toISOString(),
            count: newCount,
        });
        await this.cacheRepository.pushToList(`violations:log:${userId}`, violationLog);
    }
    async blockUser(userId, duration) {
        const until = new Date(Date.now() + duration);
        await this.cacheRepository.set(`blocked:${userId}`, until.toISOString(), Math.floor(duration / 1000));
    }
    async unblockUser(userId) {
        await this.cacheRepository.delete(`blocked:${userId}`);
    }
    async reportComment(commentId, reporterId, reason) {
        const report = JSON.stringify({
            commentId,
            reporterId,
            reason,
            timestamp: new Date().toISOString(),
        });
        await this.cacheRepository.pushToList(ModerationService_1.REPORTS_KEY, report);
    }
    async getModerationStats() {
        const reports = await this.cacheRepository.getListRange(ModerationService_1.REPORTS_KEY, 0, -1);
        return {
            bannedWordsCount: this.moderationDomainService.getBannedWords().length,
            reportsCount: reports.length,
        };
    }
    getBannedWords() {
        return this.moderationDomainService.getBannedWords();
    }
    addBannedWord(word) {
        this.moderationDomainService.addBannedWord(word);
    }
    removeBannedWord(word) {
        this.moderationDomainService.removeBannedWord(word);
    }
};
exports.ModerationService = ModerationService;
ModerationService.BLOCKED_USERS_KEY = 'blocked_users';
ModerationService.VIOLATIONS_PREFIX = 'violations:';
ModerationService.RECENT_MESSAGES_PREFIX = 'recent:';
ModerationService.REPORTS_KEY = 'moderation:reports';
exports.ModerationService = ModerationService = ModerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('CACHE_REPOSITORY')),
    __metadata("design:paramtypes", [Object, moderation_domain_service_1.ModerationDomainService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map