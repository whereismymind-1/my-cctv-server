import { CommentStyle } from '../comment-style.vo';

describe('CommentStyle Value Object', () => {
  describe('constructor', () => {
    it('should create a valid comment style', () => {
      const style = new CommentStyle('scroll', '#FF0000', 'medium');
      expect(style.position).toBe('scroll');
      expect(style.color).toBe('#FF0000');
      expect(style.size).toBe('medium');
    });

    it('should throw error for invalid color format', () => {
      expect(() => new CommentStyle('scroll', 'invalid', 'medium')).toThrow(
        'Invalid color format: invalid',
      );
      expect(() => new CommentStyle('scroll', '#GGG', 'medium')).toThrow();
      expect(() => new CommentStyle('scroll', '#FF00', 'medium')).toThrow();
    });

    it('should accept valid hex colors', () => {
      expect(() => new CommentStyle('scroll', '#FF0000', 'medium')).not.toThrow();
      expect(() => new CommentStyle('scroll', '#00ff00', 'medium')).not.toThrow();
      expect(() => new CommentStyle('scroll', '#000000', 'medium')).not.toThrow();
    });
  });

  describe('fromCommand', () => {
    it('should return default style for null command', () => {
      const style = CommentStyle.fromCommand(null);
      expect(style.position).toBe('scroll');
      expect(style.color).toBe('#FFFFFF');
      expect(style.size).toBe('medium');
    });

    it('should return default style for empty command', () => {
      const style = CommentStyle.fromCommand('');
      expect(style.position).toBe('scroll');
      expect(style.color).toBe('#FFFFFF');
      expect(style.size).toBe('medium');
    });

    it('should parse position commands correctly', () => {
      expect(CommentStyle.fromCommand('ue').position).toBe('top');
      expect(CommentStyle.fromCommand('top').position).toBe('top');
      expect(CommentStyle.fromCommand('shita').position).toBe('bottom');
      expect(CommentStyle.fromCommand('bottom').position).toBe('bottom');
    });

    it('should parse color commands correctly', () => {
      expect(CommentStyle.fromCommand('red').color).toBe('#FF0000');
      expect(CommentStyle.fromCommand('blue').color).toBe('#0000FF');
      expect(CommentStyle.fromCommand('green').color).toBe('#00FF00');
      expect(CommentStyle.fromCommand('yellow').color).toBe('#FFFF00');
      expect(CommentStyle.fromCommand('pink').color).toBe('#FF8080');
      expect(CommentStyle.fromCommand('orange').color).toBe('#FFC000');
      expect(CommentStyle.fromCommand('cyan').color).toBe('#00FFFF');
      expect(CommentStyle.fromCommand('purple').color).toBe('#C000FF');
      expect(CommentStyle.fromCommand('black').color).toBe('#000000');
      expect(CommentStyle.fromCommand('white').color).toBe('#FFFFFF');
    });

    it('should parse size commands correctly', () => {
      expect(CommentStyle.fromCommand('small').size).toBe('small');
      expect(CommentStyle.fromCommand('big').size).toBe('big');
      expect(CommentStyle.fromCommand('medium').size).toBe('medium');
    });

    it('should parse combined commands correctly', () => {
      const style1 = CommentStyle.fromCommand('ue red big');
      expect(style1.position).toBe('top');
      expect(style1.color).toBe('#FF0000');
      expect(style1.size).toBe('big');

      const style2 = CommentStyle.fromCommand('shita green small');
      expect(style2.position).toBe('bottom');
      expect(style2.color).toBe('#00FF00');
      expect(style2.size).toBe('small');

      const style3 = CommentStyle.fromCommand('blue big');
      expect(style3.position).toBe('scroll');
      expect(style3.color).toBe('#0000FF');
      expect(style3.size).toBe('big');
    });

    it('should handle extra spaces in command', () => {
      const style = CommentStyle.fromCommand('  ue   red   big  ');
      expect(style.position).toBe('top');
      expect(style.color).toBe('#FF0000');
      expect(style.size).toBe('big');
    });

    it('should be case insensitive', () => {
      const style1 = CommentStyle.fromCommand('UE RED BIG');
      const style2 = CommentStyle.fromCommand('ue red big');
      expect(style1.equals(style2)).toBe(true);
    });
  });

  describe('getSizeMultiplier', () => {
    it('should return correct multipliers', () => {
      expect(new CommentStyle('scroll', '#FFFFFF', 'small').getSizeMultiplier()).toBe(0.75);
      expect(new CommentStyle('scroll', '#FFFFFF', 'medium').getSizeMultiplier()).toBe(1.0);
      expect(new CommentStyle('scroll', '#FFFFFF', 'big').getSizeMultiplier()).toBe(1.5);
    });
  });

  describe('getFontSize', () => {
    it('should calculate font size with default base', () => {
      expect(new CommentStyle('scroll', '#FFFFFF', 'small').getFontSize()).toBe(12);
      expect(new CommentStyle('scroll', '#FFFFFF', 'medium').getFontSize()).toBe(16);
      expect(new CommentStyle('scroll', '#FFFFFF', 'big').getFontSize()).toBe(24);
    });

    it('should calculate font size with custom base', () => {
      expect(new CommentStyle('scroll', '#FFFFFF', 'small').getFontSize(20)).toBe(15);
      expect(new CommentStyle('scroll', '#FFFFFF', 'medium').getFontSize(20)).toBe(20);
      expect(new CommentStyle('scroll', '#FFFFFF', 'big').getFontSize(20)).toBe(30);
    });
  });

  describe('equals', () => {
    it('should return true for equal styles', () => {
      const style1 = new CommentStyle('top', '#FF0000', 'big');
      const style2 = new CommentStyle('top', '#FF0000', 'big');
      expect(style1.equals(style2)).toBe(true);
    });

    it('should return false for different styles', () => {
      const style1 = new CommentStyle('top', '#FF0000', 'big');
      const style2 = new CommentStyle('bottom', '#FF0000', 'big');
      const style3 = new CommentStyle('top', '#00FF00', 'big');
      const style4 = new CommentStyle('top', '#FF0000', 'small');
      
      expect(style1.equals(style2)).toBe(false);
      expect(style1.equals(style3)).toBe(false);
      expect(style1.equals(style4)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const style = new CommentStyle('top', '#FF0000', 'big');
      expect(style.toString()).toBe('top #FF0000 big');
    });
  });
});