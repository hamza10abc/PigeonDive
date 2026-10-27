import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/jwt.strategy";
import { SettingsService } from "../settings/settings.service";
import { ListEmailsQuery, SendEmailDto } from "./emails.dto";
import { EmailsService } from "./emails.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class EmailsController {
  constructor(
    private readonly emails: EmailsService,
    private readonly settings: SettingsService,
  ) {}

  @Post("emails")
  send(@CurrentUser() user: AuthenticatedUser, @Body() input: SendEmailDto) {
    return this.emails.send(user.id, input);
  }

  @Get("emails")
  list(@Query() query: ListEmailsQuery) {
    return this.emails.list(query);
  }

  // Declared before :id so "stats" is not parsed as an id.
  @Get("emails/stats")
  stats() {
    return this.emails.stats();
  }

  @Get("emails/:id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.emails.get(id);
  }

  @Get("senders")
  senders() {
    return this.emails.senders();
  }

  @Get("meta")
  async meta() {
    return { senderDomain: await this.settings.get("senderDomain") };
  }
}
