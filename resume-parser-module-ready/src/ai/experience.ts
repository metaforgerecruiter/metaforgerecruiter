const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

type PeriodDate = {
  date: Date;
  isPresent: boolean;
  isYearOnly: boolean;
  year?: number;
  month?: number;
};

function parsePeriodDate(value: any): PeriodDate | null {
  if (!value) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw || ['present', 'current', 'now', 'till date', 'till now', 'ongoing'].includes(raw)) {
    return { date: new Date(), isPresent: true, isYearOnly: false };
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (iso && iso[1] && iso[2]) {
    return {
      date: new Date(Number(iso[1]), Number(iso[2]) - 1, 1),
      isPresent: false,
      isYearOnly: false,
      year: Number(iso[1]),
      month: Number(iso[2]) - 1,
    };
  }

  const yearOnly = raw.match(/^(\d{4})$/);
  if (yearOnly && yearOnly[1]) {
    return {
      date: new Date(Number(yearOnly[1]), 0, 1),
      isPresent: false,
      isYearOnly: true,
      year: Number(yearOnly[1]),
    };
  }

  const named = raw.match(/([a-z]+)\s*[,']?\s*(\d{4})/);
  if (named && named[1] && named[2] && MONTHS[named[1]] !== undefined) {
    return {
      date: new Date(Number(named[2]), MONTHS[named[1]]!, 1),
      isPresent: false,
      isYearOnly: false,
      year: Number(named[2]),
      month: MONTHS[named[1]],
    };
  }

  const reversed = raw.match(/(\d{4})\s*[-/]\s*([a-z]+)/);
  if (reversed && reversed[1] && reversed[2] && MONTHS[reversed[2]] !== undefined) {
    return {
      date: new Date(Number(reversed[1]), MONTHS[reversed[2]]!, 1),
      isPresent: false,
      isYearOnly: false,
      year: Number(reversed[1]),
      month: MONTHS[reversed[2]],
    };
  }

  return null;
}

export function calculateExperienceMonths(periods: any[]): number | null {
  if (!Array.isArray(periods) || !periods.length) return null;

  const ranges = periods
    .map((p) => {
      const start = parsePeriodDate(p.from ?? p.start ?? p.start_date);
      const end = parsePeriodDate(p.to ?? p.end ?? p.end_date);
      if (!start || !end) return null;

      const isYearOnly = start.isYearOnly && end.isYearOnly;
      let startMonth: number;
      let endMonth: number;
      if (isYearOnly) {
        if (!end.year || !start.year || end.year < start.year) return null;
        startMonth = start.year * 12;
        endMonth = end.year * 12;
      } else {
        startMonth = (start.year ?? 0) * 12 + (start.month ?? 0);
        if (end.isPresent) {
          const now = new Date();
          endMonth = now.getFullYear() * 12 + now.getMonth();
        } else if (end.month !== undefined && end.year !== undefined) {
          endMonth = end.year * 12 + end.month + 1;
        } else if (end.year !== undefined) {
          endMonth = end.year * 12 + 12;
        } else {
          return null;
        }
      }

      if (endMonth < startMonth) return null;
      return [startMonth, endMonth] as [number, number];
    })
    .filter((r): r is [number, number] => r !== null);

  if (!ranges.length) return null;

  const sorted = ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1]!;
    const cur = sorted[i]!;
    if (cur[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }

  return merged.reduce((sum, [start, end]) => sum + (end - start), 0);
}

export function cleanExperienceOutput(raw: any): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  if (!s) return '';

  s = s.replace(/^[|:;\-–—•*▪▫❖➢✓★+\t\s]+/, '');
  s = s.replace(
    /^(?:(?:total|overall|work|professional)\s+)?(?:years\s+of\s+)?(?:experience|exp\.?)\s*(?:is|of)?\s*[:|\t\-–—]\s*/i,
    '',
  );
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

  const m = s.match(
    /^(\d+(?:\.\d+)?\+?)\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?(\d+)\s*(?:months?|mos?))?/i,
  );
  if (m && m[1]) {
    const num = m[1];
    const unit = num === '1' ? 'year' : 'years';
    if (m[2]) {
      return `${num} ${unit} ${m[2]} months`;
    }
    return `${num} ${unit}`;
  }

  const mMonth = s.match(/^(\d+)\s*(?:months?|mos?)/i);
  if (mMonth && mMonth[1]) {
    return `${mMonth[1]} months`;
  }

  return '';
}

