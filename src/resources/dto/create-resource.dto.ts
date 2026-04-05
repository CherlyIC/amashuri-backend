import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  schoolId: string;

  @IsBoolean()
  @IsOptional()
  laboratory?: boolean;

  @IsBoolean()
  @IsOptional()
  library?: boolean;

  @IsBoolean()
  @IsOptional()
  computerRoom?: boolean;

  @IsBoolean()
  @IsOptional()
  sportsField?: boolean;

  @IsBoolean()
  @IsOptional()
  boardingHouse?: boolean;

  @IsBoolean()
  @IsOptional()
  chapel?: boolean;
}