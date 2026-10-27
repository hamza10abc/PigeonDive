import { BadRequestException, Body, Controller, Get, HttpCode, Post, Put, UseGuards } from "@nestjs/common";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { Resend } from "resend";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { keyHint, SettingsService } from "./settings.service";

class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  resendApiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  webhookSecret?: string;

  @IsOptional()
  @IsString()
  @Matches(/^$|^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, { message: "Enter a domain like mail.example.com" })
  senderDomain?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("settings")
  async read() {
    return {
      resendKeyHint: keyHint(await this.settings.get("resendApiKey")),
      senderDomain: await this.settings.get("senderDomain"),
      webhookSecretSet: !!(await this.settings.get("webhookSecret")),
      lastWebhookAt: await this.settings.get("lastWebhookAt"),
    };
  }

  @Put("settings")
  async update(@Body() input: UpdateSettingsDto) {
    if (input.resendApiKey !== undefined) await this.settings.set("resendApiKey", input.resendApiKey);
    if (input.webhookSecret !== undefined) await this.settings.set("webhookSecret", input.webhookSecret);
    if (input.senderDomain !== undefined) await this.settings.set("senderDomain", input.senderDomain.toLowerCase());
    return this.read();
  }

  /** Asks Resend which domains this key can send from, which doubles as a "is the key valid" check. */
  @Post("settings/resend/domains")
  @HttpCode(200)
  async domains() {
    const apiKey = await this.settings.get("resendApiKey");
    if (!apiKey) throw new BadRequestException("Save your Resend API key first");
    const { data, error } = await new Resend(apiKey).domains.list();
    if (error || !data) throw new BadRequestException(error?.message ?? "Resend rejected that API key");
    return {
      domains: data.data.map((d) => ({
        name: d.name,
        status: d.status,
        openTracking: d.open_tracking ?? null,
        clickTracking: d.click_tracking ?? null,
      })),
    };
  }

  /** Everything the first-run checklist needs, in one cheap call. */
  @Get("setup")
  async setup() {
    const [templates, sent] = await Promise.all([
      this.prisma.template.count(),
      this.prisma.email.count({ where: { sentAt: { not: null } } }),
    ]);
    return {
      apiKey: !!(await this.settings.get("resendApiKey")),
      domain: !!(await this.settings.get("senderDomain")),
      webhook: !!(await this.settings.get("webhookSecret")),
      webhookReceived: !!(await this.settings.get("lastWebhookAt")),
      templates,
      sent,
    };
  }
}
