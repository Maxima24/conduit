import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SEND_STATUS, type ListSendsQuery, type SendStatus } from '@conduit/contracts';

export class ListSendsQueryDto implements ListSendsQuery {
  @IsOptional()
  @IsIn([...SEND_STATUS])
  status?: SendStatus;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
