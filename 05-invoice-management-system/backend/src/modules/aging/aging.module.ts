import { Module } from '@nestjs/common';
import { AgingService } from './aging.service';
import { AgingController } from './aging.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AgingController],
  providers: [AgingService, PrismaService],
  exports: [AgingService],
})
export class AgingModule {}
