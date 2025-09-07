import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'testuser',
    description: '사용자명 (3-20자, 영문/숫자/언더스코어)',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({
    example: 'user@example.com',
    description: '이메일 주소',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호 (최소 8자)',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '이메일 주소',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호',
  })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  user: {
    id: string;
    username: string;
    email: string;
    level: number;
    avatarUrl?: string;
  };
  token: string;
}

export class TokenPayload {
  sub: string; // User ID
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}