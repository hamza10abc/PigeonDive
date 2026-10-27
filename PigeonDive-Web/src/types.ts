export type TemplateFormat = "HTML" | "TEXT";

export type Template = {
  id: string;
  name: string;
  subject: string;
  format: TemplateFormat;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailStatus = "QUEUED" | "SENT" | "DELAYED" | "DELIVERED" | "BOUNCED" | "COMPLAINED" | "FAILED";

export type EmailView = "all" | "delivered" | "opened" | "clicked" | "problems";

export type EmailListItem = {
  id: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  format: TemplateFormat;
  status: EmailStatus;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  firstOpenedAt: string | null;
  firstClickedAt: string | null;
  openCount: number;
  clickCount: number;
  createdAt: string;
};

export type EmailEvent = {
  id: string;
  type: string;
  occurredAt: string;
  metadata: { link?: string | null; userAgent?: string | null; likelyBot?: boolean } | null;
};

export type EmailDetail = EmailListItem & {
  body: string;
  events: EmailEvent[];
};

export type EmailPage = { items: EmailListItem[]; total: number; page: number; pageSize: number };

export type EmailStats = { sent: number; delivered: number; opened: number; clicked: number; problems: number };

export type Sender = { localPart: string; useCount: number; lastUsedAt: string };

export type AuthUser = { id: string; username: string };

export type SettingsData = {
  resendKeyHint: string | null;
  senderDomain: string | null;
  webhookSecretSet: boolean;
  lastWebhookAt: string | null;
};

export type SetupState = {
  apiKey: boolean;
  domain: boolean;
  webhook: boolean;
  webhookReceived: boolean;
  templates: number;
  sent: number;
};

export type ResendDomain = {
  name: string;
  status: string;
  openTracking: boolean | null;
  clickTracking: boolean | null;
};
