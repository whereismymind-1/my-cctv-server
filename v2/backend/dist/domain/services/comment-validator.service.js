"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentValidator = void 0;
class CommentValidator {
    constructor(maxLength = 200, minLength = 1, bannedWords = []) {
        this.urlPattern = /https?:\/\/[^\s]+/gi;
        this.htmlTagPattern = /<[^>]*>/g;
        this.excessiveSpacePattern = /\s{3,}/g;
        this.maxConsecutiveChars = 15;
        this.maxLength = maxLength;
        this.minLength = minLength;
        this.bannedWords = new Set(bannedWords.map(w => w.toLowerCase()));
    }
    validate(text) {
        const errors = [];
        if (!text || text.trim().length === 0) {
            errors.push('Comment cannot be empty');
            return { isValid: false, errors };
        }
        const sanitized = this.sanitize(text);
        if (sanitized.length < this.minLength) {
            errors.push(`Comment must be at least ${this.minLength} character(s)`);
        }
        if (sanitized.length > this.maxLength) {
            errors.push(`Comment cannot exceed ${this.maxLength} characters`);
        }
        const lowerText = sanitized.toLowerCase();
        for (const bannedWord of this.bannedWords) {
            if (lowerText.includes(bannedWord)) {
                errors.push(`Comment contains prohibited content`);
                break;
            }
        }
        if (this.isSpam(sanitized)) {
            errors.push('Comment appears to be spam');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    sanitize(text) {
        let sanitized = text;
        sanitized = sanitized.replace(this.htmlTagPattern, '');
        sanitized = sanitized.replace(this.excessiveSpacePattern, ' ');
        sanitized = sanitized.trim();
        if (sanitized.length > this.maxLength) {
            sanitized = sanitized.substring(0, this.maxLength);
        }
        return sanitized;
    }
    isSpam(text) {
        const repeatedCharPattern = new RegExp(`(.)\\1{${this.maxConsecutiveChars},}`, 'g');
        if (repeatedCharPattern.test(text)) {
            return true;
        }
        const words = text.toLowerCase().split(/\s+/);
        const wordCount = new Map();
        for (const word of words) {
            if (word.length > 2) {
                const count = (wordCount.get(word) || 0) + 1;
                wordCount.set(word, count);
                if (count > 3) {
                    return true;
                }
            }
        }
        const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (text.length > 10 && upperCaseRatio > 0.7) {
            return true;
        }
        const specialCharRatio = (text.match(/[^a-zA-Z0-9\s\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/g) || []).length / text.length;
        if (specialCharRatio > 0.5) {
            return true;
        }
        return false;
    }
    isValidCommand(command) {
        if (!command)
            return true;
        const validCommands = [
            'ue', 'top', 'shita', 'bottom',
            'white', 'red', 'pink', 'orange', 'yellow',
            'green', 'cyan', 'blue', 'purple', 'black',
            'small', 'medium', 'big',
        ];
        const parts = command.toLowerCase().split(' ').filter(p => p.length > 0);
        return parts.every(part => validCommands.includes(part));
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
}
exports.CommentValidator = CommentValidator;
//# sourceMappingURL=comment-validator.service.js.map