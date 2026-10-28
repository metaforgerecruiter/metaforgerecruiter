import { IsArray, IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRequirementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsEnum(['High', 'Medium', 'Low', 'Urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(['Unassigned', 'Assigned', 'In Progress', 'Closed'])
  assignmentStatus?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  openings?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  placedCount?: number;

  @IsOptional()
  @IsObject()
  budgetRange?: {
    min: number;
    max: number;
    currency: string;
  };

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillsRequired?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

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

  @IsOptional()
  @IsString()
  dueDate?: string;
}
