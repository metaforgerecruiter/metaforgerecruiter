import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesRepository } from './repositories/email-templates.repository';
import { EmailTemplate, EmailTemplateSchema } from './schemas/email-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
  ],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, EmailTemplatesRepository],
  exports: [EmailTemplatesService, EmailTemplatesRepository],
})
export class EmailTemplatesModule {}
