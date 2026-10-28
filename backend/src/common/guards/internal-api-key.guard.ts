import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = String(process.env.INTERNAL_AUTOMATION_API_KEY || '').trim();
    if (!expected) {
      throw new UnauthorizedException('Automation API key is not configured');
    }
    const request = context.switchToHttp().getRequest();
    const header = String(request.headers?.['x-internal-api-key'] || '').trim();
    const authorization = String(request.headers?.authorization || '').trim();
    const bearer = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
    if (header === expected || bearer === expected) return true;
    throw new UnauthorizedException('Invalid automation API key');
  }
}
