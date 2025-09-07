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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../domain/entities/user.entity");
const user_schema_1 = require("../database/entities/user.schema");
let UserRepository = class UserRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async findById(id) {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toDomain(entity) : null;
    }
    async findByEmail(email) {
        const entity = await this.repository.findOne({ where: { email } });
        return entity ? this.toDomain(entity) : null;
    }
    async findByUsername(username) {
        const entity = await this.repository.findOne({ where: { username } });
        return entity ? this.toDomain(entity) : null;
    }
    async save(user) {
        const entity = this.toEntity(user);
        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }
    async update(user) {
        const entity = this.toEntity(user);
        const updated = await this.repository.save(entity);
        return this.toDomain(updated);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async exists(email) {
        const count = await this.repository.count({ where: { email } });
        return count > 0;
    }
    async existsByUsername(username) {
        const count = await this.repository.count({ where: { username } });
        return count > 0;
    }
    toDomain(entity) {
        return new user_entity_1.User(entity.id, entity.username, entity.email, entity.passwordHash, entity.avatarUrl, entity.level, entity.createdAt, entity.updatedAt);
    }
    toEntity(domain) {
        const entity = new user_schema_1.UserEntity();
        if (domain.id)
            entity.id = domain.id;
        entity.username = domain.username;
        entity.email = domain.email;
        entity.passwordHash = domain.passwordHash;
        entity.avatarUrl = domain.avatarUrl || '';
        entity.level = domain.level;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt;
        return entity;
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_schema_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserRepository);
//# sourceMappingURL=user.repository.js.map