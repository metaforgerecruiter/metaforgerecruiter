import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendMailInput } from './mail.types';

const cleanStr = (val: string | undefined, defaultVal = ''): string => {
  if (!val) return defaultVal;
  return val.toString().replace(/^["']|["']$/g, '').trim();
};

@Injectable()
export class NodemailerMailService {
  private readonly logger = new Logger(NodemailerMailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = cleanStr(this.config.get<string>('SMTP_HOST'), 'smtp.office365.com');
    const port = Number(cleanStr(this.config.get<string>('SMTP_PORT'), '587')) || 587;
    const user = cleanStr(
      this.config.get<string>('SMTP_USER') ||
        this.config.get<string>('MAIL_FROM_EMAIL'),
      'recruitment.application@metaforgeit.com',
    );
    const pass = cleanStr(
      this.config.get<string>('SMTP_PASS') ||
        this.config.get<string>('SMTP_PASSWORD') ||
        this.config.get<string>('MAIL_PASSWORD'),
    );

    if (!pass) {
      throw new ServiceUnavailableException(
        'SMTP_PASS is missing in backend/.env. Please set SMTP_PASS=your_password in backend/.env to send real OTP emails.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // 587 uses STARTTLS
      auth: {
        user,
        pass,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });

    // Safe Diagnostic Connection Verification (transporter.verify)
    try {
      await transporter.verify();
      this.logger.log(
        `SMTP Connection Verified: MAIL_PROVIDER=nodemailer | HOST=${host}:${port} | USER=${user} | Connection Status=SUCCESS`,
      );
    } catch (err: any) {
      this.logger.error(
        `SMTP Connection Verification Failed: MAIL_PROVIDER=nodemailer | HOST=${host}:${port} | USER=${user} | Error=${err?.message || err}`,
      );
      throw new ServiceUnavailableException(
        `SMTP connection verification failed (${err?.message || 'Connection error'}). Check host, port and password credentials.`,
      );
    }

    this.transporter = transporter;
    return this.transporter;
  }

  async sendMail(input: SendMailInput): Promise<{ accepted: true }> {
    const from = cleanStr(
      this.config.get<string>('MAIL_FROM_EMAIL') ||
        this.config.get<string>('SMTP_USER'),
      'recruitment.application@metaforgeit.com',
    );
    const host = cleanStr(this.config.get<string>('SMTP_HOST'), 'smtp.office365.com');
    const user = cleanStr(
      this.config.get<string>('SMTP_USER') ||
        this.config.get<string>('MAIL_FROM_EMAIL'),
      'recruitment.application@metaforgeit.com',
    );

    const recipients = (input.to || []).map((s) => cleanStr(s)).filter(Boolean);
    if (!recipients.length) {
      throw new ServiceUnavailableException('Email recipient is required');
    }

    // Safe Diagnostic Logging prior to send (NO Passwords, NO OTPs exposed)
    this.logger.log(
      `Preparing OTP Email Delivery: MAIL_PROVIDER=nodemailer | HOST=${host} | FROM=${user} | RECIPIENT=${recipients.join(', ')}`,
    );

    const effectiveFrom = input.from ? cleanStr(input.from) : from;
    const fromHeader = effectiveFrom.includes('<') ? effectiveFrom : `MetaForge Recruitment <${effectiveFrom}>`;

    const transporter = await this.getTransporter();

    try {
      const info = await transporter.sendMail({
        from: fromHeader,
        to: recipients.join(', '),
        cc: input.cc?.length ? input.cc.map((s) => cleanStr(s)).join(', ') : undefined,
        bcc: input.bcc?.length ? input.bcc.map((s) => cleanStr(s)).join(', ') : undefined,
        subject: input.subject,
        text: input.text,
        html: input.html || input.text,
      });

      this.logger.log(
        `OTP Email Sent Successfully: MAIL_PROVIDER=nodemailer | RECIPIENT=${recipients.join(', ')} | Status=ACCEPTED | Message ID=${info.messageId}`,
      );
      return { accepted: true };
    } catch (err: any) {
      this.logger.error(`Nodemailer failed to send email: ${err?.message || err}`);
      throw new ServiceUnavailableException(
        `Failed to send email via SMTP (${err?.message || 'Mail server error'}). Please check SMTP credentials.`,
      );
    }
  }
}
