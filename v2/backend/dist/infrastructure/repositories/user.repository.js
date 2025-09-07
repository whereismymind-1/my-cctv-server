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
    async findAll(filter) {
        const where = {};
        let take = undefined;
        let skip = undefined;
        if (filter) {
            if (filter.level !== undefined) {
                where.level = filter.level;
            }
            if (filter.minLevel !== undefined) {
                where.level = { $gte: filter.minLevel };
            }
            if (filter.search) {
                where.username = { $like: `%${filter.search}%` };
            }
            if (filter.isActive !== undefined) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                if (filter.isActive) {
                    where.lastLoginAt = { $gte: thirtyDaysAgo };
                }
            }
        }
        const entities = await this.repository.find({
            where,
            take,
            skip,
            order: { createdAt: 'DESC' },
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async findByRefreshToken(refreshToken) {
        const entity = await this.repository.findOne({
            where: { refreshToken }
        });
        return entity ? this.toDomain(entity) : null;
    }
    async updateRefreshToken(userId, refreshToken) {
        await this.repository.update(userId, { refreshToken });
    }
    async updateLastLogin(userId) {
        await this.repository.update(userId, {
            lastLoginAt: new Date()
        });
    }
    async updateLevel(userId, level) {
        await this.repository.update(userId, { level });
    }
    async incrementExp(userId, amount) {
        await this.repository.increment({ id: userId }, 'exp', amount);
    }
    async updateAvatar(userId, avatarUrl) {
        await this.repository.update(userId, { avatarUrl });
    }
    async updatePassword(userId, passwordHash) {
        await this.repository.update(userId, { passwordHash });
    }
    async countUsers() {
        return await this.repository.count();
    }
    async searchUsers(searchTerm, limit) {
        const query = this.repository.createQueryBuilder('user')
            .where('user.username ILIKE :search OR user.email ILIKE :search', {
            search: `%${searchTerm}%`
        })
            .orderBy('user.username', 'ASC');
        if (limit) {
            query.limit(limit);
        }
        const entities = await query.getMany();
        return entities.map(entity => this.toDomain(entity));
    }
    async findActiveUsers(days, limit) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const query = this.repository.createQueryBuilder('user')
            .where('user.lastLoginAt >= :date', { date })
            .orderBy('user.lastLoginAt', 'DESC');
        if (limit) {
            query.limit(limit);
        }
        const entities = await query.getMany();
        return entities.map(entity => this.toDomain(entity));
    }
    async getUserStats(userId) {
        const user = await this.repository.findOne({ where: { id: userId } });
        if (!user)
            return null;
        return {
            level: user.level,
            exp: user.exp || 0,
            joinedAt: user.createdAt,
            lastLoginAt: user.lastLoginAt || user.updatedAt,
        };
    }
    async updateExperience(id, exp) {
        await this.repository.update(id, { exp });
    }
    async getTopUsers(limit) {
        const entities = await this.repository.find({
            order: { level: 'DESC' },
            take: limit,
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async updateWatchTime(id, seconds) {
        await this.repository.query(`UPDATE user_entity SET watch_time = watch_time + $1 WHERE id = $2`, [seconds, id]);
    }
    async incrementStreamCount(id) {
        await this.repository.query(`UPDATE user_entity SET stream_count = COALESCE(stream_count, 0) + 1 WHERE id = $1`, [id]);
    }
    async getStatsByTimeRange(startDate, endDate) {
        const result = await this.repository.createQueryBuilder('user')
            .where('user.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .getCount();
        return {
            newUsers: result,
            startDate,
            endDate,
        };
    }
    async findOnlineUsers() {
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        const entities = await this.repository.find({
            where: {
                updatedAt: { $gte: fiveMinutesAgo },
            },
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async incrementCommentCount(id) {
        await this.repository.query(`UPDATE user_entity SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = $1`, [id]);
    }
    async verifyEmail(id) {
        await this.repository.update(id, {
            emailVerified: true,
        });
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