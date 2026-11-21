import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService, SetLimitDto } from './admin.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('limits')
  listLimits() {
    return this.adminService.listLimits();
  }

  @Post('limits')
  setLimit(@Body() dto: SetLimitDto) {
    return this.adminService.setLimit(dto);
  }

  @Get('audit-logs')
  listAuditLogs(@Query('limit') limit?: string) {
    return this.adminService.listAuditLogs(limit ? parseInt(limit, 10) : 100);
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('users/:id/lock')
  toggleLockUser(@Param('id') id: string, @Body('isLocked') isLocked: boolean) {
    return this.adminService.toggleLockUser(id, isLocked);
  }
}
