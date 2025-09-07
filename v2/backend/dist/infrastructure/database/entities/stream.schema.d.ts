import { UserEntity } from './user.schema';
export declare class StreamEntity {
    id: string;
    ownerId: string;
    owner: UserEntity;
    title: string;
    description: string;
    thumbnailUrl: string;
    streamKey: string;
    status: string;
    viewerCount: number;
    maxViewers: number;
    allowComments: boolean;
    commentCooldown: number;
    maxCommentLength: number;
    allowAnonymous: boolean;
    startedAt: Date;
    endedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
