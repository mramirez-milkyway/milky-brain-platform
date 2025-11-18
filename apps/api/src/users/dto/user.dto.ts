import { IsEmail, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator'
import { UserStatus } from '@prisma/client'

export class InviteUserDto {
  @IsEmail()
  email: string

  @IsString()
  @IsOptional()
  name?: string

  @IsNumber()
  @IsOptional()
  roleId?: number
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus
}
