import { resolveExperienceFields } from './experience';

const CC = [
  '+971', '+966', '+974', '+968', '+965', '+973', '+972', '+44', '+91',
  '+61', '+49', '+33', '+81', '+86', '+65', '+60', '+62', '+64', '+1',
];

export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .split(/\s*\/\s*/)
    .map((n) => {
      const t = n.trim();
      if (!t.startsWith('+')) return t;
      const flat = t.replace(/\s+/g, '');
      const cc = CC.find((c) => flat.startsWith(c));
      if (cc) {
        const loc = flat.slice(cc.length);
        return `${cc} ${loc.length === 10 ? `${loc.slice(0, 5)} ${loc.slice(5)}` : loc}`;
      }
      return flat.replace(/^(\+\d{2})(\d)/, '$1 $2');
    })
    .join(' / ');
}

export function normalizeParsedResult(r: any): any {
  const exp = resolveExperienceFields({
    total_experience: r.total_experience,
    relevant_experience: r.relevant_experience,
    work_periods: r.work_periods,
    relevant_work_periods: r.relevant_work_periods,
  });

  return {
    full_name: r.full_name || '',
    contact: normalizePhone(r.contact),
    email: r.email || '',
    linkedin: r.linkedin || '',
    qualification: r.qualification || '',
    ...exp,
    skills: Array.isArray(r.skills) ? r.skills.slice(0, 10) : [],
    technology: Array.isArray(r.technology) ? r.technology : [],
    role: (r.role || '').trim(),
  };
}
