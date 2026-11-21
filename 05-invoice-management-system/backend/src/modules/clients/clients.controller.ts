import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ClientsService, CreateClientDto } from './clients.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedInvoiceUser } from '../../common/current-user.decorator';

@Controller('api/v1/clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  listClients(@CurrentUser() user: AuthenticatedInvoiceUser) {
    return this.clientsService.listClients(user.organizationId);
  }

  @Post()
  createClient(
    @CurrentUser() user: AuthenticatedInvoiceUser,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.createClient(user.organizationId, dto);
  }
}
