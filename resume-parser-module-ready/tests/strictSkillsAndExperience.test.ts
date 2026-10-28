/// <reference types="jest" />

import {
  extractEligibleSkillsBlock,
  extractWholeResumeSkills,
  extractTotalExperienceInfo,
  parseCoreFieldsFromResumeText,
} from '../src/parseCoreResumeFields';
import { applyEvidenceLock, ParsedCandidateResume } from '../src/metaforgeParser';

describe('Strict Experience, Skills & Technologies Extraction', () => {
  describe('RULE 1: Total Years of Experience', () => {
    test('Example A: Nearly 12 years -> 12 years', () => {
      const resume = `A goal-oriented profession with nearly 12 years of experience in Refinery, Petrochemical and Chemical industry.`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('12 years');
      expect(info.years).toBe(12);
    });

    test('Example B: Over 7 years -> 7 years (qualifier removed, + not added)', () => {
      const resume = `Over 7 years of experience in mechanical design.`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('7 years');
      expect(info.years).toBe(7);
    });

    test('Example C: 7+ years -> 7+ years (+ preserved)', () => {
      const resume = `7+ years of experience in hardware engineering.`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('7+ years');
      expect(info.years).toBe(7);
    });

    test('Example D: Approximately 8 years -> 8 years', () => {
      const resume = `Approximately 8 years of professional experience.`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('8 years');
      expect(info.years).toBe(8);
    });

    test('Example E: 4.5+ years -> 4.5+ years', () => {
      const resume = `4.5+ years of experience in automotive electronics.`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('4.5+ years');
      expect(info.years).toBe(4);
    });

    test('Example F: employment dates without explicit overall experience returns empty string', () => {
      const resume = `
Work Experience
Company A: 2018 - 2021
Company B: 2021 - 2026
`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('');
      expect(info.years).toBeNull();
    });

    test('months preserved without conversion', () => {
      const resume = `36 months of professional experience.`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('36 months');
      expect(info.years).toBe(3);
    });

    test('more qualifiers stripped: more than, having', () => {
      const resumeA = `More than 7 years of experience in Cloud Architecture.`;
      expect(extractTotalExperienceInfo(resumeA).text).toBe('7 years');

      const resumeB = `Having 4.10 years of experience.`;
      expect(extractTotalExperienceInfo(resumeB).text).toBe('4.10 years');
    });

    test('extracts overall experience when relevant experience is also mentioned', () => {
      const resume = `Having 6 years of overall work experience and relevant experience is 4+ years in embedded systems.`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('6 years');
    });

    test('relevant experience only without overall experience returns empty string', () => {
      const resume = `
Professional Summary
Having 4+ years of relevant experience in React and Node.js.
`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('');
      expect(info.years).toBeNull();
    });

    test('applyEvidenceLock strictly sets totalExperience to explicit cleaned value or empty string', () => {
      const resumeWithExp = `Over 5 years of experience in hardware design.\nCompany A: 2018 - 2023`;
      const candidate: ParsedCandidateResume = {
        candidateName: 'Test Candidate',
        email: 'test@example.com',
        contactNumber: null,
        linkedinUrl: null,
        highestQualification: null,
        skillsRaw: null,
        technologiesRaw: null,
        totalExperience: 'Over 5 years',
        relevantExperience: null,
        currentEmployer: null,
        sourceFile: 'resume.txt',
        parser: 'metaforge',
      };
      const locked = applyEvidenceLock(candidate, resumeWithExp);
      expect(locked.totalExperience).toBe('5 years');

      // Dates only: AI or legacy calculated experience is stripped to empty string
      const datesOnlyResume = `
Work Experience
Company A: January 2020 – December 2022
Company B: January 2023 – Present
`;
      candidate.totalExperience = '4+ years';
      const lockedDates = applyEvidenceLock(candidate, datesOnlyResume);
      expect(lockedDates.totalExperience).toBe('');
    });
  });

  describe('RULE 2: Skills Extraction — Maximum 10 Skills', () => {
    test('Rule 2 Example: CAD skills breakdown, compound expansion, filler stripping, capped at 10', () => {
      const resume = `
Skills
- NX-CAD: Expertise in Surface, Solid Modeling and Drafting.
- Creo 7.0: Expertise in Surface, Solid Modeling and Drafting.
- CATIA: Basic Solid Modeling and Drafting.
- NX Nastran: Component-wise structural CAE Simulation.
- Microsoft Excel.
- Microsoft PowerPoint.
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual([
        'NX-CAD',
        'Surface Modeling',
        'Solid Modeling',
        'Drafting',
        'Creo 7.0',
        'CATIA',
        'NX Nastran',
        'Structural CAE Simulation',
        'Microsoft Excel',
        'Microsoft PowerPoint',
      ]);
      expect(skills.length).toBe(10);
    });

    test('A Skills section containing more than 10 skills returns maximum 10 individual skill names', () => {
      const resume = `
Technical Skills
Python, Java, C++, Go, Rust, Ruby, JavaScript, TypeScript, PHP, Swift, Kotlin, Scala
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills.length).toBe(10);
      expect(skills).toEqual([
        'Python',
        'Java',
        'C++',
        'Go',
        'Rust',
        'Ruby',
        'JavaScript',
        'TypeScript',
        'PHP',
        'Swift',
      ]);
    });

    test('a populated Skills section is not supplemented by extra technologies in Job Responsibilities', () => {
      const resume = `
John Doe
Software Engineer
Email: john@example.com

Technical Skills
Python, Django

Job Responsibilities
- 3D CAD Modeling & Detailing
- Sheet Metal & Weldment Design
- Design for Manufacturing (DFM)
- Developed responsive web applications using React and Node.js
`;
      const skillsBlock = extractEligibleSkillsBlock(resume);
      expect(skillsBlock).toBeTruthy();

      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBe('Python, Django');

      const mockCandidate: ParsedCandidateResume = {
        candidateName: 'John Doe',
        email: 'john@example.com',
        contactNumber: null,
        linkedinUrl: null,
        highestQualification: null,
        skillsRaw: 'Python, Django, React, Node.js, DFM, Sheet Metal Design',
        technologiesRaw: null,
        totalExperience: null,
        relevantExperience: null,
        currentEmployer: null,
        sourceFile: 'resume.txt',
        parser: 'metaforge',
      };
      const locked = applyEvidenceLock(mockCandidate, resume);
      expect(locked.skillsRaw).toBe('Python, Django');
    });

    test('a resume without a Skills section falls back to experience/responsibilities if explicit skills exist', () => {
      const resume = `
Candidate Name
Professional Experience
Responsibilities:
- Managed Kubernetes clusters and Docker containers
- Developed backend services in Go
`;
      const skillsBlock = extractEligibleSkillsBlock(resume);
      expect(skillsBlock).toBeNull();

      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeTruthy();
      const skills = parsed.skillsRaw!.split(', ');
      expect(skills).toContain('Kubernetes');
      expect(skills).toContain('Docker');
      expect(skills).toContain('Go');
    });

    test('a resume without a Skills section and no explicit skills returns empty array / null', () => {
      const resume = `
Candidate Name
Professional Experience
Responsibilities:
- Handled daily client communications and tracked deliverables.
- Prepared status reports and documented meeting minutes.
`;
      const skillsBlock = extractEligibleSkillsBlock(resume);
      expect(skillsBlock).toBeNull();

      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeNull();
    });

    test('different valid Skills heading names are supported', () => {
      const headings = [
        'Skills',
        'Technical Skills',
        'Core Skills',
        'Key Skills',
        'Technical Competencies',
        'Core Technical Capabilities',
      ];

      for (const heading of headings) {
        const resume = `
Jane Doe
${heading}
- Python, TypeScript, React

Experience
- Senior Developer at Acme Corp
`;
        const block = extractEligibleSkillsBlock(resume);
        expect(block).toBeTruthy();
        const skills = extractWholeResumeSkills(resume, block!);
        expect(skills).toContain('Python');
        expect(skills).toContain('TypeScript');
        expect(skills).toContain('React');
      }
    });

    test('rejects bullet sentences and responsibilities in skills section', () => {
      const resume = `
Technical Skills
- Designed and developed new products.
- Responsible for hardware testing and debugging.
- Worked on various engineering projects.
- Python
- Docker
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toContain('Python');
      expect(skills).toContain('Docker');
      expect(skills).not.toContain('Designed and developed new products.');
      expect(skills).not.toContain('Responsible for hardware testing and debugging.');
      expect(skills).not.toContain('Worked on various engineering projects.');
    });
  });

  describe('RULE 3: Technologies Extraction — Designation or Domain', () => {
    test('Regression Test 6: Summary containing Mechanical Design Engineer -> that exact designation in technologies', () => {
      const resume = `
Professional Summary
Mechanical Design Engineer with experience in CAD/CAE software, product development and simulation.

Technical Skills
CATIA, SolidWorks

Education
B.Tech in Mechanical Engineering
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies).toBe('Mechanical Design Engineer');
      expect(parsed.technologiesRaw).toBe('Mechanical Design Engineer');
      expect(parsed.role).toBe('Mechanical Design Engineer');
    });

    test('Regression Test 7: Summary containing Refinery, Petrochemical and Chemical industry without designation -> that industry/domain', () => {
      const resume = `
Professional Summary
A goal-oriented profession with nearly 12 years of experience in Refinery, Petrochemical and Chemical industry, worked experience in erection, pre commissioning, commissioning, production operation of some of the world's renowned plants.

Education
Diploma in Chemical Engineering
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies).toBe('Refinery, Petrochemical and Chemical Industry');
      expect(parsed.technologiesRaw).toBe('Refinery, Petrochemical and Chemical Industry');
      expect(parsed.totalExperienceText).toBe('12 years');
    });

    test('Domain example: Semiconductor Capital Equipment, Battery Energy Storage Systems', () => {
      const resume = `
Profile Summary
Experienced professional specializing in semiconductor capital equipment and battery energy storage systems.

Education
B.E. in Electrical Engineering
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies).toBe('Semiconductor Capital Equipment, Battery Energy Storage Systems');
    });

    test('Regression Test 8: Summary with erection, pre-commissioning, commissioning and production operations without designation or clear industry label -> concise activity phrase', () => {
      const resume = `
Executive Profile
Worked experience in erection, pre commissioning, commissioning, production operation of some of the world's renowned plants.

Education
B.Sc in Chemistry
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies).toBe('Erection, Pre-commissioning, Commissioning and Production Operations');
    });

    test('Regression Test 9: Resume without explicit designation, domain or professional activity in permitted sections returns empty string / null', () => {
      const resume = `
John Doe
john.doe@example.com
+91 9876543210

Education
B.Tech in Computer Science
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies ?? '').toBe('');
      expect(parsed.technologiesRaw ?? '').toBe('');

      const candidate: ParsedCandidateResume = {
        candidateName: 'John Doe',
        email: 'john.doe@example.com',
        contactNumber: '+91 9876543210',
        linkedinUrl: null,
        highestQualification: 'B.Tech in Computer Science',
        skillsRaw: null,
        technologiesRaw: null,
        totalExperience: '',
        relevantExperience: null,
        currentEmployer: null,
        sourceFile: 'resume.txt',
        parser: 'metaforge',
      };
      const locked = applyEvidenceLock(candidate, resume);
      expect(locked.technologies ?? '').toBe('');
      expect(locked.technologiesRaw ?? '').toBe('');
    });
  });

  describe('RULE 6: Complete Regression Test Suite', () => {
    test('1. Nearly 12 years -> 12 years', () => {
      const r = `Nearly 12 years of experience in petroleum engineering.`;
      expect(extractTotalExperienceInfo(r).text).toBe('12 years');
    });

    test('2. 7+ years -> 7+ years', () => {
      const r = `7+ years of experience in hardware engineering.`;
      expect(extractTotalExperienceInfo(r).text).toBe('7+ years');
    });

    test('3. Employment dates without an explicit overall experience -> ""', () => {
      const r = `
Professional Experience
Company A: Jan 2018 - Dec 2021
Company B: Jan 2022 - Present
`;
      expect(extractTotalExperienceInfo(r).text).toBe('');
      expect(extractTotalExperienceInfo(r).years).toBeNull();
    });

    test('4. Skills section containing > 10 skills -> maximum 10 individual skill names', () => {
      const r = `
Technical Skills
Java, Python, C++, Go, TypeScript, JavaScript, SQL, Rust, Ruby, PHP, Swift, Kotlin
`;
      const skills = extractWholeResumeSkills(r);
      expect(skills.length).toBe(10);
      expect(skills[0]).toBe('Java');
      expect(skills[9]).toBe('PHP');
    });

    test('5. Responsibilities containing duties but no evidence of specific skills -> null / empty', () => {
      const r = `
Work Experience
Responsibilities:
- Handled daily client communications, attended team standup meetings, and coordinated schedules
`;
      const parsed = parseCoreFieldsFromResumeText(r);
      expect(parsed.skillsRaw).toBeNull();
    });

    test('6. Summary containing Mechanical Design Engineer -> that exact designation in technologies', () => {
      const r = `
Professional Summary
Mechanical Design Engineer with experience in CAD/CAE software.
`;
      expect(parseCoreFieldsFromResumeText(r).technologies).toBe('Mechanical Design Engineer');
    });

    test('7. Summary containing Refinery, Petrochemical and Chemical industry without designation -> that industry/domain', () => {
      const r = `
Professional Summary
A goal-oriented profession with nearly 12 years of experience in Refinery, Petrochemical and Chemical industry.
`;
      expect(parseCoreFieldsFromResumeText(r).technologies).toBe('Refinery, Petrochemical and Chemical Industry');
    });

    test('8. Summary containing erection, pre-commissioning, commissioning and production operations without designation or clear industry label -> concise activity phrase', () => {
      const r = `
Career Summary
Worked experience in erection, pre commissioning, commissioning, production operation of various plants.
`;
      expect(parseCoreFieldsFromResumeText(r).technologies).toBe('Erection, Pre-commissioning, Commissioning and Production Operations');
    });

    test('9. Resume without explicit designation, domain or professional activity in permitted sections -> ""', () => {
      const r = `
Candidate Name
Email: cand@test.com
Education: B.Tech
`;
      expect(parseCoreFieldsFromResumeText(r).technologies ?? '').toBe('');
    });
  });

  describe('STRICT SKILLS EXTRACTION RULE — 10 Regression Tests (Section 7)', () => {
    // 1. Resume with a valid dedicated Skills section.
    test('1. Resume with a valid dedicated Skills section', () => {
      const resume = `
Alice Smith
Email: alice@example.com

Technical Skills
Python, React, PostgreSQL, Docker, AWS

Experience
Software Engineer at Acme Corp
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual(['Python', 'React', 'PostgreSQL', 'Docker', 'AWS']);
    });

    // 2. Resume with no Skills section but explicit skills in the summary.
    test('2. Resume with no Skills section but explicit skills in the summary', () => {
      const resume = `
Bob Johnson
bob@example.com

Professional Summary
Experienced Software Engineer skilled in Python, Flask, and PostgreSQL with a background in designing REST APIs.

Work Experience
Engineer at Globex
- Worked on backend systems.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeTruthy();
      const skills = parsed.skillsRaw!.split(', ');
      expect(skills).toContain('Python');
      expect(skills).toContain('Flask');
      expect(skills).toContain('REST APIs');
      expect(skills).toContain('PostgreSQL');
    });

    // 3. Resume with skills explicitly demonstrated in project descriptions.
    test('3. Resume with skills explicitly demonstrated in project descriptions', () => {
      const resume = `
Carol Danvers
carol@example.com

Technical Projects
Predictive Analytics Pipeline:
- Built machine learning models using Scikit-learn and XGBoost for patient outcome prediction.
- Deployed models using FastAPI and Docker.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeTruthy();
      const skills = parsed.skillsRaw!.split(', ');
      expect(skills).toContain('Machine Learning');
      expect(skills).toContain('Scikit-learn');
      expect(skills).toContain('XGBoost');
      expect(skills).toContain('FastAPI');
      expect(skills).toContain('Docker');
    });

    // 4. Resume with skills explicitly demonstrated in work experience.
    test('4. Resume with skills explicitly demonstrated in work experience', () => {
      const resume = `
David Miller
david@example.com

Work Experience
Frontend Developer at Tech Corp (2021 - Present)
- Experienced in designing responsive interfaces using React and Tailwind CSS.
- Developed REST APIs and integrated GraphQL endpoints.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeTruthy();
      const skills = parsed.skillsRaw!.split(', ');
      expect(skills).toContain('React');
      expect(skills).toContain('Tailwind CSS');
      expect(skills).toContain('Responsive Web Design');
      expect(skills).toContain('REST APIs');
      expect(skills).toContain('GraphQL');
    });

    // 5. Resume containing responsibilities but no evidence of specific skills.
    test('5. Resume containing responsibilities but no evidence of specific skills returns empty / null', () => {
      const resume = `
Emily Davis
emily@example.com

Work Experience
Operations Specialist (2020 - 2023)
Responsibilities:
- Responsible for attending daily standup meetings.
- Managed team schedules and coordinated cross-functional meetings.
- Liaised between clients and internal stakeholders to track deliverables.
- Prepared weekly status updates and meeting minutes.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeNull();
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual([]);
    });

    // 6. Resume with skills scattered across multiple pages or columns.
    test('6. Resume with skills scattered across multiple pages or columns', () => {
      const resume = `
Frank Castle
frank@example.com
------------------- Page Break / Column Split -------------------
Summary:
Proficient in Java and Spring Boot with experience in microservices.
------------------- Page Break / Column Split -------------------
Projects:
- Implemented real-time event streaming using Kafka and Redis.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeTruthy();
      const skills = parsed.skillsRaw!.split(', ');
      expect(skills).toContain('Java');
      expect(skills).toContain('Spring Boot');
      expect(skills).toContain('Kafka');
      expect(skills).toContain('Redis');
    });

    // 7. Resume with a populated Skills section and additional technologies mentioned in responsibilities.
    test('7. Resume with a populated Skills section does NOT supplement from responsibilities', () => {
      const resume = `
Grace Hopper
grace@example.com

Technical Skills
COBOL, Fortran, Assembly

Work Experience
Senior Systems Architect
Responsibilities:
- Developed web services using Python, Docker, Kubernetes, and AWS.
- Built reactive frontends with React and TypeScript.
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual(['COBOL', 'Fortran', 'Assembly']);
      expect(skills).not.toContain('Python');
      expect(skills).not.toContain('Docker');
      expect(skills).not.toContain('Kubernetes');
      expect(skills).not.toContain('AWS');
      expect(skills).not.toContain('React');
      expect(skills).not.toContain('TypeScript');
    });

    // 8. Resume with duplicate skills and more than 10 candidate skills.
    test('8. Resume with duplicate skills and more than 10 candidate skills returns max 10 deduplicated', () => {
      const resume = `
Henry Jekyll
henry@example.com

Technical Skills
Python, Java, C++, Python, Go, Rust, Ruby, JavaScript, TypeScript, PHP, Swift, Kotlin, Java, Rust
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills.length).toBe(10);
      const uniqueSkills = Array.from(new Set(skills));
      expect(uniqueSkills.length).toBe(10);
      expect(skills).toEqual([
        'Python',
        'Java',
        'C++',
        'Go',
        'Rust',
        'Ruby',
        'JavaScript',
        'TypeScript',
        'PHP',
        'Swift',
      ]);
    });

    // 9. Resume with no reliable skill evidence.
    test('9. Resume with no reliable skill evidence does not infer skills and returns null / empty', () => {
      const resume = `
Ian Malcolm
ian@example.com

Experience
- Worked on a project for a banking client in financial services.
- Managed customer relationships and oversaw office supplies.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.skillsRaw).toBeNull();
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual([]);
    });

    // 10. PDF and DOCX files with different formatting.
    test('10. PDF and DOCX files with different formatting (multi-line, table pipes, bullet symbols)', () => {
      const resumeDocxTable = `
Candidate Name: Jane Tech
Email: jane@example.com

| Technical Skills |
| C++ | Python | Linux | Git | Docker | Jenkins |

Professional Experience:
Engineer at Corp
`;
      const skillsDocx = extractWholeResumeSkills(resumeDocxTable);
      expect(skillsDocx).toContain('C++');
      expect(skillsDocx).toContain('Python');
      expect(skillsDocx).toContain('Linux');
      expect(skillsDocx).toContain('Git');
      expect(skillsDocx).toContain('Docker');
      expect(skillsDocx).toContain('Jenkins');

      const resumePdfBullets = `
Candidate Name: Mark Code
Summary
• Proficient in Go and Kubernetes
▪ Developed web applications with Vue.js and MongoDB
* Implemented authentication using JWT
`;
      const parsedPdf = parseCoreFieldsFromResumeText(resumePdfBullets);
      expect(parsedPdf.skillsRaw).toBeTruthy();
      const pdfSkills = parsedPdf.skillsRaw!.split(', ');
      expect(pdfSkills).toContain('Go');
      expect(pdfSkills).toContain('Kubernetes');
      expect(pdfSkills).toContain('Vue.js');
      expect(pdfSkills).toContain('MongoDB');
      expect(pdfSkills).toContain('JWT Authentication');
    });
  });

  describe('STRICT RULE: Explicit Years of Experience — 9 Regression Tests (Section 6)', () => {
    // 1. Explicit experience in the summary.
    test('1. Explicit experience in the summary', () => {
      const resume = `
Professional Summary
Results-driven Senior Full Stack Developer with 8 years of professional experience building scalable web apps.
`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('8 years');
      expect(info.years).toBe(8);
    });

    // 2. Explicit experience in the work-experience section.
    test('2. Explicit experience in the work-experience section', () => {
      const resume = `
Work Experience
Total Experience: 6 years
Company A - Software Engineer (2018 - 2024)
`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('6 years');
      expect(info.years).toBe(6);
    });

    // 3. Values containing `+`.
    test('3. Values containing +', () => {
      const resume = `
Executive Profile
IT Architect offering 7+ years of experience in enterprise systems design.
`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('7+ years');
      expect(info.years).toBe(7);
    });

    // 4. Decimal values such as `4.5 years`.
    test('4. Decimal values such as 4.5 years', () => {
      const resume = `
Profile
Software Engineer with 4.5 years of experience in Python and cloud services.
`;
      const info = extractTotalExperienceInfo(resume);
      expect(info.text).toBe('4.5 years');
      expect(info.years).toBe(4);
    });

    // 5. Qualifiers such as "nearly", "over", and "more than".
    test('5. Qualifiers such as nearly, over, and more than stripped to clean number', () => {
      const rNearly = `Nearly 12 years of experience in Refinery and Petrochemical industry.`;
      expect(extractTotalExperienceInfo(rNearly).text).toBe('12 years');

      const rOver = `Over 7 years of experience in mechanical engineering.`;
      expect(extractTotalExperienceInfo(rOver).text).toBe('7 years');

      const rMoreThan = `More than 10 years of professional experience.`;
      expect(extractTotalExperienceInfo(rMoreThan).text).toBe('10 years');

      const rApprox = `Approximately 8 years of experience.`;
      expect(extractTotalExperienceInfo(rApprox).text).toBe('8 years');

      const rAbout = `About 5 years of experience in backend development.`;
      expect(extractTotalExperienceInfo(rAbout).text).toBe('5 years');
    });

    // 6. Experience stated on a later page.
    test('6. Experience stated on a later page', () => {
      const resumeMultiPage = `
Candidate Name
candidate@example.com
Education: B.Tech in Computer Science, 2016
-------------------- Page Break --------------------
Technical Skills: Java, Spring Boot, Microservices
-------------------- Page Break --------------------
Work Experience
Total Experience: 6 years
Senior Developer at Tech Corp
`;
      const info = extractTotalExperienceInfo(resumeMultiPage);
      expect(info.text).toBe('6 years');
      expect(info.years).toBe(6);
    });

    // 7. Employment dates without an explicit total.
    test('7. Employment dates without an explicit total returns empty string', () => {
      const resumeDatesOnly = `
Work Experience
Software Engineer at Acme Corp: 2018 - 2021
Senior Engineer at Beta LLC: 2021 - 2025
`;
      const info = extractTotalExperienceInfo(resumeDatesOnly);
      expect(info.text).toBe('');
      expect(info.years).toBeNull();
    });

    // 8. Multiple conflicting experience statements.
    test('8. Multiple conflicting experience statements resolves deterministically and logs', () => {
      const resumeConflict = `
Professional Summary
Total Experience: 8 years in cloud architecture.

Experience History
Total Experience: 6 years in consulting.
`;
      const info = extractTotalExperienceInfo(resumeConflict);
      // Deterministic rule: earliest/primary statement wins
      expect(info.text).toBe('8 years');
      expect(info.years).toBe(8);

      const resumePlusConflict = `
Summary: 8 years of total experience.
Experience: 8+ years of total experience.
`;
      const infoPlus = extractTotalExperienceInfo(resumePlusConflict);
      // Preserves explicit '+'
      expect(infoPlus.text).toBe('8+ years');
    });

    // 9. PDF and DOCX formatting variations.
    test('9. PDF and DOCX formatting variations (tables, colons, bullet symbols, multi-line wrap)', () => {
      const tableFormat = `
| Total Experience | 6.5 Years |
| Current Location | Bangalore |
`;
      expect(extractTotalExperienceInfo(tableFormat).text).toBe('6.5 years');

      const bulletFormat = `
• Total Experience: 7+ yrs
• Highest Qualification: M.Tech
`;
      expect(extractTotalExperienceInfo(bulletFormat).text).toBe('7+ years');

      const multiLineFormat = `
Total Experience:
10 years
`;
      expect(extractTotalExperienceInfo(multiLineFormat).text).toBe('10 years');

      const twoColumnFormat = `
Total Experience   5 Years
Location           Hyderabad
`;
      expect(extractTotalExperienceInfo(twoColumnFormat).text).toBe('5 years');
    });
  });

  describe('STRICT PRODUCTION FIX — Skills Extraction & Technologies Field Regression Tests (Tests A-F)', () => {
    // Test A — Provided Shiva Boda Resume
    test('Test A — Provided Shiva Boda Resume', () => {
      const resume = `
Shiva Boda
shivaboda@example.com
+91 9876543210

Technical Skills:
- Python
- SQL (MS SQL Server)

Internship
AI & Machine Learning Intern
- The project development process
- Gained hands-on experience
- Evaluation
- Pandas, Scikit-learn

Certifications
- AI & Machine Learning — Edunet Foundation
- ServiceNow Micro-Certification
- SQL Certification — Intellipaat
- Python Fundamentals — Great Learning

Strengths
Quick Learner, Problem Solving, Teamwork, Communication

Languages
Telugu, Hindi, English
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      const skills = extractWholeResumeSkills(resume);
      const locked = applyEvidenceLock(
        {
          candidateName: 'Shiva Boda',
          email: 'shivaboda@example.com',
          contactNumber: '+91 9876543210',
          linkedinUrl: null,
          highestQualification: 'B.Tech',
          totalExperience: '',
          relevantExperience: null,
          skillsRaw:
            'Python, SQL, MS SQL Server, Internship, AI, The project development process, Gained hands-on, Evaluation',
          technologiesRaw: '- The project development process',
          currentEmployer: null,
          sourceFile: 'shiva_boda.pdf',
          parser: 'metaforge',
          role: 'AI & Machine Learning Intern',
        },
        resume,
      );

      // Expected Skills: ["Python", "SQL", "MS SQL Server"]
      expect(skills).toEqual(['Python', 'SQL', 'MS SQL Server']);
      expect(parsed.skillsRaw).toBe('Python, SQL, MS SQL Server');
      expect(locked.skillsRaw).toBe('Python, SQL, MS SQL Server');

      // The following must not appear in Skills:
      const prohibited = [
        'Internship',
        'AI & Machine Learning Intern',
        'The project development process',
        'Gained hands-on experience',
        'Evaluation',
        'Pandas',
        'Scikit-learn',
        'Certifications',
        'Quick Learner',
        'Problem Solving',
        'Teamwork',
        'Communication',
        'Telugu',
        'Hindi',
        'English',
      ];
      for (const p of prohibited) {
        expect(skills).not.toContain(p);
        expect(locked.skillsRaw).not.toContain(p);
      }

      // Technologies field: do not return internship bullets, years of experience, or fabricated designation
      expect(parsed.technologies ?? '').toBe('');
      expect(parsed.technologiesRaw ?? '').toBe('');
      expect(locked.technologies ?? '').toBe('');
      expect(locked.technologiesRaw ?? '').toBe('');
    });

    // Test B — Missing Skills Section
    test('Test B — Missing Skills Section: Developed a web application using Python, Flask and PostgreSQL.', () => {
      const resume = `
Alex Morgan
alex@example.com

Work Experience
Full Stack Developer
- Developed a web application using Python, Flask and PostgreSQL.
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual(['Python', 'Flask', 'PostgreSQL']);
    });

    // Test C — CAD Resume
    test('Test C — CAD Resume: Used AutoCAD and CAD software to design mechanical components.', () => {
      const resume = `
Sam Design
sam@example.com

Summary
Used AutoCAD and CAD software to design mechanical components.
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toContain('AutoCAD');
      expect(skills).toContain('CAD');
    });

    // Test D — Spoken Languages
    test('Test D — Spoken Languages: Languages: Telugu, Hindi. Technical Skills: Python, SQL.', () => {
      const resume = `
Languages: Telugu, Hindi. Technical Skills: Python, SQL.
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual(['Python', 'SQL']);
      expect(skills).not.toContain('Telugu');
      expect(skills).not.toContain('Hindi');
    });

    // Test E — Explicit Role and Years
    test('Test E — Explicit Role and Years: Java Developer with 4 years of experience.', () => {
      const resume = `
Java Developer with 4 years of experience.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies).toBe('Java Developer');
      expect(parsed.technologiesRaw).toBe('Java Developer');
      expect(parsed.technologies).not.toContain('4 years');
      expect(parsed.technologies).not.toContain('experience');

      const locked = applyEvidenceLock(
        {
          candidateName: 'Test Cand',
          email: 'test@example.com',
          contactNumber: null,
          linkedinUrl: null,
          highestQualification: null,
          totalExperience: '4 years',
          relevantExperience: null,
          skillsRaw: 'Java',
          technologiesRaw: 'Java Developer with 4 years of experience',
          currentEmployer: null,
          sourceFile: 'test.pdf',
          parser: 'metaforge',
          role: 'Java Developer with 4 years of experience',
        },
        resume,
      );
      expect(locked.technologies).toBe('Java Developer');
      expect(locked.technologiesRaw).toBe('Java Developer');
    });

    // Test F — No Reliable Evidence
    test('Test F — No Reliable Evidence', () => {
      const resume = `
John Nothing
john@nothing.com

Summary
Hard working individual seeking opportunities.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toEqual([]);
      expect(parsed.skillsRaw).toBeNull();
      expect(parsed.technologies ?? '').toBe('');
      expect(parsed.technologiesRaw ?? '').toBe('');
    });

    // Fallback Section 3 Example: Data Preprocessing & Model Evaluation
    test('Fallback ML Example: Performed data preprocessing and model evaluation using Python and Scikit-learn.', () => {
      const resume = `
Taylor Data
taylor@example.com

Work Experience
Data Scientist
- Performed data preprocessing and model evaluation using Python and Scikit-learn.
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toContain('Python');
      expect(skills).toContain('Scikit-learn');
      expect(skills).toContain('Data Preprocessing');
      expect(skills).toContain('Model Evaluation');
    });

    // Technologies Role variations
    test('Technologies field handles designations with attached experience duration and rejects invalid duration-only strings', () => {
      const r1 = `Python Developer - 4 years`;
      expect(parseCoreFieldsFromResumeText(r1).technologies).toBe('Python Developer');

      const r2 = `CAD Designer with experience using AutoCAD.`;
      expect(parseCoreFieldsFromResumeText(r2).technologies).toBe('CAD Designer');

      const r3 = `AI/ML Engineer`;
      expect(parseCoreFieldsFromResumeText(r3).technologies).toBe('AI/ML Engineer');

      const r4 = `Worked in CAD for 6 years`;
      expect(parseCoreFieldsFromResumeText(r4).technologies ?? '').toBe('');

      const r5 = `4 years of Python`;
      expect(parseCoreFieldsFromResumeText(r5).technologies ?? '').toBe('');

      const r6 = `Worked with Python, SQL and machine learning.`;
      expect(parseCoreFieldsFromResumeText(r6).technologies ?? '').toBe('');
    });

  describe('STRICT RESUME PARSER FIX — Required Regression Tests (Section 5, Tests A-G)', () => {
    // Test A — Provided Global Mobility resume
    test('Test A — Provided Global Mobility resume', () => {
      const resume = `
Shadiq Khan B
Global Mobility Immigration
+91 9876543210
shadiq@example.com

Summary
Global Mobility Immigration professional with 3+ years of experience expertise in UK and Germany mobility operations and cross-border compliance.

Skills
Global mobility management, Relocation and cross border compliance, visa processing for business purpose, tax documents, international payroll process, vendor management, stakeholders management, immigration risk management, process improvement

Certifications
Global Mobility Specialist (GMS)

Languages
English, Hindi, Telugu
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      const skills = extractWholeResumeSkills(resume);

      // 1. Skills contain complete professional skill phrases
      expect(skills).toEqual([
        'Global Mobility Management',
        'Relocation and Cross-Border Compliance',
        'Visa Processing',
        'Tax Documentation',
        'International Payroll Processing',
        'Vendor Management',
        'Stakeholder Management',
        'Immigration Risk Management',
        'Process Improvement',
      ]);

      // 2. 'For', 'And', 'Cross', and 'Border' are not returned as separate skills
      const prohibitedTokens = ['For', 'And', 'Cross', 'Border', 'Visa', 'Processing', 'Management'];
      for (const token of prohibitedTokens) {
        expect(skills).not.toContain(token);
      }

      // 3. Certifications and language names are excluded
      expect(skills).not.toContain('Global Mobility Specialist');
      expect(skills).not.toContain('GMS');
      expect(skills).not.toContain('English');
      expect(skills).not.toContain('Hindi');
      expect(skills).not.toContain('Telugu');

      // 4. Technologies equals 'Global Mobility Immigration'
      expect(parsed.technologies).toBe('Global Mobility Immigration');
      expect(parsed.technologiesRaw).toBe('Global Mobility Immigration');
      expect(parsed.technologies).not.toBe('UK, Germany Mobility Operations');
    });

    // Test B — Software developer resume
    test('Test B — Software developer resume', () => {
      const resume = `
Jane Doe
Java Full Stack Developer
jane.doe@example.com
+1 555-123-4567

Summary
Passionate Java Full Stack Developer with 5 years of experience.

Skills
Java, Spring Boot, SQL, React

Experience
Software Engineer at TechCorp
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      const skills = extractWholeResumeSkills(resume);

      expect(skills).toEqual(['Java', 'Spring Boot', 'SQL', 'React']);
      expect(parsed.technologies).toBe('Java Full Stack Developer');
    });

    // Test C — Designation only in summary
    test('Test C — Designation only in summary', () => {
      const resume = `
Alex Smith
alex.smith@example.com
+1 555-987-6543

Summary
Data Analyst with 4 years of experience turning complex data into actionable insights.

Experience
Worked at Analytics Inc.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies).toBe('Data Analyst');
    });

    // Test D — Designation only in employment history
    test('Test D — Designation only in employment history', () => {
      const resume = `
Michael Brown
michael.brown@example.com
+1 555-000-1111

Summary
Professional with over 6 years of expertise across modern industries.

Experience
DevOps Engineer at Cloud Solutions Inc.
- Managed Kubernetes clusters and CI/CD pipelines.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies).toBe('DevOps Engineer');
    });

    // Test E — No explicit designation
    test('Test E — No explicit designation', () => {
      const resume = `
Robert White
robert.white@example.com
+1 555-222-3333

Summary
Passionate professional with hands-on background in client delivery and project execution.

Experience
Worked on various deliverables and managed timelines.
`;
      const parsed = parseCoreFieldsFromResumeText(resume);
      expect(parsed.technologies ?? '').toBe('');
    });

    // Test F — No dedicated Skills section
    test('Test F — No dedicated Skills section', () => {
      const resume = `
Sarah Green
sarah.green@example.com
+1 555-444-5555

Experience
Web Developer at Innovate LLC
- Developed full-stack web applications using Python, Django and PostgreSQL.
- Responsible for daily operations and client communications.
`;
      const skills = extractWholeResumeSkills(resume);
      expect(skills).toContain('Python');
      expect(skills).toContain('Django');
      expect(skills).toContain('PostgreSQL');

      // Never return sentences, arbitrary tokens, or duties
      expect(skills.some((s) => s.toLowerCase().includes('responsible for'))).toBe(false);
      expect(skills.some((s) => s.toLowerCase().includes('daily operations'))).toBe(false);
      expect(skills.some((s) => s.toLowerCase().includes('client communications'))).toBe(false);
      expect(skills.some((s) => s.split(' ').length > 4)).toBe(false);
    });

    // Test G — Regression protection
    test('Test G — Regression protection (unrelated fields intact)', () => {
      const resume = `
Name: Shadiq Khan B
Global Mobility Immigration
+91 9876543210
shadiq.khan@gmail.com
https://linkedin.com/in/shadiqkhan

Summary
Global Mobility Immigration professional with 3+ years of experience in immigration compliance.

Education
Master of Business Administration (MBA) in Human Resources
B.Com in Commerce

Skills
Global mobility management, Relocation and cross border compliance

Certifications
Global Mobility Specialist (GMS)

Languages
English, Hindi, Telugu
`;
      const parsed = parseCoreFieldsFromResumeText(resume);

      // Verify candidate name and contact details
      expect(parsed.candidateName).toBe('Shadiq Khan B');
      expect(parsed.email).toBe('shadiq.khan@gmail.com');
      expect(parsed.contactNumber).toBe('+919876543210');
      expect(parsed.linkedinUrl).toBe('https://www.linkedin.com/in/shadiqkhan');

      // Verify work experience and years-of-experience calculations
      expect(parsed.totalExperienceText).toBe('3+ years');
      expect(parsed.totalExperienceYears).toBe(3);

      // Verify education
      expect(parsed.highestQualification).toBe('Master of Business Administration (MBA) in Human Resources');

      // Verify API response structure
      expect(parsed).toHaveProperty('candidateName');
      expect(parsed).toHaveProperty('email');
      expect(parsed).toHaveProperty('contactNumber');
      expect(parsed).toHaveProperty('linkedinUrl');
      expect(parsed).toHaveProperty('highestQualification');
      expect(parsed).toHaveProperty('skillsRaw');
      expect(parsed).toHaveProperty('technologiesRaw');
      expect(parsed).toHaveProperty('technologies');
      expect(parsed).toHaveProperty('totalExperienceYears');
      expect(parsed).toHaveProperty('totalExperienceText');

      // Verify evidence lock preserving all fields
      const candidate: ParsedCandidateResume = {
        candidateName: parsed.candidateName,
        email: parsed.email,
        contactNumber: parsed.contactNumber,
        linkedinUrl: parsed.linkedinUrl,
        highestQualification: parsed.highestQualification,
        skillsRaw: parsed.skillsRaw,
        technologiesRaw: parsed.technologiesRaw,
        technologies: parsed.technologies,
        totalExperience: parsed.totalExperienceText || '',
        relevantExperience: null,
        currentEmployer: null,
        sourceFile: 'shadiq_resume.pdf',
        parser: 'metaforge',
        role: parsed.technologies,
      };

      const locked = applyEvidenceLock(candidate, resume);
      expect(locked.candidateName).toBe('Shadiq Khan B');
      expect(locked.email).toBe('shadiq.khan@gmail.com');
      expect(locked.contactNumber).toBe('+919876543210');
      expect(locked.totalExperience).toBe('3+ years');
      expect(locked.highestQualification).toBe('Master of Business Administration (MBA) in Human Resources');
      expect(locked.technologies).toBe('Global Mobility Immigration');
      expect(locked.skillsRaw).toBe('Global Mobility Management, Relocation and Cross-Border Compliance');
    });
  });
  });
});


