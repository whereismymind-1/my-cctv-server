export declare class SendCommentDto {
    streamId: string;
    text: string;
    command?: string;
}
export declare class CommentQueryDto {
    limit?: number;
    offset?: number;
    userId?: string;
}
export declare class CommentResponseDto {
    id: string;
    text: string;
    command?: string;
    user: {
        id: string;
        username: string;
        level: number;
    };
    style: {
        position: 'scroll' | 'top' | 'bottom';
        color: string;
        size: 'small' | 'medium' | 'big';
    };
    lane: number;
    x: number;
    y: number;
    speed: number;
    duration: number;
    vpos?: number;
    createdAt: Date;
}
