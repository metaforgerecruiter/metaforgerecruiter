import { Global, Module } from '@nestjs/common';
import { GraphMailService } from './graph-mail.service';
import { NodemailerMailService } from './nodemailer-mail.service';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [GraphMailService, NodemailerMailService, MailService],
  exports: [GraphMailService, NodemailerMailService, MailService],
})
export class MailModule {}
