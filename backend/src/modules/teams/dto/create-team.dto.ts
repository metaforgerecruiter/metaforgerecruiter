import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  teamName: string;

  @IsString()
  @IsNotEmpty()
  leadId: string;

  @IsArray()
  @IsOptional()
  recruiterIds?: string[];

  @IsString()
  @IsOptional()
  teamId?: string;
}
