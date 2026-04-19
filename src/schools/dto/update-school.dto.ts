import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { SchoolType, GenderPolicy } from './create-school.dto';

export class UpdateSchoolDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsEnum(SchoolType)
  @IsOptional()
  schoolType?: SchoolType;

  @IsEnum(GenderPolicy)
  @IsOptional()
  genderPolicy?: GenderPolicy;

  @IsBoolean()
  @IsOptional()
  boarding?: boolean;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  yearEstablished?: number;

  @IsNumber()
  @IsOptional()
  totalStudents?: number;
}