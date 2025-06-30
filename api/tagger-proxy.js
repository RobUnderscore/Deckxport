// Vercel Serverless Function - api/tagger-proxy.js
const { R2Cache } = require('./services/r2-cache.js');

// Helper function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function handler(req, res) {
  // Enable CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Accept-Language, User-Agent');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'healthy', 
      message: 'Tagger proxy with R2 caching is running',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use environment variables if available, otherwise fall back to defaults
  const csrfToken = process.env.TAGGER_CSRF_TOKEN || 'cepmUnygTvN63NBHK4KTAPzhPXY0cYdKF0zwnEr6fiTZfqiQGrQNAuvvOz5bQhfi1awVuMT3KRR2sRUeUxJhCw';
  const sessionCookie = process.env.TAGGER_SESSION_COOKIE || '_ga=GA1.2.358669891.1665763652; _ga_3P82LCZY01=GS1.1.1678978267.11.0.1678978270.0.0.0; _scryfall_tagger_session=J92dHYSC0KCeQfyDPKUZSB0fTvAEGcFaX3HkdkQtu3baDx3PJvO0ME7zEvVOZRihxSDLy8wSkvORcYiXqkbZMPdS3Lr7ZlJCgqnBk5hclE5205bMOSVSMvDZcpzOjXyw2QSieAE92m9wIUF3WYP7Dx9B6TVQB%2BlPLDh0GmLHrOu3vR7bFnqNwfxzNP4KJDhhZM5NYAEkYhYODhoOCDpo4uXvoKJdazVIHvZepWY%2FUKsF%2FDaEMXLZSWeIAM20E0jXzpH0m%2FUeYm9ZjbGTldIFUFIAsWMdwCzmIP4uOFKfIjI%3D--8P6bhrh4Ogk8VTYT--yP%2FrcXS9RJiSPYbvNMwfXA%3D%3D';

  try {

    // Initialize R2 cache
    let cache;
    try {
      cache = new R2Cache();
    } catch (error) {
      console.error('Failed to initialize R2 cache:', error);
      // Continue without caching if R2 is not available
    }

    // Extract card information from the GraphQL query
    const { query, variables } = req.body;
    let collectorNumber, setCode;

    // Try to extract from variables first (most common case)
    if (variables && variables.number && variables.set) {
      collectorNumber = variables.number;
      setCode = variables.set;
    } else if (query) {
      // Try to extract from the query string if not in variables
      const collectorMatch = query.match(/number:\s*"?(\w+)"?/);
      const setMatch = query.match(/set:\s*"?(\w+)"?/);
      
      if (collectorMatch && setMatch) {
        collectorNumber = collectorMatch[1];
        setCode = setMatch[1];
      }
    }


    // Check cache if we have the necessary information
    if (cache && collectorNumber && setCode) {
      const cachedData = await cache.get(collectorNumber, setCode);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
    }

    // Add delay to avoid spamming the API
    await delay(200);

    // Make the request to Scryfall Tagger
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

    // Cache the response if we have the necessary information
    if (cache && collectorNumber && setCode && response.status === 200) {
      await cache.set(collectorNumber, setCode, data);
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Tagger proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}