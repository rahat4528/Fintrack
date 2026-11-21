import { Controller, Post, Get, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ImportExportService } from './import-export.service';
import { JwtAuthGuard } from '../../common/jwt.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/current-user.decorator';
import { Response } from 'express';
import { TransactionType } from '@prisma/client';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Post('import/csv/preview')
  previewCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      csvContent: string;
      mapping: {
        dateCol: string;
        amountCol: string;
        descCol: string;
        typeCol?: string;
        categoryCol?: string;
      };
    },
  ) {
    return this.importExportService.previewCsv(user.id, body.csvContent, body.mapping);
  }

  @Post('import/csv/commit')
  commitImport(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      accountId: string;
      filename: string;
      validRecords: Array<{
        contentHash: string;
        transactionDate: string;
        amount: string;
        type: TransactionType;
        description: string;
        categoryId?: string;
      }>;
    },
  ) {
    return this.importExportService.commitImport(
      user.id,
      body.accountId,
      body.filename,
      body.validRecords,
    );
  }

  @Post('import/batch/:id/undo')
  undoBatch(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.importExportService.undoBatch(user.id, id);
  }

  @Get('export/csv')
  async exportCsv(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csvData = await this.importExportService.exportCsv(user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csvData);
  }
}
