import { StreamEntity } from './stream.schema';
import { UserEntity } from './user.schema';
export declare class CommentEntity {
    id: string;
    streamId: string;
    stream: StreamEntity;
    userId: string;
    user: UserEntity;
    text: string;
    command: string;
    vpos: number;
    createdAt: Date;
}
