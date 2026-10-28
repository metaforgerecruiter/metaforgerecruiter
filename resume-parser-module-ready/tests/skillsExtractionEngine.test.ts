/// <reference types="jest" />

import {
  extractSkillsWithEngineSync,
  extractSkillsWithEngine,
  detectSkillSection,
  validateSkillsAgainstSection,
  expandCompoundSkillPhrases,
} from '../src/skillsExtractionEngine';
import { applyEvidenceLock } from '../src/metaforgeParser';

describe('Modular Skills Extraction Engine', () => {
  describe('1. Simple Lists and Delimiters', () => {
    test('extracts comma-separated skills list', () => {
      const resume = `
John Doe
Software Engineer

Skills
Python, Java, TypeScript, Docker, Kubernetes, PostgreSQL, Redis

Experience
Senior Developer at Acme Corp
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual([
        'Python',
        'Java',
        'TypeScript',
        'Docker',
        'Kubernetes',
        'PostgreSQL',
        'Redis',
      ]);
      expect(res.skillsRaw).toBe('Python, Java, TypeScript, Docker, Kubernetes, PostgreSQL, Redis');
      expect(res.diagnostics.method).toBe('deterministic');
      expect(res.diagnostics.sectionLayout).toBe('standard');
    });

    test('extracts semicolon-separated skills list', () => {
      const resume = `
Technical Skills
Python; Go; Rust; React; Node.js

Experience
Developer at Tech Corp
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Go', 'Rust', 'React', 'Node.js']);
      expect(res.skillsRaw).toBe('Python, Go, Rust, React, Node.js');
    });

    test('extracts standard bullet lists (•, -, *)', () => {
      const resume = `
Core Skills
• Python
- Docker
* Kubernetes
• PostgreSQL
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Docker', 'Kubernetes', 'PostgreSQL']);
    });

    test('extracts lowercase o bullet lists without splitting words containing o', () => {
      const resume = `
Technical Skills
o Python
o Docker
o MongoDB
o Oracle Database
o Node.js
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Docker', 'MongoDB', 'Oracle Database', 'Node.js']);
    });

    test('handles slash delimiter with spaces without corrupting CI/CD or PL/SQL', () => {
      const resume = `
Technical Skills
Python / Django / Docker / CI/CD / PL/SQL
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toContain('Python');
      expect(res.skills).toContain('Django');
      expect(res.skills).toContain('Docker');
      expect(res.skills).toContain('CI/CD');
      expect(res.skills).toContain('PL/SQL');
    });
  });

  describe('2. Tables (Markdown & ASCII)', () => {
    test('extracts skills from Markdown table', () => {
      const resume = `
Jane Smith
Full Stack Developer

| Skills |
| Python, TypeScript, Docker, React |

Experience
Full Stack Engineer at Global Corp
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'TypeScript', 'Docker', 'React']);
      expect(res.diagnostics.sectionLayout).toBe('table');
    });

    test('extracts skills from ASCII border table with category column', () => {
      const resume = `
+--------------------+------------------------+
| Category           | Skills                 |
+--------------------+------------------------+
| Languages          | Python, Go, TypeScript |
| Cloud              | AWS, Docker            |
+--------------------+------------------------+

Experience
Cloud Engineer at Alpha Inc
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toContain('Python');
      expect(res.skills).toContain('Go');
      expect(res.skills).toContain('TypeScript');
      expect(res.skills).toContain('AWS');
      expect(res.skills).toContain('Docker');
      expect(res.diagnostics.sectionLayout).toBe('table');
    });

    test('stops table extraction at next section boundary without leaking experience', () => {
      const resume = `
| Skills | Python, React, Docker |
| Experience | 5 years developing software at Google using Java and C++ |
| Education | BS Computer Science |
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'React', 'Docker']);
      expect(res.skills).not.toContain('Java');
      expect(res.skills).not.toContain('C++');
    });
  });

  describe('3. Two-Column Layouts', () => {
    test('extracts skills when Skills is in left column separated by gutter from Experience', () => {
      const resume = `
Skills                          Professional Experience
Python, Docker, AWS             Senior Engineer at TechCo
React, TypeScript               Built scalable backend microservices
PostgreSQL                      Managed engineering teams
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Docker', 'AWS', 'React', 'TypeScript', 'PostgreSQL']);
      expect(res.diagnostics.sectionLayout).toBe('two_column');
    });

    test('extracts skills when Skills is in right column separated by wide tab gutter', () => {
      const resume = `
Professional Experience\t\tTechnical Skills
Senior Engineer at TechCo\t\tPython, Docker, Kubernetes
Built distributed systems\t\tTerraform, AWS, Go
Education\t\t\t\tProjects
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'Go']);
      expect(res.diagnostics.sectionLayout).toBe('two_column');
    });
  });

  describe('4. Unusual Headings and Section Formats', () => {
    test.each([
      ['=== Technical Expertise ===\nPython, Docker, AWS', 'Technical Expertise'],
      ['1. Tools & Technologies:\nPython, Docker, AWS', 'Tools & Technologies'],
      ['Core Competencies\nPython, Docker, AWS', 'Core Competencies'],
      ['Software Skills\nPython, Docker, AWS', 'Software Skills'],
      ['Key Skills\nPython, Docker, AWS', 'Key Skills'],
      ['Section 2: Technical Skills\nPython, Docker, AWS', 'Technical Skills'],
    ])('correctly detects heading variant: %s', (resumeSnippet) => {
      const fullResume = `${resumeSnippet}\n\nExperience\nEngineer at Beta Corp`;
      const res = extractSkillsWithEngineSync(fullResume);
      expect(res.skills).toEqual(['Python', 'Docker', 'AWS']);
      expect(res.diagnostics.sectionDetected).toBe(true);
    });

    test('handles single-line inline heading: "Technical Skills: Python, Docker, React"', () => {
      const resume = `
Jane Doe
Technical Skills: Python, Docker, React, AWS
Work Experience
Software Engineer
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Docker', 'React', 'AWS']);
      expect(res.diagnostics.sectionLayout).toBe('inline');
    });
  });

  describe('5. Missing Skills Section — Fallback to Other Sections', () => {
    test('extracts explicit skills from work experience when resume contains NO dedicated skills section', () => {
      const resume = `
John Doe
Software Engineer

Professional Summary
Experienced full stack developer with expertise in building scalable applications.

Work Experience
Senior Software Engineer - Acme Corp (2020 - Present)
- Developed REST APIs and microservices using Python and Go.
- Deployed cloud infrastructure on AWS using Docker and Terraform.

Education
B.S. in Computer Science - University of California
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.diagnostics.sectionDetected).toBe(false);
      expect(res.diagnostics.method).toBe('fallback_sections');
      expect(res.skills).toContain('REST APIs');
      expect(res.skills).toContain('Microservices');
      expect(res.skills).toContain('Python');
      expect(res.skills).toContain('Go');
      expect(res.skills).toContain('AWS');
      expect(res.skills).toContain('Docker');
      expect(res.skills).toContain('Terraform');
      expect(res.skills.length).toBeLessThanOrEqual(10);
    });

    test('returns empty array when resume contains NO skills section and no evidenced skills in other sections', () => {
      const resume = `
John Doe
Administrative Assistant

Work Experience
Project Coordinator - Beta Corp (2021 - Present)
- Responsible for scheduling team meetings and client syncs
- Managed daily agendas and followed up on deliverables
- Worked on a project for a banking client
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual([]);
      expect(res.skillsRaw).toBeNull();
      expect(res.diagnostics.sectionDetected).toBe(false);
    });

    test('returns empty array for empty or whitespace-only resume', () => {
      const res = extractSkillsWithEngineSync('   \n\n  ');
      expect(res.skills).toEqual([]);
      expect(res.skillsRaw).toBeNull();
      expect(res.diagnostics.sectionDetected).toBe(false);
    });
  });

  describe('6. Primary Source Priority vs Fallback Rules', () => {
    test('prioritizes dedicated skills section and does not supplement from responsibilities', () => {
      const resume = `
Technical Skills
Python, Java, Docker

Work Experience
Senior Backend Engineer (2018 - Present)
Responsibilities:
- Maintained production Kubernetes clusters and Docker containers.
- Implemented data pipelines using Python, Apache Spark, and PostgreSQL.
- Architected cloud solutions using AWS and Terraform.

Projects
E-commerce Platform: Built using React, Node.js, and MongoDB.
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Java', 'Docker']);
      expect(res.skillsRaw).toBe('Python, Java, Docker');
      expect(res.skills).not.toContain('Kubernetes');
      expect(res.skills).not.toContain('React');
      expect(res.skills).not.toContain('MongoDB');
      expect(res.diagnostics.sectionDetected).toBe(true);
      expect(res.diagnostics.method).toBe('deterministic');
    });

    test('rejects responsibility sentences even if placed inside Skills section', () => {
      const resume = `
Technical Skills
- Designed and developed automated CI/CD pipelines.
- Responsible for microservice maintenance and database tuning.
- Python
- Docker
- AWS
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toEqual(['Python', 'Docker', 'AWS']);
      expect(res.skills).not.toContain('Designed and developed automated CI/CD pipelines.');
      expect(res.skills).not.toContain('Responsible for microservice maintenance and database tuning.');
      expect(res.diagnostics.validationFailuresCount).toBeGreaterThan(0);
    });
  });

  describe('7. Wrapped Lines Across Multiple Lines', () => {
    test('re-stitches wrapped lines correctly', () => {
      const resume = `
Technical Skills
Programming Languages: Python, JavaScript,
TypeScript, Go,
Rust, C++

Experience
Developer at Gamma Corp
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills).toContain('Python');
      expect(res.skills).toContain('JavaScript');
      expect(res.skills).toContain('TypeScript');
      expect(res.skills).toContain('Go');
      expect(res.skills).toContain('Rust');
      expect(res.skills).toContain('C++');
    });
  });

  describe('8. Maximum 10 Unique Skills Cap', () => {
    test('caps skills at exactly 10 unique items and deduplicates', () => {
      const resume = `
Technical Skills
Python, Java, Docker, Kubernetes, AWS, PostgreSQL, Redis, React, TypeScript, Go, C++, Rust, GraphQL, Ruby
`;
      const res = extractSkillsWithEngineSync(resume);
      expect(res.skills.length).toBe(10);
      expect(res.skills).toEqual([
        'Python',
        'Java',
        'Docker',
        'Kubernetes',
        'AWS',
        'PostgreSQL',
        'Redis',
        'React',
        'TypeScript',
        'Go',
      ]);
    });
  });

  describe('9. Compound Skill Expansion', () => {
    test('expands CAD and engineering compound phrases properly', () => {
      const expanded = expandCompoundSkillPhrases('Surface, Solid Modeling and Drafting');
      expect(expanded).toContain('Surface Modeling');
      expect(expanded).toContain('Solid Modeling');
      expect(expanded).toContain('Drafting');
    });

    test('expands Frontend & Backend Development compound phrases', () => {
      const expanded = expandCompoundSkillPhrases('Frontend & Backend Development');
      expect(expanded).toContain('Frontend Development');
      expect(expanded).toContain('Backend Development');
    });
  });

  describe('10. AI Fallback Behavior', () => {
    test('invokes AI fallback when deterministic extraction finds 0 validated skills', async () => {
      // Unusual phrasing in skills section where deterministic parser gets 0 candidates
      const resume = `
Technical Skills
Familiarized with modern containerization methodologies and cloud infrastructure orchestration.

Experience
Engineer at Delta Corp
`;
      const mockAiFallback = jest.fn().mockResolvedValue(['Docker', 'Kubernetes']);

      const res = await extractSkillsWithEngine(resume, {
        enableAiFallback: true,
        aiFallbackFn: mockAiFallback,
      });

      expect(mockAiFallback).toHaveBeenCalled();
      // AI candidates must be validated against the source section text
      // 'Docker' does not appear in section text, so validation should reject it
      expect(res.diagnostics.validationFailures).toContain('Docker');
      expect(res.skills).toEqual([]);
    });

    test('validates AI fallback tokens against source section text and accepts matches', async () => {
      const resume = `
Technical Skills
Core stack consists of Go and Rust programming.

Experience
Engineer at Delta Corp
`;
      // AI fallback provides clean tokens extracted from the text
      const mockAiFallback = jest.fn().mockResolvedValue(['Go', 'Rust', 'Python']);

      const res = await extractSkillsWithEngine(resume, {
        enableAiFallback: true,
        aiFallbackFn: mockAiFallback,
      });

      // 'Go' and 'Rust' are verified in the section text; 'Python' is not and is rejected
      expect(res.skills).toContain('Go');
      expect(res.skills).toContain('Rust');
      expect(res.skills).not.toContain('Python');
    });
  });

  describe('11. Integration with applyEvidenceLock', () => {
    test('preserves candidateName, education, and totalExperience while updating skills', () => {
      const resume = `
John Doe
john.doe@example.com
+1-555-123-4567

Summary
Full Stack Engineer with 5 years of experience.

Technical Skills
Python, Docker, AWS, React, PostgreSQL

Experience
Senior Developer at Acme Corp
Jan 2019 - Present (5 years)
`;
      const locked = applyEvidenceLock(
        {
          candidateName: 'John Doe',
          email: 'john.doe@example.com',
          contactNumber: '+1-555-123-4567',
          linkedinUrl: null,
          highestQualification: 'B.Tech',
          totalExperience: '5 years',
          relevantExperience: null,
          skillsRaw: null,
          technologiesRaw: null,
          currentEmployer: 'Acme Corp',
          sourceFile: 'test.pdf',
          parser: 'legacy',
        },
        resume,
      );

      expect(locked.candidateName).toBe('John Doe');
      expect(locked.email).toBe('john.doe@example.com');
      expect(locked.totalExperience).toBe('5 years');
      expect(locked.relevantExperience).toBeNull();
      expect(locked.skillsRaw).toBe('Python, Docker, AWS, React, PostgreSQL');
    });
  });

  describe('12. Prompt Specification Examples & Edge Cases', () => {
    describe('Primary Rule: Dedicated Skills Headings & Examples', () => {
      test('Primary Example 1: Comma-separated list under Skills', () => {
        const resume = `
Alice Wonder
alice@example.com

Skills
Python, Java, SQL, React

Experience
Senior Engineer at Tech Corp
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toEqual(['Python', 'Java', 'SQL', 'React']);
        expect(res.skillsRaw).toBe('Python, Java, SQL, React');
      });

      test('Primary Example 2: Inline heading Technical Skills: Python, Pandas, NumPy', () => {
        const resume = `
Bob Data
bob@example.com

Technical Skills: Python, Pandas, NumPy

Experience
Data Analyst at Metrics Inc
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toEqual(['Python', 'Pandas', 'NumPy']);
        expect(res.skillsRaw).toBe('Python, Pandas, NumPy');
      });

      test.each([
        'Skills',
        'Technical Skills',
        'Key Skills',
        'Core Competencies',
        'Technical Expertise',
        'Professional Skills',
        'Tools and Technologies',
        'Programming Languages',
        'Software Skills',
      ])('detects heading "%s" and extracts explicit skills', (heading) => {
        const resume = `
Candidate Name
cand@example.com

${heading}
Python, React, PostgreSQL

Experience
Software Engineer at Delta Corp
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toEqual(['Python', 'React', 'PostgreSQL']);
        expect(res.diagnostics.sectionDetected).toBe(true);
      });
    });

    describe('Section 2 Fallback Examples A, B, C, D', () => {
      test('Example A — Summary: Experienced in Python programming, machine learning, and data analysis.', () => {
        const resume = `
John Doe
john@example.com

Professional Summary
Experienced in Python programming, machine learning, and data analysis.

Work Experience
Engineer at Alpha Inc
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.diagnostics.sectionDetected).toBe(false);
        expect(res.diagnostics.method).toBe('fallback_sections');
        expect(res.skills).toContain('Python');
        expect(res.skills).toContain('Machine Learning');
        expect(res.skills).toContain('Data Analysis');
      });

      test('Example B — Responsibilities: Developed REST APIs using Python and Flask and integrated PostgreSQL.', () => {
        const resume = `
Jane Doe
jane@example.com

Work Experience
Backend Developer at Beta LLC
- Developed REST APIs using Python and Flask and integrated PostgreSQL.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.diagnostics.sectionDetected).toBe(false);
        expect(res.diagnostics.method).toBe('fallback_sections');
        expect(res.skills).toContain('Python');
        expect(res.skills).toContain('Flask');
        expect(res.skills).toContain('REST APIs');
        expect(res.skills).toContain('PostgreSQL');
      });

      test('Example C — Role description: Managed customer queries, resolved complaints, and coordinated with internal teams.', () => {
        const resume = `
Chris Green
chris@example.com

Work Experience
Customer Operations Associate at Gamma Corp
- Managed customer queries, resolved complaints, and coordinated with internal teams.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.diagnostics.sectionDetected).toBe(false);
        expect(res.diagnostics.method).toBe('fallback_sections');
        expect(res.skills).toContain('Customer Service');
        expect(res.skills).toContain('Problem Resolution');
        expect(res.skills).toContain('Team Coordination');
      });

      test('Example D — Project: Built a machine learning model using Scikit-learn and XGBoost.', () => {
        const resume = `
Dana White
dana@example.com

Projects
- Built a machine learning model using Scikit-learn and XGBoost.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.diagnostics.sectionDetected).toBe(false);
        expect(res.diagnostics.method).toBe('fallback_sections');
        expect(res.skills).toContain('Machine Learning');
        expect(res.skills).toContain('Scikit-learn');
        expect(res.skills).toContain('XGBoost');
      });
    });

    describe('Section 4: Decision Logic (Cases 1, 2, 3, 4)', () => {
      test('Case 1: Dedicated Skills section contains valid skills -> extracted first without adding unrelated responsibilities', () => {
        const resume = `
Eve Online
eve@example.com

Core Competencies
Java, Spring Boot, MySQL

Work Experience
Senior Developer
- Implemented microservices using Python, Docker, and Kubernetes.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toEqual(['Java', 'Spring Boot', 'MySQL']);
        expect(res.skills).not.toContain('Python');
        expect(res.skills).not.toContain('Docker');
        expect(res.skills).not.toContain('Kubernetes');
      });

      test('Case 2: No dedicated Skills section exists -> fallback to summary, experience, projects', () => {
        const resume = `
Frank Ocean
frank@example.com

Career Summary
Full stack developer with hands-on experience in React and Node.js.

Work Experience
Engineer at Delta Corp
- Built REST APIs and microservices.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.diagnostics.sectionDetected).toBe(false);
        expect(res.skills).toContain('React');
        expect(res.skills).toContain('Node.js');
        expect(res.skills).toContain('REST APIs');
        expect(res.skills).toContain('Microservices');
      });

      test('Case 3: Skills section exists but is empty or unreadable -> fallback to other sections', () => {
        const resume = `
Grace Hopper
grace@example.com

Technical Skills
None / N/A

Summary
Experienced in Python programming and PostgreSQL database design.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toContain('Python');
        expect(res.skills).toContain('PostgreSQL');
      });

      test('Case 4: Populated skills section preserves primary skills without indiscriminately merging every tech in experience', () => {
        const resume = `
Hank Pym
hank@example.com

Technical Skills
Python, Django, PostgreSQL

Work Experience
Lead Developer
- Conducted code reviews for team members.
- Maintained legacy PHP and C++ applications.
- Deployed AWS Lambda functions with Terraform.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toEqual(['Python', 'Django', 'PostgreSQL']);
        expect(res.skills).not.toContain('PHP');
        expect(res.skills).not.toContain('C++');
        expect(res.skills).not.toContain('Terraform');
      });
    });

    describe('Section 3 & 5: Strict No Fabrication, Normalization, & Deduplication', () => {
      test('does not extract degrees, job titles, companies, or dates as skills', () => {
        const resume = `
Ivy League
ivy@example.com

Professional Summary
Senior Software Engineer at Google with a B.Tech in Computer Science from 2018 to 2022.
Experience in Python and Docker.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toContain('Python');
        expect(res.skills).toContain('Docker');
        expect(res.skills).not.toContain('Senior Software Engineer');
        expect(res.skills).not.toContain('Google');
        expect(res.skills).not.toContain('B.Tech');
        expect(res.skills).not.toContain('Computer Science');
        expect(res.skills).not.toContain('2018');
        expect(res.skills).not.toContain('2022');
      });

      test('returns max 10 distinct skills even when more than 10 candidate skills exist', () => {
        const resume = `
Jack Ryan
jack@example.com

Technical Skills
Python, Java, Go, Rust, C++, C, TypeScript, JavaScript, Kotlin, Swift, Ruby, PHP, Scala
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills.length).toBe(10);
        expect(new Set(res.skills).size).toBe(10);
      });

      test('returns empty array and null skillsRaw when no reliable skills evidence exists', () => {
        const resume = `
Kelly Clarkson
kelly@example.com

Summary
Hardworking and passionate professional seeking a challenging role.

Experience
Operations Associate
- Organized team files and responded to correspondence.
- Attended weekly status reviews.
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toEqual([]);
        expect(res.skillsRaw).toBeNull();
      });
    });

    describe('Layout Handling: Isolated Table Columns & Two-Column Resumes', () => {
      test('table column isolation: does not leak Experience column into Skills', () => {
        const resume = `
Leo Tolstoy
leo@example.com

| Technical Skills | Professional Experience |
| Python, Docker   | Managed client deployments and resolved tickets |
| React, PostgreSQL| Designed user interfaces and maintained servers |
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toContain('Python');
        expect(res.skills).toContain('Docker');
        expect(res.skills).toContain('React');
        expect(res.skills).toContain('PostgreSQL');
        expect(res.skills).not.toContain('Managed client deployments and resolved tickets');
        expect(res.skills).not.toContain('Designed user interfaces and maintained servers');
      });

      test('two-column layout: extracts skills from left column without mixing right column', () => {
        const resume = `
Candidate Name
cand@test.com

Technical Skills        Work Experience
Python                  Senior Engineer at Corp
Docker                  Built scalable architectures
Kubernetes              Mentored junior teammates
AWS                     Maintained system availability
`;
        const res = extractSkillsWithEngineSync(resume);
        expect(res.skills).toContain('Python');
        expect(res.skills).toContain('Docker');
        expect(res.skills).toContain('Kubernetes');
        expect(res.skills).toContain('AWS');
        expect(res.skills).not.toContain('Senior Engineer at Corp');
        expect(res.skills).not.toContain('Built scalable architectures');
      });
    });
  });
});

