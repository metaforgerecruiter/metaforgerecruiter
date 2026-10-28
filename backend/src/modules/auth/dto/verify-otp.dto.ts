import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Enter a valid work email address' })
  @IsNotEmpty({ message: 'Work email address is required' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'OTP code must be 6 digits' })
  @IsNotEmpty({ message: 'OTP code is required' })
  otpCode: string;
}
