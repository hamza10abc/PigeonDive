import { Module } from "@nestjs/common";
import { EMAIL_PROVIDER } from "../providers/email-provider";
import { ResendProvider } from "../providers/resend.provider";
import { EmailsController } from "./emails.controller";
import { EmailsService } from "./emails.service";

@Module({
  controllers: [EmailsController],
  providers: [EmailsService, ResendProvider, { provide: EMAIL_PROVIDER, useExisting: ResendProvider }],
})
export class EmailsModule {}
