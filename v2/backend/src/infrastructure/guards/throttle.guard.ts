import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerOptions,
    storageService: any,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected getTracker(req: Record<string, any>): string {
    // Use IP address as the tracker
    // Consider X-Forwarded-For header for proxied requests
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    
    // If user is authenticated, combine IP with user ID for more granular control
    if (req.user && req.user.id) {
      return `${ip}-${req.user.id}`;
    }
    
    return ip;
  }

  protected generateKey(context: ExecutionContext, tracker: string): string {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;
    
    // Create unique key based on route and tracker
    return `${route}-${tracker}`;
  }
}