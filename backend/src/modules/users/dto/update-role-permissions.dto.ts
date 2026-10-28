import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateRolePermissionsDto {
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
