/** Normalize parsed résumé field text for DB/UI (no stray periods, clean education). */

const MONTH =
  'january|february|march|april|may|june|july|august|september|october|november|december';

/** Strip trailing punctuation and dangling prepositions from any display field. */
export function sanitizeDisplayText(raw: string | null | undefined): string {
  let t = String(raw ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return '';
  t = t.replace(/[.!?;:]+$/g, '').trim();
  // Dangling preposition only (keep "in April 2021" intact for education compaction).
  t = t.replace(/\s+in\s*$/i, '').replace(/\s+from\s*$/i, '').replace(/\s+at\s*$/i, '');
  return t.replace(/\s+/g, ' ').trim();
}

export function normalizeSkillToken(raw: string): string {
  let t = sanitizeDisplayText(raw);
  if (!t) return '';
  t = t.replace(/^[\s•\-–—*]+/, '');
  t = t.replace(
    /^(?:Core|Technical|Primary|Secondary|Key|Other|Tools?|Languages?|Platforms?|Databases?|Frameworks?|Cloud)\s*:\s*/i,
    '',
  );
  if (/[.!?]/.test(t.replace(/\b[A-Z]\./g, ''))) return '';
  return t.trim();
}

export const CERTIFICATION_STOP_RE =
  /\b(?:scrum\s*master|master\s*trainer|master\s*of\s*ceremonies|pmp|prince2|itil|six\s*sigma|istqb|ceh|cisp|cissp|cisa|aws\s+certified|azure\s+administrator|google\s+(?:cloud\s+)?certified|cisco\s+certified|ccna|ccnp|oracle\s+certified|certified\s+solutions|certified\s+developer|certified\s+administrator|professional\s+certificate|training\s+certificate|online\s+course|bootcamp|course\s+completion)\b/i;

export function isCertificationOrNonAcademic(text: string | null | undefined): boolean {
  const t = String(text ?? '').trim();
  if (!t) return false;
  if (CERTIFICATION_STOP_RE.test(t)) return true;
  if (/\b(?:certified|certification|certificate|training|workshop|bootcamp|license|licence)\b/i.test(t)) {
    if (!/\b(?:degree|diploma|b\.?\s*tech|m\.?\s*tech|bachelor|master|doctorate|ph\.?\s*d)\b/i.test(t)) {
      return true;
    }
  }
  return false;
}

export const DEGREE_RE =
  /\b(?:B\.?\s*Tech(?:\s*\(Hons\))?|M\.?\s*Tech|B\.?\s*E\.?|M\.?\s*E\.?|B\.?\s*S(?:\b|\.)|M\.?\s*S(?:\b|\.)|B\.?\s*Sc\.?|M\.?\s*Sc\.?|B\.?\s*Com\.?|M\.?\s*Com\.?|B\.?\s*A(?:\b|\.)|M\.?\s*A(?:\b|\.)|B\.?\s*Arch|M\.?\s*Arch|MCA|MBA|PGDM|PGDCA|Post\s+Graduate\s+Diploma|BBA|BCA|B\.?\s*Pharm|M\.?\s*Pharm|Diploma(?:\s+in\s+[A-Za-z&/]+(?:\s+[A-Za-z&/]+){0,3})?|Polytechnic|Ph\.?\s*D|Doctorate|Doctor\s+of\s+Philosophy|Bachelor(?:'s)?(?:\s+of\s+[A-Za-z&/]+(?:\s+[A-Za-z&/]+){0,3})?(?:\s+(?:in|with)\s+[A-Za-z&/]+(?:\s+[A-Za-z&/]+){0,4})?|Master(?:'s)?(?:\s+of\s+[A-Za-z&/]+(?:\s+[A-Za-z&/]+){0,3})?(?:\s+(?:in|with)\s+[A-Za-z&/]+(?:\s+[A-Za-z&/]+){0,4})?|Associate(?:\s+Degree)?(?:\s+of\s+[A-Za-z&/]+(?:\s+[A-Za-z&/]+){0,3})?)\b/i;

/** Strip institutions, years, marks, and locations from an academic qualification string. */
export function cleanAcademicSpecialization(raw: string | null | undefined): string | null {
  let t = sanitizeDisplayText(raw);
  if (!t) return null;
  if (isCertificationOrNonAcademic(t)) return null;

  // 1. Strip leading table row serial numbers (e.g. "1. ", "1) ", "• ")
  t = t.replace(/^\d+[\s.)\-–—]+/, '').trim();

  // 2. Remove leading narrative markers
  t = t.replace(
    /^(?:completed\s+)?(?:degree\s+in|qualification\s+in|graduation\s+in|graduated\s+from|pursuing\s+(?:a\s+)?|completed\s+|holds\s+a\s+|highest\s+qualification\s*[:\-]?\s*)\s*/i,
    '',
  );

  // 3. Cut off at period if preceded by a full word (not an abbreviation like B.E. or B.Tech.)
  t = t.replace(/(?<!\b(?:[A-Z]|Tech|Engg|Hons|Phil|Admin))\.\s+[\s\S]*/i, '');

  // 4. Cut off narrative employment/experience clauses
  t = t.replace(
    /\b(?:currently|presently)?\s*(?:working|employed|serving|holding\s+(?:a|the)\s+(?:position|role)|reporting\s+to|managing\s+a\s+team)\b[\s\S]*/i,
    '',
  );
  t = t.replace(
    /\b(?:with|having|possessing)\s+(?:over\s+|nearly\s+|about\s+|more\s+than\s+)?\d+(?:\.\d+)?\+?\s*(?:years?|yrs?|months?)\b[\s\S]*/i,
    '',
  );
  t = t.replace(/\b\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)\s+of\s+experience\b[\s\S]*/i, '');

  // 5. Cut off trailing job roles / designations (e.g. "Technical Lead", "Software Engineer")
  t = t.replace(
    /\s*[-–—|,/]?\s*(?:currently\s+)?(?:working\s+as\s+)?(?:Technical\s+Lead|Software\s+Engineer|Senior\s+Engineer|Developer|Lead\s+Developer|Solution\s+Architect|Team\s+Lead|Project\s+Manager|Manager|Analyst|Consultant|Specialist|Administrator|Coordinator|Executive|Officer|Director)\b[\s\S]*/i,
    '',
  );

  // 6. Strip marks, CGPA, percentages
  t = t.replace(/\b(?:cgpa|sgpa|gpa)\s*[:\-]?\s*[\d.]+\s*(?:\/\s*\d+)?\b/gi, ' ');
  t = t.replace(/\b(?:percentage|aggregate|marks?|scores?)\s*[:\-]?\s*[\d.]+\s*%?\b/gi, ' ');
  t = t.replace(/\b\d+(?:\.\d+)?\s*%\b/g, ' ');
  t = t.replace(/\b(?:distinction|first\s*class|second\s*class|with\s+honou?rs)\b/gi, ' ');

  // 7. Strip years and year ranges
  t = t.replace(/\s*[,;]?\s*(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}\b/g, ' ');
  t = t.replace(/\s*[,;]?\s*\b(?:19|20)\d{2}\b/g, ' ');

  // 8. Strip institutions, colleges, and universities
  t = t.replace(/\s+(?:from|at|affiliated\s+to|accredited\s+by)\s+[\s\S]*/i, ' ');
  t = t.replace(
    /\s*[,;–—\-]\s*[A-Za-z0-9&.'\s-]{2,50}\s+(?:University|College|Institute|School|Academy|Board|Vidyapeeth|Campus|Technologies|Solutions|Services|Pvt\s+Ltd|Ltd|Inc)\b[\s\S]*/i,
    ' ',
  );
  t = t.replace(
    /\s{2,}[A-Za-z0-9&.'\s-]{2,50}\s+(?:University|College|Institute|School|Academy|Board|Vidyapeeth|Campus)\b[\s\S]*/i,
    ' ',
  );
  t = t.replace(
    /\s+(?!(?:Mechanical|Electrical|Civil|Computer|Chemical|Aerospace|Biomedical|Information|Software|Automobile|Electronics|Production|Industrial)\b)[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:University|College|Institute|Vidyapeeth)\b[\s\S]*/i,
    ' ',
  );
  t = t.replace(/\b(?:University|College|Institute|School|Academy)\s+(?:of\s+)?[A-Z][A-Za-z0-9&.'\s-]{2,80}\b/i, ' ');

  // 9. Clean whitespace and trailing punctuation
  t = t.replace(/\s+/g, ' ').replace(/[.,;:·\-–—]+$/g, '').trim();
  if (!t) return null;

  // 10. Locate the degree token
  const degMatch = t.match(DEGREE_RE);
  if (!degMatch || degMatch.index === undefined) return null;

  // Extract from the degree token onwards (drops stray prefixes like "Board of Intermediate...")
  let degreeWithBranch = t.slice(degMatch.index).trim();

  // 11. Repeat post-degree cutoffs on degreeWithBranch
  degreeWithBranch = degreeWithBranch
    .replace(/(?<!\b(?:[A-Z]|Tech|Engg|Hons|Phil|Admin))\.\s+[\s\S]*/i, '')
    .replace(/\s+(?:from|at|in\s+university|in\s+college|affiliated\s+to|accredited\s+by)\b[\s\S]*/i, '')
    .replace(/\b(?:currently|presently)?\s*(?:working|employed|serving|holding\s+(?:a|the)\s+(?:position|role))\b[\s\S]*/i, '')
    .replace(
      /\s*[-–—|,/]?\s*(?:currently\s+)?(?:working\s+as\s+)?(?:Technical\s+Lead|Software\s+Engineer|Senior\s+Engineer|Developer|Lead\s+Developer|Solution\s+Architect|Team\s+Lead|Project\s+Manager|Manager|Analyst|Consultant|Specialist)\b[\s\S]*/i,
      '',
    )
    .trim();

  // 12. Clean trailing punctuation
  degreeWithBranch = degreeWithBranch.replace(/[,;:\-–—\s.]+$/, '').trim();

  return degreeWithBranch.length >= 2 ? degreeWithBranch : null;
}

/** One concise HQ line: ONLY highest academic degree + course/branch/specialization. */
export function compactHighestQualification(raw: string | null | undefined): string | null {
  return cleanAcademicSpecialization(raw);
}

/** Whole phrase reads as a job title / domain role, not a discrete skill. */
export function looksLikeJobRolePhrase(token: string): boolean {
  const t = token.trim();
  if (!t || t.length < 8) return false;
  if (
    /\b(?:consultant|engineer|developer|architect|analyst|specialist|manager|lead)\b/i.test(t) &&
    t.split(/\s+/).length >= 2 &&
    t.split(/\s+/).length <= 8
  ) {
    return true;
  }
  if (/\bsap\s+successfactors\b/i.test(t) && /\bconsultant\b/i.test(t)) return true;
  return false;
}
