"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositoryProviders = exports.REPOSITORY_TOKENS = void 0;
const stream_repository_1 = require("./stream.repository");
const user_repository_1 = require("./user.repository");
const comment_repository_1 = require("./comment.repository");
exports.REPOSITORY_TOKENS = {
    STREAM_REPOSITORY: 'IStreamRepository',
    USER_REPOSITORY: 'IUserRepository',
    COMMENT_REPOSITORY: 'ICommentRepository',
    CACHE_REPOSITORY: 'ICacheRepository',
};
exports.repositoryProviders = [
    {
        provide: exports.REPOSITORY_TOKENS.STREAM_REPOSITORY,
        useClass: stream_repository_1.StreamRepository,
    },
    {
        provide: exports.REPOSITORY_TOKENS.USER_REPOSITORY,
        useClass: user_repository_1.UserRepository,
    },
    {
        provide: exports.REPOSITORY_TOKENS.COMMENT_REPOSITORY,
        useClass: comment_repository_1.CommentRepository,
    },
];
//# sourceMappingURL=repository.providers.js.map