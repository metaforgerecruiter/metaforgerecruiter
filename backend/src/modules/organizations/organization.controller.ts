import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @Roles('superadmin', 'admin')
  async create(
    @Body()
    body: {
      name: string;
      slug: string;
      tier?: string;
      active?: boolean;
    },
  ) {
    return this.organizationService.create(body);
  }

  @Get()
  @Roles('superadmin', 'admin', 'lead')
  async findAll() {
    return this.organizationService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'lead', 'recruiter')
  async findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }
}
