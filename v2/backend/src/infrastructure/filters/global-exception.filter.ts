import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
  path?: string;
  method?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        details = responseObj.details || responseObj.error;
      }

      // Map status codes to error codes
      errorCode = this.getErrorCode(status);
    } else if (exception instanceof Error) {
      // Handle regular Error objects
      message = exception.message;
      
      // Check for specific error types
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
      } else if (exception.name === 'MongoError' || exception.name === 'QueryFailedError') {
        // Database errors
        if (exception.message.includes('duplicate')) {
          status = HttpStatus.CONFLICT;
          errorCode = 'CONFLICT';
          message = 'Resource already exists';
        } else {
          errorCode = 'DATABASE_ERROR';
          message = 'Database operation failed';
        }
      }
    }

    // Log the error
    this.logError(exception, request, status);

    // Build error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(process.env.NODE_ENV === 'development' && details && { details }),
      },
      timestamp: Date.now(),
      ...(process.env.NODE_ENV === 'development' && {
        path: request.url,
        method: request.method,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const errorCodeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
      [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
      [HttpStatus.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
    };

    return errorCodeMap[status] || 'UNKNOWN_ERROR';
  }

  private logError(exception: unknown, request: Request, status: number) {
    const logContext = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      status,
    };

    if (status >= 500) {
      // Log server errors with full stack trace
      this.logger.error(
        'Server Error',
        exception instanceof Error ? exception.stack : exception,
        logContext,
      );
    } else if (status >= 400) {
      // Log client errors without stack trace
      this.logger.warn(
        `Client Error: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        logContext,
      );
    }
  }
}