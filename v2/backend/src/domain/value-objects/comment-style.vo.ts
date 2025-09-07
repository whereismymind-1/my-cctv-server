export type CommentPosition = 'scroll' | 'top' | 'bottom';
export type CommentSize = 'small' | 'medium' | 'big';

export class CommentStyle {
  constructor(
    public readonly position: CommentPosition,
    public readonly color: string,
    public readonly size: CommentSize,
  ) {
    this.validateColor(color);
  }

  private validateColor(color: string): void {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (!hexColorRegex.test(color)) {
      throw new Error(`Invalid color format: ${color}`);
    }
  }

  static createDefault(): CommentStyle {
    return new CommentStyle('scroll', '#FFFFFF', 'medium');
  }

  static fromCommand(command: string | null): CommentStyle {
    const defaultStyle = CommentStyle.createDefault();
    
    if (!command) return defaultStyle;

    const parts = command.toLowerCase().split(' ').filter(p => p.length > 0);
    
    let position: CommentPosition = 'scroll';
    let color = '#FFFFFF';
    let size: CommentSize = 'medium';

    // Parse position
    if (parts.includes('ue') || parts.includes('top')) {
      position = 'top';
    } else if (parts.includes('shita') || parts.includes('bottom')) {
      position = 'bottom';
    }

    // Parse color
    const colorMap: Record<string, string> = {
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

    // Parse size
    if (parts.includes('small')) {
      size = 'small';
    } else if (parts.includes('big')) {
      size = 'big';
    }

    return new CommentStyle(position, color, size);
  }

  getSizeMultiplier(): number {
    switch (this.size) {
      case 'small': return 0.75;
      case 'medium': return 1.0;
      case 'big': return 1.5;
    }
  }

  getFontSize(baseSize = 16): number {
    return Math.round(baseSize * this.getSizeMultiplier());
  }

  equals(other: CommentStyle): boolean {
    return (
      this.position === other.position &&
      this.color === other.color &&
      this.size === other.size
    );
  }

  toString(): string {
    return `${this.position} ${this.color} ${this.size}`;
  }
}