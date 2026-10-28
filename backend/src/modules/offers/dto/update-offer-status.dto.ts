import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOfferStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  declinedReason?: string;

  @IsOptional()
  @IsString()
  notJoinedNote?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
