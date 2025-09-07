import { Stream } from '../entities/stream.entity';
export interface StreamFilter {
    status?: 'waiting' | 'live' | 'ended';
    ownerId?: string;
    search?: string;
}
export interface PaginationOptions {
    page: number;
    limit: number;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface IStreamRepository {
    findById(id: string): Promise<Stream | null>;
    findByStreamKey(streamKey: string): Promise<Stream | null>;
    findAll(filter?: StreamFilter, pagination?: PaginationOptions): Promise<PaginatedResult<Stream>>;
    save(stream: Stream): Promise<Stream>;
    update(stream: Stream): Promise<Stream>;
    delete(id: string): Promise<void>;
    updateViewerCount(id: string, count: number): Promise<void>;
    findActiveStreams(): Promise<Stream[]>;
}
