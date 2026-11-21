import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KycStatus, AccountStatus, UserRole } from '@prisma/client';

export interface ReviewKycDto {
  status: KycStatus;
  rejectionReason?: string;
  notes?: string;
}

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async listKycRecords(status?: KycStatus) {
    return this.prisma.kYCRecord.findMany({
      where: status ? { status } : undefined,
      include: {
        customerProfile: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewKycRecord(recordId: string, employeeId: string, dto: ReviewKycDto) {
    const record = await this.prisma.kYCRecord.findUnique({
      where: { id: recordId },
      include: { customerProfile: true },
    });
    if (!record) throw new NotFoundException('KYC record not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.kYCRecord.update({
        where: { id: recordId },
        data: {
          status: dto.status,
          rejectionReason: dto.rejectionReason,
          reviewedAt: new Date(),
          reviewedByEmployeeId: employeeId,
          notes: dto.notes,
        },
      });

      await tx.customerProfile.update({
        where: { id: record.customerProfileId },
        data: { kycStatus: dto.status },
      });

      return updatedRecord;
    });

    return updated;
  }

  async freezeAccount(accountId: string, employeeId: string, reason: string) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Bank account not found');
    if (account.status === AccountStatus.FROZEN) {
      throw new BadRequestException('Account is already frozen');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.bankAccount.update({
        where: { id: accountId },
        data: { status: AccountStatus.FROZEN },
      });

      await tx.monitoringAlert.create({
        data: {
          bankAccountId: accountId,
          ruleName: 'ACCOUNT_FROZEN_MANUAL',
          severity: 'HIGH',
          status: 'ACTIONED',
          description: `Account manually frozen by employee: ${reason}`,
        },
      });

      return updatedAccount;
    });
  }

  async unfreezeAccount(accountId: string, employeeId: string) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Bank account not found');
    if (account.status !== AccountStatus.FROZEN) {
      throw new BadRequestException('Account is not frozen');
    }

    return this.prisma.bankAccount.update({
      where: { id: accountId },
      data: { status: AccountStatus.ACTIVE },
    });
  }

  async listAlerts(status?: string) {
    return this.prisma.monitoringAlert.findMany({
      where: status ? { status } : undefined,
      include: {
        bankAccount: {
          select: { accountNumber: true, accountType: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveAlert(alertId: string, resolution: string) {
    const alert = await this.prisma.monitoringAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Monitoring alert not found');

    return this.prisma.monitoringAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        description: `${alert.description} | Resolution: ${resolution}`,
      },
    });
  }
}
