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
import { EmailTemplatesService } from './email-templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Controller('email-templates')
@UseGuards(JwtAuthGuard)
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  /** GET /api/v1/email-templates */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.emailTemplatesService.findAll(req.user, {
      category,
      search,
      status,
    });
  }

  /** GET /api/v1/email-templates/:id */
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.emailTemplatesService.findOne(req.user, id);
  }

  /** POST /api/v1/email-templates */
  @Post()
  async create(@Req() req: any, @Body() dto: CreateEmailTemplateDto) {
    return this.emailTemplatesService.create(req.user, dto);
  }

  /** PUT /api/v1/email-templates/:id */
  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplatesService.update(req.user, id, dto);
  }

  /** DELETE /api/v1/email-templates/:id */
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.emailTemplatesService.remove(req.user, id);
  }
}
