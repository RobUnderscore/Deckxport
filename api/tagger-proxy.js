// Vercel Serverless Function - api/tagger-proxy.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use environment variables if available, otherwise fall back to defaults
  const csrfToken = process.env.TAGGER_CSRF_TOKEN || 'cepmUnygTvN63NBHK4KTAPzhPXY0cYdKF0zwnEr6fiTZfqiQGrQNAuvvOz5bQhfi1awVuMT3KRR2sRUeUxJhCw';
  const sessionCookie = process.env.TAGGER_SESSION_COOKIE || '_ga=GA1.2.358669891.1665763652; _ga_3P82LCZY01=GS1.1.1678978267.11.0.1678978270.0.0.0; _scryfall_tagger_session=J92dHYSC0KCeQfyDPKUZSB0fTvAEGcFaX3HkdkQtu3baDx3PJvO0ME7zEvVOZRihxSDLy8wSkvORcYiXqkbZMPdS3Lr7ZlJCgqnBk5hclE5205bMOSVSMvDZcpzOjXyw2QSieAE92m9wIUF3WYP7Dx9B6TVQB%2BlPLDh0GmLHrOu3vR7bFnqNwfxzNP4KJDhhZM5NYAEkYhYODhoOCDpo4uXvoKJdazVIHvZepWY%2FUKsF%2FDaEMXLZSWeIAM20E0jXzpH0m%2FUeYm9ZjbGTldIFUFIAsWMdwCzmIP4uOFKfIjI%3D--8P6bhrh4Ogk8VTYT--yP%2FrcXS9RJiSPYbvNMwfXA%3D%3D';

  try {
    const response = await fetch('https://tagger.scryfall.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Origin': 'https://tagger.scryfall.com',
        'Referer': 'https://tagger.scryfall.com/',
        'Cookie': sessionCookie,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Tagger proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}