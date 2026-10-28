/**
 * Keyword / section-based extraction of core resume fields (name, contact, education, skills).
 * Tuned for common Indian tech resume layouts (header + Education + Technical Skills + Projects).
 */

import {
  isBadCandidateDisplayName,
  isResumeSectionHeadingLine,
  trimJobTitleSuffixFromDisplayName,
} from './candidateNameValidation';
import {
  compactHighestQualification,
  cleanAcademicSpecialization,
  isCertificationOrNonAcademic,
  looksLikeJobRolePhrase,
  normalizeSkillToken,
  sanitizeDisplayText,
  DEGREE_RE,
} from './resumeFieldSanitize';
import {
  detectSkillSection,
  extractDeterministicSkills,
  validateSkillsAgainstSection,
  extractSkillsWithEngineSync,
} from './skillsExtractionEngine';

export type CoreParsedFields = {
  candidateName: string | null;
  email: string | null;
  contactNumber: string | null;
  linkedinUrl: string | null;
  highestQualification: string | null;
  educationRaw: string | null;
  skillsRaw: string | null;
  technologiesRaw: string | null;
  technologies?: string | null;
  totalExperienceYears: number | null;
  totalExperienceText?: string | null;
  relevantExperience: string | null;
  currentCompany: string | null;
  currentLocation: string | null;
  role?: string | null;
};

/** Next-section boundary (skills / education blocks stop here). */
const SECTION_END = String.raw`(?=\n\s*(?:Education|Educational\s+Qualification|Academic\s+Details|Academic\s+Background|Highest\s+Qualification|Studies|Technical\s+Skills|Technologies|Skills|Core\s+Skills|Key\s+Skills|Skill\s+Set|Domain\s+Proficiency|Technical\s+Expertise|Toolset|Area\s+of\s+Interest|Areas\s+of\s+Interest|Areas\s+of\s+Expertise|IT\s+Skills|Computer\s+Skills|Experience|Professional\s+Experience|Relevant\s+Experience|Work\s+Experience|Employment|Current\s+Company|Projects?|PROJECT(?:-\d+)?|Certifications?|Certification|Career\s+Highlights:?|Highlights:?|Additional\s+Information|Interests|Summary|Objective|Synopsis|Declaration|Key\s+Achievements?|Achievements?|Contact|Personal|References|Location)\b)`;

/** Headers that start a “skills / tech” block (case-insensitive). */
const SKILL_SECTION_START = String.raw`(?:Technical\s+Skills|Core\s+Skills|Key\s+Skills|Technologies|Technology\s+Stack|Programming\s+Languages|Programming\s+Skills|Skills\s*(?:&|and)\s*Technologies|Professional\s+Skills|Profession(?:al)?\s+Skills|Relevant\s+Skills|Software\s+Skills|IT\s+Skills|Computer\s+Skills|Functional\s+Skills|Domain\s+Proficiency|Technical\s+Expertise|Technical\s+Competencies|Toolset|Area\s+of\s+Interest|Areas\s+of\s+Interest|Areas\s+of\s+Expertise|Tech\s+Stack|Tools\s+and\s+Technologies|Tools\s*&\s*Technologies|Professional\s+Expertise|Summary\s+of\s+Skills|Skills\s+Profile|Skills?\s+Set|Skill\s+Set)`;

/** Headers that start an education / qualification block. */
const EDUCATION_SECTION_START = String.raw`(?:Education(?:\s+details|\s+qualifications?|\s+background|\s+history|\s+summary|\s+profile)?|Educational\s+Qualifications?|Educational\s+Details|Academic\s+Qualifications?|Academic\s+Background|Academic\s+Details|Academic\s+Record|Highest\s+Qualification|Studies|Qualifications?|Educational\s+Background|Degrees?(?:\s+details)?)`;

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, ' ').replace(/\*\*/g, '').trim());
}

/** Prefer header for contact fields — reduces picking footer / template emails and phones. */
function sliceResumeHeaderForContacts(text: string): string {
  const cut = text.search(
    /\n\s*(?:Professional\s+Experience|Work\s+Experience|Employment\s+History|Organizational\s+Experience|Detailed\s+Experience|Career\s+History)\b/i,
  );
  if (cut > 350 && cut < 80000) return text.slice(0, cut);
  return text.slice(0, Math.min(text.length, 9000));
}

function extractBetweenSections(fullText: string, startNames: RegExp, endBefore: RegExp): string | null {
  const m = fullText.match(
    new RegExp(
      `(?:${startNames.source})\\s*\\n([\\s\\S]*?)(?:${endBefore.source}|$)`,
      'i',
    ),
  );
  return m?.[1]?.trim() ?? null;
}

