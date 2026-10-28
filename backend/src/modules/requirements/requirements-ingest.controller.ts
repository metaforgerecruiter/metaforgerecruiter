import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';

@Controller(['requirements', 'internal/requirements'])
@UseGuards(InternalApiKeyGuard)
export class RequirementsIngestController {
  constructor(private readonly requirementsService: RequirementsService) {}

  /** POST /api/v1/requirements/ingest-email */
  @Post('ingest-email')
  @HttpCode(HttpStatus.OK)
  ingest(@Body() body: Record<string, any>) {
    return this.requirementsService.ingestFromEmail(body || {});
  }

  /** POST /api/v1/requirements/presence — which client requirement IDs exist (pipeline reconciliation) */
  @Post('presence')
  @HttpCode(HttpStatus.OK)
  presence(@Body() body: { clientJdIds?: string[] }) {
    return this.requirementsService.clientIdPresence(Array.isArray(body?.clientJdIds) ? body.clientJdIds : []);
  }
}
