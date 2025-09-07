import { Provider } from '@nestjs/common';
import { StreamRepository } from './stream.repository';
import { UserRepository } from './user.repository';
import { CommentRepository } from './comment.repository';

/**
 * Repository providers for dependency injection
 * Maps domain interfaces to infrastructure implementations
 */
export const REPOSITORY_TOKENS = {
  STREAM_REPOSITORY: 'IStreamRepository',
  USER_REPOSITORY: 'IUserRepository',
  COMMENT_REPOSITORY: 'ICommentRepository',
  CACHE_REPOSITORY: 'ICacheRepository',
} as const;

export const repositoryProviders: Provider[] = [
  {
    provide: REPOSITORY_TOKENS.STREAM_REPOSITORY,
    useClass: StreamRepository,
  },
  {
    provide: REPOSITORY_TOKENS.USER_REPOSITORY,
    useClass: UserRepository,
  },
  {
    provide: REPOSITORY_TOKENS.COMMENT_REPOSITORY,
    useClass: CommentRepository,
  },
];