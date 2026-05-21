import { IsEmail, IsString, IsOptional } from 'class-validator';

export class SchoolSendEnquiryDto {
  @IsEmail()
  recipientEmail: string;

  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  saveToDb?: boolean;
}
