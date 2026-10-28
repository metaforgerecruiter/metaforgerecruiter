import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class VerifyLoginOtpDto {
  @IsEmail({}, { message: 'Enter a valid work email address' })
  @IsNotEmpty({ message: 'Work email address is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  @Matches(/^\d{4}$/, { message: 'OTP code must be exactly 4 digits' })
  code: string;

  @IsOptional()
  @IsString()
  role?: string;
}
