export class StreamStatus {
  private static readonly VALID_STATUSES = ['waiting', 'live', 'ended'] as const;
  
  constructor(private readonly value: typeof StreamStatus.VALID_STATUSES[number]) {
    this.validate(value);
  }

  private validate(value: string): void {
    if (!StreamStatus.VALID_STATUSES.includes(value as any)) {
      throw new Error(`Invalid stream status: ${value}`);
    }
  }

  static waiting(): StreamStatus {
    return new StreamStatus('waiting');
  }

  static live(): StreamStatus {
    return new StreamStatus('live');
  }

  static ended(): StreamStatus {
    return new StreamStatus('ended');
  }

  isWaiting(): boolean {
    return this.value === 'waiting';
  }

  isLive(): boolean {
    return this.value === 'live';
  }

  isEnded(): boolean {
    return this.value === 'ended';
  }

  canStart(): boolean {
    return this.isWaiting();
  }

  canEnd(): boolean {
    return this.isLive();
  }

  canDelete(): boolean {
    return !this.isLive();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: StreamStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}