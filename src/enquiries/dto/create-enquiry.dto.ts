import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateEnquiryDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  attachment?: any;
}
