import { StreamService } from '../../application/services/stream.service';
import { CreateStreamDto, UpdateStreamDto, StreamQueryDto } from '../../application/dto/stream.dto';
import { CurrentUserData } from '../decorators/current-user.decorator';
export declare class StreamController {
    private readonly streamService;
    constructor(streamService: StreamService);
    getStreams(query: StreamQueryDto): Promise<{
        streams: import("../../application/dto/stream.dto").StreamResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStream(streamId: string, user?: CurrentUserData): Promise<import("../../application/dto/stream.dto").StreamResponseDto>;
    createStream(dto: CreateStreamDto, user: CurrentUserData): Promise<import("../../application/dto/stream.dto").StreamResponseDto>;
    updateStream(streamId: string, dto: UpdateStreamDto, user: CurrentUserData): Promise<import("../../application/dto/stream.dto").StreamResponseDto>;
    startStream(streamId: string, user: CurrentUserData): Promise<{
        status: string;
        startedAt: Date;
    }>;
    endStream(streamId: string, user: CurrentUserData): Promise<{
        status: string;
        endedAt: Date;
        duration: number;
        stats: {
            totalViewers: number;
            peakViewers: number;
            totalComments: number;
        };
    }>;
    deleteStream(streamId: string, user: CurrentUserData): Promise<void>;
}
