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
import { BlacklistService } from './candidate-blacklist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBlacklistDto } from './dto/create-blacklist.dto';
import { UpdateBlacklistDto } from './dto/update-blacklist.dto';

@Controller('blacklist')
@UseGuards(JwtAuthGuard)
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  /** GET /api/v1/blacklist */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blacklistService.findAll(req.user, { search, page, limit });
  }

  /** GET /api/v1/blacklist/:id */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.blacklistService.findOne(req.user, id);
  }

  /** POST /api/v1/blacklist */
  @Post()
  async create(@Req() req: any, @Body() dto: CreateBlacklistDto) {
    return this.blacklistService.create(req.user, dto);
  }

  /** PUT /api/v1/blacklist/:id */
  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBlacklistDto,
  ) {
    return this.blacklistService.update(req.user, id, dto);
  }

  /** DELETE /api/v1/blacklist/:id */
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.blacklistService.remove(req.user, id);
  }
}
