import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { resolveJwtSecret } from '../../common/security/secrets.util';

export interface JwtPayload {
  sub: string;
  userId: string;
  email: string;
  role: string;
  orgId: string;
  name?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

function cookieExtractor(req: { headers?: { cookie?: string } }): string | null {
  const header = req?.headers?.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === 'access_token') return decodeURIComponent(rest.join('='));
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Prefer HttpOnly cookie (browser sessions). Bearer kept for non-browser tooling only.
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(configService.get<string>('JWT_SECRET')),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid JWT payload format');
    }

    let capabilities = {};
    const dbUser = await this.userModel.findOne({
      $or: [
        ...(Types.ObjectId.isValid(payload.sub) ? [{ _id: payload.sub }] : []),
        { userId: payload.sub },
        { email: payload.email },
      ],
      deletedAt: null,
    }).exec();

    if (dbUser) {
      if (dbUser.active === false) {
        throw new UnauthorizedException('User account has been deactivated or deleted');
      }
      capabilities = dbUser.capabilities || {};
    }

    return {
      id: payload.sub,
      userId: payload.userId || payload.sub,
      email: payload.email,
      role: payload.role,
      // Prefer live DB org/client over stale JWT claims for authorization.
      orgId: dbUser?.orgId || payload.orgId,
      name: payload.name || dbUser?.name,
      permissions: payload.permissions || [],
      capabilities,
      clientId: (dbUser as any)?.clientId || undefined,
      teamId: (dbUser as any)?.teamId || undefined,
    };
  }
}
