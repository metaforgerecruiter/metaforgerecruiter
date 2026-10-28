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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { DuplicateCheckDto } from './dto/duplicate-check.dto';
import { BulkUploadCandidatesDto } from './dto/bulk-upload.dto';

@ApiTags('Candidates')
@ApiBearerAuth('access-token')
@Controller('candidates')
@UseGuards(JwtAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /** GET /api/v1/candidates */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('skill') skill?: string,
    @Query('minExperience') minExperience?: number,
    @Query('maxExperience') maxExperience?: number,
    @Query('noticePeriod') noticePeriod?: number,
    @Query('location') location?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.candidatesService.findAll(req.user, {
      search,
      skill,
      minExperience,
      maxExperience,
      noticePeriod,
      location,
      status,
      page,
      limit,
    });
  }

  /** POST /api/v1/candidates/duplicate-check */
  @Post('duplicate-check')
  @HttpCode(HttpStatus.OK)
  async duplicateCheck(@Body() dto: DuplicateCheckDto, @Req() req: any) {
    return this.candidatesService.duplicateCheck(dto, req.user);
  }

  /** POST /api/v1/candidates/bulk-upload */
  @Post('bulk-upload')
  @HttpCode(HttpStatus.OK)
  async bulkUpload(@Body() payload: any, @Req() req: any) {
    return this.candidatesService.bulkUpload(payload, req.user);
  }

  /** GET /api/v1/candidates/:id */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.candidatesService.findById(id, req.user);
  }

  /** POST /api/v1/candidates */
  @Post()
  @Roles('superadmin', 'admin', 'lead', 'recruiter', 'devteam')
  @RequirePermission('cand_add')
  async create(@Body() dto: CreateCandidateDto, @Req() req: any) {
    return this.candidatesService.create(dto, req.user);
  }

  /** PUT /api/v1/candidates/:id */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
    @Req() req: any,
  ) {
    return this.candidatesService.update(id, dto, req.user);
  }

  /** DELETE /api/v1/candidates/:id */
  @Delete(':id')
  @Roles('superadmin', 'admin', 'devteam')
  @RequirePermission('cand_delete')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    return this.candidatesService.softDelete(id, req.user);
  }
}
