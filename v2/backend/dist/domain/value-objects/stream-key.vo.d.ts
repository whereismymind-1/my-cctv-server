export declare class StreamKey {
    private readonly value;
    private static readonly KEY_LENGTH;
    private static readonly KEY_PREFIX;
    constructor(value: string);
    private validate;
    static generate(): StreamKey;
    static fromString(value: string): StreamKey;
    getObfuscated(): string;
    toString(): string;
    equals(other: StreamKey): boolean;
    getRtmpUrl(serverUrl: string): string;
    static isValid(value: string): boolean;
}
