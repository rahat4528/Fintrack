import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AgingModule } from './modules/aging/aging.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    InvoicesModule,
    PaymentsModule,
    AgingModule,
    QuotationsModule,
    ClientsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