/** Block from "Education" (or synonym) until next major section. */
function sliceEducationBlock(text: string): string | null {
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:${EDUCATION_SECTION_START})\\s*:?\\s*\\n([\\s\\S]*?)(?:${SECTION_END}|$)`,
    'i',
  );
  let m = text.match(re);
  if (m?.[1]?.trim()) return m[1].trim();
  m = text.match(
    new RegExp(
      `(?:^|\\n)\\s*(?:${EDUCATION_SECTION_START})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:${SKILL_SECTION_START}|Technical\\s+Skills|Experience|Projects|Certifications?)\\b|$)`,
      'i',
    ),
  );
  if (m?.[1]?.trim()) return m[1].trim();
  return extractBetweenSections(
    text,
    new RegExp(`(?:^|\\n)\\s*(?:${EDUCATION_SECTION_START})\\s*:?\\s*\\n`, 'i'),
    new RegExp(
      `\\n\\s*(?:${SKILL_SECTION_START}|Technical\\s+Skills|Core\\s+Skills|Skills|Experience|Projects|Certifications?)\\b`,
      'i',
    ),
  );
}

export const ELIGIBLE_SKILLS_HEADING_RE =
  /^(?:technical\s+skills?|core\s+skills?|key\s+skills?|relevant\s+skills?|software\s+skills?|skills?|tools\s*(?:&|and|\/)\s*technologies|technologies\s*(?:&|and|\/)\s*tools|technical\s+competencies|core\s+competencies|core\s+technical\s+capabilities|technical\s+proficiencies|technical\s+proficiency|technical\s+expertise|professional\s+expertise|professional\s+skills?|areas?\s+of\s+expertise|software|tools|technologies|technology\s+stack|tech\s+stack|programming\s+languages?|programming\s+skills?|it\s+skills?|computer\s+skills?|skills?\s*set|skills?\s+profile|skills?\s+summary|skillset)$/i;

export const PROHIBITED_HEADING_RE =
  /\b(?:responsibilit|experience|employment|work\s+history|career\s+history|project|education|academic|qualification|summary|objective|profile|certificat|training|internship|achievement|award|declaration|personal|contact|reference|synopsis)\b/i;

/** Slices ONLY the explicitly labeled eligible Skills section(s). */
export function extractEligibleSkillsBlock(text: string): string | null {
  const detected = detectSkillSection(text);
  if (detected?.content?.trim()) {
    return detected.content.trim();
  }
  return null;
}

/** Block for Technical Skills-style section (multiline or same-line heading). */
function sliceTechnicalSkillsBlock(text: string): string | null {
  return extractEligibleSkillsBlock(text);
}

function extractEmailFromChunk(chunk: string): string | null {
  let fallbackCandidate: string | null = null;
  const labeled: RegExp[] = [
    /(?:email|e-?mail|contact\s+email)\s*[:\-]\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
    /(?:email|e-?mail|mail)\s*[:\-]?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
  ];
  for (const pattern of labeled) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(chunk)) !== null) {
      const clean = (m[1] ?? '')
        .replace(/^mailto:/i, '')
        .trim();
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(clean)) continue;
      if (/(?:example|test|sample|dummy|resume|candidate)\.(?:com|org|net)$/i.test(clean)) {
        if (!fallbackCandidate) fallbackCandidate = clean.toLowerCase();
        continue;
      }
      return clean.toLowerCase();
    }
  }
  const any = chunk.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  if (any) {
    for (const raw of any) {
      const clean = raw.replace(/^mailto:/i, '').trim();
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(clean)) continue;
      if (/(?:example|test|sample|dummy|resume|candidate)\.(?:com|org|net)$/i.test(clean)) {
        if (!fallbackCandidate) fallbackCandidate = clean.toLowerCase();
        continue;
      }
      return clean.toLowerCase();
    }
  }
  return fallbackCandidate;
}

function extractEmail(text: string): string | null {
  const head = sliceResumeHeaderForContacts(text);
  return extractEmailFromChunk(head) ?? extractEmailFromChunk(text);
}

function extractPhoneFromChunk(chunk: string): string | null {
  const patterns: RegExp[] = [
    /(?:\+91[-\s.]?)?[6-9]\d{9}\b/g,
    /\(\+91\)\s*[6-9]\d{9}\b/g,
    /\(\s*\+91\s*\)\s*[6-9]\d{9}\b/g,
    /\b\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
    /\+\d{1,3}[-\s]?\d[\d\s().-]{8,14}\d/g,
    /(?:phone|phone\s*no\.?|mobile|mob|tel|cell|contact|contact\s*number|ph\.?\s*no\.?)\s*[:\-]?\s*([+\d\s().-]{10,})/gi,
  ];
  for (const pattern of patterns) {
    const matches = chunk.match(pattern);
    if (!matches) continue;
    for (const phone of matches) {
      let clean = phone
        .replace(/^(?:phone|phone\s*no\.?|mobile|mob|tel|cell|contact|contact\s*number|ph\.?\s*no\.?)\s*[:\-]?\s*/i, '')
        .trim();
      clean = clean.replace(/[^\d+]/g, '');
      if (clean.length >= 10 && clean.length <= 15) {
        if (clean.length === 10 && /^[6-9]/.test(clean)) {
          return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
        }
        if (clean.startsWith('91') && clean.length === 12) {
          return `+${clean.slice(0, 2)} ${clean.slice(2, 7)} ${clean.slice(7)}`;
        }
        if (clean.startsWith('+')) return clean;
        if (clean.length === 10) return clean;
      }
    }
  }
  return null;
}

function extractPhone(text: string): string | null {
  const head = sliceResumeHeaderForContacts(text);
  return extractPhoneFromChunk(head) ?? extractPhoneFromChunk(text);
}

/** Normalize a matched fragment into https://www.linkedin.com/in/... */
function normalizeLinkedInProfileUrl(raw: string): string | null {
  let s = raw.trim().replace(/\s+/g, '');
  s = (s.split('?')[0] ?? '').split('#')[0] ?? '';
  s = s.replace(/\/+$/, '');
  s = s.replace(/[.,;:)]+$/g, '');
  if (!/linkedin\.com\/(?:in|pub)\//i.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) {
    s = s.replace(/^\/\//, '');
    s = 'https://www.' + s.replace(/^www\./i, '');
  } else if (/^https:\/\/linkedin\.com/i.test(s)) {
    s = s.replace(/^https:\/\/linkedin\.com/i, 'https://www.linkedin.com');
  }
  return s;
}

/**
 * LinkedIn profile URLs — PDFs often break or space tokens; "in" is the path segment for profiles.
 * Handles: full https URL, regional subdomains, spaced "linkedin . com / in / user",
 * and lines like "LinkedIn: linkedin.com/in/..."
 */
function extractLinkedIn(text: string): string | null {
  const collapsed = text
    .replace(/(https?):\/\/+\s*/gi, '$1://')
    .replace(/[\u00a0\t]/g, ' ')
    .replace(/\s+/g, ' ');

  const uid = String.raw`[a-zA-Z0-9_%\-]{1,200}`;
  const hits: { url: string; idx: number }[] = [];

  const tryPush = (fragment: string, idx: number) => {
    const n = normalizeLinkedInProfileUrl(fragment);
    if (n) hits.push({ url: n, idx });
  };

  const patterns: RegExp[] = [
    new RegExp(`https?://(?:[a-z]{2}\\.)?(?:www\\.)?linkedin\\.com/(?:in|pub)/${uid}`, 'gi'),
    new RegExp(`(?:^|\\s)www\\.linkedin\\.com/(?:in|pub)/${uid}`, 'gi'),
    new RegExp(`(?:^|\\s)linkedin\\.com/(?:in|pub)/${uid}`, 'gi'),
    new RegExp(`linkedin\\s*\\.\\s*com\\s*/\\s*(?:in|pub)\\s*/\\s*${uid}`, 'gi'),
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    while ((m = r.exec(collapsed)) !== null) {
      const rawMatch = m[0] ?? '';
      let frag = rawMatch.trim();
      if (/^linkedin\s*\./i.test(frag)) frag = frag.replace(/\s+/g, '');
      else if (/^\s/.test(rawMatch)) frag = frag.trimStart();
      if (!/^https?:\/\//i.test(frag)) {
        if (/^www\.linkedin\.com/i.test(frag)) frag = `https://${frag}`;
        else if (/^linkedin\.com/i.test(frag)) frag = `https://www.${frag}`;
      }
      tryPush(frag, m.index);
    }
  }

  const labeled = collapsed.match(
    new RegExp(
      `(?:^|\\s)(?:linkedin|linked\\s*in)\\s*[:\\-]\\s*(https?://[^\\s]+|(?:www\\.)?linkedin\\.com/(?:in|pub)/${uid})`,
      'i',
    ),
  );
  if (labeled?.[1]) {
    let frag = labeled[1].trim();
    if (!/^https?:\/\//i.test(frag)) {
      frag = frag.replace(/^www\./i, '');
      frag = `https://www.${frag}`;
    }
    tryPush(frag, labeled.index ?? 0);
  }

  /**
   * Word/Canva resumes: hyperlink text is often just `in/username` (icon + "in/slug").
   * Plain-text export has no linkedin.com — map to full profile URL.
   */
  const slugPart = String.raw`[a-zA-Z0-9](?:[a-zA-Z0-9_-]{1,98}[a-zA-Z0-9])`;
  const looksLikeLiSlug = (s: string) => {
    const t = s.replace(/[.,;:)]+$/g, '');
    if (t.length < 3 || t.length > 100) return false;
    if (/^\d+$/.test(t)) return false;
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(t);
  };
  const pushSlug = (slug: string, idx: number) => {
    const t = slug.trim().replace(/[.,;:)]+$/g, '');
    if (!looksLikeLiSlug(t)) return;
    hits.push({ url: `https://www.linkedin.com/in/${t}`, idx });
  };

  const shortLabeled = new RegExp(
    `(?:^|\\s)(?:linkedin|linked\\s*in|profile)\\s*[:\\s-]*\\s*in\\s*/\\s*(${slugPart})`,
    'gi',
  );
  let sm: RegExpExecArray | null;
  while ((sm = shortLabeled.exec(collapsed)) !== null) {
    const g = sm[1];
    if (g) pushSlug(g, sm.index);
  }

  const bareInPath = new RegExp(`(?:^|\\s)in\\s*/\\s*(${slugPart})(?=[\\s.,;)|]|$)`, 'gi');
  while ((sm = bareInPath.exec(collapsed)) !== null) {
    const g = sm[1];
    if (g) pushSlug(g, sm.index);
  }

  if (hits.length === 0) return null;
  hits.sort((a, b) => a.idx - b.idx);
  const seen = new Set<string>();
  for (const { url } of hits) {
    const k = url.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      return url;
    }
  }
  return hits[0]?.url ?? null;
}

function finalizeCandidateName(candidate: string | null): string | null {
  if (!candidate) return null;
  const trimmed = sanitizeDisplayText(trimJobTitleSuffixFromDisplayName(candidate) ?? candidate.trim());
  if (isBadCandidateDisplayName(trimmed)) return null;
  return trimmed;
}

/** Normalize "Name : RAHUL KUMAR" / "Name- John Doe" into a display name. */
function cleanExtractedName(raw: string): string | null {
  let s = raw.replace(/^[\s:–—\-]+/, '').trim();
  s = (s.split('|')[0] ?? '').trim();
  s = s.replace(/\s*[,;]\s*.*$/, '');
  s = s.replace(/\s+/g, ' ');
  if (!s || s.length > 90) return null;
  if (isBadCandidateDisplayName(s)) return null;
  if (
    /\b(?:key skills|technical skills|professional summary|career objective|core strengths?|key\s+achievements?)\b/i.test(s)
  ) {
    return null;
  }
  if (/^[A-Z][A-Z\s.'-]{2,80}$/.test(s)) {
    return finalizeCandidateName(
      s
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  }
  if (/^[A-Za-z][A-Za-z.'-]*(?:\s+(?:[A-Za-z][A-Za-z.'-]*|[A-Za-z]\.)){0,6}$/.test(s)) {
    return finalizeCandidateName(s);
  }
  return null;
}

function extractNameFromLabeledFields(fullText: string): string | null {
  const patterns = [
    /(?:^|\n)\s*(?:Name|Candidate\s*Name|Full\s*Name)\s*[:]\s*([^\n]+)/i,
    /(?:^|\n)\s*(?:Name|Candidate\s*Name|Full\s*Name)\s*[-–—]\s*([^\n]+)/i,
    /(?:^|\n)\s*(?:Name|Candidate\s*Name|Full\s*Name)\s*\*?\s*(?:[:\-–—]\s*)?([A-Z][^\n]{1,80})/i,
  ];
  for (const re of patterns) {
    const m = fullText.match(re);
    if (m?.[1]) {
      const cleaned = cleanExtractedName(m[1].split(/\t/)[0] ?? m[1]);
      if (cleaned) return cleaned;
    }
  }
  return null;
}

/** Name: labeled fields + first plausible title-case line in header (before Objective/Education/skills). */
function extractName(lines: string[], fullText: string): string | null {
  const fromLabels = extractNameFromLabeledFields(fullText);
  if (fromLabels) return fromLabels;

  const headerStop =
    /^(objective|summary|career\s+summary|experience\s+summary|work\s+summary|curriculum\s+vitae|curriculum|vitae|education|work\s+experience|professional\s+experience|organizations?\s+experience|experience|skills|technical|projects|contact|personal|profile|core\s+strengths?|career\s+objective|key\s+achievements?|achievements?|synopsis|declaration|about\s+me|strengths|technical\s+competency|biodata|resume)$/i;
  const skipLine =
    /[@/:]|linkedin|github\.com|\.com\/in\/|^\d[\d\s().+-]{8,}$|^[+()]/i;
  const locationOnly =
    /^(hyderabad|bengaluru|bangalore|chennai|mumbai|delhi|pune|kolkata|india)\b/i;

  for (let i = 0; i < Math.min(28, lines.length); i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine.replace(/^[\s•\-–—]+/, '').trim();
    if (!line || line.length > 90) continue;
    if (skipLine.test(line) || headerStop.test(line)) continue;
    if (locationOnly.test(line) && /,\s*india/i.test(line)) continue;

    const labeled = line.match(
      /^(?:name|candidate|full\s*name)\s*[:\-]\s*(.+)$/i,
    );
    if (labeled?.[1]) {
      const n = cleanExtractedName(labeled[1]);
      if (n) return n;
    }

    if (
      /^[A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.)){1,4}$/.test(line) &&
      line.length >= 4 &&
      line.length <= 60
    ) {
      const name = finalizeCandidateName(line);
      if (name) return name;
    }

    if (
      /^[A-Z][A-Z.\s]{2,50}$/.test(line) &&
      /[A-Z]{2,}/.test(line) &&
      line.split(/\s+/).length >= 2 &&
      line.split(/\s+/).length <= 5 &&
      line.length <= 60
    ) {
      if (!isResumeSectionHeadingLine(line)) {
        const name = finalizeCandidateName(
          line
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        );
        if (name) return name;
      }
    }
  }

  const emailLineIdx = lines.findIndex((l) =>
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(l),
  );
  if (emailLineIdx > 0) {
    const prevRaw = lines[emailLineIdx - 1];
    if (prevRaw !== undefined) {
      const prev = prevRaw.replace(/^[\s•\-–—]+/, '').trim();
      if (
        prev &&
        prev.length >= 2 &&
        prev.length <= 80 &&
        !skipLine.test(prev) &&
        !headerStop.test(prev)
      ) {
        if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4}$/.test(prev) && !isResumeSectionHeadingLine(prev)) {
          const name = finalizeCandidateName(prev);
          if (name) return name;
        }
        if (
          /^[A-Z][A-Z\s]{2,50}$/.test(prev) &&
          prev.split(/\s+/).length >= 2 &&
          prev.split(/\s+/).length <= 5 &&
          !isResumeSectionHeadingLine(prev)
        ) {
          const name = finalizeCandidateName(
            prev
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          );
          if (name) return name;
        }
      }
    }
  }

  const m = fullText.match(/(?:^|\n)\s*(?:name|full\s*name)\s*[:\-]\s*([^\n]+)/i);
  if (m?.[1]) {
    const c = cleanExtractedName(m[1]);
    if (c) return c;
  }
  return null;
}

