import { IsString } from 'class-validator';

export class ReplyToEnquiryDto {
  @IsString()
  message: string;
}
