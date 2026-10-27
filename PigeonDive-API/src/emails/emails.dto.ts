import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

export const MAX_RECIPIENTS = 100;

export class SendEmailDto {
  /** One address or many. Every recipient gets a separate email, so none can see the others. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_RECIPIENTS)
  @IsEmail({}, { each: true })
  @MaxLength(254, { each: true })
  to!: string[];

  @IsUUID()
  templateId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(998)
  subject!: string;

  /** Only the part before the @ — the domain comes from Settings. */
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  fromLocalPart!: string;
}

export const EMAIL_VIEWS = ["all", "delivered", "opened", "clicked", "problems"] as const;
export type EmailView = (typeof EMAIL_VIEWS)[number];

export class ListEmailsQuery {
  @IsOptional()
  @IsIn(EMAIL_VIEWS)
  view?: EmailView;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
