/**
 * Resume Parser Module (Ready for Integration)
 * 
 * A self-contained, enterprise-grade resume parsing engine with:
 * 1. Hybrid Gemini AI extraction (Gemini 3.8 Flash with multi-model fallback & context chat).
 * 2. Deterministic local fallback parser (zero external API dependency).
 * 3. Multi-format text extraction (PDF, DOCX, DOC, TXT, OCR).
 * 4. Strict extraction rules (verbatim skills, 10-skill cap, professional roles, location).
 */

// Types
export * from './types';

// Core Orchestration & Parsing API
export {
  parseResumeBuffer,
  parseResumeBuffersBulk,
  parseResumeBufferWithMetaforge,
  parseResumeBufferLegacy,
  isMetaforgeParserAvailable,
  getAiParsingSuspendedReason,
  applyEvidenceLock,
  clearParseCache,
} from './metaforgeParser';

// Local Deterministic Parser
export {
  parseCoreFieldsFromResumeText,
  extractTotalExperienceInfo,
  extractWholeResumeSkills,
  extractEligibleSkillsBlock,
  extractVerbatimDesignation,
  cleanAndValidateRoleOrTechnologies,
  extractCurrentLocation,
} from './parseCoreResumeFields';

// Strict Skills Extraction Engine
export {
  extractSkillsWithEngine,
  extractSkillsWithEngineSync,
  detectSkillSection,
  validateSkillsAgainstSection,
  expandCompoundSkillPhrases,
  type SkillsSectionLayout,
  type SkillEvidence,
  type SkillsExtractionDiagnostics,
  type SkillsEngineOptions,
  type SkillsExtractionResult,
} from './skillsExtractionEngine';

// Multi-Format Text Extraction
export {
  extractPlainTextFromResumeBuffer,
  type ExtractResumeTextResult,
} from './extractResumeText';

// Gemini AI Services
export {
  parseResumeFromPdf,
  parseResumeFromText,
  extractSkillsWithGemini,
} from './ai/gemini';

// Validation and Sanitization Utilities
export {
  isBadCandidateDisplayName,
  trimJobTitleSuffixFromDisplayName,
} from './candidateNameValidation';

export {
  compactHighestQualification,
  cleanAcademicSpecialization,
  isCertificationOrNonAcademic,
  looksLikeJobRolePhrase,
  sanitizeDisplayText,
} from './resumeFieldSanitize';

export {
  CORE_TECH_KEYWORDS,
} from './coreTechKeywords';

// Candidate Storage Adapters (Optional Persistence)
export {
  type CandidateStoreAdapter,
  InMemoryCandidateStore,
} from './adapters/candidateStoreAdapter';

// Express HTTP Router Adapter
export {
  resumeParserRouter,
} from './routes/resumeParserRouter';
