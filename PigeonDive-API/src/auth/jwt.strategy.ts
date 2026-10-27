import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";

export type AuthenticatedUser = { id: string; username: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    settings: SettingsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // The signing secret is generated and stored by the app itself, so it is looked up per request.
      secretOrKeyProvider: (_req: unknown, _token: unknown, done: (err: unknown, secret?: string) => void) => {
        settings.getAppSecret().then((secret) => done(null, secret), (error) => done(error));
      },
    });
  }

  async validate(payload: { sub: string }): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, username: true } });
    if (!user) throw new UnauthorizedException("Account no longer exists");
    return user;
  }
}
