import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSavedSearchDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @IsIn(['candidates', 'requirements'])
  @IsOptional()
  collection?: string;
}
