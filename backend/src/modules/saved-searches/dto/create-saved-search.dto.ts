import { IsIn, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  filters: Record<string, any>;

  @IsIn(['candidates', 'requirements'])
  @IsNotEmpty()
  collection: string;
}
