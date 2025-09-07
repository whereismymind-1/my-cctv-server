import { Repository } from 'typeorm';
import { Stream } from '../../domain/entities/stream.entity';
import { IStreamRepository, StreamFilter, PaginationOptions, PaginatedResult } from '../../domain/repositories/stream.repository.interface';
import { StreamEntity } from '../database/entities/stream.schema';
export declare class StreamRepository implements IStreamRepository {
    private readonly repository;
    constructor(repository: Repository<StreamEntity>);
    findById(id: string): Promise<Stream | null>;
    findByStreamKey(streamKey: string): Promise<Stream | null>;
    findAll(filter?: StreamFilter, pagination?: PaginationOptions): Promise<PaginatedResult<Stream>>;
    save(stream: Stream): Promise<Stream>;
    update(stream: Stream): Promise<Stream>;
    delete(id: string): Promise<void>;
    updateViewerCount(id: string, count: number): Promise<void>;
    findActiveStreams(): Promise<Stream[]>;
    private toDomain;
    private toEntity;
}
