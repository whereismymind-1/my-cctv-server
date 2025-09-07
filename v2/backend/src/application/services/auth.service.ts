import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterDto, LoginDto, AuthResponseDto, TokenPayload } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const emailExists = await this.userRepository.exists(dto.email);
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const usernameExists = await this.userRepository.existsByUsername(dto.username);
    if (usernameExists) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Create user
    const user = User.create(dto.username, dto.email, passwordHash);
    const savedUser = await this.userRepository.save(user);

    // Generate token
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

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
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

  async validateUser(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }

  async refreshToken(userId: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return await this.generateToken(user);
  }

  private async generateToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    });
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}