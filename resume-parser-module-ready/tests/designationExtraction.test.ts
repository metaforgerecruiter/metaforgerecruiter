/// <reference types="jest" />

import { parseCoreFieldsFromResumeText } from '../src/parseCoreResumeFields';
import {
  applyEvidenceLock,
  type ParsedCandidateResume,
} from '../src/metaforgeParser';

describe('Designation Extraction into technologies field — Mandatory Tests', () => {
  // Test 1: Professional Summary
  it('Test 1: extracts designation from Professional Summary', () => {
    const resumeText = [
      'John Doe',
      'john.doe@example.com',
      '+91 9876543210',
      '',
      'Professional Summary: Experienced Java Full Stack Developer with expertise in Spring Boot and React.',
      '',
      'Technical Skills',
      'Java, Spring Boot, React, SQL',
      '',
      'Education',
      'B.Tech in Computer Science',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBe('Java Full Stack Developer');
    expect(parsed.technologies).toBe('Java Full Stack Developer');
    expect(parsed.role).toBe('Java Full Stack Developer');
  });

  // Test 2: Summary
  it('Test 2: extracts designation from Summary', () => {
    const resumeText = [
      'Jane Smith',
      'jane.smith@example.com',
      '+91 9876543211',
      '',
      'Summary: Senior Data Engineer with experience in data platforms.',
      '',
      'Technical Skills',
      'Python, SQL, Spark, Kafka',
      '',
      'Education',
      'M.Tech in Data Science',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBe('Senior Data Engineer');
    expect(parsed.technologies).toBe('Senior Data Engineer');
    expect(parsed.role).toBe('Senior Data Engineer');
  });

  // Test 3: Profile
  it('Test 3: extracts designation from Profile', () => {
    const resumeText = [
      'Rajesh Kumar',
      'rajesh.kumar@example.com',
      '+91 9876543212',
      '',
      'Profile: SAP EWM Functional Consultant.',
      '',
      'Skills',
      'SAP EWM, SAP MM, S/4 HANA',
      '',
      'Education',
      'B.Com from Acharya Nagarjuna University',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBe('SAP EWM Functional Consultant');
    expect(parsed.technologies).toBe('SAP EWM Functional Consultant');
    expect(parsed.role).toBe('SAP EWM Functional Consultant');
  });

  // Test 4: Career Summary
  it('Test 4: extracts designation from Career Summary', () => {
    const resumeText = [
      'Anita Sharma',
      'anita.sharma@example.com',
      '+91 9876543213',
      '',
      'Career Summary: Network Engineer with enterprise networking experience.',
      '',
      'Technical Skills',
      'Cisco, Routing, Switching, Firewalls',
      '',
      'Education',
      'B.Tech in Electronics and Communication',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBe('Network Engineer');
    expect(parsed.technologies).toBe('Network Engineer');
    expect(parsed.role).toBe('Network Engineer');
  });

  // Test 5: Resume headline
  it('Test 5: extracts designation from resume headline near candidate name', () => {
    const resumeText = [
      'LOKESH A',
      'Network Engineer',
      'lokesh.a@example.com',
      '+91 9876543214',
      '',
      'Technical Skills',
      'Routing, Switching, TCP/IP',
      '',
      'Education',
      'B.E. in Information Technology',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBe('Network Engineer');
    expect(parsed.technologies).toBe('Network Engineer');
    expect(parsed.role).toBe('Network Engineer');
  });

  // Test 6: Employment designation
  it('Test 6: extracts designation explicitly stated in employment details when absent from summary', () => {
    const resumeText = [
      'Vikram Patel',
      'vikram.patel@example.com',
      '+91 9876543215',
      '',
      'Experience',
      'Company XYZ (2020 - Present)',
      'Designation: QA Automation Engineer',
      'Responsibilities: writing Selenium tests',
      '',
      'Technical Skills',
      'Selenium, Java, TestNG',
      '',
      'Education',
      'B.Tech in Computer Science',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBe('QA Automation Engineer');
    expect(parsed.technologies).toBe('QA Automation Engineer');
    expect(parsed.role).toBe('QA Automation Engineer');
  });

  // Test 7: Skills without a designation
  it('Test 7: returns null when resume contains skills but no explicit designation', () => {
    const resumeText = [
      'Pooja Nair',
      'pooja.nair@example.com',
      '+91 9876543216',
      '',
      'Skills: Python, SQL, Machine Learning, Pandas, NumPy',
      '',
      'Education',
      'B.Sc in Statistics',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBeNull();
    expect(parsed.technologies).toBeNull();
    expect(parsed.role).toBeNull();
    expect(parsed.skillsRaw).toContain('Python');
  });

  // Test 8: Conflicting designations
  it('Test 8: follows source priority and prefers Professional Summary over lower-priority mention without merging', () => {
    const resumeText = [
      'Suresh Reddy',
      'suresh.reddy@example.com',
      '+91 9876543217',
      '',
      'Professional Summary',
      'Java Developer with 5 years experience',
      '',
      'Work Experience',
      'Previous Role: Python Developer at ABC Corp',
      '',
      'Technical Skills',
      'Java, Python, SQL',
      '',
      'Education',
      'B.Tech in Information Technology',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBe('Java Developer');
    expect(parsed.technologies).toBe('Java Developer');
    expect(parsed.role).toBe('Java Developer');
  });

  // Test 9: Missing designation
  it('Test 9: returns null when resume contains only personal info, education, projects, and skills', () => {
    const resumeText = [
      'Ravi Verma',
      'ravi.verma@example.com',
      '+91 9876543218',
      '',
      'Education',
      'B.Tech in Computer Science',
      '',
      'Projects',
      'E-commerce Portal using React and Node.js',
      '',
      'Technical Skills',
      'JavaScript, React, Node.js, MongoDB',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.technologiesRaw).toBeNull();
    expect(parsed.technologies).toBeNull();
    expect(parsed.role).toBeNull();
  });

  // Test 10: Gemini failure
  it('Test 10: fallback parser applies strict designation rules and never substitutes skills', () => {
    const rawText = [
      'Deepak Singh',
      'deepak.singh@example.com',
      '+91 9876543219',
      '',
      'Professional Summary: DevOps Engineer with AWS and Kubernetes experience.',
      '',
      'Technical Skills',
      'AWS, Docker, Kubernetes, Terraform',
    ].join('\n');

    const mockCandidate: ParsedCandidateResume = {
      candidateName: 'Deepak Singh',
      email: 'deepak.singh@example.com',
      contactNumber: '+91 9876543219',
      linkedinUrl: null,
      highestQualification: null,
      skillsRaw: 'AWS, Docker, Kubernetes, Terraform',
      technologiesRaw: null,
      totalExperience: '4 Years',
      relevantExperience: null,
      currentEmployer: null,
      sourceFile: 'deepak.pdf',
      parser: 'legacy',
      role: null,
    };

    const locked = applyEvidenceLock(mockCandidate, rawText);
    expect(locked.technologiesRaw).toBe('DevOps Engineer');
    expect(locked.technologies).toBe('DevOps Engineer');
    expect(locked.role).toBe('DevOps Engineer');
    expect(locked.skillsRaw).toBe('AWS, Docker, Kubernetes, Terraform');
    expect(locked.technologiesRaw).not.toContain('Docker');
  });

  // Test 11: Bulk upload isolation
  it('Test 11: ensures strict candidate isolation across multiple resumes without cross-contamination', () => {
    const resumeAText = [
      'Candidate A',
      'cand.a@example.com',
      '+91 9876543220',
      '',
      'Professional Summary: Java Developer with expertise in Spring.',
      '',
      'Technical Skills',
      'Java, Spring',
    ].join('\n');

    const resumeBText = [
      'Candidate B',
      'cand.b@example.com',
      '+91 9876543221',
      '',
      'Professional Summary: Network Engineer with CCNA certification.',
      '',
      'Technical Skills',
      'Routing, Switching',
    ].join('\n');

    const parsedA = parseCoreFieldsFromResumeText(resumeAText);
    const parsedB = parseCoreFieldsFromResumeText(resumeBText);

    expect(parsedA.technologiesRaw).toBe('Java Developer');
    expect(parsedA.technologies).toBe('Java Developer');
    expect(parsedB.technologiesRaw).toBe('Network Engineer');
    expect(parsedB.technologies).toBe('Network Engineer');

    const lockedA = applyEvidenceLock(
      {
        candidateName: 'Candidate A',
        email: 'cand.a@example.com',
        contactNumber: '+91 9876543220',
        linkedinUrl: null,
        highestQualification: null,
        skillsRaw: 'Java, Spring',
        technologiesRaw: null,
        totalExperience: null,
        relevantExperience: null,
        currentEmployer: null,
        sourceFile: 'resumeA.txt',
        parser: 'legacy',
      },
      resumeAText,
    );

    const lockedB = applyEvidenceLock(
      {
        candidateName: 'Candidate B',
        email: 'cand.b@example.com',
        contactNumber: '+91 9876543221',
        linkedinUrl: null,
        highestQualification: null,
        skillsRaw: 'Routing, Switching',
        technologiesRaw: null,
        totalExperience: null,
        relevantExperience: null,
        currentEmployer: null,
        sourceFile: 'resumeB.txt',
        parser: 'legacy',
      },
      resumeBText,
    );

    expect(lockedA.technologiesRaw).toBe('Java Developer');
    expect(lockedB.technologiesRaw).toBe('Network Engineer');
    expect(lockedA.technologiesRaw).not.toBe(lockedB.technologiesRaw);
  });

  // Test 12: Unrelated fields remain unchanged
  it('Test 12: preserves candidateName, email, phone, education, experience, and skills completely unchanged', () => {
    const resumeText = [
      'Sunita Rao',
      'sunita.rao@gmail.com',
      '+91 9876543222',
      'https://www.linkedin.com/in/sunitarao',
      '',
      'Professional Summary: Senior Python Developer with 6 years of experience.',
      '',
      'Total Experience: 6 years',
      '',
      'Technical Skills',
      'Python, Django, FastAPI, PostgreSQL',
      '',
      'Education',
      'B.Tech in Computer Science',
      '',
      'Experience',
      'Tech Corp (2018 - Present)',
      'Senior Python Developer',
    ].join('\n');

    const parsed = parseCoreFieldsFromResumeText(resumeText);
    expect(parsed.candidateName).toBe('Sunita Rao');
    expect(parsed.email).toBe('sunita.rao@gmail.com');
    expect(parsed.contactNumber).toBe('+919876543222');
    expect(parsed.linkedinUrl).toBe('https://www.linkedin.com/in/sunitarao');
    expect(parsed.highestQualification).toMatch(/B\.?\s*Tech/i);
    expect(parsed.totalExperienceText).toMatch(/6\s*years/i);
    expect(parsed.skillsRaw).toContain('Python');
    expect(parsed.skillsRaw).toContain('Django');
    expect(parsed.technologiesRaw).toBe('Senior Python Developer');
  });
});
