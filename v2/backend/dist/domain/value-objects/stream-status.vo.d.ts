export declare class StreamStatus {
    private readonly value;
    private static readonly VALID_STATUSES;
    constructor(value: typeof StreamStatus.VALID_STATUSES[number]);
    private validate;
    static waiting(): StreamStatus;
    static live(): StreamStatus;
    static ended(): StreamStatus;
    isWaiting(): boolean;
    isLive(): boolean;
    isEnded(): boolean;
    canStart(): boolean;
    canEnd(): boolean;
    canDelete(): boolean;
    getValue(): string;
    equals(other: StreamStatus): boolean;
    toString(): string;
}
