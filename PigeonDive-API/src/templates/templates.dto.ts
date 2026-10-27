import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";

export enum TemplateFormatDto {
  HTML = "HTML",
  TEXT = "TEXT",
}

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(998)
  subject!: string;

  @IsEnum(TemplateFormatDto)
  format!: TemplateFormatDto;

  @IsString()
  @MaxLength(500_000)
  body!: string;
}

export class UpdateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(998)
  subject!: string;

  @IsEnum(TemplateFormatDto)
  format!: TemplateFormatDto;

  @IsString()
  @MaxLength(500_000)
  body!: string;
}
