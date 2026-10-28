import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCandidateDto } from './create-candidate.dto';

export class BulkUploadCandidatesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCandidateDto)
  candidates: CreateCandidateDto[];

  @IsOptional()
  options?: Record<string, any>;
}
