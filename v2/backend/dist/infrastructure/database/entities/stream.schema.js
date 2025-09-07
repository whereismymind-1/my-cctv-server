"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamEntity = void 0;
const typeorm_1 = require("typeorm");
const user_schema_1 = require("./user.schema");
let StreamEntity = class StreamEntity {
};
exports.StreamEntity = StreamEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StreamEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_id', type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], StreamEntity.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_schema_1.UserEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_schema_1.UserEntity)
], StreamEntity.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], StreamEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StreamEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], StreamEntity.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stream_key', length: 100, unique: true, nullable: true }),
    __metadata("design:type", String)
], StreamEntity.prototype, "streamKey", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: 'waiting',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], StreamEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'viewer_count', default: 0 }),
    __metadata("design:type", Number)
], StreamEntity.prototype, "viewerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_viewers', default: 0 }),
    __metadata("design:type", Number)
], StreamEntity.prototype, "maxViewers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allow_comments', default: true }),
    __metadata("design:type", Boolean)
], StreamEntity.prototype, "allowComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comment_cooldown', default: 1000 }),
    __metadata("design:type", Number)
], StreamEntity.prototype, "commentCooldown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_comment_length', default: 200 }),
    __metadata("design:type", Number)
], StreamEntity.prototype, "maxCommentLength", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'allow_anonymous', default: false }),
    __metadata("design:type", Boolean)
], StreamEntity.prototype, "allowAnonymous", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StreamEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ended_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StreamEntity.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], StreamEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], StreamEntity.prototype, "updatedAt", void 0);
exports.StreamEntity = StreamEntity = __decorate([
    (0, typeorm_1.Entity)('streams')
], StreamEntity);
//# sourceMappingURL=stream.schema.js.map