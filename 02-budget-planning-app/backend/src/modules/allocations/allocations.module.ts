import { Module } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { AllocationsController } from './allocations.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AllocationsController],
  providers: [AllocationsService, PrismaService],
  exports: [AllocationsService],
})
export class AllocationsModule {}
