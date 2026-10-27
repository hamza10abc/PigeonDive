import { BadRequestException, Controller, HttpCode, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { WebhooksService } from "./webhooks.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  /** Public on purpose: authenticity comes from the Svix signature, not a login. */
  @Post("resend")
  @HttpCode(200)
  resend(@Req() req: Request & { rawBody?: Buffer }) {
    if (!req.rawBody) throw new BadRequestException("Missing raw body");
    return this.webhooks.handleResend(req.rawBody.toString("utf8"), req.headers);
  }
}
