import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class UpdateOfferDto {
  @IsOptional()
  @IsNumber()
  offeredCtc?: number;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  declinedReason?: string;

  @IsOptional()
  @IsString()
  notJoinedNote?: string;
}
