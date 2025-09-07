import { Stream } from '../entities/stream.entity';
export interface StreamFilter {
    status?: 'waiting' | 'live' | 'ended';
    ownerId?: string;
    search?: string;
    category?: string;
}
export interface PaginationOptions {
    page: number;
    limit: number;
    orderBy?: 'createdAt' | 'viewerCount' | 'startedAt';
    order?: 'ASC' | 'DESC';
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface StreamStats {
    totalViewers: number;
    peakViewers: number;
    averageViewers: number;
    totalComments: number;
    duration: number;
}
export interface IStreamRepository {
    findById(id: string): Promise<Stream | null>;
    findByStreamKey(streamKey: string): Promise<Stream | null>;
    findAll(filter?: StreamFilter, pagination?: PaginationOptions): Promise<PaginatedResult<Stream>>;
    save(stream: Stream): Promise<Stream>;
    update(stream: Stream): Promise<Stream>;
    delete(id: string): Promise<void>;
    findActiveStreams(): Promise<Stream[]>;
    findByOwner(ownerId: string, includeEnded?: boolean): Promise<Stream[]>;
    findRecentStreams(limit: number): Promise<Stream[]>;
    countActiveStreamsByOwner(ownerId: string): Promise<number>;
    updateViewerCount(id: string, count: number): Promise<void>;
    updateStreamStatus(id: string, status: 'waiting' | 'live' | 'ended'): Promise<void>;
    recordStreamStart(id: string): Promise<void>;
    recordStreamEnd(id: string, stats: StreamStats): Promise<void>;
    getStreamStats(id: string): Promise<StreamStats | null>;
    getOwnerStreamHistory(ownerId: string, days: number): Promise<Stream[]>;
    getMostViewedStreams(limit: number, timeRange?: number): Promise<Stream[]>;
}
