import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ScreenTimeDto {
  @IsNumber()
  @IsNotEmpty()
  activeSeconds: number;

  @IsNumber()
  @IsNotEmpty()
  idleSeconds: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
