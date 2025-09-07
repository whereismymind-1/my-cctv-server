"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentEntity = void 0;
const comment_style_vo_1 = require("../value-objects/comment-style.vo");
class CommentEntity {
    constructor(id, streamId, userId, username, text, command, style, lane, x, y, speed, duration, vpos, createdAt, userLevel = 1) {
        this.id = id;
        this.streamId = streamId;
        this.userId = userId;
        this.username = username;
        this.text = text;
        this.command = command;
        this.style = style;
        this.lane = lane;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.duration = duration;
        this.vpos = vpos;
        this.createdAt = createdAt;
        this.userLevel = userLevel;
        this.validateInvariants();
    }
    validateInvariants() {
        if (!this.text || this.text.trim().length === 0) {
            throw new Error('Comment text cannot be empty');
        }
        if (this.text.length > CommentEntity.MAX_TEXT_LENGTH) {
            throw new Error(`Comment text cannot exceed ${CommentEntity.MAX_TEXT_LENGTH} characters`);
        }
        if (this.text.length < CommentEntity.MIN_TEXT_LENGTH) {
            throw new Error(`Comment text must be at least ${CommentEntity.MIN_TEXT_LENGTH} character`);
        }
        if (this.lane < 0 || this.lane >= CommentEntity.TOTAL_LANES) {
            throw new Error(`Invalid lane number. Must be between 0 and ${CommentEntity.TOTAL_LANES - 1}`);
        }
        if (this.speed <= 0) {
            throw new Error('Comment speed must be positive');
        }
        if (this.duration <= 0) {
            throw new Error('Comment duration must be positive');
        }
        this.validateStylePermissions();
    }
    validateStylePermissions() {
        if (this.isAnonymous()) {
            if (this.style.size !== 'medium' ||
                this.style.color !== 'white' ||
                this.style.position !== 'scroll') {
                throw new Error('Anonymous users can only use basic comment styles');
            }
            return;
        }
        if (this.style.size === 'big' && this.userLevel < 3) {
            throw new Error('Big size comments require level 3 or higher');
        }
        if (this.style.position !== 'scroll' && this.userLevel < 4) {
            throw new Error('Fixed position comments require level 4 or higher');
        }
        const premiumColors = ['red', 'blue', 'green', 'purple', 'pink', 'orange'];
        if (premiumColors.includes(this.style.color) && this.userLevel < 2) {
            throw new Error('Premium colors require level 2 or higher');
        }
    }
    static create(streamId, userId, username, text, command, vpos, userLevel = 1) {
        const style = this.parseCommand(command, userLevel);
        const duration = this.calculateDuration(text, style);
        const speed = this.calculateSpeed(style, duration);
        return new CommentEntity(this.generateId(), streamId, userId, username, text, command, style, 0, CommentEntity.SCREEN_WIDTH, 0, speed, duration, vpos, new Date(), userLevel);
    }
    static parseCommand(command, userLevel) {
        const defaultStyle = comment_style_vo_1.CommentStyle.createDefault();
        if (!command)
            return defaultStyle;
        let requestedStyle = comment_style_vo_1.CommentStyle.fromCommand(command);
        let adjustedSize = requestedStyle.size;
        let adjustedPosition = requestedStyle.position;
        let adjustedColor = requestedStyle.color;
        if (requestedStyle.size === 'big' && userLevel < 3) {
            adjustedSize = 'medium';
        }
        if (requestedStyle.position !== 'scroll' && userLevel < 4) {
            adjustedPosition = 'scroll';
        }
        const premiumColors = ['red', 'blue', 'green', 'purple', 'pink', 'orange'];
        if (premiumColors.includes(requestedStyle.color) && userLevel < 2) {
            adjustedColor = 'white';
        }
        return new comment_style_vo_1.CommentStyle(adjustedPosition, adjustedColor, adjustedSize);
    }
    static calculateDuration(text, style) {
        if (style.position !== 'scroll') {
            return 5000;
        }
        const baseTime = 3000;
        const timePerChar = 30;
        const calculated = baseTime + (text.length * timePerChar);
        return Math.max(3000, Math.min(calculated, 8000));
    }
    static calculateSpeed(style, duration) {
        if (style.position !== 'scroll') {
            return 0;
        }
        return (CommentEntity.SCREEN_WIDTH + 200) / (duration / 1000);
    }
    static generateId() {
        return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    isAnonymous() {
        return this.userId === null;
    }
    isCommand() {
        return this.command !== null && this.command.length > 0;
    }
    calculatePosition(currentTime) {
        const elapsedTime = currentTime - this.createdAt.getTime();
        if (elapsedTime < 0 || elapsedTime > this.duration) {
            return { x: -1, y: -1, visible: false };
        }
        let x = this.x;
        if (this.style.position === 'scroll') {
            x = this.x - (this.speed * (elapsedTime / 1000));
        }
        return { x, y: this.y, visible: true };
    }
    collidesWith(other, currentTime) {
        if (this.lane !== other.lane) {
            return false;
        }
        const thisPos = this.calculatePosition(currentTime);
        const otherPos = other.calculatePosition(currentTime);
        if (!thisPos.visible || !otherPos.visible) {
            return false;
        }
        const thisWidth = this.estimateWidth();
        const otherWidth = other.estimateWidth();
        return (thisPos.x < otherPos.x + otherWidth &&
            thisPos.x + thisWidth > otherPos.x);
    }
    estimateWidth() {
        const charWidth = this.style.size === 'big' ? 15 :
            this.style.size === 'small' ? 8 : 10;
        return this.text.length * charWidth;
    }
    getRenderPriority() {
        let priority = 0;
        priority += this.userLevel * 10;
        if (this.style.size === 'big')
            priority += 5;
        if (this.style.position !== 'scroll')
            priority += 8;
        if (this.style.color !== 'white')
            priority += 2;
        if (this.isCommand())
            priority += 20;
        if (this.isAnonymous())
            priority -= 10;
        return priority;
    }
    passesFilter(filterLevel) {
        switch (filterLevel) {
            case 'none':
                return true;
            case 'low':
                return !this.isSpam();
            case 'medium':
                return !this.isSpam() && !this.isAnonymous();
            case 'high':
                return !this.isSpam() && !this.isAnonymous() && this.userLevel >= 2;
            default:
                return true;
        }
    }
    isSpam() {
        if (/(.)\1{5,}/.test(this.text))
            return true;
        if (this.text.length > 10 && this.text === this.text.toUpperCase())
            return true;
        if (/[!?]{3,}/.test(this.text))
            return true;
        return false;
    }
    canBeModeratedBy(moderatorLevel) {
        if (this.userLevel === moderatorLevel)
            return false;
        return moderatorLevel > this.userLevel;
    }
    toDisplayFormat() {
        return {
            id: this.id,
            text: this.text,
            style: this.style,
            lane: this.lane,
            priority: this.getRenderPriority(),
        };
    }
    withLane(lane) {
        const y = lane * CommentEntity.LANE_HEIGHT;
        return new CommentEntity(this.id, this.streamId, this.userId, this.username, this.text, this.command, this.style, lane, this.x, y, this.speed, this.duration, this.vpos, this.createdAt, this.userLevel);
    }
    withStyle(style) {
        return new CommentEntity(this.id, this.streamId, this.userId, this.username, this.text, this.command, this.style, this.lane, this.x, this.y, this.speed, this.duration, this.vpos, this.createdAt, this.userLevel);
    }
}
exports.CommentEntity = CommentEntity;
CommentEntity.MAX_TEXT_LENGTH = 200;
CommentEntity.MIN_TEXT_LENGTH = 1;
CommentEntity.DEFAULT_DURATION = 4000;
CommentEntity.DEFAULT_SPEED = 200;
CommentEntity.SCREEN_WIDTH = 1280;
CommentEntity.LANE_HEIGHT = 40;
CommentEntity.TOTAL_LANES = 12;
//# sourceMappingURL=comment.entity.enhanced.js.map