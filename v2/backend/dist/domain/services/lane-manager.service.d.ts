export interface Lane {
    id: number;
    occupiedUntil: number;
}
export declare class LaneManager {
    private readonly totalLanes;
    private readonly laneHeight;
    private readonly commentDuration;
    private lanes;
    constructor(totalLanes?: number, laneHeight?: number, commentDuration?: number);
    private initializeLanes;
    assignLane(currentTime?: number): {
        lane: number;
        y: number;
    };
    private cleanExpiredLanes;
    private calculateYPosition;
    getAvailableLanes(currentTime?: number): number[];
    reset(): void;
    getLaneStatus(): Map<number, boolean>;
}
