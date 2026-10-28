/**
 * Core type definitions for the Resume Parser Module.
 */

export type ParsedCandidateResume = {
  candidateName: string | null;
  email: string | null;
  contactNumber: string | null;
  linkedinUrl: string | null;
  highestQualification: string | null;
  skillsRaw: string | null;
  technologiesRaw: string | null;
  technologies?: string | null;
  totalExperience: string | null;
  relevantExperience: string | null;
  currentEmployer: string | null;
  currentLocation?: string | null;
  location?: string | null;
  sourceFile: string;
  parser: 'metaforge' | 'legacy';
  role?: string | null;
};

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
  location?: string | null;
  role?: string | null;
};

export type BulkParseItemResult =
  | { sourceFile: string; status: 'done'; data: ParsedCandidateResume }
  | { sourceFile: string; status: 'error'; error: string };

export type ExtractResumeTextResult = {
  text: string;
  error?: string;
};

export type MetaforgeParsed = {
  full_name?: string;
  contact?: string;
  email?: string;
  linkedin?: string;
  qualification?: string;
  total_experience?: string;
  relevant_experience?: string;
  skills?: string[];
  technology?: string[];
  role?: string;
  location?: string;
  current_location?: string;
  work_periods?: Array<{ from?: string; to?: string; start?: string; end?: string }>;
  relevant_work_periods?: Array<{ from?: string; to?: string; start?: string; end?: string }>;
};

export type ResumeParserOptions = {
  enableAi?: boolean;
  geminiApiKey?: string;
  geminiModel?: string;
  fallbackModels?: string[];
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatWithContextOptions {
  messages: ChatMessage[];
  candidateProfile?: Partial<ParsedCandidateResume> | null;
}
