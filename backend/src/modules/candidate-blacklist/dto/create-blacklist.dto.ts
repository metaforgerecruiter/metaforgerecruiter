import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlacklistDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  candidateId?: string;
}
