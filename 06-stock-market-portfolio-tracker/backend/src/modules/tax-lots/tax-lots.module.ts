import { Module } from '@nestjs/common';
import { TaxLotsService } from './tax-lots.service';
import { TaxLotsController } from './tax-lots.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TaxLotsController],
  providers: [TaxLotsService, PrismaService],
  exports: [TaxLotsService],
})
export class TaxLotsModule {}
