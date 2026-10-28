import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ScreenTimeDto } from './dto/screen-time.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/v1/users/me */
  @Get('me')
  async getMe(@Req() req: any) {
    return this.usersService.getMe(req.user);
  }

  /** PUT /api/v1/users/me */
  @Put('me')
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: any) {
    return this.usersService.updateMe(dto, req.user);
  }

  /** POST /api/v1/users/screen-time */
  @Post('screen-time')
  @HttpCode(HttpStatus.OK)
  async recordScreenTime(@Body() dto: ScreenTimeDto, @Req() req: any) {
    return this.usersService.recordScreenTime(dto, req.user);
  }

  /** GET /api/v1/users */
  @Get()
  async findAll(
    @Query() query: { role?: string; search?: string; active?: string },
    @Req() req: any,
  ) {
    return this.usersService.findAll(req.user, query);
  }

  /** GET /api/v1/users/:id */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findById(id, req.user);
  }

  /** POST /api/v1/users/restore/:id */
  @Post('restore/:id')
  @Roles('superadmin', 'admin')
  async restore(@Param('id') id: string, @Req() req: any) {
    return this.usersService.restore(id, req.user);
  }

  /** POST /api/v1/users */
  @Post()
  @Roles('superadmin', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.usersService.create(dto, req.user);
  }

  /** PUT /api/v1/users/:id */
  @Put(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.usersService.update(id, dto, req.user);
  }

  /** DELETE /api/v1/users/:id */
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async remove(
    @Param('id') id: string,
    @Query('permanent') permanent: string,
    @Req() req: any,
  ) {
    if (permanent === 'true') {
      return this.usersService.hardDelete(id, req.user);
    }
    return this.usersService.softDelete(id, req.user);
  }
}
