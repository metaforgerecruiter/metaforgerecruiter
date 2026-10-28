import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateOfferDto {
  @IsNotEmpty()
  @IsString()
  submissionId: string;

  @IsOptional()
  @IsString()
  candidateId?: string;

  @IsOptional()
  @IsString()
  requirementId?: string;

  @IsNotEmpty()
  @IsNumber()
  offeredCtc: number;

  @IsNotEmpty()
  @IsDateString()
  joiningDate: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  declinedReason?: string;
}