/**
 * Rank a line by highest degree mentioned (10th < 12th < diploma < UG < PG < PhD).
 * Used to pick e.g. B.Tech over 10th/12th when all appear under Education.
 */
function rankLineForDegree(line: string): number {
  if (isCertificationOrNonAcademic(line)) return 0;
  const L = line;
  const tiers: Array<{ re: RegExp; rank: number }> = [
    { re: /\b(ph\.?\s*d|phd|doctorate|doctoral|doctor\s+of\s+philosophy)\b/i, rank: 100 },
    { re: /\b(m\.?\s*phil|m\.?\s*philosophy)\b/i, rank: 88 },
    {
      re: /\b(m\.?\s*tech|m\.?\s*e\.?|m\.?\s*sc|m\.?\s*com|mca|mba|pgdm|pgdca|post\s*graduate(?:\s+diploma)?|post-?grad|msc|m\.?\s*sc\.|ms\s+in|master(?:'s)?\s+(?:degree|of\b|in\b)|master\s+degree)\b/i,
      rank: 75,
    },
    {
      re: /\b(b\.?\s*tech|b\.?\s*e\.?|b\.?\s*e\b|bachelor|b\.?\s*sc|b\.?\s*com\.?|b\.?\s*com\b|bca|bba|b\.?\s*ba|b\.?\s*arch|b\.?\s*pharm|under\s*graduate|undergraduate|u\.?g\.?)\b/i,
      rank: 55,
    },
    { re: /\b(diploma(?:\s+in\b)?|polytechnic|d\.?\s*tech\s*\(diploma\)|associate(?:\s+degree)?)\b/i, rank: 42 },
    {
      re: /\b(12\s*th|twelfth|hsc|h\.?\s*s\.?\s*c|intermediate|\+2|plus\s*two|puc|senior\s*secondary|class\s*xii|class\s*12)\b/i,
      rank: 32,
    },
    {
      re: /\b(10\s*th|tenth|ssc|s\.?\s*s\.?\s*c|matric|matriculation|sslc|class\s*10|class\s*x\b)\b/i,
      rank: 22,
    },
  ];
  let max = 0;
  for (const { re, rank } of tiers) {
    if (re.test(L)) max = Math.max(max, rank);
  }
  return max;
}

/** Remove marks / scores from education lines (UI + DB should not show these). */
function stripMarksFromEducationText(s: string): string {
  let t = s.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  t = t.replace(/\b(?:cgpa|sgpa|gpa)\s*[:\-]?\s*[\d.]+\s*(?:\/\s*\d+)?\b/gi, ' ');
  t = t.replace(/\b(?:percentage|aggregate|marks?|scores?)\s*[:\-]?\s*[\d.]+\s*%?\b/gi, ' ');
  t = t.replace(/\b\d+(?:\.\d+)?\s*%\b/g, ' ');
  t = t.replace(/\b(?:distinction|first\s*class|second\s*class|with\s+honou?rs)\b/gi, ' ');
  t = t.replace(/\s*[,;]?\s*(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}\b/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * Extract highest legitimate academic degree + course/branch/specialization.
 * Never appends university, year, marks, or certifications.
 */
function pickBestEducationFromBlock(educationBlock: string | null): {
  highestQualification: string | null;
  educationItems: string[];
} {
  if (!educationBlock?.trim()) return { highestQualification: null, educationItems: [] };
  const rawLines = educationBlock
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-–—]+/, '').trim())
    .filter(Boolean)
    .filter((l) => !/^(project(?:-\d+)?|description|roles?|team\s*size)\b/i.test(l))
    .filter((l) => !isCertificationOrNonAcademic(l));
  if (rawLines.length === 0) return { highestQualification: null, educationItems: [] };

  const stripped = rawLines.map((l) => stripMarksFromEducationText(l));
  let maxR = 0;
  for (const line of stripped) {
    maxR = Math.max(maxR, rankLineForDegree(line));
  }
  if (maxR <= 0) {
    return { highestQualification: null, educationItems: [] };
  }

  const tierRows = stripped
    .map((line, idx) => ({ line, idx, r: rankLineForDegree(line) }))
    .filter((x) => x.r === maxR);
  let pick = tierRows[0];
  for (const row of tierRows) {
    if (pick && row.line.length > pick.line.length) pick = row;
  }
  if (!pick) return { highestQualification: null, educationItems: [] };

  const cleaned = cleanAcademicSpecialization(pick.line);
  return cleaned
    ? { highestQualification: cleaned, educationItems: [cleaned] }
    : { highestQualification: null, educationItems: [] };
}

/** Prefer header / education-adjacent text so degree mentions in job history are not picked as HQ. */
function sliceResumeHeadForEducationFallback(fullText: string): string {
  const markers = [
    /\n\s*(?:Professional\s+Experience|Work\s+Experience|Employment\s+History|Career\s+Snapshot|Organizational\s+Experience|Detailed\s+Experience|Experience\s*[\|:])/i,
    /\n\s*(?:PROJECT|Project)[\s_-]?\d/i,
  ];
  let cut = fullText.length;
  for (const rx of markers) {
    const m = rx.exec(fullText);
    if (m && m.index >= 200 && m.index < cut) cut = m.index;
  }
  if (cut !== fullText.length) return fullText.slice(0, cut);
  return fullText.slice(0, Math.min(fullText.length, 4800));
}

export function extractHighestQualificationFromAnyText(text: string): string | null {
  const lines = text
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-–—]+/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((l) => l.length < 180)
    .filter((l) => !isCertificationOrNonAcademic(l));
  let best: { rank: number; value: string } | null = null;
  for (const line of lines) {
    const r = rankLineForDegree(line);
    if (r <= 0) continue;
    if (/\b(responsible|managed|leading\s+a|team\s+of|delivered|implemented|designed|client:|stakeholder)\b/i.test(line)) {
      continue;
    }
    if (
      line.length > 95 &&
      !/\b(university|college|institute|polytechnic|school|board|cgpa|gpa|graduation|aggregate|%\b|\d{4})\b/i.test(line) &&
      !DEGREE_RE.test(line)
    ) {
      continue;
    }
    const cleaned = cleanAcademicSpecialization(line);
    if (!cleaned) continue;
    if (!best || r > best.rank || (r === best.rank && cleaned.length > best.value.length)) {
      best = { rank: r, value: cleaned };
    }
  }
  if (!best?.value) return null;
  return cleanAcademicSpecialization(best.value);
}

function looksLikeEducationRow(line: string): boolean {
  if (isCertificationOrNonAcademic(line)) return false;
  if (rankLineForDegree(line) > 0) return true;
  if (
    /\b(university|college|institute|polytechnic|school|board|cgpa|gpa|\d{1,2}\.\d\s*cgpa|%\s*\d|graduation|year\s+of\s+passing)\b/i.test(
      line,
    )
  ) {
    return true;
  }
  if (/\b(?:19|20)\d{2}\b/.test(line) && line.length < 130) return true;
  return false;
}

function extractEducationItems(educationBlock: string | null): string[] {
  if (!educationBlock) return [];
  return Array.from(
    new Set(
      educationBlock
        .split(/\n|[;•]/)
        .map((line) => line.replace(/^[\s•\-–—]+/, '').replace(/\s+/g, ' ').trim())
        .filter((line) => line.length > 2 && line.length < 180)
        .filter((line) => !isCertificationOrNonAcademic(line))
        .filter(
          (line) =>
            !/^(project(?:-\d+)?|description|roles?|team\s*size|duration|customer|tools?)\b/i.test(line),
        )
        .filter((line) => looksLikeEducationRow(line))
        .map((line) => cleanAcademicSpecialization(stripMarksFromEducationText(line)) ?? '')
        .filter((line) => line.length > 2 && line.length < 180),
    ),
  ).slice(0, 2);
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function parseExperienceDateToken(val: string): { year: number; month?: number; isPresent?: boolean } | null {
  const s = val.trim().toLowerCase();
  if (!s) return null;
  if (/^(present|current|now|till\s+date|till\s+now|ongoing)$/i.test(s)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), isPresent: true };
  }
  // Month Name + Year: "January 2021", "Jan 2021", "Jan, 2021", "Jan'21", "Jan 21"
  const named = s.match(/^([a-z]+)\s*[,']?\s*(\d{4})$/i);
  if (named?.[1] && named?.[2] && MONTH_MAP[named[1].toLowerCase()] !== undefined) {
    return { year: Number(named[2]), month: MONTH_MAP[named[1].toLowerCase()] };
  }
  const namedShort = s.match(/^([a-z]+)\s*[']?\s*(\d{2})$/i);
  if (namedShort?.[1] && namedShort?.[2] && MONTH_MAP[namedShort[1].toLowerCase()] !== undefined) {
    const yr = 2000 + Number(namedShort[2]);
    return { year: yr, month: MONTH_MAP[namedShort[1].toLowerCase()] };
  }
  // MM/YYYY or MM-YYYY
  const mmYyyy = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmYyyy?.[1] && mmYyyy?.[2]) {
    const m = Number(mmYyyy[1]);
    if (m >= 1 && m <= 12) {
      return { year: Number(mmYyyy[2]), month: m - 1 };
    }
  }
  // YYYY-MM
  const yyyyMm = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yyyyMm?.[1] && yyyyMm?.[2]) {
    const m = Number(yyyyMm[2]);
    if (m >= 1 && m <= 12) {
      return { year: Number(yyyyMm[1]), month: m - 1 };
    }
  }
  // YYYY only: "2021"
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly?.[1]) {
    const yr = Number(yearOnly[1]);
    if (yr >= 1970 && yr <= 2050) {
      return { year: yr };
    }
  }
  return null;
}

