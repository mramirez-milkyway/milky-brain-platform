import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreatePolicyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  statements: any[];
}
