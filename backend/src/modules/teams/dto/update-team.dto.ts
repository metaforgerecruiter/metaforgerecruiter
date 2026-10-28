import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  teamName?: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsArray()
  @IsOptional()
  recruiterIds?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
