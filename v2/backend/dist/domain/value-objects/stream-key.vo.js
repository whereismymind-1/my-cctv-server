"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamKey = void 0;
class StreamKey {
    constructor(value) {
        this.value = value;
        this.validate();
    }
    validate() {
        if (!this.value || this.value.length === 0) {
            throw new Error('Stream key cannot be empty');
        }
        if (!this.value.startsWith(StreamKey.KEY_PREFIX)) {
            throw new Error('Invalid stream key format');
        }
        const keyPart = this.value.substring(StreamKey.KEY_PREFIX.length);
        if (keyPart.length !== StreamKey.KEY_LENGTH) {
            throw new Error('Invalid stream key length');
        }
        if (!/^[a-zA-Z0-9]+$/.test(keyPart)) {
            throw new Error('Stream key contains invalid characters');
        }
    }
    static generate() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = StreamKey.KEY_PREFIX;
        for (let i = 0; i < StreamKey.KEY_LENGTH; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return new StreamKey(key);
    }
    static fromString(value) {
        return new StreamKey(value);
    }
    getObfuscated() {
        const visibleChars = 8;
        const keyPart = this.value.substring(StreamKey.KEY_PREFIX.length);
        const visible = keyPart.substring(0, visibleChars);
        const hidden = '*'.repeat(keyPart.length - visibleChars);
        return `${StreamKey.KEY_PREFIX}${visible}${hidden}`;
    }
    toString() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    getRtmpUrl(serverUrl) {
        return `${serverUrl}/live/${this.value}`;
    }
    static isValid(value) {
        try {
            new StreamKey(value);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.StreamKey = StreamKey;
StreamKey.KEY_LENGTH = 32;
StreamKey.KEY_PREFIX = 'live_';
//# sourceMappingURL=stream-key.vo.js.map