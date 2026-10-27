import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EMAIL_PROVIDER, type EmailProvider } from "../providers/email-provider";
import { SettingsService } from "../settings/settings.service";
import { EmailView, ListEmailsQuery, SendEmailDto } from "./emails.dto";
import { buildFromAddress, normalizeLocalPart } from "./from-address";

const PROBLEM_STATUSES = ["BOUNCED", "COMPLAINED", "FAILED"] as const;

export function whereForView(view: EmailView | undefined): Prisma.EmailWhereInput {
  switch (view) {
    case "delivered":
      return { deliveredAt: { not: null } };
    case "opened":
      return { openCount: { gt: 0 } };
    case "clicked":
      return { clickCount: { gt: 0 } };
    case "problems":
      return { status: { in: [...PROBLEM_STATUSES] } };
    default:
      return {};
  }
}

@Injectable()
export class EmailsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
    private readonly settings: SettingsService,
  ) {}

  async send(userId: string, input: SendEmailDto) {
    const localPart = normalizeLocalPart(input.fromLocalPart);
    if (!localPart) {
      throw new BadRequestException("The sender name can only use letters, numbers, dots, dashes and underscores");
    }
    const domain = await this.settings.get("senderDomain");
    if (!domain) throw new BadRequestException("Choose your sending domain in Settings first");

    const template = await this.prisma.template.findUnique({ where: { id: input.templateId } });
    if (!template) throw new NotFoundException("Template not found");

    const fromEmail = buildFromAddress(localPart, domain);
    const email = await this.prisma.email.create({
      data: {
        userId,
        templateId: template.id,
        toEmail: input.to.trim().toLowerCase(),
        fromEmail,
        subject: input.subject,
        format: template.format,
        body: template.body,
      },
    });

    await this.prisma.senderIdentity.upsert({
      where: { localPart },
      create: { localPart, useCount: 1 },
      update: { useCount: { increment: 1 }, lastUsedAt: new Date() },
    });

    const result = await this.provider.send({
      from: fromEmail,
      to: email.toEmail,
      subject: email.subject,
      format: email.format,
      body: email.body,
      idempotencyKey: email.id,
    });

    if (!result.ok) {
      return this.prisma.email.update({ where: { id: email.id }, data: { status: "FAILED", error: result.error } });
    }
    return this.prisma.email.update({
      where: { id: email.id },
      data: { status: "SENT", resendId: result.providerId, sentAt: new Date() },
    });
  }

  async list(query: ListEmailsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = whereForView(query.view);
    const [items, total] = await Promise.all([
      this.prisma.email.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          toEmail: true,
          fromEmail: true,
          subject: true,
          format: true,
          status: true,
          error: true,
          sentAt: true,
          deliveredAt: true,
          firstOpenedAt: true,
          firstClickedAt: true,
          openCount: true,
          clickCount: true,
          createdAt: true,
        },
      }),
      this.prisma.email.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async stats() {
    const [sent, delivered, opened, clicked, problems] = await Promise.all([
      this.prisma.email.count({ where: { sentAt: { not: null } } }),
      this.prisma.email.count({ where: whereForView("delivered") }),
      this.prisma.email.count({ where: whereForView("opened") }),
      this.prisma.email.count({ where: whereForView("clicked") }),
      this.prisma.email.count({ where: whereForView("problems") }),
    ]);
    return { sent, delivered, opened, clicked, problems };
  }

  async get(id: string) {
    const email = await this.prisma.email.findUnique({
      where: { id },
      include: { events: { orderBy: { occurredAt: "asc" } } },
    });
    if (!email) throw new NotFoundException("Email not found");
    return email;
  }

  senders() {
    return this.prisma.senderIdentity.findMany({
      orderBy: { lastUsedAt: "desc" },
      take: 50,
      select: { localPart: true, useCount: true, lastUsedAt: true },
    });
  }
}
