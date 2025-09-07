import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ModerationService } from '../../application/services/moderation.service';

interface BlockUserDto {
  userId: string;
  duration?: number; // milliseconds
  reason?: string;
}

interface ReportCommentDto {
  commentId: string;
  reason: string;
}

interface AddBannedWordDto {
  word: string;
}

@ApiTags('moderation')
@Controller('api/moderation')
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({ status: 200, description: 'Moderation statistics retrieved' })
  async getModerationStats() {
    return await this.moderationService.getModerationStats();
  }

  @Post('block')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  async blockUser(
    @CurrentUser() user: any,
    @Body() dto: BlockUserDto,
  ) {
    // TODO: Check if user has moderation permissions
    const duration = dto.duration || 3600000; // Default 1 hour
    await this.moderationService.blockUser(dto.userId, duration);
    return { message: 'User blocked successfully' };
  }

  @Delete('block/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  async unblockUser(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
  ) {
    // TODO: Check if user has moderation permissions
    await this.moderationService.unblockUser(userId);
    return { message: 'User unblocked successfully' };
  }

  @Post('report')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report a comment' })
  @ApiResponse({ status: 201, description: 'Comment reported successfully' })
  async reportComment(
    @CurrentUser() user: any,
    @Body() dto: ReportCommentDto,
  ) {
    await this.moderationService.reportComment(
      dto.commentId,
      user.id,
      dto.reason,
    );
    return { message: 'Comment reported successfully' };
  }

  @Get('banned-words')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get list of banned words' })
  @ApiResponse({ status: 200, description: 'Banned words retrieved' })
  async getBannedWords() {
    const words = this.moderationService.getBannedWords();
    return { words };
  }

  @Post('banned-words')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a banned word' })
  @ApiResponse({ status: 201, description: 'Banned word added successfully' })
  async addBannedWord(
    @CurrentUser() user: any,
    @Body() dto: AddBannedWordDto,
  ) {
    // TODO: Check if user has moderation permissions
    this.moderationService.addBannedWord(dto.word);
    return { message: 'Banned word added successfully' };
  }

  @Delete('banned-words/:word')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a banned word' })
  @ApiResponse({ status: 200, description: 'Banned word removed successfully' })
  async removeBannedWord(
    @CurrentUser() user: any,
    @Param('word') word: string,
  ) {
    // TODO: Check if user has moderation permissions
    this.moderationService.removeBannedWord(word);
    return { message: 'Banned word removed successfully' };
  }
}