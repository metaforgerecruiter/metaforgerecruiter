import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  clientName?: string;

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
  @IsNumber()
  deliveryGapScore?: number;

  @IsOptional()
  @IsString()
  agreementsUrl?: string;
}
