import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import passport = require('passport');
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  isCsrfExemptPath,
  isSafeMethod,
  issueCsrfCookie,
  originAllowed,
  parseAllowedOrigins,
  readCookie,
} from './common/security/csrf.util';
import { assertJwtSecretConfigured } from './common/security/secrets.util';
import {
  httpsRequired,
  isHttpsRequest,
  requestHost,
  trustProxySetting,
} from './common/security/transport.util';
import { isSwaggerRequestPath, setupSwagger } from './common/swagger/swagger.setup';

/**
 * Sanitizes input payloads to block MongoDB operator keys ($where, $gt, etc.)
 */
function sanitizeMongoOperators(obj: any): void {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeMongoOperators(obj[key]);
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const expressApp = app.getHttpAdapter().getInstance();
  const forceHttps = httpsRequired();

  // Behind ALB / nginx / ingress: honor X-Forwarded-Proto for HTTPS detection.
  expressApp.set('trust proxy', trustProxySetting());

  // Transport: redirect plain HTTP → HTTPS (production / FORCE_HTTPS).
  if (forceHttps) {
    app.use((req: any, res: any, next: any) => {
      if (isHttpsRequest(req)) return next();
      const host = requestHost(req);
      const url = `https://${host}${req.originalUrl || req.url || '/'}`;
      return res.redirect(308, url);
    });
  }

  // 1. Helmet HTTP Security Headers (OWASP 2026 Baseline)
  // API JSON stays locked down. Swagger UI needs scripts/styles on /api/docs.
  const hstsOptions = forceHttps
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false;

  app.use((req: any, res: any, next: any) => {
    if (isSwaggerRequestPath(String(req.path || req.url || ''))) {
      return helmet({
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            ...(forceHttps
              ? { upgradeInsecureRequests: [] }
              : { upgradeInsecureRequests: null }),
          },
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        hsts: hstsOptions,
      })(req, res, next);
    }

    return helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'none'"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
          imgSrc: ["'none'"],
          connectSrc: ["'none'"],
          objectSrc: ["'none'"],
          ...(forceHttps
            ? { upgradeInsecureRequests: [] }
            : { upgradeInsecureRequests: null }),
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: hstsOptions,
    })(req, res, next);
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // 2. MongoDB Query Protections: block operator injection
  app.use((req: any, _res: any, next: any) => {
    if (req.body) sanitizeMongoOperators(req.body);
    if (req.query) sanitizeMongoOperators(req.query);
    if (req.params) sanitizeMongoOperators(req.params);
    next();
  });

  // Global role/permission guards run before controller JwtAuthGuard.
  // Populate req.user first when a bearer token or access cookie is present
  // so those guards can see the authenticated role.
  app.use(passport.initialize());
  app.use((req: any, res: any, next: any) => {
    const header = String(req.headers?.authorization || '');
    const cookie = String(req.headers?.cookie || '');
    if (!header.startsWith('Bearer ') && !cookie.includes('access_token=')) {
      return next();
    }
    passport.authenticate('jwt', { session: false }, (_err: unknown, user: unknown) => {
      if (user) req.user = user;
      next();
    })(req, res, next);
  });

  // Explicit allowlist only — never reflect arbitrary Origin (credentials + CORS).
  const allowedOrigins = parseAllowedOrigins();

  // CSRF defenses for cookie-based auth:
  // 1) Origin/Referer must match allowlist on mutating requests from browsers
  // 2) Double-submit: csrf_token cookie must equal X-CSRF-Token header when session cookie is present
  app.use((req: any, res: any, next: any) => {
    const hasSession = Boolean(readCookie(req, 'access_token') || readCookie(req, 'refresh_token'));

    // Keep double-submit cookie fresh for existing sessions (e.g. logged in before CSRF shipped).
    if (isSafeMethod(req.method)) {
      if (hasSession && !readCookie(req, CSRF_COOKIE_NAME)) {
        issueCsrfCookie(res);
      }
      return next();
    }

    const origin = req.headers?.origin ? String(req.headers.origin) : '';
    const referer = req.headers?.referer ? String(req.headers.referer) : '';

    if (origin) {
      if (!originAllowed(origin, allowedOrigins)) {
        return res.status(403).json({ statusCode: 403, message: 'Forbidden origin' });
      }
    } else if (referer) {
      if (!originAllowed(referer, allowedOrigins)) {
        return res.status(403).json({ statusCode: 403, message: 'Forbidden referer' });
      }
    }

    // Bearer / tooling clients are not cookie-CSRF vulnerable.
    const authHeader = String(req.headers?.authorization || '');
    if (authHeader.startsWith('Bearer ')) {
      return next();
    }

    if (isCsrfExemptPath(String(req.path || req.url || ''))) {
      return next();
    }

    if (!hasSession) {
      return next();
    }

    const csrfCookie = readCookie(req, CSRF_COOKIE_NAME);
    const csrfHeader = String(req.headers?.[CSRF_HEADER_NAME] || '');
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      // Mint a cookie so the next client retry (after reading Set-Cookie) can succeed.
      if (!csrfCookie) {
        issueCsrfCookie(res);
      }
      return res.status(403).json({ statusCode: 403, message: 'Invalid or missing CSRF token' });
    }
    return next();
  });

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // No Origin = same-origin / server-to-server / curl — not a browser cross-origin call.
      if (!origin) {
        return callback(null, true);
      }
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.has(normalized)) {
        return callback(null, true);
      }
      // Deny without throwing — avoids 500s; browser still blocks the response.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-metaforge-return-tokens',
      'X-CSRF-Token',
      CSRF_HEADER_NAME,
    ],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/db', method: RequestMethod.ALL },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Fail closed: JWT_SECRET must come from env/vault and meet strength rules (all environments).
  assertJwtSecretConfigured();

  const swaggerPath = setupSwagger(app);

  const port = Number(process.env.PORT) || 3001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  const scheme = forceHttps ? 'https' : 'http';
  console.log(
    `V2 backend listening on ${host}:${port}/api/v1 (clients should use ${scheme}; HTTPS enforce=${forceHttps})`,
  );
  if (swaggerPath) {
    console.log(`Swagger UI: ${scheme}://localhost:${port}${swaggerPath}`);
  }
}

bootstrap();
