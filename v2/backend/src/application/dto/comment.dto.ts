import { IsString, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';

export class SendCommentDto {
  @IsString()
  streamId: string;

  @IsString()
  @MaxLength(200)
  text: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  command?: string;
}

export class CommentQueryDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 100;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class CommentResponseDto {
  id: string;
  text: string;
  command?: string;
  user: {
    id: string;
    username: string;
    level: number;
  };
  style: {
    position: 'scroll' | 'top' | 'bottom';
    color: string;
    size: 'small' | 'medium' | 'big';
  };
  lane: number;
  x: number;
  y: number;
  speed: number;
  duration: number;
  vpos?: number;
  createdAt: Date;
}