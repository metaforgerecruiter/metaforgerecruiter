/// <reference types="jest" />

import express from 'express';
import http from 'http';
import { resumeParserRouter } from '../src/routes/resumeParserRouter';

describe('Resume Parser HTTP API Endpoints', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  beforeAll((done) => {
    app = express();
    app.use(express.json());
    app.use('/api/resume', resumeParserRouter);

    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
        done();
      }
    });
  });

  afterAll((done) => {
    (server as any)?.closeAllConnections?.();
    server.close(done);
  });

  describe('GET /api/resume/health', () => {
    it('returns service status and AI parser status', async () => {
      const res = await fetch(`${baseUrl}/api/resume/health`);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.status).toBe('ok');
      expect(body.service).toBe('resume-parser-module');
      expect(body).toHaveProperty('aiParserAvailable');
      expect(body).toHaveProperty('mode');
    });
  });

  describe('POST /api/resume/parse', () => {
    it('returns 400 if no resume file is attached', async () => {
      const res = await fetch(`${baseUrl}/api/resume/parse`, {
        method: 'POST',
      });
      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.success).toBe(false);
      expect(body.message).toMatch(/required/i);
    });

    it('parses an uploaded text resume buffer correctly', async () => {
      const resumeContent = [
        'Ananya Sharma',
        'ananya.sharma@gmail.com',
        '+91 9876543210',
        'https://linkedin.com/in/ananyasharma',
        '',
        'Professional Summary',
        'Full Stack Developer with 4 years of experience building modern web apps.',
        '',
        'Technical Skills',
        'TypeScript, React, Node.js, PostgreSQL, Docker',
        '',
        'Education',
        'B.Tech in Computer Science from NIT Trichy (2018 - 2022)',
      ].join('\n');

      const formData = new FormData();
      formData.append(
        'resume',
        new Blob([Buffer.from(resumeContent, 'utf-8')], { type: 'text/plain' }),
        'ananya_resume.txt'
      );

      const res = await fetch(`${baseUrl}/api/resume/parse`, {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();

      const { data } = body;
      expect(data.candidateName).toBe('Ananya Sharma');
      expect(data.email).toBe('ananya.sharma@gmail.com');
      expect(data.contactNumber).toBe('+919876543210');
      expect(data.skillsRaw).toContain('TypeScript');
      expect(data.skillsRaw).toContain('React');
      expect(data.skillsRaw).toContain('Docker');
      expect(data.technologiesRaw).toBe('Full Stack Developer');
      expect(data.highestQualification).toMatch(/B\.?\s*Tech/i);
      expect(data.totalExperience).toMatch(/4\s*years/i);
    });
  });

  describe('POST /api/resume/parse/bulk', () => {
    it('returns 400 if no resumes are provided in bulk endpoint', async () => {
      const res = await fetch(`${baseUrl}/api/resume/parse/bulk`, {
        method: 'POST',
      });
      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.success).toBe(false);
    });

    it('parses multiple resumes in bulk upload', async () => {
      const resumeA = [
        'Karthik Raju',
        'karthik@example.com',
        '+91 9123456780',
        '',
        'Professional Summary: DevOps Engineer with AWS experience.',
        '',
        'Skills: AWS, Terraform, Docker, Kubernetes',
      ].join('\n');

      const resumeB = [
        'Sneha Reddy',
        'sneha@example.com',
        '+91 9123456781',
        '',
        'Summary: Python Data Analyst specializing in SQL and Tableau.',
        '',
        'Key Skills: Python, SQL, Tableau, Pandas',
      ].join('\n');

      const formData = new FormData();
      formData.append(
        'resumes',
        new Blob([Buffer.from(resumeA, 'utf-8')], { type: 'text/plain' }),
        'karthik.txt'
      );
      formData.append(
        'resumes',
        new Blob([Buffer.from(resumeB, 'utf-8')], { type: 'text/plain' }),
        'sneha.txt'
      );

      const res = await fetch(`${baseUrl}/api/resume/parse/bulk`, {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.count).toBe(2);
      expect(body.results).toHaveLength(2);

      const [resA, resB] = body.results;
      expect(resA.status).toBe('done');
      expect(resA.data.candidateName).toBe('Karthik Raju');
      expect(resA.data.technologiesRaw).toBe('DevOps Engineer');

      expect(resB.status).toBe('done');
      expect(resB.data.candidateName).toBe('Sneha Reddy');
      expect(resB.data.technologiesRaw).toBe('Python Data Analyst');
    });
  });
});
