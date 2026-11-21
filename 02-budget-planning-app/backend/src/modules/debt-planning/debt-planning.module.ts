import { Module } from '@nestjs/common';
import { DebtPlanningService } from './debt-planning.service';
import { DebtPlanningController } from './debt-planning.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DebtPlanningController],
  providers: [DebtPlanningService, PrismaService],
  exports: [DebtPlanningService],
})
export class DebtPlanningModule {}