function extractStatedExperienceWording(stated: any): string {
  if (!stated || typeof stated !== 'string') return '';
  const s = stated.trim();
  if (!s) return '';

  const directMatch = s.match(
    /^((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))$/i,
  );
  if (directMatch?.[1]?.trim()) {
    return cleanExperienceOutput(directMatch[1].trim());
  }

  type Candidate = { raw: string; cleaned: string; score: number; index: number };
  const candidates: Candidate[] = [];

  const addCandidate = (rawSnippet: string, matchIdx: number, score: number) => {
    const startIdx = Math.max(0, matchIdx - 35);
    const preceding = s.slice(startIdx, matchIdx);
    if (/\brelevant\s*$/i.test(preceding) || /\brelevant\s+experience\b/i.test(preceding)) {
      if (!/\b(?:overall|total)\b/i.test(preceding) && !/\b(?:overall|total)\b/i.test(rawSnippet)) {
        return;
      }
    }

    const afterIdx = matchIdx + rawSnippet.length;
    const following = s.slice(afterIdx, Math.min(s.length, afterIdx + 30));
    if (/^\s*(?:degree|course|b\.?tech|b\.?e|m\.?tech|m\.?e|diploma|graduation)\b/i.test(following)) {
      return;
    }

    const cleaned = cleanExperienceOutput(rawSnippet);
    if (!cleaned) return;

    candidates.push({ raw: rawSnippet, cleaned, score, index: matchIdx });
  };

  const labeledPatterns = [
    {
      re: /(?:^|[|\n\r;•*▪▫❖➢✓★-])\s*(?:(?:total|overall)\s+(?:work\s+|professional\s+|industry\s+|it\s+|software\s+)?(?:years\s+of\s+)?(?:experience|exp\.?)|(?:total\s+)?years\s+of\s+experience)\s*(?:is|of)?\s*(?:[:|\t\-–—]\s*|\s*\n\s*|\s{2,})((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))/gi,
      score: 100,
    },
    {
      re: /(?:^|[|\n\r;•*▪▫❖➢✓★-])\s*(?:(?:work|professional)\s+(?:experience|exp\.?)|experience|exp\.?)\s*(?:is|of)?\s*(?:[:|\t\-–—]\s*|\s*\n\s*|\s{2,})((?:(?:over|nearly|approx(?:imately)?|more\s+than|at\s+least|around|almost|about|close\s+to|upwards\s+of|in\s+excess\s+of)\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|yr\b)(?:\s*(?:and\s*)?\d+\s*(?:months?|mos?))?|\d+\s*(?:months?|mos?))/gi,
      score: 85,
    },
  ];

  for (const { re, score } of labeledPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      if (m[1]?.trim()) {
        addCandidate(m[1].trim(), m.index, score);
      }
    }
  }

  const sentenceTotalPatterns = [
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

  const sentenceGeneralPatterns = [
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

  if (candidates.length === 0) return '';

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const bestScore = candidates[0]!.score;
  const topCandidates = candidates.filter((c) => c.score === bestScore);

  const plusCand = topCandidates.find((c) => c.cleaned.includes('+'));
  if (plusCand) {
    const baseNum = plusCand.cleaned.replace(/\+.*$/, '');
    const nonPlusMatch = topCandidates.find(
      (c) => !c.cleaned.includes('+') && c.cleaned.startsWith(baseNum),
    );
    if (nonPlusMatch) {
      return plusCand.cleaned;
    }
  }

  return topCandidates[0]!.cleaned;
}

function parseStatedYears(raw: any): number | null {
  if (!raw) return null;
  const mOnly = String(raw).match(/(\d+)\s*(?:months?|mos?)/i);
  if (mOnly && mOnly[1]) {
    return parseInt(mOnly[1], 10);
  }
  const ym = String(raw).match(/(\d+)\s*(?:years?|yrs?)\s+(\d+)\s*(?:months?|mos?)/i);
  if (ym && ym[1] && ym[2]) {
    return parseInt(ym[1], 10) * 12 + parseInt(ym[2], 10);
  }
  const m = String(raw).match(/(\d+(\.\d+)?)/);
  return m && m[1] ? Math.round(parseFloat(m[1]) * 12) : null;
}

function resolveOneExperience({ stated }: { stated?: any }): {
  display: string;
  months: number;
  years: number;
  yearsPart: number;
  monthsPart: number;
} {
  if (stated && typeof stated === 'string' && stated.trim()) {
    const raw = stated.trim();
    const display = extractStatedExperienceWording(raw);
    if (display) {
      const totalMonths = parseStatedYears(display) || 0;
      return {
        display,
        months: totalMonths,
        years: Math.round((totalMonths / 12) * 10) / 10,
        yearsPart: Math.floor(totalMonths / 12),
        monthsPart: totalMonths % 12,
      };
    }
  }
  return { display: '', months: 0, years: 0, yearsPart: 0, monthsPart: 0 };
}

export function resolveExperienceFields({
  total_experience,
}: {
  total_experience?: any;
  relevant_experience?: any;
  work_periods?: any;
  relevant_work_periods?: any;
}): {
  total_experience: string;
  total_experience_months: number;
  total_experience_years: number;
  relevant_experience: string;
  relevant_experience_months: number;
  relevant_experience_years: number;
} {
  const total = resolveOneExperience({ stated: total_experience });

  return {
    total_experience: total.display || '',
    total_experience_months: total.months || 0,
    total_experience_years: total.years || 0,
    relevant_experience: '',
    relevant_experience_months: 0,
    relevant_experience_years: 0,
  };
}
