import { IsString, IsEmail } from 'class-validator';

export class CreateEnquiryDto {
  @IsString()
  schoolId: string;

  @IsString()
  message: string;

  @IsEmail()
  senderEmail: string;
}