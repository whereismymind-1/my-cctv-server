import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');

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

  // CORS configuration
  app.enableCors({
    origin: corsOrigin,
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