import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean, IsObject } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Role is required' })
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsObject()
  capabilities?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}
