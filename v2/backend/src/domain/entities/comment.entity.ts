export interface CommentStyle {
  position: 'scroll' | 'top' | 'bottom';
  color: string;
  size: 'small' | 'medium' | 'big';
}

export class Comment {
  constructor(
    public readonly id: string,
    public readonly streamId: string,
    public readonly userId: string | null,
    public readonly username: string,
    public readonly text: string,
    public readonly command: string | null,
    public readonly style: CommentStyle,
    public readonly lane: number,
    public readonly x: number,
    public readonly y: number,
    public readonly speed: number,
    public readonly duration: number,
    public readonly vpos: number, // Video position in milliseconds
    public readonly createdAt: Date,
  ) {}

  static create(
    streamId: string,
    userId: string | null,
    username: string,
    text: string,
    command: string | null,
    vpos: number,
  ): Comment {
    const style = Comment.parseCommand(command);
    const lane = 0; // Will be assigned by LaneManager
    const x = 1280; // Starting position (screen width)
    const y = 0; // Will be calculated based on lane
    const speed = 200; // pixels per second
    const duration = 4000; // milliseconds

    return new Comment(
      '', // ID will be generated
      streamId,
      userId,
      username,
      text,
      command,
      style,
      lane,
      x,
      y,
      speed,
      duration,
      vpos,
      new Date(),
    );
  }

  static parseCommand(command: string | null): CommentStyle {
    const defaultStyle: CommentStyle = {
      position: 'scroll',
      color: '#FFFFFF',
      size: 'medium',
    };

    if (!command) return defaultStyle;

    const parts = command.toLowerCase().split(' ');
    const style = { ...defaultStyle };

    // Parse position
    if (parts.includes('ue') || parts.includes('top')) {
      style.position = 'top';
    } else if (parts.includes('shita') || parts.includes('bottom')) {
      style.position = 'bottom';
    }

    // Parse color
    const colors: Record<string, string> = {
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

    // Parse size
    if (parts.includes('small')) {
      style.size = 'small';
    } else if (parts.includes('big')) {
      style.size = 'big';
    }

    return style;
  }

  withLaneAssignment(lane: number, y: number): Comment {
    return new Comment(
      this.id,
      this.streamId,
      this.userId,
      this.username,
      this.text,
      this.command,
      this.style,
      lane,
      this.x,
      y,
      this.speed,
      this.duration,
      this.vpos,
      this.createdAt,
    );
  }
}