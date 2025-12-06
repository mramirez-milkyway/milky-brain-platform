import { IsString, IsOptional, IsObject, IsInt, Min, Max } from 'class-validator';

export class CreateJobDto {
  @IsString()
  jobType: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  queue?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;
}
