import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  tier?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  slaDays?: number;

  @IsOptional()
  @IsArray()
  pocContacts?: Array<{ name: string; email: string; phone?: string; designation?: string }>;

  @IsOptional()
  @IsString()
  accountLeadId?: string;

  @IsOptional()
  @IsString()
  agreementsUrl?: string;
}
