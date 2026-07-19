import { IsOptional, IsString } from 'class-validator';
import type { ReconcileQuery } from '@conduit/contracts';

export class ReconcileQueryDto implements ReconcileQuery {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
