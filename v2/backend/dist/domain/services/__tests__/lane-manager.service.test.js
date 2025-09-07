"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lane_manager_service_1 = require("../lane-manager.service");
describe('LaneManager Service', () => {
    let laneManager;
    const mockTime = 1000000;
    beforeEach(() => {
        laneManager = new lane_manager_service_1.LaneManager(12, 30, 4000);
        jest.spyOn(Date, 'now').mockReturnValue(mockTime);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('assignLane', () => {
        it('should assign first available lane', () => {
            const result = laneManager.assignLane(mockTime);
            expect(result.lane).toBe(0);
            expect(result.y).toBe(50);
        });
        it('should assign different lanes for consecutive comments', () => {
            const result1 = laneManager.assignLane(mockTime);
            const result2 = laneManager.assignLane(mockTime);
            const result3 = laneManager.assignLane(mockTime);
            expect(result1.lane).toBe(0);
            expect(result2.lane).toBe(1);
            expect(result3.lane).toBe(2);
        });
        it('should calculate Y position correctly', () => {
            const result1 = laneManager.assignLane(mockTime);
            const result2 = laneManager.assignLane(mockTime);
            const result3 = laneManager.assignLane(mockTime);
            expect(result1.y).toBe(50);
            expect(result2.y).toBe(80);
            expect(result3.y).toBe(110);
        });
        it('should reuse lanes after they expire', () => {
            const result1 = laneManager.assignLane(mockTime);
            expect(result1.lane).toBe(0);
            const futureTime = mockTime + 5000;
            const result2 = laneManager.assignLane(futureTime);
            expect(result2.lane).toBe(0);
        });
        it('should handle all lanes being occupied', () => {
            for (let i = 0; i < 12; i++) {
                const result = laneManager.assignLane(mockTime);
                expect(result.lane).toBe(i);
            }
            const result13 = laneManager.assignLane(mockTime);
            expect(result13.lane).toBeGreaterThanOrEqual(0);
            expect(result13.lane).toBeLessThan(12);
        });
        it('should assign lane that will be free soonest when all occupied', () => {
            for (let i = 0; i < 12; i++) {
                laneManager.assignLane(mockTime + i * 100);
            }
            const result = laneManager.assignLane(mockTime + 200);
            expect(result.lane).toBe(0);
        });
    });
    describe('getAvailableLanes', () => {
        it('should return all lanes when none are occupied', () => {
            const available = laneManager.getAvailableLanes(mockTime);
            expect(available).toHaveLength(12);
            expect(available).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        });
        it('should return only unoccupied lanes', () => {
            laneManager.assignLane(mockTime);
            laneManager.assignLane(mockTime);
            laneManager.assignLane(mockTime);
            const available = laneManager.getAvailableLanes(mockTime);
            expect(available).toHaveLength(9);
            expect(available).not.toContain(0);
            expect(available).not.toContain(1);
            expect(available).not.toContain(2);
        });
        it('should return lanes that have expired', () => {
            laneManager.assignLane(mockTime);
            laneManager.assignLane(mockTime);
            const futureTime = mockTime + 5000;
            const available = laneManager.getAvailableLanes(futureTime);
            expect(available).toHaveLength(12);
        });
    });
    describe('getLaneStatus', () => {
        it('should return correct occupation status', () => {
            laneManager.assignLane(mockTime);
            laneManager.assignLane(mockTime);
            const status = laneManager.getLaneStatus();
            expect(status.get(0)).toBe(true);
            expect(status.get(1)).toBe(true);
            expect(status.get(2)).toBe(false);
            expect(status.size).toBe(12);
        });
    });
    describe('reset', () => {
        it('should reset all lanes to unoccupied', () => {
            laneManager.assignLane(mockTime);
            laneManager.assignLane(mockTime);
            laneManager.assignLane(mockTime);
            laneManager.reset();
            const available = laneManager.getAvailableLanes(mockTime);
            expect(available).toHaveLength(12);
        });
    });
    describe('edge cases', () => {
        it('should handle custom lane configuration', () => {
            const customManager = new lane_manager_service_1.LaneManager(5, 40, 2000);
            const result = customManager.assignLane(mockTime);
            expect(result.lane).toBeGreaterThanOrEqual(0);
            expect(result.lane).toBeLessThan(5);
            expect(result.y).toBe(50);
        });
        it('should handle rapid consecutive assignments', () => {
            const results = [];
            for (let i = 0; i < 20; i++) {
                const result = laneManager.assignLane(mockTime + i);
                results.push(result.lane);
            }
            expect(new Set(results).size).toBeGreaterThan(1);
        });
    });
});
//# sourceMappingURL=lane-manager.service.test.js.map