/**
 * Stream Status Value Object
 * Represents the current state of a stream
 */
export enum StreamStatus {
  WAITING = 'waiting',
  LIVE = 'live',
  ENDED = 'ended',
}

/**
 * Helper class for Stream Status operations
 */
export class StreamStatusHelper {
  /**
   * Check if transition is valid
   */
  static canTransition(from: StreamStatus, to: StreamStatus): boolean {
    const transitions: Record<StreamStatus, StreamStatus[]> = {
      [StreamStatus.WAITING]: [StreamStatus.LIVE, StreamStatus.ENDED],
      [StreamStatus.LIVE]: [StreamStatus.ENDED],
      [StreamStatus.ENDED]: [], // No transitions from ended
    };
    
    return transitions[from].includes(to);
  }

  /**
   * Get display name
   */
  static getDisplayName(status: StreamStatus): string {
    const names: Record<StreamStatus, string> = {
      [StreamStatus.WAITING]: 'Waiting to Start',
      [StreamStatus.LIVE]: 'Live',
      [StreamStatus.ENDED]: 'Ended',
    };
    
    return names[status];
  }

  /**
   * Get status color (for UI)
   */
  static getColor(status: StreamStatus): string {
    const colors: Record<StreamStatus, string> = {
      [StreamStatus.WAITING]: '#FFA500', // Orange
      [StreamStatus.LIVE]: '#FF0000', // Red
      [StreamStatus.ENDED]: '#808080', // Gray
    };
    
    return colors[status];
  }

  /**
   * Parse status from string
   */
  static fromString(value: string): StreamStatus {
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