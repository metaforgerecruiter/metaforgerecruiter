import { IsOptional, IsBoolean, IsString, IsEmail } from 'class-validator';

export class TriggerReportDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  @IsOptional()
  @IsString()
  targetDate?: string; // YYYY-MM-DD in Asia/Kolkata

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;
}
