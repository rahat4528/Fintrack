import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateClientDto {
  name: string;
  email: string;
  phone?: string;
  taxNumber?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listClients(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organizationId },
      include: {
        _count: { select: { invoices: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createClient(organizationId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        organizationId,
        ...dto,
      },
    });
  }
}
