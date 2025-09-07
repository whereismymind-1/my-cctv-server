"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentStyle = void 0;
class CommentStyle {
    constructor(position, color, size) {
        this.position = position;
        this.color = color;
        this.size = size;
        this.validateColor(color);
    }
    validateColor(color) {
        const hexColorRegex = /^#[0-9A-F]{6}$/i;
        if (!hexColorRegex.test(color)) {
            throw new Error(`Invalid color format: ${color}`);
        }
    }
    static createDefault() {
        return new CommentStyle('scroll', '#FFFFFF', 'medium');
    }
    static fromCommand(command) {
        const defaultStyle = CommentStyle.createDefault();
        if (!command)
            return defaultStyle;
        const parts = command.toLowerCase().split(' ').filter(p => p.length > 0);
        let position = 'scroll';
        let color = '#FFFFFF';
        let size = 'medium';
        if (parts.includes('ue') || parts.includes('top')) {
            position = 'top';
        }
        else if (parts.includes('shita') || parts.includes('bottom')) {
            position = 'bottom';
        }
        const colorMap = {
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
            if (colorMap[part]) {
                color = colorMap[part];
                break;
            }
        }
        if (parts.includes('small')) {
            size = 'small';
        }
        else if (parts.includes('big')) {
            size = 'big';
        }
        return new CommentStyle(position, color, size);
    }
    getSizeMultiplier() {
        switch (this.size) {
            case 'small': return 0.75;
            case 'medium': return 1.0;
            case 'big': return 1.5;
        }
    }
    getFontSize(baseSize = 16) {
        return Math.round(baseSize * this.getSizeMultiplier());
    }
    equals(other) {
        return (this.position === other.position &&
            this.color === other.color &&
            this.size === other.size);
    }
    toString() {
        return `${this.position} ${this.color} ${this.size}`;
    }
}
exports.CommentStyle = CommentStyle;
//# sourceMappingURL=comment-style.vo.js.map