import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, ValidateIf } from 'class-validator';

export class CreateSubmissionDto {
  @ValidateIf((o) => !o.email && !o.candidate)
  @IsNotEmpty()
  @IsString()
  candidateId?: string;

  @ValidateIf((o) => !o.req)
  @IsNotEmpty()
  @IsString()
  requirementId?: string;

  @IsOptional()
  @IsString()
  candidate?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  req?: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsString()
  recruiter?: string;

  @IsOptional()
  @IsString()
  match?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  recruiterId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsNumber()
  matchScore?: number;

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
