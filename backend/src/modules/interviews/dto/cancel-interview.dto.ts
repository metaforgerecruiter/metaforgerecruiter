import { IsOptional, IsString } from 'class-validator';

export class CancelInterviewDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
