/// <reference types="jest" />

import { compactHighestQualification, looksLikeJobRolePhrase, sanitizeDisplayText } from '../src/resumeFieldSanitize';
import { parseCoreFieldsFromResumeText } from '../src/parseCoreResumeFields';

describe('resumeFieldSanitize', () => {
  it('compacts narrative education into clean degree specialization', () => {
    const hq = compactHighestQualification(
      'Completed Degree in B COM (COMPUTERS) From Acharya Nagarjuna University in April 2021 in',
    );
    expect(hq).toMatch(/B\.?\s*COM/i);
    expect(hq).not.toMatch(/\s+in\s*$/i);
  });

  it('strips trailing periods from display text', () => {
    expect(sanitizeDisplayText('Mohammed Junaid.')).toBe('Mohammed Junaid');
  });

  it('strips trailing job roles, sentences, and narrative details from degree', () => {
    const hq1 = compactHighestQualification(
      'Bachelor of Engineering in Mechanical Engineering. Currently working as a Technical Lead',
    );
    expect(hq1).toBe('Bachelor of Engineering in Mechanical Engineering');

    const hq2 = compactHighestQualification(
      'Strong Engineering professional with a Bachelor of Engineering in Mechanical Engineering. Currently working as a Technical Lead at Tata Technologies, Pune',
    );
    expect(hq2).toBe('Bachelor of Engineering in Mechanical Engineering');

    const hq3 = compactHighestQualification('1. BE Mechanical Amravati University 2017 8.5 CGPA');
    expect(hq3).toBe('BE Mechanical');

    const hq4 = compactHighestQualification('BE Mechanical Amravati University');
    expect(hq4).toBe('BE Mechanical');

    const hq5 = compactHighestQualification(
      'Master of Business Administration (MBA) in Human Resources',
    );
    expect(hq5).toBe('Master of Business Administration (MBA) in Human Resources');
  });

  it('detects job-role phrases that belong in technology not skills', () => {
    expect(looksLikeJobRolePhrase('SAP SuccessFactors Consultant')).toBe(true);
    expect(looksLikeJobRolePhrase('SF EC')).toBe(false);
  });
});

describe('parseCoreFieldsFromResumeText — field formatting', () => {
  it('separates skills and technology for SAP profile', () => {
    const parsed = parseCoreFieldsFromResumeText(
      [
        'Mohammed Junaid',
        'mohammedjunaidsapsf@gmail.com',
        '+917013044354',
        '',
        'Professional Summary',
        'SAP SuccessFactors Consultant with 3 years experience',
        '',
        'Technical Skills',
        'SF EC, Time Off, Employee Central',
        '',
        'Education',
        'Completed Degree in B COM (COMPUTERS) From Acharya Nagarjuna University in April 2021',
      ].join('\n'),
    );

    expect(parsed.candidateName).toBe('Mohammed Junaid');
    expect(parsed.highestQualification).toMatch(/COM/i);
    expect(parsed.highestQualification).not.toMatch(/\s+in\s*$/i);
    expect(parsed.skillsRaw).toMatch(/SF EC/i);
    expect(parsed.skillsRaw).not.toMatch(/SuccessFactors Consultant/i);
    expect(parsed.technologiesRaw).toMatch(/SAP/i);
    expect(parsed.skillsRaw).not.toContain('.');
  });
});
