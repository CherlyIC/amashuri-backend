import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum StudentType {
  BOARDING = 'BOARDING',
  DAY = 'DAY',
}

export class CreateFeeDto {
  @IsString()
  @IsOptional()
  schoolId?: string;

  @IsString()
  level!: string;

  @IsEnum(StudentType)
  studentType!: StudentType;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsString()
  academicYear!: string;
}