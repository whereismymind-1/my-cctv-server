"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const morgan_1 = require("morgan");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:5173');
    const vitePorts = Array.from({ length: 10 }, (_, i) => 5170 + i);
    const allowedOrigins = [
        ...vitePorts.map((p) => `http://localhost:${p}`),
        ...vitePorts.map((p) => `http://127.0.0.1:${p}`),
    ];
    if (corsOrigin && !allowedOrigins.includes(corsOrigin)) {
        allowedOrigins.push(corsOrigin);
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.use((0, morgan_1.default)('combined'));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin))
                return callback(null, true);
            return callback(new Error('Not allowed by CORS'), false);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map