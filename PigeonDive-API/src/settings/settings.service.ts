import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type SettingKey = "resendApiKey" | "webhookSecret" | "senderDomain" | "appSecret" | "lastWebhookAt";

/** Key/value app configuration backed by the database, with a small in-memory read cache. */
@Injectable()
export class SettingsService {
  private cache = new Map<SettingKey, string | null>();

  constructor(private readonly prisma: PrismaService) {}

  async get(key: SettingKey): Promise<string | null> {
    if (this.cache.has(key)) return this.cache.get(key) ?? null;
    const row = await this.prisma.setting.findUnique({ where: { key } });
    this.cache.set(key, row?.value ?? null);
    return row?.value ?? null;
  }

  /** An empty string or null clears the setting. */
  async set(key: SettingKey, value: string | null): Promise<void> {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
      await this.prisma.setting.deleteMany({ where: { key } });
      this.cache.set(key, null);
      return;
    }
    await this.prisma.setting.upsert({ where: { key }, create: { key, value: trimmed }, update: { value: trimmed } });
    this.cache.set(key, trimmed);
  }

  /** Generated once, on first use, and kept: nobody has to configure a signing secret. */
  async getAppSecret(): Promise<string> {
    const existing = await this.get("appSecret");
    if (existing) return existing;
    const fresh = randomBytes(48).toString("hex");
    // create-only upsert: if two boots race, the first value wins and both read it back.
    await this.prisma.setting.upsert({ where: { key: "appSecret" }, create: { key: "appSecret", value: fresh }, update: {} });
    this.cache.delete("appSecret");
    return (await this.get("appSecret")) as string;
  }
}

/** "re_abc123xyz" -> "re_…xyz": enough to recognise a key, never enough to leak it. */
export function keyHint(key: string | null): string | null {
  if (!key) return null;
  return key.length <= 8 ? "••••" : `${key.slice(0, 3)}…${key.slice(-4)}`;
}