export function calculateExperienceFromWorkHistory(fullText: string): string | null {
  const expMatch =
    fullText.match(
      /(?:^|\n)\s*(?:Professional\s+Experience|Work\s+Experience|Employment\s+History|Experience|Career\s+History|Work\s+History|Employment)\s*:?\s*(?:\n|$)([\s\S]*?)(?=(?:^|\n)\s*(?:Education|Educational\s+Qualifications?|Academic\s+Details|Academic\s+Background|Technical\s+Skills|Skills|Core\s+Skills|Key\s+Skills|Projects?|Academic\s+Projects?|Certifications?|Declaration)\b|$)/i,
    ) ??
    fullText.match(
      /(?:Professional\s+Experience|Work\s+Experience|Employment\s+History|Experience)\b[:\s]*([\s\S]*?)(?=(?:Education|Technical\s+Skills|Skills|Projects?|Declaration)\b|$)/i,
    );

  let searchSection = expMatch?.[1] || fullText;

  // If fallback to fullText, exclude Education block if present
  if (!expMatch?.[1]) {
    const eduBlock = sliceEducationBlock(fullText);
    if (eduBlock) {
      searchSection = searchSection.replace(eduBlock, '');
    }
  }

  const dateRangePattern =
    /\b((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,']*\d{2,4}|\d{1,2}[-/]\d{2,4}|\d{4}))\s*(?:[-–—]|\bto\b)\s*((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,']*\d{2,4}|\d{1,2}[-/]\d{2,4}|\d{4}|present|current|till\s+date|till\s+now|now|ongoing))\b/gi;

  const intervals: Array<[number, number]> = [];

  const lines = searchSection.split(/\r?\n/);
  for (const line of lines) {
    if (/\b(?:intern|internship|academic\s+project|coursework|training)\b/i.test(line)) {
      continue;
    }
    let m: RegExpExecArray | null;
    const re = new RegExp(dateRangePattern.source, 'gi');
    while ((m = re.exec(line)) !== null) {
      const startToken = m[1];
      const endToken = m[2];
      if (!startToken || !endToken) continue;
      const start = parseExperienceDateToken(startToken);
      const end = parseExperienceDateToken(endToken);
      if (!start || !end) continue;

      const isYearOnly = start.month === undefined && end.month === undefined && !end.isPresent;
      let startIdx: number;
      let endIdx: number;

      if (isYearOnly) {
        if (end.year < start.year) continue;
        startIdx = start.year * 12;
        endIdx = end.year * 12;
      } else {
        startIdx = start.year * 12 + (start.month ?? 0);
        if (end.isPresent) {
          endIdx = end.year * 12 + end.month!;
        } else if (end.month !== undefined) {
          endIdx = end.year * 12 + end.month + 1;
        } else {
          endIdx = end.year * 12 + 12;
        }
        if (endIdx < startIdx) continue;
      }

      intervals.push([startIdx, endIdx]);
    }
  }

  if (intervals.length === 0) {
    let m: RegExpExecArray | null;
    const re = new RegExp(dateRangePattern.source, 'gi');
    while ((m = re.exec(searchSection)) !== null) {
      const startToken = m[1];
      const endToken = m[2];
      if (!startToken || !endToken) continue;
      const start = parseExperienceDateToken(startToken);
      const end = parseExperienceDateToken(endToken);
      if (!start || !end) continue;

      const isYearOnly = start.month === undefined && end.month === undefined && !end.isPresent;
      let startIdx: number;
      let endIdx: number;

      if (isYearOnly) {
        if (end.year < start.year) continue;
        startIdx = start.year * 12;
        endIdx = end.year * 12;
      } else {
        startIdx = start.year * 12 + (start.month ?? 0);
        if (end.isPresent) {
          endIdx = end.year * 12 + end.month!;
        } else if (end.month !== undefined) {
          endIdx = end.year * 12 + end.month + 1;
        } else {
          endIdx = end.year * 12 + 12;
        }
        if (endIdx < startIdx) continue;
      }

      intervals.push([startIdx, endIdx]);
    }
  }

  if (intervals.length === 0) return null;

  // Merge overlapping intervals to avoid double-counting and exclude gaps
  const sorted = intervals.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1]!;
    const cur = sorted[i]!;
    if (cur[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }

  let totalMonths = 0;
  for (const [s, e] of merged) {
    if (e > s) {
      totalMonths += (e - s);
    }
  }

  const completedYears = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  if (completedYears <= 0 && remainingMonths <= 0) return null;
  if (completedYears <= 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  }
  if (remainingMonths === 0) {
    return `${completedYears} ${completedYears === 1 ? 'year' : 'years'}`;
  }
  return `${completedYears}.${remainingMonths} years`;
}

export function parseNumericYears(str: string): number | null {
  if (!str) return null;
  const m = str.match(/(\d+)\s*(?:months?|mos?)/i);
  if (m && !/years?|yrs?/i.test(str)) {
    const months = parseInt(m[1]!, 10);
    return Math.floor(months / 12);
  }
  const ym = str.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yr\b)/i);
  if (ym && ym[1]) {
    return Math.floor(parseFloat(ym[1]));
  }
  const num = str.match(/(\d+(?:\.\d+)?)/);
  if (num && num[1]) {
    return Math.floor(parseFloat(num[1]));
  }
  return null;
}

export function cleanExperienceOutput(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  if (!s) return '';

  // 1. Strip leading punctuation, table pipes, colons, bullets
  s = s.replace(/^[|:;\-–—•*▪▫❖➢✓★+\t\s]+/, '');

  // 2. Remove leading label if passed directly (e.g. "Total Experience: 6 years")
  s = s.replace(
    /^(?:(?:total|overall|work|professional)\s+)?(?:years\s+of\s+)?(?:experience|exp\.?)\s*(?:is|of)?\s*[:|\t\-–—]\s*/i,
    '',
  );

  // 3. Remove descriptive qualifier words
  s = s.replace(
    /^(?:having\s+)?(?:experience\s+of\s+)?(?:nearly|approximately|approx|about|over|more\s+than|at\s+least|around|almost|totally|close\s+to|upwards\s+of|in\s+excess\s+of)\s+/i,
    '',
  );
  s = s.replace(
    /\b(?:overall|nearly|approximately|approx|about|over|more\s+than|having|experience\s+of|at\s+least|around|almost|totally|close\s+to|upwards\s+of|in\s+excess\s+of)\b/gi,
    ' ',
  );
  s = s.replace(
    /\s+(?:of\s+)?(?:overall|total|professional|work|industry|technical|it|software)?\s*experience.*$/i,
    '',
  );
  s = s.replace(/\s+/g, ' ').trim();

  // 4. Match: digits with optional decimal, optional +, unit (years, yrs), optional additional months
  const m = s.match(
    /^(\d+(?:\.\d+)?\+?)\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?(\d+)\s*(?:months?|mos?))?/i,
  );
  if (m) {
    const num = m[1];
    const unit = num === '1' ? 'year' : 'years';
    if (m[2]) {
      return `${num} ${unit} ${m[2]} months`;
    }
    return `${num} ${unit}`;
  }

  // 5. Months-only match (e.g. "36 months", "18 mos")
  const mMonth = s.match(/^(\d+)\s*(?:months?|mos?)/i);
  if (mMonth) {
    return `${mMonth[1]} months`;
  }

  return '';
}

