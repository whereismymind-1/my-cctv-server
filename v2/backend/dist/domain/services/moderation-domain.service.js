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
exports.ModerationDomainService = void 0;
const common_1 = require("@nestjs/common");
let ModerationDomainService = class ModerationDomainService {
    constructor() {
        this.maxViolationsBeforeBlock = 5;
        this.defaultBlockDuration = 3600000;
        this.bannedWords = this.initializeBannedWords();
        this.spamPatterns = this.initializeSpamPatterns();
    }
    initializeBannedWords() {
        return new Set([
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
        return [
            /https?:\/\/[^\s]+/gi,
            /(.)\1{10,}/g,
            /^[A-Z\s]{20,}$/,
            /^\d{10,}$/,
            /discord\.gg\/[a-zA-Z0-9]+/gi,
            /t\.me\/[a-zA-Z0-9]+/gi,
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        ];
    }
    containsBannedWords(text) {
        const lowerText = text.toLowerCase();
        for (const word of this.bannedWords) {
            if (lowerText.includes(word.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
    isSpam(text) {
        return this.spamPatterns.some(pattern => {
            pattern.lastIndex = 0;
            return pattern.test(text);
        });
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
    determineSeverity(hasBannedWords, isSpam, similarityScore, violationCount) {
        if (violationCount >= this.maxViolationsBeforeBlock) {
            return 'high';
        }
        if (hasBannedWords) {
            return 'medium';
        }
        if (isSpam || similarityScore > 0.8) {
            return 'low';
        }
        return 'low';
    }
    shouldAutoBlock(violationCount) {
        return violationCount >= this.maxViolationsBeforeBlock;
    }
    calculateBlockDuration(violationCount) {
        if (violationCount >= 10) {
            return 86400000;
        }
        if (violationCount >= 5) {
            return 3600000 * 6;
        }
        return this.defaultBlockDuration;
    }
    areMessagesSimilar(msg1, msg2, threshold = 0.8) {
        return this.calculateSimilarity(msg1, msg2) > threshold;
    }
    validateModerationAction(action, moderatorLevel, targetUserLevel) {
        if (targetUserLevel >= moderatorLevel) {
            return false;
        }
        switch (action) {
            case 'block':
                return moderatorLevel >= 3;
            case 'unblock':
                return moderatorLevel >= 3;
            case 'mute':
                return moderatorLevel >= 2;
            case 'warn':
                return moderatorLevel >= 1;
            default:
                return false;
        }
    }
    getModerationReason(hasBannedWords, isSpam, isFlooding, isSimilar) {
        if (hasBannedWords) {
            return 'Your message contains inappropriate content';
        }
        if (isSpam) {
            return 'Your message was detected as spam';
        }
        if (isFlooding) {
            return 'You are sending messages too quickly';
        }
        if (isSimilar) {
            return 'Please avoid sending duplicate messages';
        }
        return 'Your message violated community guidelines';
    }
    getBannedWords() {
        return Array.from(this.bannedWords);
    }
    addBannedWord(word) {
        this.bannedWords.add(word.toLowerCase());
    }
    removeBannedWord(word) {
        this.bannedWords.delete(word.toLowerCase());
    }
    getMaxViolationsBeforeBlock() {
        return this.maxViolationsBeforeBlock;
    }
};
exports.ModerationDomainService = ModerationDomainService;
exports.ModerationDomainService = ModerationDomainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ModerationDomainService);
//# sourceMappingURL=moderation-domain.service.js.map