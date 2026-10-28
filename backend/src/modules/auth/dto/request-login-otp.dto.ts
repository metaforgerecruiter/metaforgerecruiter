import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestLoginOtpDto {
  @IsEmail({}, { message: 'Enter a valid work email address' })
  @IsNotEmpty({ message: 'Work email address is required' })
  email: string;

  @IsOptional()
  @IsString()
  role?: string;
}
