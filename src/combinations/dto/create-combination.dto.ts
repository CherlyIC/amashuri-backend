import { IsString, IsOptional } from 'class-validator';

export class CreateCombinationDto {
  @IsString()
  @IsOptional()
  schoolId?: string;

  @IsString()
  name!: string;

  @IsString()
  subjects!: string;
}