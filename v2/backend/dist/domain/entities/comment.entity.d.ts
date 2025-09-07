export interface CommentStyle {
    position: 'scroll' | 'top' | 'bottom';
    color: string;
    size: 'small' | 'medium' | 'big';
}
export declare class Comment {
    readonly id: string;
    readonly streamId: string;
    readonly userId: string | null;
    readonly username: string;
    readonly text: string;
    readonly command: string | null;
    readonly style: CommentStyle;
    readonly lane: number;
    readonly x: number;
    readonly y: number;
    readonly speed: number;
    readonly duration: number;
    readonly vpos: number;
    readonly createdAt: Date;
    constructor(id: string, streamId: string, userId: string | null, username: string, text: string, command: string | null, style: CommentStyle, lane: number, x: number, y: number, speed: number, duration: number, vpos: number, createdAt: Date);
    static create(streamId: string, userId: string | null, username: string, text: string, command: string | null, vpos: number): Comment;
    static parseCommand(command: string | null): CommentStyle;
    withLaneAssignment(lane: number, y: number): Comment;
}
