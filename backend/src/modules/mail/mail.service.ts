import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphMailService } from './graph-mail.service';
import { NodemailerMailService } from './nodemailer-mail.service';
import { SendMailInput } from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly graphMailService: GraphMailService,
    private readonly nodemailerMailService: NodemailerMailService,
  ) {}

  async sendMail(input: SendMailInput): Promise<{ accepted: true }> {
    // Global kill switch for local/testing — blocks OTP, attendance, interviews, etc.
    const outboundEnabled = (this.config.get<string>('OUTBOUND_EMAIL_ENABLED') || 'true')
      .toString()
      .replace(/^["']|["']$/g, '')
      .trim()
      .toLowerCase();
    if (outboundEnabled === 'false' || outboundEnabled === '0') {
      this.logger.warn(
        `[Outbound disabled] Skipping email (OUTBOUND_EMAIL_ENABLED=false). To: ${Array.isArray(input.to) ? input.to.join(', ') : input.to} | Subject: "${input.subject}"`,
      );
      return { accepted: true };
    }

    const allowRequirementEmails =
      this.config.get<string>('ENABLE_REQUIREMENT_EMAILS') === 'true' ||
      this.config.get<string>('ENABLE_SUBMISSION_EMAILS') === 'true';

    const subjectLower = (input.subject || '').toLowerCase();
    const isRequirementEmail =
      subjectLower.includes('requirement') ||
      subjectLower.includes('candidate submission') ||
      subjectLower.includes('lead review');

    if (!allowRequirementEmails && isRequirementEmail) {
      this.logger.warn(
        `[Policy Block] Outbound email about requirement blocked by policy (ENABLE_REQUIREMENT_EMAILS=false). Subject: "${input.subject}".`,
      );
      return { accepted: true };
    }

    const rawProvider = this.config.get<string>('MAIL_PROVIDER') || 'nodemailer';
    const provider = rawProvider.toString().replace(/^["']|["']$/g, '').trim().toLowerCase();

    if (provider === 'graph') {
      this.logger.log('Dispatching email via Microsoft Graph provider');
      return this.graphMailService.sendMail(input);
    }

    this.logger.log('Dispatching email via Nodemailer SMTP provider (smtp.office365.com:587)');
    return this.nodemailerMailService.sendMail(input);
  }
}
