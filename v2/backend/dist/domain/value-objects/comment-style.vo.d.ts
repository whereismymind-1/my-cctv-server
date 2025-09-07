export type CommentPosition = 'scroll' | 'top' | 'bottom';
export type CommentSize = 'small' | 'medium' | 'big';
export declare class CommentStyle {
    readonly position: CommentPosition;
    readonly color: string;
    readonly size: CommentSize;
    constructor(position: CommentPosition, color: string, size: CommentSize);
    private validateColor;
    static createDefault(): CommentStyle;
    static fromCommand(command: string | null): CommentStyle;
    getSizeMultiplier(): number;
    getFontSize(baseSize?: number): number;
    equals(other: CommentStyle): boolean;
    toString(): string;
}
