import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  /** GET /api/v1/teams */
  @Get()
  async findAll(@Req() req: any, @Query('search') search?: string) {
    return this.teamsService.findAll(req.user, { search });
  }

  /** GET /api/v1/teams/:id */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.teamsService.findOne(req.user, id);
  }

  /** POST /api/v1/teams */
  @Post()
  async create(@Req() req: any, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(req.user, dto);
  }

  /** PUT /api/v1/teams/:id */
  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(req.user, id, dto);
  }

  /** DELETE /api/v1/teams/:id */
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.teamsService.remove(req.user, id);
  }
}
