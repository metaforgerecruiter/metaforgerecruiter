import { test, expect } from '@playwright/test';

test.describe('API & Backend Microservices Health Suite', () => {

  test('09.1: Backend core health endpoint is healthy', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.application).toBe('metaforge-recruiter-v2');
    expect(body.database).toBe('mongodb');
  });

  test('09.2: Backend database health check confirms MongoDB connection', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health/db');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.mongodb).toBe('connected');
    expect(body.database).toBe('metaforge_recruiter_v2');
  });

  test('09.3: AI Gateway service health endpoint responds with operational status', async ({ request }) => {
    const response = await request.get('http://localhost:3002/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('metaforge-ai-v2');
  });

  test('09.4: Frontend Next.js service serves root index document', async ({ request }) => {
    const response = await request.get('http://localhost:3000');
    expect(response.status()).toBe(200);

    const text = await response.text();
    expect(text).toContain('<!DOCTYPE html>');
  });

  test('09.5: Backend auth rejects unauthenticated request with 401 Unauthorized', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/v1/auth/login', {
      data: {
        email: 'invalid.user@nonexistent.domain',
        password: 'InvalidPassword123!',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.statusCode).toBe(401);
  });

  test('09.6: AI Gateway root status or ping check is reachable', async ({ request }) => {
    const response = await request.get('http://localhost:3002/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('mode');
  });

});
