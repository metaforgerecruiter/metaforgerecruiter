import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateBlacklistDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  candidateId?: string;
}
