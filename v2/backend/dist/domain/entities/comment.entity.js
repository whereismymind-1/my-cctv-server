"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
class Comment {
    constructor(id, streamId, userId, username, text, command, style, lane, x, y, speed, duration, vpos, createdAt) {
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
    }
    static create(streamId, userId, username, text, command, vpos) {
        const style = Comment.parseCommand(command);
        const lane = 0;
        const x = 1280;
        const y = 0;
        const speed = 200;
        const duration = 4000;
        return new Comment('', streamId, userId, username, text, command, style, lane, x, y, speed, duration, vpos, new Date());
    }
    static parseCommand(command) {
        const defaultStyle = {
            position: 'scroll',
            color: '#FFFFFF',
            size: 'medium',
        };
        if (!command)
            return defaultStyle;
        const parts = command.toLowerCase().split(' ');
        const style = { ...defaultStyle };
        if (parts.includes('ue') || parts.includes('top')) {
            style.position = 'top';
        }
        else if (parts.includes('shita') || parts.includes('bottom')) {
            style.position = 'bottom';
        }
        const colors = {
            white: '#FFFFFF',
            red: '#FF0000',
            pink: '#FF8080',
            orange: '#FFC000',
            yellow: '#FFFF00',
            green: '#00FF00',
            cyan: '#00FFFF',
            blue: '#0000FF',
            purple: '#C000FF',
            black: '#000000',
        };
        for (const part of parts) {
            if (colors[part]) {
                style.color = colors[part];
                break;
            }
        }
        if (parts.includes('small')) {
            style.size = 'small';
        }
        else if (parts.includes('big')) {
            style.size = 'big';
        }
        return style;
    }
    withLaneAssignment(lane, y) {
        return new Comment(this.id, this.streamId, this.userId, this.username, this.text, this.command, this.style, lane, this.x, y, this.speed, this.duration, this.vpos, this.createdAt);
    }
}
exports.Comment = Comment;
//# sourceMappingURL=comment.entity.js.map