import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStageDto {
  @IsNotEmpty()
  @IsString()
  stage: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
