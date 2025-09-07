"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const stream_service_1 = require("../application/services/stream.service");
const stream_controller_1 = require("../presentation/controllers/stream.controller");
const stream_repository_1 = require("../infrastructure/repositories/stream.repository");
const stream_schema_1 = require("../infrastructure/database/entities/stream.schema");
const user_schema_1 = require("../infrastructure/database/entities/user.schema");
let StreamModule = class StreamModule {
};
exports.StreamModule = StreamModule;
exports.StreamModule = StreamModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([stream_schema_1.StreamEntity, user_schema_1.UserEntity])],
        controllers: [stream_controller_1.StreamController],
        providers: [
            stream_service_1.StreamService,
            {
                provide: 'IStreamRepository',
                useClass: stream_repository_1.StreamRepository,
            },
            stream_repository_1.StreamRepository,
        ],
        exports: [stream_service_1.StreamService],
    })
], StreamModule);
//# sourceMappingURL=stream.module.js.map