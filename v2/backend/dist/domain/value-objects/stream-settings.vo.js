"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSettings = void 0;
class StreamSettings {
    constructor(allowComments, commentCooldown, maxCommentLength, allowAnonymous, moderationLevel, allowEmotes, allowLinks) {
        this.allowComments = allowComments;
        this.commentCooldown = commentCooldown;
        this.maxCommentLength = maxCommentLength;
        this.allowAnonymous = allowAnonymous;
        this.moderationLevel = moderationLevel;
        this.allowEmotes = allowEmotes;
        this.allowLinks = allowLinks;
        this.validate();
    }
    validate() {
        if (this.commentCooldown < 0 || this.commentCooldown > 60000) {
            throw new Error('Comment cooldown must be between 0 and 60 seconds');
        }
        if (this.maxCommentLength < 1 || this.maxCommentLength > 500) {
            throw new Error('Max comment length must be between 1 and 500');
        }
        const validLevels = ['none', 'low', 'medium', 'high'];
        if (!validLevels.includes(this.moderationLevel)) {
            throw new Error('Invalid moderation level');
        }
    }
    update(changes, userLevel) {
        const allowedChanges = this.applyLevelRestrictions(changes, userLevel);
        return new StreamSettings(allowedChanges.allowComments ?? this.allowComments, allowedChanges.commentCooldown ?? this.commentCooldown, allowedChanges.maxCommentLength ?? this.maxCommentLength, allowedChanges.allowAnonymous ?? this.allowAnonymous, allowedChanges.moderationLevel ?? this.moderationLevel, allowedChanges.allowEmotes ?? this.allowEmotes, allowedChanges.allowLinks ?? this.allowLinks);
    }
    applyLevelRestrictions(changes, userLevel) {
        const restricted = { ...changes };
        if (userLevel < 2) {
            delete restricted.allowAnonymous;
            delete restricted.allowEmotes;
        }
        if (userLevel < 5) {
            if (restricted.commentCooldown !== undefined && restricted.commentCooldown < 500) {
                restricted.commentCooldown = 500;
            }
            if (restricted.moderationLevel === 'none') {
                restricted.moderationLevel = 'low';
            }
        }
        if (userLevel < 10) {
            delete restricted.allowLinks;
        }
        return restricted;
    }
    static createDefault(userLevel) {
        return new StreamSettings(true, userLevel >= 5 ? 500 : 1000, 200, userLevel >= 2, userLevel >= 5 ? 'low' : 'medium', userLevel >= 2, userLevel >= 10);
    }
    equals(other) {
        return (this.allowComments === other.allowComments &&
            this.commentCooldown === other.commentCooldown &&
            this.maxCommentLength === other.maxCommentLength &&
            this.allowAnonymous === other.allowAnonymous &&
            this.moderationLevel === other.moderationLevel &&
            this.allowEmotes === other.allowEmotes &&
            this.allowLinks === other.allowLinks);
    }
    toObject() {
        return {
            allowComments: this.allowComments,
            commentCooldown: this.commentCooldown,
            maxCommentLength: this.maxCommentLength,
            allowAnonymous: this.allowAnonymous,
            moderationLevel: this.moderationLevel,
            allowEmotes: this.allowEmotes,
            allowLinks: this.allowLinks,
        };
    }
}
exports.StreamSettings = StreamSettings;
//# sourceMappingURL=stream-settings.vo.js.map