export function extractTotalExperienceInfo(text: string): { text: string; years: number | null } {
  if (!text || !text.trim()) {
    return { text: '', years: null };
  }

  const s = text.trim();

  // Step 0: Direct isolated experience phrase (e.g. passed from candidate.totalExperience or clean snippet)
  const directMatch = s.match(
    /^((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))$/i,
  );
  if (directMatch?.[1]?.trim()) {
    const cleaned = cleanExperienceOutput(directMatch[1].trim());
    if (cleaned) {
      return { text: cleaned, years: parseNumericYears(cleaned) };
    }
  }

  type CandidateRecord = {
    raw: string;
    cleaned: string;
    years: number | null;
    score: number;
    index: number;
  };

  const candidates: CandidateRecord[] = [];

  const addCandidate = (rawSnippet: string, matchIdx: number, score: number) => {
    // Check surrounding text for "relevant experience" (without overall/total)
    const surrounding = s.slice(Math.max(0, matchIdx - 35), matchIdx + rawSnippet.length + 35);
    const preceding = s.slice(Math.max(0, matchIdx - 35), matchIdx);
    if (/\brelevant\s+experience\b/i.test(surrounding) || /\brelevant\s*$/i.test(preceding)) {
      if (!/\b(?:overall|total)\b/i.test(surrounding) && !/\b(?:overall|total)\b/i.test(rawSnippet)) {
        return;
      }
    }

    // Check following text for education degrees/courses (e.g. "4 years degree", "4 years btech course")
    const afterIdx = matchIdx + rawSnippet.length;
    const following = s.slice(afterIdx, Math.min(s.length, afterIdx + 30));
    if (/^\s*(?:degree|course|b\.?tech|b\.?e|m\.?tech|m\.?e|diploma|graduation)\b/i.test(following)) {
      return;
    }

    const cleaned = cleanExperienceOutput(rawSnippet);
    if (!cleaned) return;

    candidates.push({
      raw: rawSnippet,
      cleaned,
      years: parseNumericYears(cleaned),
      score,
      index: matchIdx,
    });
  };

  // Pattern Group 1: Explicit Labeled Fields (e.g. "Total Experience: 6 years", "Work Experience: 7+ years", "| Total Exp | 5 Yrs |")
  // Score: 100 for Total/Overall, 85 for Work/Professional/General Experience label
  const labeledPatterns: Array<{ re: RegExp; isTotal: boolean }> = [
    // Labeled with explicit Total/Overall: "Total Experience: 8 years", "Total Exp: 6.5 yrs", "Overall Experience: 7 years"
    {
      re: /(?:^|[|\n\r;•*▪▫❖➢✓★-])\s*(?:(?:total|overall)\s+(?:work\s+|professional\s+|industry\s+|it\s+|software\s+)?(?:years\s+of\s+)?(?:experience|exp\.?)|(?:total\s+)?years\s+of\s+experience)\s*(?:is|of)?\s*(?:[:|\t\-–—]\s*|\s*\n\s*|\s{2,})((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))/gi,
      isTotal: true,
    },
    // Labeled general experience: "Work Experience: 7 years", "Professional Experience: 8+ yrs", "Experience: 5 years", "Exp: 6 yrs"
    {
      re: /(?:^|[|\n\r;•*▪▫❖➢✓★-])\s*(?:(?:work|professional)\s+(?:experience|exp\.?)|experience|exp\.?)\s*(?:is|of)?\s*(?:[:|\t\-–—]\s*|\s*\n\s*|\s{2,})((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))/gi,
      isTotal: false,
    },
  ];

  for (const { re, isTotal } of labeledPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      if (m[1]?.trim()) {
        addCandidate(m[1].trim(), m.index, isTotal ? 100 : 85);
      }
    }
  }

  // Pattern Group 2: Explicit Overall / Total in Sentences (Score: 95)
  // e.g. "having 6 years of overall work experience", "nearly 12 years of total experience", "total experience of 8 years"
  const sentenceTotalPatterns: RegExp[] = [
    /\b((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))\s+(?:of\s+)?(?:overall|total)\s*(?:work\s+|professional\s+|industry\s+|it\s+|software\s+)?experience\b/gi,
    /\b(?:overall|total)\s+(?:work\s+|professional\s+|industry\s+|it\s+|software\s+)?experience\s*(?:is|of|[:\-–—])?\s*((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))/gi,
  ];

  for (const re of sentenceTotalPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      if (m[1]?.trim()) {
        addCandidate(m[1].trim(), m.index, 95);
      }
    }
  }

  // Pattern Group 3: General Career / Professional Experience in Sentences (Score: 70)
  // e.g. "5 years of experience", "8+ years of experience", "Over 7 years of experience", "Nearly 12 years of experience", "More than 10 years of professional experience", "4.5 years of experience"
  const sentenceGeneralPatterns: RegExp[] = [
    /\b((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))\s+(?:of\s+)?(?:work\s+|professional\s+|industry\s+|it\s+|software\s+|technical\s+|hands[- ]on\s+|rich\s+|extensive\s+|proven\s+|progressive\s+|successful\s+|diverse\s+|practical\s+)?(?:career\s+)?experience\b/gi,
    /\b(?:having|with|offering|bringing|possessing)\s+((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))\s+(?:of\s+)?(?:[a-zA-Z\-]+\s+)?experience\b/gi,
  ];

  for (const re of sentenceGeneralPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      if (m[1]?.trim()) {
        addCandidate(m[1].trim(), m.index, 70);
      }
    }
  }

  if (candidates.length === 0) {
    return { text: '', years: null };
  }

  // Sort candidates by score descending, then by document appearance index ascending
  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  const best = candidates[0];
  if (!best) {
    return { text: '', years: null };
  }
  const bestScore = best.score;
  const topCandidates = candidates.filter((c) => c.score === bestScore);

  // Check for conflicts among top candidates
  const distinctCleaned = Array.from(new Set(topCandidates.map((c) => c.cleaned)));
  if (distinctCleaned.length > 1) {
    console.warn(
      `[extractTotalExperienceInfo] Conflicting experience statements detected: ${topCandidates
        .map((c) => `"${c.raw}" -> ${c.cleaned}`)
        .join(', ')}. Resolving deterministically to primary statement.`,
    );

    // If one candidate has '+' and shares the same numeric base (e.g. "8+ years" vs "8 years"), prefer the '+' version
    const plusCand = topCandidates.find((c) => c.cleaned.includes('+'));
    if (plusCand) {
      const baseNum = plusCand.cleaned.replace(/\+.*$/, '');
      const nonPlusMatch = topCandidates.find(
        (c) => !c.cleaned.includes('+') && c.cleaned.startsWith(baseNum),
      );
      if (nonPlusMatch) {
        return { text: plusCand.cleaned, years: plusCand.years };
      }
    }
  }

  // Deterministic winner is the highest score and earliest appearance in the document
  const winner = topCandidates[0]!;
  return { text: winner.cleaned, years: winner.years };
}

function extractRelevantExperience(text: string): string | null {
  // Explicitly set to blank per requirement
  void text;
  return "";
}

function extractCurrentCompany(text: string): string | null {
  const labeled = text.match(
    /(?:current\s+company|present\s+company|currently\s+working\s+at)\s*[:\-]\s*([^\n]{2,120})/i,
  );
  const v = labeled?.[1]?.replace(/\s+/g, ' ').trim();
  if (v) return v;
  const inPhrase =
    text.match(/currently\s+i\s+am\s+working\s+as\s+[^.\n]{0,40}\s+in\s+([A-Za-z][A-Za-z0-9&.\- ]{2,80})/i) ??
    text.match(/currently\s+working\s+(?:as\s+[^.\n]{0,40}\s+)?at\s+([A-Za-z][A-Za-z0-9&.\- ]{2,80})/i) ??
    text.match(/presently\s+working\s+with\s+([A-Za-z][A-Za-z0-9&.\- ]{2,80})/i);
  return inPhrase?.[1]?.replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '') || null;
}

export function extractCurrentLocation(text: string): string | null {
  const labeled = text.match(
    /(?:current\s+location|location|based\s+in)\s*[:\-]\s*([^\n]{2,120})/i,
  );
  const v = labeled?.[1]?.replace(/\s+/g, ' ').trim();
  if (v) return v;

  const addressMatch = text.match(
    /(?:permanent\s+address|current\s+address|address)\s*[:\-]\s*([^\n]{2,140})/i,
  );
  if (addressMatch?.[1]) {
    const addr = addressMatch[1];
    const cityInAddr = addr.match(
      /\b(Pune|Mumbai|Bengaluru|Bangalore|Hyderabad|Chennai|Delhi|Noida|Gurgaon|Gurugram|Kolkata|Ahmedabad|Vadodara|Jaipur|Indore|Coimbatore|Kochi|Trivandrum|Chandigarh|Nagpur|Bhubaneswar)\b/i,
    );
    if (cityInAddr?.[1]) {
      const stateInAddr = addr.match(
        /\b(Maharashtra|Karnataka|Tamil Nadu|Telangana|Andhra Pradesh|Kerala|Gujarat|Delhi|Uttar Pradesh|Madhya Pradesh|Rajasthan|West Bengal|Odisha|Punjab|Haryana)\b/i,
      );
      return stateInAddr?.[1] ? `${cityInAddr[1]}, ${stateInAddr[1]}` : cityInAddr[1];
    }
  }

  const cityState = text.match(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*,\s*(Maharashtra|Karnataka|Tamil Nadu|Telangana|Andhra Pradesh|Kerala|Gujarat|Delhi|Uttar Pradesh|Madhya Pradesh|Rajasthan|West Bengal|Odisha|Punjab|Haryana|Bihar|Chhattisgarh|Jharkhand|Assam|Goa)\b/i,
  );
  if (cityState?.[1] && cityState?.[2]) {
    const city = cityState[1].replace(/\s+/g, ' ').trim();
    const state = cityState[2].replace(/\s+/g, ' ').trim();
    return `${city}, ${state}`;
  }

  return null;
}

export const ROLE_NOUNS_REGEX =
  /\b(?:Consultant|Engineer|Developer|Architect|Analyst|Specialist|Lead|Manager|Administrator|Tester|Designer|Programmer|Scientist|Coordinator|Technician|Officer|Executive|Auditor|Professional|Expert|Practitioner|Associate|Generalist|Recruiter|Strategist|Director)\b/i;

export const PROFESSIONAL_DOMAINS_REGEX =
  /\b(?:Global\s+Mobility(?:\s+Immigration)?|Immigration|Human\s+Resources|Talent\s+Acquisition|Business\s+Intelligence|Data\s+Science|Data\s+Analytics|Machine\s+Learning|Artificial\s+Intelligence|Cloud\s+Computing|DevOps|Cyber\s+Security|Information\s+Security|Network\s+Engineering|Quality\s+Assurance|UI\/UX(?:\s+Design)?|Digital\s+Marketing|Supply\s+Chain|Product\s+Management|Project\s+Management)\b/i;

