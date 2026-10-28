export interface ClientEmailConfig {
  requirement: {
    from: string;
    to: string[];
    cc: string[];
  };
  submission: {
    from: string;
    to: string[];
    cc: string[];
  };
}

export const CLIENT_EMAIL_DEFAULTS: Record<string, ClientEmailConfig> = {
  Accenture: {
    requirement: {
      from: 'anusha.k@iexcel.co.in',
      to: [
        'hiring@iexcel.co.in',
      ],
      cc: [
        'rkarnam@metaforgeit.com',
        'nitu.pant@iexcel.in',
        'neeharika.s@iexcel.co.in',
      ],
    },
    submission: {
      from: 'anusha.k@iexcel.co.in',
      to: [
        'hiring@iexcel.co.in',
      ],
      cc: [
        'rkarnam@metaforgeit.com',
        'rachana.g@metaforgeit.com',
      ],
    },
  },
  LTTS: {
    requirement: {
      from: 'Kallol.Chakraborty@Ltts.com',
      to: [],
      cc: [],
    },
    submission: {
      from: 'Kallol.Chakraborty@Ltts.com',
      to: [
        'Arundhati.Rudagi_ext@Ltts.com',
        'Pranati.Paul_ext@Ltts.com',
        'Kv.Saisiri_ext@Ltts.com',
        'Deepashree.Bc_ext@Ltts.com',
        'Caroline.Anisha_ext@Ltts.com',
        'Vinayakumarp.Patil_ext@Ltts.com',
        'Rithika.G_ext@Ltts.com',
        'Manikandan.N_ext@Ltts.com',
        'Solanki.Hemangi_ext@Ltts.com',
        'Prabha.Chavda_ext@Ltts.com',
        'Bowya.Bowya_ext@Ltts.com',
        'Nikitha.S@Ltts.com',
        'Kiran.N_ext@Ltts.com',
        'Sai.Keerthi_ext@Ltts.com',
        'Pampa.Sengarai_ext@Ltts.com',
        'Praveen.Kumar_ext@Ltts.com',
      ],
      cc: [
        'Ashwini.Kudi@Ltts.com',
        'Kallol.Chakraborty@Ltts.com',
        'rachana.g@metaforgeit.com',
      ],
    },
  },
};

export function isAccentureClient(clientName?: string): boolean {
  if (!clientName) return false;
  const normalized = clientName.trim().toLowerCase();
  return normalized === 'accenture' || normalized.startsWith('accenture');
}

export function isLttsClient(clientName?: string): boolean {
  if (!clientName) return false;
  const normalized = clientName.trim().toLowerCase();
  return normalized === 'ltts' || normalized.startsWith('ltts') || normalized.includes('l&t technology');
}

export function sanitizeEmailList(emails: string[] = []): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }
  return result;
}

export function getClientEmailDefaults(clientName?: string): ClientEmailConfig | null {
  if (isAccentureClient(clientName)) {
    return CLIENT_EMAIL_DEFAULTS.Accenture;
  }
  if (isLttsClient(clientName)) {
    return CLIENT_EMAIL_DEFAULTS.LTTS;
  }
  return null;
}
