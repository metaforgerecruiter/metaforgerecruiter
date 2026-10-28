import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/v1/roles/permissions */
  @Get('permissions')
  async getRolePermissions(@Req() req: any) {
    return this.usersService.getRolePermissions(req.user);
  }

  /** PUT /api/v1/roles/permissions */
  @Put('permissions')
  @Roles('superadmin', 'admin')
  async updateRolePermissions(
    @Body() dto: UpdateRolePermissionsDto,
    @Req() req: any,
  ) {
    return this.usersService.updateRolePermissions(dto, req.user);
  }
}
