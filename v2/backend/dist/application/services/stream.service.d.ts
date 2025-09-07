import { IStreamRepository } from '../../domain/repositories/stream.repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { CreateStreamDto, UpdateStreamDto, StreamQueryDto, StreamResponseDto } from '../dto/stream.dto';
export declare class StreamService {
    private readonly streamRepository;
    private readonly redisService;
    constructor(streamRepository: IStreamRepository, redisService: RedisService);
    createStream(userId: string, dto: CreateStreamDto): Promise<StreamResponseDto>;
    getStream(streamId: string, userId?: string): Promise<StreamResponseDto>;
    getStreams(query: StreamQueryDto): Promise<{
        streams: StreamResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateStream(streamId: string, userId: string, dto: UpdateStreamDto): Promise<StreamResponseDto>;
    startStream(streamId: string, userId: string): Promise<void>;
    endStream(streamId: string, userId: string): Promise<{
        status: string;
        endedAt: Date;
        duration: number;
        stats: {
            totalViewers: number;
            peakViewers: number;
            totalComments: number;
        };
    }>;
    deleteStream(streamId: string, userId: string): Promise<void>;
    updateViewerCount(streamId: string, count: number): Promise<void>;
    private toResponseDto;
}
