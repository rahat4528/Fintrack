import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AlertsService, CreateAlertDto } from './alerts.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedCryptoUser } from '../../common/current-user.decorator';

@Controller('api/v1/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  listAlerts(@CurrentUser() user: AuthenticatedCryptoUser) {
    return this.alertsService.listUserAlerts(user.id);
  }

  @Post()
  createAlert(
    @CurrentUser() user: AuthenticatedCryptoUser,
    @Body() dto: CreateAlertDto,
  ) {
    return this.alertsService.createAlert(user.id, dto);
  }

  @Delete(':id')
  deleteAlert(
    @CurrentUser() user: AuthenticatedCryptoUser,
    @Param('id') id: string,
  ) {
    return this.alertsService.deleteAlert(user.id, id);
  }

  @Post('evaluate')
  evaluate() {
    return this.alertsService.evaluateAlerts();
  }
}
