export interface SendMailInput {
  from?: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  saveToSentItems?: boolean;
}

export interface MailMessageSummary {
  id: string;
  subject: string;
  from?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  bodyPreview?: string;
}

export interface MailMessageDetail extends MailMessageSummary {
  body?: { contentType?: string; content?: string };
  to?: string[];
}

export interface UpdateMailInput {
  isRead?: boolean;
  categories?: string[];
  importance?: 'low' | 'normal' | 'high';
}

export interface ListMailOptions {
  folder?: string;
  top?: number;
  unreadOnly?: boolean;
}
