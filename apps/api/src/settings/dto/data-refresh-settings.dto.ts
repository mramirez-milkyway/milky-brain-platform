import {
  IsInt,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { Type } from 'class-transformer'

@ValidatorConstraint({ name: 'basicNotExceedAudience', async: false })
class BasicNotExceedAudienceConstraint implements ValidatorConstraintInterface {
  validate(basicDataDays: number, args: ValidationArguments): boolean {
    const object = args.object as NetworkThresholdDto
    const audienceDataDays = object.audienceDataDays

    // If audience is not set, skip this validation (will be caught by required validation)
    if (audienceDataDays === undefined) {
      return true
    }

    return basicDataDays <= audienceDataDays
  }

  defaultMessage(): string {
    return 'Basic data threshold cannot exceed audience data threshold'
  }
}

export class NetworkThresholdDto {
  @IsInt()
  @Min(1, { message: 'Threshold must be at least 1 day' })
  @Max(365, { message: 'Threshold cannot exceed 365 days' })
  @Validate(BasicNotExceedAudienceConstraint)
  basicDataDays: number

  @IsInt()
  @Min(1, { message: 'Threshold must be at least 1 day' })
  @Max(365, { message: 'Threshold cannot exceed 365 days' })
  audienceDataDays: number
}

export class UpdateDataRefreshSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NetworkThresholdDto)
  instagram?: NetworkThresholdDto

  @IsOptional()
  @ValidateNested()
  @Type(() => NetworkThresholdDto)
  tiktok?: NetworkThresholdDto

  @IsOptional()
  @ValidateNested()
  @Type(() => NetworkThresholdDto)
  youtube?: NetworkThresholdDto
}

export interface DataRefreshSettingsResponse {
  instagram: NetworkThresholdDto
  tiktok: NetworkThresholdDto
  youtube: NetworkThresholdDto
}

export const DEFAULT_THRESHOLDS: NetworkThresholdDto = {
  basicDataDays: 30,
  audienceDataDays: 180,
}
