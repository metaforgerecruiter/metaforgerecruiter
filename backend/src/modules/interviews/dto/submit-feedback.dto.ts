import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class SubmitFeedbackDto {
  @IsOptional()
  @IsString()
  evaluatorName?: string;

  @IsOptional()
  @IsString()
  evaluatorEmail?: string;

  @IsOptional()
  @IsNumber()
  technicalScore?: number;

  @IsOptional()
  @IsString()
  feedbackNotes?: string;

  @IsNotEmpty()
  @IsString()
  recommendation: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
