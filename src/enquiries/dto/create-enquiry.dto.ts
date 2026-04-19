import { IsString, IsOptional } from 'class-validator';

export class CreateEnquiryDto {
  @IsString()
  @IsOptional()
  schoolId?: string;

  @IsString()
  message: string;
}