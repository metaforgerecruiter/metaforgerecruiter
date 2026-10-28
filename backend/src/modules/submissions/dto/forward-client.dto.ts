import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class ForwardClientDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  clientEmails?: string[];

  @IsOptional()
  @IsString()
  leadEmail?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  leadEmails?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  candidateIds?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  ccEmails?: string[];

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trackerColumns?: string[];

  @IsOptional()
  @IsArray()
  trackerRows?: Record<string, string>[];

  @IsOptional()
  @IsString()
  trackerHeaderColor?: string;

  @IsOptional()
  @IsString()
  emailGreeting?: string;

  @IsOptional()
  @IsString()
  emailIntroduction?: string;

  @IsOptional()
  @IsString()
  recruiterName?: string;

  @IsOptional()
  @IsString()
  recruiterEmail?: string;
}
