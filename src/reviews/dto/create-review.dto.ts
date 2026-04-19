import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsString()
  @IsOptional()
  schoolId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  teachingRating!: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  facilitiesRating!: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  adminRating!: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  overallRating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}