"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamStatusHelper = exports.StreamStatus = void 0;
var StreamStatus;
(function (StreamStatus) {
    StreamStatus["WAITING"] = "waiting";
    StreamStatus["LIVE"] = "live";
    StreamStatus["ENDED"] = "ended";
})(StreamStatus || (exports.StreamStatus = StreamStatus = {}));
class StreamStatusHelper {
    static canTransition(from, to) {
        const transitions = {
            [StreamStatus.WAITING]: [StreamStatus.LIVE, StreamStatus.ENDED],
            [StreamStatus.LIVE]: [StreamStatus.ENDED],
            [StreamStatus.ENDED]: [],
        };
        return transitions[from].includes(to);
    }
    static getDisplayName(status) {
        const names = {
            [StreamStatus.WAITING]: 'Waiting to Start',
            [StreamStatus.LIVE]: 'Live',
            [StreamStatus.ENDED]: 'Ended',
        };
        return names[status];
    }
    static getColor(status) {
        const colors = {
            [StreamStatus.WAITING]: '#FFA500',
            [StreamStatus.LIVE]: '#FF0000',
            [StreamStatus.ENDED]: '#808080',
        };
        return colors[status];
    }
    static fromString(value) {
        const normalized = value.toLowerCase();
        switch (normalized) {
            case 'waiting':
                return StreamStatus.WAITING;
            case 'live':
                return StreamStatus.LIVE;
            case 'ended':
                return StreamStatus.ENDED;
            default:
                throw new Error(`Invalid stream status: ${value}`);
        }
    }
}
exports.StreamStatusHelper = StreamStatusHelper;
//# sourceMappingURL=stream-status.vo.js.map