export function cleanAndValidateRoleOrTechnologies(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let c = raw.replace(/^[\s•\-–—*.,;:|]+/, '').replace(/[\s.,;:!|]+$/, '').trim();
  if (!c || c.length < 3 || c.length > 80) return null;

  // Reject skill/knowledge paragraphs (must never land in designation/Technologies)
  if (
    /^(?:knowledge|expertise|proficient|familiar|hands[- ]?on|exposure|skills?|tools?|technologies)\b/i.test(c) ||
    /\bknowledge\s+on\b/i.test(c) ||
    /\b(?:installation|uninstallation|kernel\s+upgrade|client\s+creation|system\s+refresh)\b/i.test(c) ||
    (c.match(/,/g) || []).length >= 3 ||
    c.split(/\s+/).filter(Boolean).length > 10
  ) {
    return null;
  }

  // 1. REJECT section headings
  if (
    /^(?:internship|internships|projects?|education|certifications?|strengths?|technical\s+skills|skills|summary|profile|objective|languages?|declaration|references?)\b/i.test(
      c,
    )
  ) {
    return null;
  }

  // 2. REJECT student / intern titles
  if (/\b(?:intern|internship|trainee|student|graduate\s+assistant|research\s+assistant)\b/i.test(c)) {
    return null;
  }

  // 3. REJECT bullet points, responsibilities, sentences, and duty phrases
  if (
    /^(?:worked|working|responsibilities|responsible|handled|handling)\b/i.test(c) ||
    /\b(?:developed|developing|designed\s+(?:machine|web|models?)|built|creating|implemented|managed|worked\s+(?:on|with|in|at|for)|working\s+(?:on|with|in|at|for)|responsible\s+for|responsibilities|the\s+project\s+development\s+process|gained\s+hands[- ]on|learned\s+the|improved\s+understanding|evaluation|attend(?:ed|ing)|participat(?:ed|ing)|conducted|prepared|tracked|facilitated|collaborated)\b/i.test(
      c,
    )
  ) {
    return null;
  }

  // Reject sentences with full stops in the middle or multiple clauses
  if (/[.!?]\s+[A-Za-z]/.test(c)) return null;

  // 4. STRIP experience duration / numeric years from role string if a valid designation precedes it
  c = c
    .replace(/\s*[-–—|:(,]\s*(?:over\s+|nearly\s+|about\s+|approximately\s+|more\s+than\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|months?|mos?)(?:\s+of\s+experience)?\)?.*$/i, '')
    .replace(/\s+(?:with|having|possessing|offering)\s+(?:over\s+|nearly\s+|about\s+|approximately\s+|more\s+than\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|months?|mos?).*$/i, '')
    .replace(/\s+(?:with|having|possessing|specializing\s+in|specialized\s+in|experienced\s+in|offering)\s+(?:experience\s+using|experience\s+in|background\s+in)\s+.*$/i, '')
    .replace(/\s*[-–—|]\s*\d+\+?\s*(?:years?|yrs?).*$/i, '')
    .trim();

  // 5. REJECT duration-only strings or strings where years remain
  if (
    /^\s*(?:over\s+|nearly\s+|about\s+|approximately\s+|more\s+than\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|months?|mos?)\s*(?:of\s+experience)?\s*$/i.test(
      c,
    ) ||
    /^\s*\d+\+?\s*(?:years?|yrs?)\s+(?:of\s+)?/i.test(c) ||
    /\b\d+\s+years\b/i.test(c) ||
    /\b(?:worked\s+in|experience\s+in)\b.*\b\d+\s+years\b/i.test(c)
  ) {
    return null;
  }

  if (isCertificationOrNonAcademic(c)) return null;

  // Standalone generic words are not complete designations by themselves
  if (
    /^(?:professional|expert|practitioner|associate|generalist|officer|executive|consultant|specialist|lead|manager|engineer|developer|analyst)$/i.test(
      c,
    )
  ) {
    return null;
  }

  // 6. Check recognized domain / industry expertise
  const isRecognizedDomain =
    PROFESSIONAL_DOMAINS_REGEX.test(c) ||
    /\b(?:industry|sector|capital\s+equipment|storage\s+systems|operations)\b/i.test(c) ||
    /^(?:erection|pre[\s-]commissioning|commissioning|production\s+operations)/i.test(c);

  if (isRecognizedDomain) {
    if (c.split(/\s+/).filter(Boolean).length <= 10) {
      return toTitleCasePhrase(c);
    }
  }

  // 7. Otherwise, must contain a recognized role noun
  if (!ROLE_NOUNS_REGEX.test(c)) return null;

  // Must not have more than 5 words for a designation
  if (c.split(/\s+/).filter(Boolean).length > 5) return null;

  // Must not contain comma
  if (c.includes(',')) return null;

  return toTitleCasePhrase(c);
}

function cleanAndValidateDesignation(candidate: string): string | null {
  return cleanAndValidateRoleOrTechnologies(candidate);
}

function sliceSectionContent(text: string, headingRegex: RegExp): string | null {
  const re = new RegExp(
    `(?:^|\\n)\\s*${headingRegex.source}\\s*[:\\-]?(?:\\s*\\n|\\s+)([\\s\\S]*?)(?=\\n\\s*(?:Education|Academic|Technical\\s+Skills|Technologies|Skills|Core\\s+Skills|Key\\s+Skills|Core\\s+Competencies|Competencies|Experience|Professional\\s+Experience|Work\\s+Experience|Employment|Projects?|Certifications?|Declaration|Personal|Contact)\\b|$)`,
    'i',
  );
  const m = text.match(re);
  return m?.[1]?.trim() || null;
}

function extractRoleFromNarrative(content: string | null | undefined): string | null {
  if (!content) return null;
  const chunks = content.split(/\r?\n|[.;]/).map((s) => s.trim()).filter(Boolean);
  for (const chunk of chunks) {
    if (!chunk || chunk.length < 3) continue;
    if (/^(?:seeking|looking|aspiring)\b/i.test(chunk)) continue;

    const s = chunk
      .replace(/^(?:(?:working|experience|employed|role|serving)\s+as\s+(?:an?|the)?)\s*/i, '')
      .replace(/^(?:(?:over|around|having)?\s*[\d+.]+\s+years(?:\s+of)?\s+experience\s+(?:in\s+the\s+industry\s+)?as\s+(?:an?|the)?)\s*/i, '')
      .replace(/^(?:experienced|results?-driven|dynamic|accomplished|skilled|certified|energetic|seasoned|passionate|innovative|motivated)\s+/i, '')
      .trim();

    const splitMatch = s.split(/\s+(?:with|having|possessing|specialized\s+in|specializing\s+in|experienced\s+in|offering|bringing|seeking|looking\s+for|in\s+building|skilled\s+in|proven\s+track|dedicated\s+to|proficient\s+in)\b/i);
    let candidateStr = splitMatch[0]?.trim() || s;

    // Strip trailing "professional", "expert", "practitioner"
    candidateStr = candidateStr.replace(/\s+(?:professional|expert|practitioner)\s*$/i, '').trim();
    if (/^(?:professional|expert|practitioner|associate|generalist|officer|executive)$/i.test(candidateStr)) {
      continue;
    }

    const validated = cleanAndValidateDesignation(candidateStr);
    if (validated) return validated;
  }
  return null;
}

function extractRoleFromHeadline(text: string): string | null {
  const headerLines = splitLines(text).slice(0, 12);
  const candidateName = extractName(headerLines, text);
  for (const rawLine of headerLines) {
    const line = rawLine.replace(/^[\s•\-–—*]+/, '').trim();
    if (!line || line.length < 3 || line.length > 80) continue;
    if (isResumeSectionHeadingLine(line)) break; // Stop at first section heading
    if (/@|https?:\/\/|www\.|\.com\b/i.test(line)) continue;
    if (/\b(?:phone|mobile|tel|cell|email|contact|linkedin|github)\b/i.test(line)) continue;
    if (/^\+?\d[\d\s\-()]{7,}\d$/.test(line)) continue;
    if (/^(?:hyderabad|bangalore|bengaluru|mumbai|pune|delhi|chennai|kolkata|noida|gurgaon|new york|london|san francisco|california|texas|india|usa|uk)[,\s]/i.test(line)) continue;
    if (/^[A-Za-z\s]+,\s*[A-Za-z\s]+(?:\s+\d{5,6})?$/.test(line)) continue;
    if (/^(?:worked|working|responsibilities|responsible|handled|handling)\b/i.test(line)) continue;

    // Skip candidate's name line
    if (candidateName && line.toLowerCase() === candidateName.toLowerCase()) {
      continue;
    }

    const titleOnly = line.split(/\s+(?:with|having)\s+[0-9]/i)[0]?.trim() || line;
    const validated = cleanAndValidateRoleOrTechnologies(titleOnly);
    if (validated) return validated;
  }
  return null;
}

function extractRoleFromEmployment(text: string, currentCompany?: string | null): string | null {
  // 6a. Explicit labeled designation line
  const labeled = text.match(
    /(?:^|\n)\s*(?:current\s+designation|current\s+role|current\s+position|designation|current\s+job\s+title|job\s+title|role)\s*[:\-]\s*([^\n]+)/i,
  );
  if (labeled?.[1]) {
    const validated = cleanAndValidateDesignation(labeled[1]);
    if (validated) return validated;
  }

  // 6b. Confirmed work experience role lines
  const expMatch = text.match(
    /\n\s*(?:Professional\s+Experience|Work\s+Experience|Work\s+History|Employment\s+History|Career\s+History|Experience|Employment)\s*:?\s*\n([\s\S]{20,4000}?)(?=\n\s*(?:Education|Technical\s+Skills|Skills|Projects?|Certifications?)\b|$)/i,
  );
  if (expMatch?.[1]) {
    const expLines = splitLines(expMatch[1]).slice(0, 30);
    for (const rawLine of expLines) {
      const line = rawLine.replace(/^[\s•\-–—*]+/, '').trim();
      if (!line || line.length > 100) continue;
      if (/^(?:responsibilities|roles|duties|project|client|tools|team|environment|duration)\b/i.test(line)) continue;
      const beforeAt = line.split(/\s+(?:at|in|with|-|–|—|\|)\s+/i)[0]?.trim();
      const checkCandidate = beforeAt && beforeAt.length >= 3 ? beforeAt : line;
      const validated = cleanAndValidateDesignation(checkCandidate);
      if (validated) return validated;
    }
  }

  return null;
}

export function toTitleCasePhrase(str: string): string {
  const lowercaseWords = new Set(['and', 'or', 'of', 'in', 'the', 'for', 'with', 'to', 'at', 'by', '&']);
  const normalized = str.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
  return normalized
    .split(/\s+/)
    .map((word, i) => {
      const hasComma = word.endsWith(',');
      const w = hasComma ? word.slice(0, -1) : word;
      const lower = w.toLowerCase();
      if (i > 0 && lowercaseWords.has(lower)) {
        return lower + (hasComma ? ',' : '');
      }
      const cap = w.charAt(0).toUpperCase() + w.slice(1);
      return cap + (hasComma ? ',' : '');
    })
    .join(' ');
}

