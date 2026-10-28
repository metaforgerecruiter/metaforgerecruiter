import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_PATH = 'api/docs';

/** Public routes that should not require the Authorize lock in Swagger. */
const PUBLIC_PATH_PREFIXES = [
  '/health',
  '/api/v1/auth/login',
  '/api/v1/auth/request-login-otp',
  '/api/v1/auth/verify-login-otp',
  '/api/v1/auth/register-request',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh',
  '/api/v1/files/signed-download',
];

function isSwaggerEnabled(): boolean {
  const flag = (process.env.SWAGGER_ENABLED || '').trim().toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return (process.env.NODE_ENV || 'development') !== 'production';
}

function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Mount Swagger UI at /api/docs (JSON at /api/docs-json).
 * Use Authorize → Bearer JWT from login (`x-metaforge-return-tokens: 1`).
 */
export function setupSwagger(app: INestApplication): string | null {
  if (!isSwaggerEnabled()) {
    return null;
  }

  const config = new DocumentBuilder()
    .setTitle('MetaForge Recruiter API')
    .setDescription(
      [
        'MRAP V2 backend (`/api/v1`).',
        '',
        '**Auth:** click **Authorize**, paste a JWT access token.',
        'Login with header `x-metaforge-return-tokens: 1` to receive tokens in the JSON body (browsers normally get HttpOnly cookies only).',
        '',
        '**Health (no `/api/v1` prefix):** `GET /health`, `GET /health/db`.',
      ].join('\n'),
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the accessToken from POST /api/v1/auth/login',
      },
      'access-token',
    )
    .addServer('http://localhost:3001', 'Local backend')
    .addServer('/api/v1', 'Via frontend proxy (relative — use full host instead for Try it out)')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  // Default lock: Bearer required. Clear for known public routes.
  document.security = [{ 'access-token': [] }];
  for (const [path, methods] of Object.entries(document.paths || {})) {
    if (!isPublicPath(path)) continue;
    for (const method of Object.keys(methods || {})) {
      const op = (methods as Record<string, any>)[method];
      if (op && typeof op === 'object') {
        op.security = [];
      }
    }
  }

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
    },
    customSiteTitle: 'MetaForge Recruiter API Docs',
  });

  return `/${SWAGGER_PATH}`;
}

/** True when request path is Swagger UI / OpenAPI JSON (needs relaxed CSP). */
export function isSwaggerRequestPath(path: string): boolean {
  const p = String(path || '').split('?')[0];
  return (
    p === '/api/docs' ||
    p.startsWith('/api/docs/') ||
    p === '/api/docs-json' ||
    p.startsWith('/api/docs-json')
  );
}
