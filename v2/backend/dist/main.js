"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:5173');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.enableCors({
        origin: corsOrigin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    if (configService.get('NODE_ENV') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Danmaku Live Streaming API')
            .setDescription('니코니코/티비플 스타일 실시간 댓글 스트리밍 서비스 API')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('auth', '인증 관련 API')
            .addTag('streams', '스트림 관련 API')
            .addTag('comments', '댓글 관련 API')
            .addTag('health', '헬스체크 API')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api-docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });
        console.log(`📚 API Documentation available at http://localhost:${port}/api-docs`);
    }
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map