export function formatActivityPhrase(raw: string): string {
  const parts = raw
    .split(/[,;&]|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const normalizedParts = parts.map((part) => {
    const p = part.trim();
    if (/^pre[\s-]commissioning$/i.test(p)) return 'Pre-commissioning';
    if (/^erection$/i.test(p)) return 'Erection';
    if (/^commissioning$/i.test(p)) return 'Commissioning';
    if (/^production\s+operations?$/i.test(p)) return 'Production Operations';
    if (/^procurement$/i.test(p)) return 'Procurement';
    if (/^fabrication$/i.test(p)) return 'Fabrication';
    if (/^installation$/i.test(p)) return 'Installation';
    if (/^maintenance$/i.test(p)) return 'Maintenance';
    return toTitleCasePhrase(p);
  });

  if (normalizedParts.length <= 1) {
    return normalizedParts[0] || '';
  }
  const last = normalizedParts[normalizedParts.length - 1];
  const rest = normalizedParts.slice(0, -1);
  return `${rest.join(', ')} and ${last}`;
}

export function extractDomainOrIndustryFromText(content: string | null | undefined): string | null {
  if (!content) return null;

  // 1. Explicit domain / industry pattern ending with industry/sector/field/domain
  // e.g. "experience in Refinery, Petrochemical and Chemical industry"
  const industryMatch = content.match(
    /\b(?:experience\s+in|background\s+in|domain\s+of|field\s+of)\s+([A-Za-z0-9\s,&/'-]+?\s*(?:industry|sector|domain|field))\b/i,
  );
  if (industryMatch?.[1]) {
    const raw = industryMatch[1].trim();
    if (raw.length >= 5 && raw.length <= 100 && !/\b(?:responsible|working|proven|track\s+record)\b/i.test(raw)) {
      return toTitleCasePhrase(raw);
    }
  }

  // 2. Specializing / expertise in domain(s)
  // e.g. "specializing in semiconductor capital equipment and battery energy storage systems"
  const specMatch = content.match(
    /\b(?:specializing|specialized|expertise)\s+in\s+([A-Za-z0-9\s,&/'-]+?)(?:\s+(?:with|having|offering)\b|[.;\n]|$)/i,
  );
  if (specMatch?.[1]) {
    const raw = specMatch[1].trim();
    if (
      raw.length >= 5 &&
      raw.length <= 100 &&
      !/\b(?:responsible|working)\b/i.test(raw) &&
      !/\b(?:uk|germany|usa?|india|canada|australia|singapore|uae|dubai|europe|asia|america)\b/i.test(raw)
    ) {
      const formatted = raw.replace(/\s+and\s+/gi, ', ');
      return toTitleCasePhrase(formatted);
    }
  }

  // 3. Principal work activities
  // e.g. "worked experience in erection, pre commissioning, commissioning, production operation of some of the world's renowned plants"
  const activitiesMatch = content.match(
    /\b(?:worked\s+experience\s+in|experience\s+in|activities\s+in|hands-on\s+in)\s+((?:erection|pre[\s-]commissioning|commissioning|production\s+operations?|procurement|fabrication|installation|maintenance|design\s+and\s+drafting|product\s+development|simulation)[A-Za-z0-9\s,&/'-]*?)(?:\s+(?:of|for|at|in|with)\b|[.;\n]|$)/i,
  );
  if (activitiesMatch?.[1]) {
    const raw = activitiesMatch[1].trim();
    if (raw.length >= 5 && raw.length <= 100) {
      return formatActivityPhrase(raw);
    }
  }

  return null;
}

/**
 * Extract exact, verbatim designation, domain, or activities from the resume using strict source priority:
 * 1. Professional Summary
 * 2. Executive Profile
 * 3. Profile Summary
 * 4. Career Summary
 * 5. Professional Overview
 * 6. Objective / introductory profile / Summary / Profile
 * 
 * Decision rule:
 * 1. Explicit designation first.
 * 2. If no designation exists, use clearly stated primary industry/domain.
 * 3. If neither exists, use explicitly stated professional activities.
 * 4. Fallback to resume headline or employment details.
 */
export function extractVerbatimDesignation(text: string, currentCompany?: string | null): string | null {
  // PRIORITY 1: Explicit designation near candidate's name (header area below name, above contact info / first section)
  const roleHeadline = extractRoleFromHeadline(text);
  if (roleHeadline) {
    const validated = cleanAndValidateRoleOrTechnologies(roleHeadline);
    if (validated) return validated;
  }

  // PRIORITY 2: Professional Summary / Summary / Profile / Career Summary
  // Inspect opening of summary for explicit designation or domain phrase
  const summarySections: Array<{ name: string; content: string }> = [
    { name: 'Professional Summary', content: sliceSectionContent(text, /Professional\s+Summary/i) || '' },
    { name: 'Executive Profile', content: sliceSectionContent(text, /Executive\s+Profile/i) || '' },
    { name: 'Profile Summary', content: sliceSectionContent(text, /Profile\s+Summary/i) || '' },
    { name: 'Career Summary', content: sliceSectionContent(text, /Career\s+Summary/i) || '' },
    { name: 'Professional Overview', content: sliceSectionContent(text, /Professional\s+Overview/i) || '' },
    { name: 'Summary', content: sliceSectionContent(text, /(?<!Professional\s+|Career\s+|Profile\s+)Summary/i) || '' },
    { name: 'Profile', content: sliceSectionContent(text, /(?<!Executive\s+|Profile\s+)(?:Professional\s+)?Profile/i) || '' },
    { name: 'Objective', content: sliceSectionContent(text, /(?:Career\s+)?Objective/i) || '' },
  ].filter((s) => Boolean(s.content.trim()));

  for (const sec of summarySections) {
    const role = extractRoleFromNarrative(sec.content);
    if (role) {
      const validated = cleanAndValidateRoleOrTechnologies(role);
      if (validated) return validated;
    }
  }

  // Permitted domain / industry fallback only if no explicit designation was found
  for (const sec of summarySections) {
    const domainOrActivity = extractDomainOrIndustryFromText(sec.content);
    if (domainOrActivity) {
      const validated = cleanAndValidateRoleOrTechnologies(domainOrActivity);
      if (validated) return validated;
    }
  }

  // PRIORITY 3: Explicit designation elsewhere in the resume (e.g. employment section)
  const roleEmployment = extractRoleFromEmployment(text, currentCompany);
  if (roleEmployment) {
    const validated = cleanAndValidateRoleOrTechnologies(roleEmployment);
    if (validated) return validated;
  }

  // PRIORITY 4: Return empty value (null)
  return null;
}

const EXTRA_SKILL_PATTERNS: RegExp[] = [
  /\bTech\s*Stack\s*[:\-]\s*([^\n]+)/gi,
  /\bSkills?\s+Set\s*[:\-]\s*([^\n]+)/gi,
  /\b(?:Technical|Professional|Core|Key|Relevant|Functional)\s+Skills?\s*[:\-]\s*([^\n]+)/gi,
  /\b(?:Programming|AI\s*&?\s*ML|Frameworks?\s*&?\s*Libraries|Tools\s*&?\s*Platforms)\s*[:\-]\s*([^\n]+)/gi,
  /\b(?:Area\s+of\s+Interest|Areas\s+of\s+Interest|Programming\s+Languages)\s*[:\-]\s*([^\n]+)/gi,
  /\b(?:Technologies|Technical\s+Proficiencies)\s*[:\-]\s*([^\n]+)/gi,
];

function isLikelySkillToken(token: string): boolean {
  const t = normalizeSkillToken(token);
  if (!t || t.length < 2 || t.length > 40) return false;
  if (isCertificationOrNonAcademic(t)) return false;
  if (looksLikeJobRolePhrase(t)) return false;
  if (DEGREE_RE.test(t)) return false;
  if (/^\d+$/.test(t)) return false;
  if (/:$/.test(t)) return false;
  if (/\b(?:designed|developed|implemented|managed|collaborated|responsible|experience|responsibilities)\b/i.test(t)) {
    return false;
  }
  if (
    /\b(?:description|roles?|team\s*size|duration|customer|tools?|educational qualifications|key\s+achievements?|achievements?)\b/i.test(
      t,
    )
  ) {
    return false;
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 4) return false;
  if (/^(technical|functional|skills profile|key skills|skills)$/i.test(t)) return false;
  return true;
}

function parseCategoryLines(skillsBlock: string): string[] {
  const found: string[] = [];
  const lines = skillsBlock.split(/\n/);
  const skipCategoryLhs =
    /^(key\s+achievements?|achievements?|awards?|certificates?|declaration|synopsis|summary|objective|work\s+history|employment|accomplishments?|projects?|core\s+skills?|key\s+skills?|technical\s+skills?)$/i;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 200) continue;
    const m = trimmed.match(
      /^\s*(?:\*\*)?([A-Za-z0-9][A-Za-z0-9\s&'.+/()-]{0,52})\s*[:\-–—]\s*(.+)$/,
    );
    if (m?.[1] && skipCategoryLhs.test(m[1].trim())) continue;
    if (m?.[2]) {
      const rhs = m[2]
        .split(/[,;|•]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 80);
      found.push(...rhs);
    }
  }
  return found;
}

function parseTabularSkillRows(skillsBlock: string): string[] {
  const out: string[] = [];
  const lines = skillsBlock.split(/\n/);
  const labelPatterns: RegExp[] = [
    /^integration tool\b/i,
    /^programming languages?\b/i,
    /^database\b/i,
    /^operating systems?\b/i,
    /^other tech concepts?\b/i,
    /^tools?\b/i,
    /^frameworks?\b/i,
    /^platforms?\b/i,
  ];
  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
    if (!line || line.length > 220) continue;
    if (/^(technical|functional|skills profile)$/i.test(line)) continue;

    let rhs = '';
    for (const labelRx of labelPatterns) {
      if (labelRx.test(line)) {
        rhs = line.replace(labelRx, '').replace(/^\s*[:\-]?\s*/, '').trim();
        break;
      }
    }
    if (!rhs) continue;

    rhs.split(/[,;|]/).forEach((part) => {
      const token = part.replace(/\s+/g, ' ').trim();
      if (token.length > 1 && token.length < 90) out.push(token);
    });
  }
  return out;
}

function parseUnlabeledSkillLines(skillsBlock: string): string[] {
  const found: string[] = [];
  const lines = skillsBlock.split(/\n/);
  const labeled = /^\s*(?:\*\*)?[A-Za-z0-9][A-Za-z0-9\s&'.+/()-]{0,52}\s*[:\-–—]\s*.+$/;
  const tabularLabelStart =
    /^(integration tool|programming languages?|database|operating systems?|other tech concepts?|management and leadership skills|training\s*&\s*development)\b/i;
  for (const line of lines) {
    const trimmed = line.trim().replace(/^[\s•\-–—]+/, '');
    if (!trimmed || trimmed.length > 220) continue;
    if (labeled.test(trimmed)) continue;
    if (tabularLabelStart.test(trimmed)) continue;
    if (/[,;|]/.test(trimmed)) {
      trimmed.split(/[,;|]/).forEach((p) => {
        const t = p.trim();
        if (t.length > 1 && t.length < 120) found.push(t);
      });
    } else if (/\s[|\/]\s/.test(trimmed)) {
      trimmed.split(/\s*[|\/]\s*/).forEach((p) => {
        const t = p.trim();
        if (t.length > 1 && t.length < 120) found.push(t);
      });
    } else if (trimmed.length < 60) {
      found.push(trimmed);
    }
  }
  return found;
}

function parseTableStyleSkillLines(skillsBlock: string): string[] {
  const out: string[] = [];
  const lines = skillsBlock
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-–—]+/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const headingLike = /^(operating system|environment|database|internet tools|languages|other|tools|frameworks?|cloud|testing tools|monitoring|version control|methodologies)$/i;

  for (let i = 0; i < lines.length; i += 1) {
    const cur = lines[i];
    if (!cur) continue;
    if (!headingLike.test(cur)) continue;
    for (let j = i + 1; j <= i + 3 && j < lines.length; j += 1) {
      const next = lines[j];
      if (!next) continue;
      if (headingLike.test(next)) break;
      if (next.length > 220) continue;
      next.split(/[,;|]/).forEach((part) => {
        const token = part.replace(/\s+/g, ' ').trim();
        if (token.length > 1 && token.length < 90) out.push(token);
      });
    }
  }
  return out;
}

const CORE_TECH_PRIORITY: RegExp[] = [
  // Tier 1: Programming languages
  /\b(Python|Java|JavaScript|TypeScript|C\+\+|C#|Go|Golang|Rust|Ruby|PHP|Swift|Kotlin|Scala|R|Dart|Perl|SQL|PL\/SQL)\b/i,
  // Tier 2: Major frameworks & runtimes
  /\b(React(?:\.js)?|Angular(?:\.js)?|Vue(?:\.js)?|Next(?:\.js)?|Node(?:\.js)?|Express(?:\.js)?|Spring\s*Boot|Spring|Django|Flask|FastAPI|\.NET(?:\s*Core)?|ASP\.NET|Hibernate|Laravel|Ruby\s*on\s*Rails)\b/i,
  // Tier 3: Major Cloud & Platforms
  /\b(AWS|Amazon\s*Web\s*Services|Azure|Microsoft\s*Azure|Google\s*Cloud|GCP|Docker|Kubernetes|K8s|Terraform|Ansible|Jenkins|CI\/CD)\b/i,
  // Tier 4: Major Databases & Big Data
  /\b(PostgreSQL|Postgres|MySQL|MongoDB|Redis|Oracle(?:\s*Database)?|MS\s*SQL\s*Server|SQL\s*Server|Cassandra|DynamoDB|Elasticsearch|Apache\s*Spark|Spark|Apache\s*Kafka|Kafka|Hadoop|Snowflake|BigQuery|Databricks)\b/i,
  // Tier 5: Core Tools & Systems
  /\b(Git|GitHub|GitLab|Linux|Unix|Jira|SAP\s*HANA|SAP\s*Basis|Salesforce|Power\s*BI|Tableau|Selenium|Cypress|Jest)\b/i,
];

function scoreSkillPriority(skill: string): number {
  for (let i = 0; i < CORE_TECH_PRIORITY.length; i++) {
    if (CORE_TECH_PRIORITY[i]!.test(skill)) {
      return 10 - i;
    }
  }
  return 1;
}

const GENERIC_CATEGORY_RE =
  /^(?:3d\s+cad\s+tools?|2d\s+drafting|plm\s+tools?|cad\s+tools?|cae\s+tools?|programming(?:\s+languages?)?|languages|frameworks?(?:\s*&?\s*libraries)?|databases?|cloud(?:\s*&?\s*platforms)?|operating\s+systems?|standards?|automation|methodologies|web\s+technologies|developer\s+tools|office\s+tools|miscellaneous|soft\s+skills|core\s+competencies|technical\s+competencies|tools\s*(?:&|and)\s*technologies|technical\s+skills?|skills?|tools?|technologies|area\s+of\s+interest|areas\s+of\s+interest)$/i;

export function extractSkillsFromEligibleBlock(skillsBlock: string): string[] {
  const candidates = extractDeterministicSkills(skillsBlock);
  const { validSkills } = validateSkillsAgainstSection(candidates, skillsBlock, 10);
  return validSkills;
}

/**
 * Extracts skills from the resume following source-aware priority:
 * 1. Primary: Dedicated Skills section if present and populated.
 * 2. Fallback: Summary, Projects, Work Experience, Education in strict priority order.
 * Maximum 10 distinct skills.
 */
export function extractWholeResumeSkills(fullText: string, technicalBlock?: string | null): string[] {
  if (technicalBlock && technicalBlock.trim()) {
    const fromBlock = extractSkillsFromEligibleBlock(technicalBlock);
    if (fromBlock.length > 0) {
      return fromBlock;
    }
  }
  const result = extractSkillsWithEngineSync(fullText);
  return result.skills;
}

/**
 * Single entry: plain resume text (from PDF/DOCX) → core fields.
 */
export function parseCoreFieldsFromResumeText(rawText: string): CoreParsedFields {
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
  const lines = splitLines(text);

  const email = extractEmail(text);
  const phone = extractPhone(text);
  const linkedin = extractLinkedIn(text);
  const name = extractName(lines, text);

  const eduBlock = sliceEducationBlock(text);
  const eduFallbackSlice = sliceResumeHeadForEducationFallback(text);
  const eduPick = pickBestEducationFromBlock(eduBlock);
  let highestQualification = eduPick.highestQualification;
  const anyQual = extractHighestQualificationFromAnyText(text);

  if (!highestQualification) {
    highestQualification = anyQual;
  } else if (anyQual) {
    // If eduPick is an abbreviated or short form (e.g. "BE Mechanical", "B.Tech") and anyQual is the full title
    // (e.g. "Bachelor of Engineering in Mechanical Engineering") with equal or higher rank, prefer the fuller form
    const rPick = rankLineForDegree(highestQualification);
    const rAny = rankLineForDegree(anyQual);
    if (rAny > rPick || (rAny === rPick && anyQual.length > highestQualification.length && anyQual.length <= 80)) {
      highestQualification = anyQual;
    }
  }

  if (
    highestQualification &&
    /^(description|roles?|team\s*size|duration|customer|tools?)\b/i.test(highestQualification)
  ) {
    highestQualification = null;
  }
  let educationItems = eduPick.educationItems;
  if (!highestQualification) {
    const sparse = extractEducationItems(eduBlock);
    const degreeLine = sparse.find((e) =>
      DEGREE_RE.test(e) && !isCertificationOrNonAcademic(e),
    );
    if (degreeLine) {
      highestQualification = cleanAcademicSpecialization(degreeLine) ?? null;
      if (educationItems.length === 0 && highestQualification) educationItems = [highestQualification];
    }
  }
  if (highestQualification) {
    highestQualification = cleanAcademicSpecialization(highestQualification) ?? highestQualification;
  }
  const educationRaw = educationItems.length
    ? educationItems
        .map((e) => sanitizeDisplayText(e))
        .filter(Boolean)
        .slice(0, 2)
        .join(', ')
    : null;

  const techBlock = sliceTechnicalSkillsBlock(text);
  const skillList = extractWholeResumeSkills(text, techBlock);
  const skillsRaw = skillList.length ? skillList.join(', ') : null;
  const verbatimRole = extractVerbatimDesignation(text);
  const expInfo = extractTotalExperienceInfo(text);
  const relevantExperience = extractRelevantExperience(text);
  const currentCompany = extractCurrentCompany(text);
  const currentLocation = extractCurrentLocation(text);

  return {
    candidateName: name ? sanitizeDisplayText(name) : null,
    email,
    contactNumber: phone,
    linkedinUrl: linkedin,
    highestQualification: highestQualification
      ? sanitizeDisplayText(highestQualification)
      : null,
    educationRaw,
    skillsRaw,
    technologiesRaw: verbatimRole ? sanitizeDisplayText(verbatimRole) : null,
    technologies: verbatimRole ? sanitizeDisplayText(verbatimRole) : null,
    totalExperienceYears: expInfo.years,
    totalExperienceText: expInfo.text,
    relevantExperience: relevantExperience || null,
    currentCompany: currentCompany ? sanitizeDisplayText(currentCompany) : null,
    currentLocation: currentLocation ? sanitizeDisplayText(currentLocation) : null,
    role: verbatimRole ? sanitizeDisplayText(verbatimRole) : null,
  };
}
