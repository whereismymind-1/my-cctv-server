"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaneManager = void 0;
class LaneManager {
    constructor(totalLanes = 12, laneHeight = 30, commentDuration = 4000) {
        this.totalLanes = totalLanes;
        this.laneHeight = laneHeight;
        this.commentDuration = commentDuration;
        this.lanes = new Map();
        this.initializeLanes();
    }
    initializeLanes() {
        for (let i = 0; i < this.totalLanes; i++) {
            this.lanes.set(i, {
                id: i,
                occupiedUntil: 0,
            });
        }
    }
    assignLane(currentTime = Date.now()) {
        this.cleanExpiredLanes(currentTime);
        for (let i = 0; i < this.totalLanes; i++) {
            const lane = this.lanes.get(i);
            if (lane.occupiedUntil <= currentTime) {
                lane.occupiedUntil = currentTime + this.commentDuration;
                return {
                    lane: i,
                    y: this.calculateYPosition(i),
                };
            }
        }
        let soonestFreeLane = 0;
        let soonestFreeTime = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < this.totalLanes; i++) {
            const lane = this.lanes.get(i);
            if (lane.occupiedUntil < soonestFreeTime) {
                soonestFreeTime = lane.occupiedUntil;
                soonestFreeLane = i;
            }
        }
        const lane = this.lanes.get(soonestFreeLane);
        lane.occupiedUntil = currentTime + this.commentDuration;
        return {
            lane: soonestFreeLane,
            y: this.calculateYPosition(soonestFreeLane),
        };
    }
    cleanExpiredLanes(currentTime) {
        for (const lane of this.lanes.values()) {
            if (lane.occupiedUntil <= currentTime) {
                lane.occupiedUntil = 0;
            }
        }
    }
    calculateYPosition(laneNumber) {
        return 50 + (laneNumber * this.laneHeight);
    }
    getAvailableLanes(currentTime = Date.now()) {
        const available = [];
        for (const [laneId, lane] of this.lanes.entries()) {
            if (lane.occupiedUntil <= currentTime) {
                available.push(laneId);
            }
        }
        return available;
    }
    reset() {
        this.initializeLanes();
    }
    getLaneStatus() {
        const currentTime = Date.now();
        const status = new Map();
        for (const [laneId, lane] of this.lanes.entries()) {
            status.set(laneId, lane.occupiedUntil > currentTime);
        }
        return status;
    }
}
exports.LaneManager = LaneManager;
//# sourceMappingURL=lane-manager.service.js.map