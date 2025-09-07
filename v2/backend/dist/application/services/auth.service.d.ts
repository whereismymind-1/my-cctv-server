import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterDto, LoginDto, AuthResponseDto, TokenPayload } from '../dto/auth.dto';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly configService;
    constructor(userRepository: IUserRepository, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    login(dto: LoginDto): Promise<AuthResponseDto>;
    validateUser(userId: string): Promise<User | null>;
    refreshToken(userId: string): Promise<string>;
    private generateToken;
    verifyToken(token: string): Promise<TokenPayload>;
}
