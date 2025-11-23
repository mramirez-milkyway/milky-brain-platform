import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { Type } from 'class-transformer'

@ValidatorConstraint({ name: 'dailyNotExceedMonthly', async: false })
class DailyNotExceedMonthlyConstraint implements ValidatorConstraintInterface {
  validate(dailyLimit: number | null | undefined, args: ValidationArguments): boolean {
    const object = args.object as CreateExportControlDto
    const monthlyLimit = object.monthlyLimit

    // If either is null or undefined, validation passes
    if (
      dailyLimit === null ||
      dailyLimit === undefined ||
      monthlyLimit === null ||
      monthlyLimit === undefined
    ) {
      return true
    }

    // Daily limit must not exceed monthly limit
    return dailyLimit <= monthlyLimit
  }

  defaultMessage(): string {
    return 'Daily limit cannot exceed monthly limit'
  }
}

@ValidatorConstraint({ name: 'rowLimitValid', async: false })
class RowLimitValidConstraint implements ValidatorConstraintInterface {
  validate(rowLimit: number): boolean {
    // Must be -1 (unlimited) or positive number
    return rowLimit === -1 || rowLimit > 0
  }

  defaultMessage(): string {
    return 'Row limit must be -1 (unlimited) or a positive number'
  }
}

export class CreateExportControlDto {
  @IsInt()
  @Min(1)
  roleId: number

  @IsString()
  exportType: string

  @IsInt()
  @Validate(RowLimitValidConstraint)
  rowLimit: number

  @IsBoolean()
  enableWatermark: boolean

  @IsOptional()
  @IsInt()
  @Min(1)
  @Validate(DailyNotExceedMonthlyConstraint)
  dailyLimit?: number | null

  @IsOptional()
  @IsInt()
  @Min(1)
  monthlyLimit?: number | null
}
