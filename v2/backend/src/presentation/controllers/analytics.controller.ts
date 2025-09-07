import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AnalyticsService } from '../../application/services/analytics.service';

interface TrackEventDto {
  streamId: string;
  event: 'join' | 'leave' | 'comment' | 'reaction';
  metadata?: any;
}

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track viewer event' })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  async trackEvent(
    @CurrentUser() user: any,
    @Body() dto: TrackEventDto,
  ) {
    await this.analyticsService.trackViewerEvent({
      userId: user?.id || null,
      streamId: dto.streamId,
      event: dto.event,
      timestamp: new Date(),
      metadata: dto.metadata,
    });
  }

  @Get('stream/:streamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stream analytics' })
  @ApiResponse({ status: 200, description: 'Stream analytics retrieved' })
  async getStreamAnalytics(
    @Param('streamId') streamId: string,
  ) {
    const metrics = await this.analyticsService.getStreamMetrics(streamId);
    return { success: true, data: metrics };
  }

  @Get('viewer/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get viewer analytics' })
  @ApiResponse({ status: 200, description: 'Viewer analytics retrieved' })
  async getViewerAnalytics(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    // Users can only view their own analytics unless they're admin
    if (userId !== user.id && user.role !== 'admin') {
      userId = user.id;
    }
    
    const analytics = await this.analyticsService.getViewerAnalytics(userId);
    return { success: true, data: analytics };
  }

  @Get('platform')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Platform analytics retrieved' })
  async getPlatformAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const analytics = await this.analyticsService.getPlatformAnalytics(start, end);
    return { success: true, data: analytics };
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard() {
    const dashboard = await this.analyticsService.getRealTimeDashboard();
    return { success: true, data: dashboard };
  }

  @Get('export/:streamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiResponse({ status: 200, description: 'Analytics data exported' })
  async exportAnalytics(
    @Param('streamId') streamId: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @CurrentUser() user: any,
  ) {
    // Check if user owns the stream or is admin
    // TODO: Add permission check
    
    const data = await this.analyticsService.exportAnalytics(streamId, format);
    
    return {
      success: true,
      data,
      format,
      filename: `analytics_${streamId}_${Date.now()}.${format}`,
    };
  }
}