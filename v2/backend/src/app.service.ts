import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Danmaku Live Streaming Service API v1.0';
  }
}