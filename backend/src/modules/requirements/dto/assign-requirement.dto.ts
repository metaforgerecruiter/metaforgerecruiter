import { IsArray, IsOptional, IsString } from 'class-validator';

export class AssignRequirementDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recruiterIds?: string[];

  @IsOptional()
  @IsString()
  leadId?: string;
}
