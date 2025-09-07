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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../../domain/entities/user.entity");
let AuthService = class AuthService {
    constructor(userRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const emailExists = await this.userRepository.exists(dto.email);
        if (emailExists) {
            throw new common_1.ConflictException('Email already registered');
        }
        const usernameExists = await this.userRepository.existsByUsername(dto.username);
        if (usernameExists) {
            throw new common_1.ConflictException('Username already taken');
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);
        const user = user_entity_1.User.create(dto.username, dto.email, passwordHash);
        const savedUser = await this.userRepository.save(user);
        const token = await this.generateToken(savedUser);
        return {
            user: {
                id: savedUser.id,
                username: savedUser.username,
                email: savedUser.email,
                level: savedUser.level,
                avatarUrl: savedUser.avatarUrl ?? undefined,
            },
            token,
        };
    }
    async login(dto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const token = await this.generateToken(user);
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                level: user.level,
                avatarUrl: user.avatarUrl ?? undefined,
            },
            token,
        };
    }
    async validateUser(userId) {
        return await this.userRepository.findById(userId);
    }
    async refreshToken(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return await this.generateToken(user);
    }
    async generateToken(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
        };
        return this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
        });
    }
    async verifyToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map