import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ListMailOptions,
  MailMessageDetail,
  MailMessageSummary,
  SendMailInput,
  UpdateMailInput,
} from './mail.types';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

/**
 * Application-permission Microsoft Graph client for the company mailbox.
 * Credentials stay in backend environment variables and are never returned.
 */
@Injectable()
export class GraphMailService {
  private readonly logger = new Logger(GraphMailService.name);
  private tokenCache: TokenCache | null = null;

  constructor(private readonly config: ConfigService) {}

  async sendMail(input: SendMailInput): Promise<{ accepted: true }> {
    const mailbox = this.mailbox();
    const to = this.recipients(input.to);
    if (!to.length) {
      throw new ServiceUnavailableException('Email recipient is required');
    }
    const content = input.html || input.text || '';
    const contentType = input.html ? 'HTML' : 'Text';
    await this.graph('POST', `/users/${encodeURIComponent(mailbox)}/sendMail`, {
      message: {
        subject: input.subject,
        body: { contentType, content },
        toRecipients: to,
        ccRecipients: this.recipients(input.cc),
        bccRecipients: this.recipients(input.bcc),
      },
      saveToSentItems: input.saveToSentItems !== false,
    });
    this.logger.log(`Sent mail from ${mailbox} to ${to.length} recipient(s)`);
    return { accepted: true };
  }

  async listMessages(options: ListMailOptions = {}): Promise<MailMessageSummary[]> {
    const mailbox = this.mailbox();
    const folder = options.folder || 'inbox';
    const top = Math.min(Math.max(options.top || 10, 1), 50);
    const filter = options.unreadOnly ? '&$filter=isRead eq false' : '';
    const path =
      `/users/${encodeURIComponent(mailbox)}/mailFolders/${encodeURIComponent(folder)}/messages` +
      `?$top=${top}&$select=id,subject,from,receivedDateTime,isRead,bodyPreview&$orderby=receivedDateTime desc${filter}`;
    const data = await this.graph<{ value?: any[] }>('GET', path);
    return (data.value || []).map(item => this.toSummary(item));
  }

  async getMessage(messageId: string): Promise<MailMessageDetail> {
    const mailbox = this.mailbox();
    const data = await this.graph<any>(
      'GET',
      `/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}` +
        '?$select=id,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,body',
    );
    return {
      ...this.toSummary(data),
      body: data.body
        ? { contentType: data.body.contentType, content: data.body.content }
        : undefined,
      to: (data.toRecipients || [])
        .map((recipient: any) => recipient?.emailAddress?.address)
        .filter(Boolean),
    };
  }

  async setReadState(messageId: string, isRead: boolean): Promise<MailMessageSummary> {
    return this.updateMessage(messageId, { isRead });
  }

  async updateMessage(messageId: string, patch: UpdateMailInput): Promise<MailMessageSummary> {
    const mailbox = this.mailbox();
    const body: Record<string, unknown> = {};
    if (typeof patch.isRead === 'boolean') body.isRead = patch.isRead;
    if (patch.categories) body.categories = patch.categories;
    if (patch.importance) body.importance = patch.importance;
    const data = await this.graph<any>(
      'PATCH',
      `/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}`,
      body,
    );
    return this.toSummary(data);
  }

  private mailbox(): string {
    const mailbox = (this.config.get<string>('GRAPH_FROM_EMAIL') || '').trim();
    if (!mailbox) {
      throw new ServiceUnavailableException('Company mailbox is not configured');
    }
    return mailbox;
  }

  private async graph<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.accessToken();
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 202 || response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) {
      const graphCode = data?.error?.code || response.status;
      this.logger.error(`Graph ${method} failed (${graphCode})`);
      throw new ServiceUnavailableException('Microsoft Graph mailbox request failed');
    }
    return data as T;
  }

  private async accessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60_000) {
      return this.tokenCache.accessToken;
    }
    const tenantId = (this.config.get<string>('GRAPH_TENANT_ID') || '').trim();
    const clientId = (this.config.get<string>('GRAPH_CLIENT_ID') || '').trim();
    const clientSecret = this.config.get<string>('GRAPH_CLIENT_SECRET') || '';
    if (!tenantId || !clientId || !clientSecret) {
      throw new ServiceUnavailableException('Microsoft Graph is not configured');
    }
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });
    const response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok || !data?.access_token) {
      this.logger.error(`Graph token request failed (${data?.error || response.status})`);
      throw new ServiceUnavailableException('Microsoft Graph authentication failed');
    }
    const expiresIn = Number(data.expires_in || 3600);
    this.tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return data.access_token as string;
  }

  private recipients(addresses?: string[]) {
    return (addresses || [])
      .map(address => address.trim())
      .filter(Boolean)
      .map(address => ({ emailAddress: { address } }));
  }

  private toSummary(item: any): MailMessageSummary {
    return {
      id: item?.id,
      subject: item?.subject || '',
      from: item?.from?.emailAddress?.address,
      receivedDateTime: item?.receivedDateTime,
      isRead: item?.isRead,
      bodyPreview: item?.bodyPreview,
    };
  }
}
