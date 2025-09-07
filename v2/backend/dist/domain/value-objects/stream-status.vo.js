"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamStatus = void 0;
class StreamStatus {
    constructor(value) {
        this.value = value;
        this.validate(value);
    }
    validate(value) {
        if (!StreamStatus.VALID_STATUSES.includes(value)) {
            throw new Error(`Invalid stream status: ${value}`);
        }
    }
    static waiting() {
        return new StreamStatus('waiting');
    }
    static live() {
        return new StreamStatus('live');
    }
    static ended() {
        return new StreamStatus('ended');
    }
    isWaiting() {
        return this.value === 'waiting';
    }
    isLive() {
        return this.value === 'live';
    }
    isEnded() {
        return this.value === 'ended';
    }
    canStart() {
        return this.isWaiting();
    }
    canEnd() {
        return this.isLive();
    }
    canDelete() {
        return !this.isLive();
    }
    getValue() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.StreamStatus = StreamStatus;
StreamStatus.VALID_STATUSES = ['waiting', 'live', 'ended'];
//# sourceMappingURL=stream-status.vo.js.map