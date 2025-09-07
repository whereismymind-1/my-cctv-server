export declare enum StreamStatus {
    WAITING = "waiting",
    LIVE = "live",
    ENDED = "ended"
}
export declare class StreamStatusHelper {
    static canTransition(from: StreamStatus, to: StreamStatus): boolean;
    static getDisplayName(status: StreamStatus): string;
    static getColor(status: StreamStatus): string;
    static fromString(value: string): StreamStatus;
}
