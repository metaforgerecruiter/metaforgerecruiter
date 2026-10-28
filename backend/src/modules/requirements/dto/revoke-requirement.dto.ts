import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeRequirementDto {
  @IsString()
  @IsNotEmpty({ message: 'Revoke reason is required' })
  reason: string;
}
