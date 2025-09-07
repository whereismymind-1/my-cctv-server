"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comment_style_vo_1 = require("../comment-style.vo");
describe('CommentStyle Value Object', () => {
    describe('constructor', () => {
        it('should create a valid comment style', () => {
            const style = new comment_style_vo_1.CommentStyle('scroll', '#FF0000', 'medium');
            expect(style.position).toBe('scroll');
            expect(style.color).toBe('#FF0000');
            expect(style.size).toBe('medium');
        });
        it('should throw error for invalid color format', () => {
            expect(() => new comment_style_vo_1.CommentStyle('scroll', 'invalid', 'medium')).toThrow('Invalid color format: invalid');
            expect(() => new comment_style_vo_1.CommentStyle('scroll', '#GGG', 'medium')).toThrow();
            expect(() => new comment_style_vo_1.CommentStyle('scroll', '#FF00', 'medium')).toThrow();
        });
        it('should accept valid hex colors', () => {
            expect(() => new comment_style_vo_1.CommentStyle('scroll', '#FF0000', 'medium')).not.toThrow();
            expect(() => new comment_style_vo_1.CommentStyle('scroll', '#00ff00', 'medium')).not.toThrow();
            expect(() => new comment_style_vo_1.CommentStyle('scroll', '#000000', 'medium')).not.toThrow();
        });
    });
    describe('fromCommand', () => {
        it('should return default style for null command', () => {
            const style = comment_style_vo_1.CommentStyle.fromCommand(null);
            expect(style.position).toBe('scroll');
            expect(style.color).toBe('#FFFFFF');
            expect(style.size).toBe('medium');
        });
        it('should return default style for empty command', () => {
            const style = comment_style_vo_1.CommentStyle.fromCommand('');
            expect(style.position).toBe('scroll');
            expect(style.color).toBe('#FFFFFF');
            expect(style.size).toBe('medium');
        });
        it('should parse position commands correctly', () => {
            expect(comment_style_vo_1.CommentStyle.fromCommand('ue').position).toBe('top');
            expect(comment_style_vo_1.CommentStyle.fromCommand('top').position).toBe('top');
            expect(comment_style_vo_1.CommentStyle.fromCommand('shita').position).toBe('bottom');
            expect(comment_style_vo_1.CommentStyle.fromCommand('bottom').position).toBe('bottom');
        });
        it('should parse color commands correctly', () => {
            expect(comment_style_vo_1.CommentStyle.fromCommand('red').color).toBe('#FF0000');
            expect(comment_style_vo_1.CommentStyle.fromCommand('blue').color).toBe('#0000FF');
            expect(comment_style_vo_1.CommentStyle.fromCommand('green').color).toBe('#00FF00');
            expect(comment_style_vo_1.CommentStyle.fromCommand('yellow').color).toBe('#FFFF00');
            expect(comment_style_vo_1.CommentStyle.fromCommand('pink').color).toBe('#FF8080');
            expect(comment_style_vo_1.CommentStyle.fromCommand('orange').color).toBe('#FFC000');
            expect(comment_style_vo_1.CommentStyle.fromCommand('cyan').color).toBe('#00FFFF');
            expect(comment_style_vo_1.CommentStyle.fromCommand('purple').color).toBe('#C000FF');
            expect(comment_style_vo_1.CommentStyle.fromCommand('black').color).toBe('#000000');
            expect(comment_style_vo_1.CommentStyle.fromCommand('white').color).toBe('#FFFFFF');
        });
        it('should parse size commands correctly', () => {
            expect(comment_style_vo_1.CommentStyle.fromCommand('small').size).toBe('small');
            expect(comment_style_vo_1.CommentStyle.fromCommand('big').size).toBe('big');
            expect(comment_style_vo_1.CommentStyle.fromCommand('medium').size).toBe('medium');
        });
        it('should parse combined commands correctly', () => {
            const style1 = comment_style_vo_1.CommentStyle.fromCommand('ue red big');
            expect(style1.position).toBe('top');
            expect(style1.color).toBe('#FF0000');
            expect(style1.size).toBe('big');
            const style2 = comment_style_vo_1.CommentStyle.fromCommand('shita green small');
            expect(style2.position).toBe('bottom');
            expect(style2.color).toBe('#00FF00');
            expect(style2.size).toBe('small');
            const style3 = comment_style_vo_1.CommentStyle.fromCommand('blue big');
            expect(style3.position).toBe('scroll');
            expect(style3.color).toBe('#0000FF');
            expect(style3.size).toBe('big');
        });
        it('should handle extra spaces in command', () => {
            const style = comment_style_vo_1.CommentStyle.fromCommand('  ue   red   big  ');
            expect(style.position).toBe('top');
            expect(style.color).toBe('#FF0000');
            expect(style.size).toBe('big');
        });
        it('should be case insensitive', () => {
            const style1 = comment_style_vo_1.CommentStyle.fromCommand('UE RED BIG');
            const style2 = comment_style_vo_1.CommentStyle.fromCommand('ue red big');
            expect(style1.equals(style2)).toBe(true);
        });
    });
    describe('getSizeMultiplier', () => {
        it('should return correct multipliers', () => {
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'small').getSizeMultiplier()).toBe(0.75);
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'medium').getSizeMultiplier()).toBe(1.0);
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'big').getSizeMultiplier()).toBe(1.5);
        });
    });
    describe('getFontSize', () => {
        it('should calculate font size with default base', () => {
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'small').getFontSize()).toBe(12);
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'medium').getFontSize()).toBe(16);
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'big').getFontSize()).toBe(24);
        });
        it('should calculate font size with custom base', () => {
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'small').getFontSize(20)).toBe(15);
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'medium').getFontSize(20)).toBe(20);
            expect(new comment_style_vo_1.CommentStyle('scroll', '#FFFFFF', 'big').getFontSize(20)).toBe(30);
        });
    });
    describe('equals', () => {
        it('should return true for equal styles', () => {
            const style1 = new comment_style_vo_1.CommentStyle('top', '#FF0000', 'big');
            const style2 = new comment_style_vo_1.CommentStyle('top', '#FF0000', 'big');
            expect(style1.equals(style2)).toBe(true);
        });
        it('should return false for different styles', () => {
            const style1 = new comment_style_vo_1.CommentStyle('top', '#FF0000', 'big');
            const style2 = new comment_style_vo_1.CommentStyle('bottom', '#FF0000', 'big');
            const style3 = new comment_style_vo_1.CommentStyle('top', '#00FF00', 'big');
            const style4 = new comment_style_vo_1.CommentStyle('top', '#FF0000', 'small');
            expect(style1.equals(style2)).toBe(false);
            expect(style1.equals(style3)).toBe(false);
            expect(style1.equals(style4)).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return string representation', () => {
            const style = new comment_style_vo_1.CommentStyle('top', '#FF0000', 'big');
            expect(style.toString()).toBe('top #FF0000 big');
        });
    });
});
//# sourceMappingURL=comment-style.vo.test.js.map