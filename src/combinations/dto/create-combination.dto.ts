import { IsString } from 'class-validator';

export class CreateCombinationDto {
  @IsString()
  schoolId: string;

  @IsString()
  name: string;

  @IsString()
  subjects: string;
}