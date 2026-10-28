export const EXTRACTION_PROMPT = `You are a world-class resume parsing engine for Metaforge IT Solutions.
Extract the fields below. THE RESUME IS THE SOURCE OF TRUTH. Follow STRICT SOURCE EVIDENCE RULES per field.

FIELD 1 — full_name: Candidate name from top of resume.
FIELD 2 — contact: All phone numbers. Format: +[CC] [local] with ONE space after country code. Multiple → join with " / ".
FIELD 3 — email: Primary email address.
FIELD 4 — linkedin: LinkedIn URL/handle or null.

FIELD 5 — qualification:
  • SINGLE highest legitimate academic degree with course/branch/specialization from education context ONLY.
  • Examples: "B.Tech in Computer Science and Engineering", "B.Tech (CSE)", "PGDM in IT Projects Management", "M.Tech in Computer Science", "MBA - Finance".
  • NEVER include university, college, school, year, marks, GPA, location, duration, or training provider.
  • NEVER classify certifications/training as academic degrees (exclude Scrum Master, PMP, AWS Certified, Azure Administrator, ISTQB, Six Sigma, etc.).
  • "Scrum Master" or "Master Trainer" is NOT a Master's degree.
  • Return null if no legitimate academic degree is found.

FIELD 6 — total_experience:
  • Scan the entire resume (summary, profile, work experience, headers, tables) for an explicitly stated total number of years of professional experience.
  • Extract the stated numeric value and unit (e.g. "12 years", "7 years", "7+ years", "8+ years", "4.5 years", "10 years", "36 months").
  • Preserve the number and decimal precision as written (e.g. "4.5 years").
  • Preserve the "+" sign ONLY if explicitly present (e.g. "8+ years", "7+ years").
  • REMOVE descriptive qualifier words such as "overall", "nearly", "approximately", "about", "over", "more than", "having", "close to", and "experience of". E.g. "Nearly 12 years of experience" → "12 years", "Over 7 years of experience" → "7 years", "More than 10 years of professional experience" → "10 years".
  • NEVER calculate, estimate, infer, or derive experience from employment dates, job periods, education dates, or current date.
  • Return null if not explicitly stated.

FIELD 6b — work_periods:
  • Return []. Do NOT calculate or derive total experience from employment dates.

FIELD 7 — skills:
  • Extract a MAXIMUM OF 10 individual skills following STRICT source priority:
  • PRIMARY: Extract from the resume's dedicated Skills section if present and populated (Skills, Technical Skills, Core Skills, Key Skills, Professional Skills, Relevant Skills, Areas of Expertise, Competencies, Software Skills, Tools and Technologies, Programming Languages, IT Skills).
  • The dedicated Skills section is AUTHORITATIVE. NEVER supplement or replace its contents with technologies mentioned in projects, internships, work experience, or certifications when the dedicated section is populated.
  • Preserve the original skill wording wherever practical. NEVER split a multiword skill into individual words or tokens (e.g. "Global mobility management" must remain "Global Mobility Management", NEVER "Global", "Mobility").
  • Comma is a delimiter between complete skills, NOT a delimiter for word-level splitting.
  • For parenthetical skills like "SQL (MS SQL Server)", extract both: "SQL" and "MS SQL Server".
  • FALLBACK: If NO dedicated Skills section exists (or it is genuinely empty or unusable), extract explicitly evidenced skills from other resume sections in this priority order:
    1. Professional Summary / Profile / Career Summary / Objective
    2. Work experience and responsibilities
    3. Technical project descriptions
    4. Education and academic project descriptions
    5. Other relevant sections containing explicit competencies
  • NEVER extract section headings (e.g. "Internship", "Projects", "Education", "Certifications", "Strengths", "Languages").
  • NEVER extract generic phrases or duty descriptions (e.g. "The project development process", "Gained hands-on experience", "Learned the fundamentals", "Evaluation").
  • NEVER extract articles, prepositions, or single words like "For", "And", "Cross", "Border" when they are fragments of longer skills.
  • NEVER extract spoken or mother tongue languages (e.g. "Telugu", "Hindi", "Tamil", "English", "Spanish") as technical or professional skills.
  • NEVER extract soft skills or personal traits (e.g. "Quick Learner", "Problem Solving", "Teamwork", "Communication").
  • NEVER extract certifications or certification titles as skills (e.g. "ServiceNow Micro-Certification", "Global Mobility Specialist (GMS)", "Edunet Foundation").
  • Output must contain individual skill names only (e.g. "React", "Node.js", "Express", "MongoDB", "Global Mobility Management", "Relocation and Cross-Border Compliance"), NEVER bullet points, complete sentences, job duties, or responsibilities.
  • Deduplicate and return an array of strings with AT MOST 10 items. Return [] if no reliable skills can be identified.

FIELD 7b — technology:
  • Return []. (Tools/skills belong in FIELD 7 skills. Do NOT put skill lists here.)

FIELD 8 — role:
  • Extract ONLY the candidate's short professional designation / job title (this maps to the app Technologies field).
  • STRICT source priority:
    1. Priority 1: Explicit designation near candidate's name (title or subtitle directly below name, above contact info, e.g. "SAP Basis Consultant", "Python Developer", "Java Full Stack Developer", "Data Analyst").
    2. Priority 2: Professional Summary / Summary / Profile opening (e.g. "Data Analyst with 4 years of experience" → "Data Analyst"). Do NOT return the entire sentence.
    3. Priority 3: Explicit designation line in employment history (e.g. "Senior Software Engineer").
    4. Priority 4: Return null if no reliable explicit designation is found.
  • MUST be a short title (typically 2–5 words). NEVER return skill paragraphs, "Knowledge On …" lines, tool lists, product acronym lists (MDG, RMS, SAPPI…), kernel/HANA install blurbs, or comma-separated competency dumps.
  • NEVER include numeric years of experience or duration phrases. If attached, return ONLY the designation (e.g. "Python Developer").
  • NEVER return location, company names, duties, project descriptions, or complete sentences.
  • Return null if no reliable explicit designation is found.

FIELD 9 — location:
  • Candidate's city, state, or country if explicitly stated (e.g. "Bangalore, Karnataka", "Hyderabad", "Dallas, TX").
  • Return null if no explicit location is stated.

RULES: Extract only explicit content from the resume. Deduplicate. null for missing strings, [] for arrays.
OUTPUT: Single valid JSON only. No markdown.
{"full_name":null,"contact":null,"email":null,"linkedin":null,"location":null,"qualification":null,"total_experience":null,"work_periods":[],"skills":[],"technology":[],"role":null}`;

export function buildTextPrompt(resumeText: string): string {
  return `${EXTRACTION_PROMPT}\n\n${'='.repeat(40)}\nRESUME\n${'='.repeat(40)}\n${resumeText}`;
}
