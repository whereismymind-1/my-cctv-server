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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_schema_1 = require("../../infrastructure/database/entities/user.schema");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
const public_decorator_1 = require("../decorators/public.decorator");
let HealthController = class HealthController {
    constructor(userRepository, redisService) {
        this.userRepository = userRepository;
        this.redisService = redisService;
    }
    async healthCheck() {
        const dbHealth = await this.checkDatabase();
        const redisHealth = await this.checkRedis();
        const isHealthy = dbHealth && redisHealth;
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date(),
            uptime: process.uptime(),
            services: {
                database: dbHealth,
                redis: redisHealth,
            },
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
    }
    async readinessCheck() {
        const dbHealth = await this.checkDatabase();
        const redisHealth = await this.checkRedis();
        return {
            ready: dbHealth && redisHealth,
            services: {
                database: dbHealth,
                redis: redisHealth,
            },
        };
    }
    async livenessCheck() {
        return {
            alive: true,
            timestamp: new Date(),
        };
    }
    async checkDatabase() {
        try {
            await this.userRepository.query('SELECT 1');
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    async checkRedis() {
        try {
            const client = this.redisService.getClient();
            const result = await client.ping();
            return result === 'PONG';
        }
        catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is unhealthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "healthCheck", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('ready'),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness check endpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is ready' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is not ready' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "readinessCheck", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness check endpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is alive' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "livenessCheck", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __param(0, (0, typeorm_1.InjectRepository)(user_schema_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redis_service_1.RedisService])
], HealthController);
//# sourceMappingURL=health.controller.js.map