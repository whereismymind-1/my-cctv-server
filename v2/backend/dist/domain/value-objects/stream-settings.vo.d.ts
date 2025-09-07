export declare class StreamSettings {
    readonly allowComments: boolean;
    readonly commentCooldown: number;
    readonly maxCommentLength: number;
    readonly allowAnonymous: boolean;
    readonly moderationLevel: 'none' | 'low' | 'medium' | 'high';
    readonly allowEmotes: boolean;
    readonly allowLinks: boolean;
    constructor(allowComments: boolean, commentCooldown: number, maxCommentLength: number, allowAnonymous: boolean, moderationLevel: 'none' | 'low' | 'medium' | 'high', allowEmotes: boolean, allowLinks: boolean);
    private validate;
    update(changes: Partial<StreamSettings>, userLevel: number): StreamSettings;
    private applyLevelRestrictions;
    static createDefault(userLevel: number): StreamSettings;
    equals(other: StreamSettings): boolean;
    toObject(): Record<string, any>;
}
