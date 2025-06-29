/**
 * Simple proxy server for Scryfall Tagger API
 * 
 * This allows browser requests to bypass CORS restrictions
 * by routing through a local server.
 * 
 * Usage: npx tsx src/scripts/taggerProxy.ts
 * Then update TAGGER_GRAPHQL_ENDPOINT to http://localhost:3001/graphql
 */

import http from 'http';
import https from 'https';

const PROXY_PORT = 3001;
const TAGGER_HOST = 'tagger.scryfall.com';

const server = http.createServer((req, res) => {
  // Enable CORS for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle GraphQL endpoint
  if (req.url !== '/graphql' || req.method !== 'POST') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    // Forward request to Tagger API
    const options = {
      hostname: TAGGER_HOST,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Origin': 'https://tagger.scryfall.com',
        'Referer': 'https://tagger.scryfall.com/',
        // Use the default credentials
        'Cookie': '_ga=GA1.2.358669891.1665763652; _ga_3P82LCZY01=GS1.1.1678978267.11.0.1678978270.0.0.0; _scryfall_tagger_session=J92dHYSC0KCeQfyDPKUZSB0fTvAEGcFaX3HkdkQtu3baDx3PJvO0ME7zEvVOZRihxSDLy8wSkvORcYiXqkbZMPdS3Lr7ZlJCgqnBk5hclE5205bMOSVSMvDZcpzOjXyw2QSieAE92m9wIUF3WYP7Dx9B6TVQB%2BlPLDh0GmLHrOu3vR7bFnqNwfxzNP4KJDhhZM5NYAEkYhYODhoOCDpo4uXvoKJdazVIHvZepWY%2FUKsF%2FDaEMXLZSWeIAM20E0jXzpH0m%2FUeYm9ZjbGTldIFUFIAsWMdwCzmIP4uOFKfIjI%3D--8P6bhrh4Ogk8VTYT--yP%2FrcXS9RJiSPYbvNMwfXA%3D%3D',
        'X-CSRF-Token': 'cepmUnygTvN63NBHK4KTAPzhPXY0cYdKF0zwnEr6fiTZfqiQGrQNAuvvOz5bQhfi1awVuMT3KRR2sRUeUxJhCw',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(500);
      res.end('Proxy error');
    });

    proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`Scryfall Tagger proxy running on http://localhost:${PROXY_PORT}`);
  console.log('Update your TAGGER_GRAPHQL_ENDPOINT to: http://localhost:3001/graphql');
  console.log('Press Ctrl+C to stop');
});