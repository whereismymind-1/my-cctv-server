import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamService } from '../application/services/stream.service';
import { StreamController } from '../presentation/controllers/stream.controller';
import { StreamRepository } from '../infrastructure/repositories/stream.repository';
import { StreamEntity } from '../infrastructure/database/entities/stream.schema';
import { UserEntity } from '../infrastructure/database/entities/user.schema';

@Module({
  imports: [TypeOrmModule.forFeature([StreamEntity, UserEntity])],
  controllers: [StreamController],
  providers: [
    StreamService,
    {
      provide: 'IStreamRepository',
      useClass: StreamRepository,
    },
    StreamRepository,
  ],
  exports: [StreamService],
})
export class StreamModule {}
