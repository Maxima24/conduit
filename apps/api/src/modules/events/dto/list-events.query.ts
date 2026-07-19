import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EVENT_STATUS, type EventStatus, type ListEventsQuery } from '@conduit/contracts';

export class ListEventsQueryDto implements ListEventsQuery {
  @IsOptional()
  @IsIn([...EVENT_STATUS])
  status?: EventStatus;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
