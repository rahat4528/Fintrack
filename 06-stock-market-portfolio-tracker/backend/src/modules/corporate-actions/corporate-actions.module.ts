import { Module } from '@nestjs/common';
import { CorporateActionsService } from './corporate-actions.service';
import { CorporateActionsController } from './corporate-actions.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CorporateActionsController],
  providers: [CorporateActionsService, PrismaService],
  exports: [CorporateActionsService],
})
export class CorporateActionsModule {}
