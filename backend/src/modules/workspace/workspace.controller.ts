import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /** GET /api/v1/workspace — full SPA bootstrap payload mapped to frontend types */
  @Get()
  async getWorkspace(@Req() req: any) {
    return this.workspaceService.getWorkspacePayload(req.user);
  }
}
