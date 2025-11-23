import { IsInt, IsString, IsBoolean, IsOptional, Min, Validate } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateExportControlDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  roleId?: number

  @IsOptional()
  @IsString()
  exportType?: string

  @IsOptional()
  @IsInt()
  rowLimit?: number

  @IsOptional()
  @IsBoolean()
  enableWatermark?: boolean

  @IsOptional()
  @IsInt()
  @Min(1)
  dailyLimit?: number | null

  @IsOptional()
  @IsInt()
  @Min(1)
  monthlyLimit?: number | null
}
