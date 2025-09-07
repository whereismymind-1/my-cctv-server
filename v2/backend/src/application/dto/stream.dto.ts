import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';

export enum StreamStatus {
  WAITING = 'waiting',
  LIVE = 'live',
  ENDED = 'ended',
}

export class StreamSettingsDto {
  @IsBoolean()
  @IsOptional()
  allowComments?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(60000)
  commentCooldown?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  maxCommentLength?: number;

  @IsBoolean()
  @IsOptional()
  allowAnonymous?: boolean;
}

export class CreateStreamDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsOptional()
  settings?: StreamSettingsDto;
}

export class UpdateStreamDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsOptional()
  settings?: StreamSettingsDto;
}

export class StreamQueryDto {
  @IsEnum(StreamStatus)
  @IsOptional()
  status?: StreamStatus;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;
}

export class StreamResponseDto {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  viewerCount: number;
  status: StreamStatus;
  settings?: {
    allowComments: boolean;
    commentCooldown: number;
    maxCommentLength: number;
    allowAnonymous: boolean;
  };
  streamKey?: string; // Only for owner
  streamUrl?: string; // Only for owner
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}