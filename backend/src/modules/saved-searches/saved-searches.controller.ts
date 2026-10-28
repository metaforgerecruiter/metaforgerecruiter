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
import { SavedSearchesService } from './saved-searches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';

@Controller('saved-searches')
@UseGuards(JwtAuthGuard)
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  /** GET /api/v1/saved-searches */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('collection') collection?: string,
    @Query('search') search?: string,
  ) {
    return this.savedSearchesService.findAll(req.user, { collection, search });
  }

  /** GET /api/v1/saved-searches/:id */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.savedSearchesService.findOne(req.user, id);
  }

  /** POST /api/v1/saved-searches */
  @Post()
  async create(@Req() req: any, @Body() dto: CreateSavedSearchDto) {
    return this.savedSearchesService.create(req.user, dto);
  }

  /** PUT /api/v1/saved-searches/:id */
  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    return this.savedSearchesService.update(req.user, id, dto);
  }

  /** DELETE /api/v1/saved-searches/:id */
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.savedSearchesService.remove(req.user, id);
  }
}
