import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateCompareDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  schoolIds: string[];
}