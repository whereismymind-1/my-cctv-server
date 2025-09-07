import { Provider } from '@nestjs/common';
export declare const REPOSITORY_TOKENS: {
    readonly STREAM_REPOSITORY: "IStreamRepository";
    readonly USER_REPOSITORY: "IUserRepository";
    readonly COMMENT_REPOSITORY: "ICommentRepository";
    readonly CACHE_REPOSITORY: "ICacheRepository";
};
export declare const repositoryProviders: Provider[];
