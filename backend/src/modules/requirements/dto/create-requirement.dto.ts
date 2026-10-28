import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class CreateRequirementDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ValidateIf((o) => !o.client && !o.clientName)
  @IsString()
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId?: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsEnum(['High', 'Medium', 'Low', 'Urgent'])
  priority?: string;

  @IsOptional()
  @IsEnum(['Open', 'Assigned', 'In Progress', 'Hold', 'On Hold', 'Reopen', 'Closed'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  openings?: number;

  @IsOptional()
  @IsObject()
  budgetRange?: {
    min: number;
    max: number;
    currency: string;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillsRequired?: string[];

  @IsOptional()
  @IsObject()
  experienceRange?: {
    min: number;
    max: number;
  };

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  assignedLeadId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedRecruiterIds?: string[];

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toEmails?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmails?: string[];
}
