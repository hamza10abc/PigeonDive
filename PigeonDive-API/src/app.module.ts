import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { EmailsModule } from "./emails/emails.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SettingsModule } from "./settings/settings.module";
import { TemplatesModule } from "./templates/templates.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [PrismaModule, SettingsModule, AuthModule, TemplatesModule, EmailsModule, WebhooksModule],
})
export class AppModule {}
