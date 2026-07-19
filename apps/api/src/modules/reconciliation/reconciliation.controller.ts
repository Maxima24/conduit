import { Controller, Get, Query } from '@nestjs/common';
import type { ReconcileReportDto } from '@conduit/contracts';
import { ReconciliationService } from './reconciliation.service';
import { ReconcileQueryDto } from './dto/reconcile.query';

@Controller('reconcile')
export class ReconciliationController {
  constructor(private readonly reconciliation: ReconciliationService) {}

  @Get()
  report(@Query() query: ReconcileQueryDto): Promise<ReconcileReportDto> {
    return this.reconciliation.getReport(query);
  }
}
