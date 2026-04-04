import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SchoolType, GenderPolicy } from './create-school.dto';

export class FilterSchoolDto {
  @IsString()
  @IsOptional()
  search?: string;

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
  @Transform(({ value }) => value === 'true')
  boarding?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minFee?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxFee?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}