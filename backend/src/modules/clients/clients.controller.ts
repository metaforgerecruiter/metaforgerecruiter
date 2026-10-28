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
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /** GET /api/v1/clients */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('domain') domain?: string,
  ) {
    return this.clientsService.findAll(req.user, {
      search,
      status,
      tier,
      domain,
    });
  }

  /** GET /api/v1/clients/:id */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findById(id, req.user);
  }

  /** POST /api/v1/clients */
  @Post()
  @Roles('superadmin', 'admin', 'devteam')
  @RequirePermission('user_manage')
  async create(@Body() dto: CreateClientDto, @Req() req: any) {
    return this.clientsService.create(dto, req.user);
  }

  /** PUT /api/v1/clients/:id */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: any,
  ) {
    return this.clientsService.update(id, dto, req.user);
  }

  /** DELETE /api/v1/clients/:id */
  @Delete(':id')
  @Roles('superadmin', 'admin', 'devteam')
  @RequirePermission('user_manage')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.softDelete(id, req.user);
  }
}
