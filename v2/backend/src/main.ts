import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import morgan from 'morgan';
import { GlobalExceptionFilter } from './infrastructure/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  
  // Allow localhost:5170-5179 (Vite dev ports)
  const vitePorts = Array.from({ length: 10 }, (_, i) => 5170 + i);
  const allowedOrigins = [
    ...vitePorts.map((p) => `http://localhost:${p}`),
    ...vitePorts.map((p) => `http://127.0.0.1:${p}`),
  ];
  if (corsOrigin && !allowedOrigins.includes(corsOrigin)) {
    allowedOrigins.push(corsOrigin);
  }

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // HTTP request logging
  app.use(morgan('combined'));

  // CORS configuration
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Swagger documentation
  // Swagger temporarily disabled due to module conflict
  // if (configService.get<string>('NODE_ENV') !== 'production') {
  //   const config = new DocumentBuilder()
  //     .setTitle('Danmaku Live Streaming API')
  //     .setDescription('니코니코/티비플 스타일 실시간 댓글 스트리밍 서비스 API')
  //     .setVersion('1.0')
  //     .addBearerAuth()
  //     .addTag('auth', '인증 관련 API')
  //     .addTag('streams', '스트림 관련 API')
  //     .addTag('comments', '댓글 관련 API')
  //     .addTag('health', '헬스체크 API')
  //     .build();

  //   const document = SwaggerModule.createDocument(app, config);
  //   SwaggerModule.setup('api-docs', app, document, {
  //     swaggerOptions: {
  //       persistAuthorization: true,
  //     },
  //   });

  //   console.log(`📚 API Documentation available at http://localhost:${port}/api-docs`);
  // }

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}

bootstrap();
