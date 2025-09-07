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
exports.StreamResponseDto = exports.StreamQueryDto = exports.UpdateStreamDto = exports.CreateStreamDto = exports.StreamSettingsDto = exports.StreamStatus = void 0;
const class_validator_1 = require("class-validator");
var StreamStatus;
(function (StreamStatus) {
    StreamStatus["WAITING"] = "waiting";
    StreamStatus["LIVE"] = "live";
    StreamStatus["ENDED"] = "ended";
})(StreamStatus || (exports.StreamStatus = StreamStatus = {}));
class StreamSettingsDto {
}
exports.StreamSettingsDto = StreamSettingsDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], StreamSettingsDto.prototype, "allowComments", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(60000),
    __metadata("design:type", Number)
], StreamSettingsDto.prototype, "commentCooldown", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], StreamSettingsDto.prototype, "maxCommentLength", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], StreamSettingsDto.prototype, "allowAnonymous", void 0);
class CreateStreamDto {
}
exports.CreateStreamDto = CreateStreamDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateStreamDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateStreamDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStreamDto.prototype, "thumbnail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", StreamSettingsDto)
], CreateStreamDto.prototype, "settings", void 0);
class UpdateStreamDto {
}
exports.UpdateStreamDto = UpdateStreamDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateStreamDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateStreamDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStreamDto.prototype, "thumbnail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", StreamSettingsDto)
], UpdateStreamDto.prototype, "settings", void 0);
class StreamQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.StreamQueryDto = StreamQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(StreamStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StreamQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], StreamQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], StreamQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StreamQueryDto.prototype, "search", void 0);
class StreamResponseDto {
}
exports.StreamResponseDto = StreamResponseDto;
//# sourceMappingURL=stream.dto.js.map