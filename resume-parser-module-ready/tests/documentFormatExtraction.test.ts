/// <reference types="jest" />

import {
  extractPlainTextFromResumeBuffer,
  parseResumeBuffer,
  extractCurrentLocation,
  InMemoryCandidateStore,
} from '../src';

describe('Document Format Extraction & Location Preservation', () => {
  describe('1. Location Extraction Rules', () => {
    it('extracts location from labeled Current Location field', () => {
      const text = [
        'Harish Sharma',
        'Email: harish@gmail.com',
        'Current Location: Bangalore, Karnataka',
        'Total Experience: 6 years',
      ].join('\n');

      const loc = extractCurrentLocation(text);
      expect(loc).toBe('Bangalore, Karnataka');
    });

    it('extracts location from labeled Location field', () => {
      const text = [
        'Divya Nair',
        'Email: divya@gmail.com',
        'Location: Hyderabad, Telangana',
      ].join('\n');

      const loc = extractCurrentLocation(text);
      expect(loc).toBe('Hyderabad, Telangana');
    });

    it('extracts location from Based in phrasing', () => {
      const text = [
        'Rohan Varma',
        'Email: rohan@gmail.com',
        'Based in: Pune, Maharashtra',
      ].join('\n');

      const loc = extractCurrentLocation(text);
      expect(loc).toBe('Pune, Maharashtra');
    });

    it('returns null when no location is mentioned', () => {
      const text = [
        'Amit Patel',
        'Email: amit@gmail.com',
        'Skills: Python, Django',
      ].join('\n');

      const loc = extractCurrentLocation(text);
      expect(loc).toBeNull();
    });
  });

  describe('2. Text Document Pipeline with Location & Evidence Lock', () => {
    it('extracts text and parses all fields including location from a text buffer', async () => {
      const resumeText = [
        'Kunal Deshmukh',
        'kunal.deshmukh@gmail.com',
        '+91 9876543210',
        'Current Location: Pune, Maharashtra',
        'https://linkedin.com/in/kunaldeshmukh',
        '',
        'Professional Summary',
        'Senior Cloud Engineer with 7 years of experience in enterprise systems.',
        '',
        'Technical Skills',
        'AWS, Terraform, Kubernetes, Docker, Python, Bash, CI/CD, Ansible, Prometheus, Grafana, Linux',
        '',
        'Education',
        'B.E. in Information Technology from Pune University (2014 - 2018)',
      ].join('\n');

      const buffer = Buffer.from(resumeText, 'utf-8');
      const textResult = await extractPlainTextFromResumeBuffer(buffer, 'kunal.txt');
      expect(textResult.text).toContain('Kunal Deshmukh');

      const parsed = await parseResumeBuffer(buffer, 'kunal.txt');
      expect(parsed.candidateName).toBe('Kunal Deshmukh');
      expect(parsed.email).toBe('kunal.deshmukh@gmail.com');
      expect(parsed.contactNumber).toBe('+919876543210');
      expect(parsed.currentLocation).toBe('Pune, Maharashtra');
      expect(parsed.location).toBe('Pune, Maharashtra');
      expect(parsed.technologiesRaw).toBe('Senior Cloud Engineer');
      expect(parsed.totalExperience).toMatch(/7\s*years/i);
      expect(parsed.highestQualification).toMatch(/B\.?\s*E/i);

      // Verify strict 10-skill cap
      const skillsArray = parsed.skillsRaw ? parsed.skillsRaw.split(',').map((s) => s.trim()) : [];
      expect(skillsArray.length).toBeLessThanOrEqual(10);
      expect(skillsArray).toContain('AWS');
      expect(skillsArray).toContain('Terraform');
      expect(skillsArray).toContain('Kubernetes');
    });
  });

  describe('3. Error Handling and Corrupt Buffer Resilience', () => {
    it('returns informative error when buffer is corrupt or unreadable', async () => {
      const corruptBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const res = await extractPlainTextFromResumeBuffer(corruptBuffer, 'corrupt.pdf');
      expect(res).toHaveProperty('text');
    });
  });

  describe('4. Candidate Store Adapter (Persistence)', () => {
    it('persists and retrieves candidates using InMemoryCandidateStore', async () => {
      const store = new InMemoryCandidateStore();
      const mockCandidate = {
        candidateName: 'Test Candidate',
        email: 'test@gmail.com',
        contactNumber: '+919999999999',
        linkedinUrl: null,
        highestQualification: 'B.Tech',
        skillsRaw: 'JavaScript, TypeScript',
        technologiesRaw: 'Full Stack Engineer',
        totalExperience: '5 years',
        relevantExperience: null,
        currentEmployer: 'Acme Corp',
        currentLocation: 'Bangalore',
        sourceFile: 'test.pdf',
        parser: 'legacy' as const,
      };

      const { id } = await store.saveCandidate(mockCandidate);
      expect(id).toBeDefined();

      const retrieved = await store.getCandidateById(id);
      expect(retrieved?.candidateName).toBe('Test Candidate');
      expect(retrieved?.currentLocation).toBe('Bangalore');

      const list = await store.listCandidates();
      expect(list.length).toBe(1);

      const deleted = await store.deleteCandidate(id);
      expect(deleted).toBe(true);

      const afterDelete = await store.getCandidateById(id);
      expect(afterDelete).toBeNull();
    });
  });
});
