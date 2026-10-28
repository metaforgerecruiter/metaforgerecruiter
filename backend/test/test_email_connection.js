const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function getAccessToken() {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  const postData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(body);
            resolve(data.access_token);
          } else {
            reject(new Error(`Failed to get token: ${res.statusCode} ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function verifyGraphMail() {
  try {
    console.log('Testing Microsoft Graph authentication...');
    const token = await getAccessToken();
    console.log('Graph access token obtained successfully!');

    const fromEmail = process.env.GRAPH_FROM_EMAIL || 'recruitment.application@metaforgeit.com';
    console.log(`Checking mailbox access for: ${fromEmail}`);

    return new Promise((resolve, reject) => {
      const req = https.request(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromEmail)}/mailFolders/inbox`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('Mailbox access verified successfully!', JSON.parse(body).displayName || 'OK');
              resolve(true);
            } else {
              console.error(`Mailbox check returned ${res.statusCode}:`, body);
              resolve(false);
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  } catch (err) {
    console.error('Error verifying Graph mail:', err.message);
  }
}

verifyGraphMail();
