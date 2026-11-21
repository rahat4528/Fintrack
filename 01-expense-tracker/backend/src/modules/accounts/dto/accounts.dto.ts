import { IsNotEmpty, IsEnum, IsString, IsOptional, IsNumberString, IsBoolean } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumberString()
  initialBalance?: string;

  @IsOptional()
  @IsString()
  colorHex?: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
