import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EmployeeService, ReviewKycDto } from './employee.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthenticatedBankingUser } from '../../common/current-user.decorator';
import { UserRole, KycStatus } from '@prisma/client';

@Controller('api/v1/employee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('kyc')
  listKyc(@Query('status') status?: KycStatus) {
    return this.employeeService.listKycRecords(status);
  }

  @Post('kyc/:id/review')
  reviewKyc(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedBankingUser,
    @Body() dto: ReviewKycDto,
  ) {
    return this.employeeService.reviewKycRecord(id, user.id, dto);
  }

  @Post('accounts/:id/freeze')
  freezeAccount(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedBankingUser,
    @Body('reason') reason: string,
  ) {
    return this.employeeService.freezeAccount(id, user.id, reason || 'Suspicious activity lock');
  }

  @Post('accounts/:id/unfreeze')
  unfreezeAccount(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedBankingUser,
  ) {
    return this.employeeService.unfreezeAccount(id, user.id);
  }

  @Get('alerts')
  listAlerts(@Query('status') status?: string) {
    return this.employeeService.listAlerts(status);
  }

  @Post('alerts/:id/resolve')
  resolveAlert(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
  ) {
    return this.employeeService.resolveAlert(id, resolution || 'Reviewed and dismissed');
  }
}
