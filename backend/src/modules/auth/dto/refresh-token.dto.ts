import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  /** Optional when HttpOnly refresh_token cookie is present. */
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
