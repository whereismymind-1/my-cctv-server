import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StreamService } from '../../application/services/stream.service';
import {
  CreateStreamDto,
  UpdateStreamDto,
  StreamQueryDto,
} from '../../application/dto/stream.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';

@Controller('api/streams')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Public()
  @Get()
  async getStreams(@Query() query: StreamQueryDto) {
    return await this.streamService.getStreams(query);
  }

  @Public()
  @Get(':id')
  async getStream(
    @Param('id') streamId: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return await this.streamService.getStream(streamId, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStream(
    @Body() dto: CreateStreamDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.streamService.createStream(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateStream(
    @Param('id') streamId: string,
    @Body() dto: UpdateStreamDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.streamService.updateStream(streamId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async startStream(
    @Param('id') streamId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.streamService.startStream(streamId, user.id);
    return {
      status: 'live',
      startedAt: new Date(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  async endStream(
    @Param('id') streamId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return await this.streamService.endStream(streamId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStream(
    @Param('id') streamId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.streamService.deleteStream(streamId, user.id);
  }
}