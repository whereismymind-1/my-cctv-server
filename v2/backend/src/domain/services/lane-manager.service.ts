export interface Lane {
  id: number;
  occupiedUntil: number;
}

export class LaneManager {
  private readonly totalLanes: number;
  private readonly laneHeight: number;
  private readonly commentDuration: number;
  private lanes: Map<number, Lane>;

  constructor(
    totalLanes = 12,
    laneHeight = 30,
    commentDuration = 4000,
  ) {
    this.totalLanes = totalLanes;
    this.laneHeight = laneHeight;
    this.commentDuration = commentDuration;
    this.lanes = new Map();
    this.initializeLanes();
  }

  private initializeLanes(): void {
    for (let i = 0; i < this.totalLanes; i++) {
      this.lanes.set(i, {
        id: i,
        occupiedUntil: 0,
      });
    }
  }

  assignLane(currentTime: number = Date.now()): { lane: number; y: number } {
    // Clean up expired lanes
    this.cleanExpiredLanes(currentTime);

    // Find the first available lane
    for (let i = 0; i < this.totalLanes; i++) {
      const lane = this.lanes.get(i)!;
      if (lane.occupiedUntil <= currentTime) {
        // Occupy this lane
        lane.occupiedUntil = currentTime + this.commentDuration;
        return {
          lane: i,
          y: this.calculateYPosition(i),
        };
      }
    }

    // If all lanes are occupied, find the lane that will be free soonest
    let soonestFreeLane = 0;
    let soonestFreeTime = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.totalLanes; i++) {
      const lane = this.lanes.get(i)!;
      if (lane.occupiedUntil < soonestFreeTime) {
        soonestFreeTime = lane.occupiedUntil;
        soonestFreeLane = i;
      }
    }

    // Force assign to the soonest free lane
    const lane = this.lanes.get(soonestFreeLane)!;
    lane.occupiedUntil = currentTime + this.commentDuration;

    return {
      lane: soonestFreeLane,
      y: this.calculateYPosition(soonestFreeLane),
    };
  }

  private cleanExpiredLanes(currentTime: number): void {
    for (const lane of this.lanes.values()) {
      if (lane.occupiedUntil <= currentTime) {
        lane.occupiedUntil = 0;
      }
    }
  }

  private calculateYPosition(laneNumber: number): number {
    // Add some padding from the top (50px) and space between lanes
    return 50 + (laneNumber * this.laneHeight);
  }

  getAvailableLanes(currentTime: number = Date.now()): number[] {
    const available: number[] = [];
    for (const [laneId, lane] of this.lanes.entries()) {
      if (lane.occupiedUntil <= currentTime) {
        available.push(laneId);
      }
    }
    return available;
  }

  reset(): void {
    this.initializeLanes();
  }

  getLaneStatus(): Map<number, boolean> {
    const currentTime = Date.now();
    const status = new Map<number, boolean>();
    
    for (const [laneId, lane] of this.lanes.entries()) {
      status.set(laneId, lane.occupiedUntil > currentTime);
    }
    
    return status;
  }
}