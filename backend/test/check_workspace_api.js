const API_BASE = 'http://localhost:3001/api/v1';

async function checkWorkspace() {
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-metaforge-return-tokens': '1' },
    body: JSON.stringify({ email: 'r.haines@talentflow.io', password: 'Admin@2026', role: 'superadmin' }),
  });
  const json = await loginRes.json();
  const token = json.accessToken || json.access_token || json.token;
  console.log('Logged in. Token obtained.');

  const res = await fetch(`${API_BASE}/workspace`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ws = await res.json();
  console.log('Total requirements in workspace:', ws.requirements?.length);
  console.log('Top 25 requirements:');
  ws.requirements?.slice(0, 25).forEach((r, i) => {
    console.log(`${i+1}. [${r.id}] Title: "${r.title}" | Client: "${r.client}" | Date: ${r.createdAt}`);
  });
}

checkWorkspace().catch(console.error);
