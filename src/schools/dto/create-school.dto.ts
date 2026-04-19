import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsEmail,
  MinLength,
} from 'class-validator';

export enum SchoolType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  GOVERNMENT_AIDED = 'GOVERNMENT_AIDED',
}

export enum GenderPolicy {
  COED = 'COED',
  BOYS_ONLY = 'BOYS_ONLY',
  GIRLS_ONLY = 'GIRLS_ONLY',
}

export class CreateSchoolDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  district: string;

  @IsString()
  province: string;

  @IsEnum(SchoolType)
  schoolType: SchoolType;

  @IsEnum(GenderPolicy)
  genderPolicy: GenderPolicy;

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