import { Module } from '@nestjs/common';
import { SecuritiesService } from './securities.service';
import { SecuritiesController } from './securities.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SecuritiesController],
  providers: [SecuritiesService, PrismaService],
  exports: [SecuritiesService],
})
export class SecuritiesModule {}
