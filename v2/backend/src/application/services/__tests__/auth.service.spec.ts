import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = new User(
    'user-id-123',
    'testuser',
    'test@example.com',
    'hashedpassword',
    null,
    1,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      existsByUsername: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get('IUserRepository');
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    configService.get.mockReturnValue('7d');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      userRepository.exists.mockResolvedValue(false);
      userRepository.existsByUsername.mockResolvedValue(false);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        level: mockUser.level,
        avatarUrl: mockUser.avatarUrl,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.exists.mockResolvedValue(true);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      userRepository.exists.mockResolvedValue(false);
      userRepository.existsByUsername.mockResolvedValue(true);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        level: mockUser.level,
        avatarUrl: mockUser.avatarUrl,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-id-123');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.validateUser('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should return payload for valid token', async () => {
      const payload = { sub: 'user-id', username: 'testuser', email: 'test@example.com' };
      jwtService.verify.mockReturnValue(payload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});