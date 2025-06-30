// Simple development server to run Vercel serverless functions locally
import { createServer } from 'http';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the serverless function
const { default: taggerProxy } = await import('./api/tagger-proxy.js');

const server = createServer(async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route to tagger proxy
  if (req.url === '/api/tagger-proxy' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Parse the JSON body
        const parsedBody = JSON.parse(body);
        
        // Create Vercel-like request/response objects
        const mockReq = {
          method: req.method,
          headers: req.headers,
          body: parsedBody,
          url: req.url
        };
        
        const mockRes = {
          setHeader: (name, value) => res.setHeader(name, value),
          status: (code) => ({
            json: (data) => {
              res.writeHead(code, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
            },
            end: () => {
              res.writeHead(code);
              res.end();
            }
          })
        };
        
        // Call the serverless function
        await taggerProxy(mockReq, mockRes);
        
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Server error', 
          message: error.message 
        }));
      }
    });
    
  } else {
    // Handle other routes or return 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Local Vercel dev server running on http://localhost:${PORT}`);
  console.log(`📝 Tagger proxy available at: http://localhost:${PORT}/api/tagger-proxy`);
  console.log(`💾 R2 caching enabled with environment variables`);
  console.log('');
  console.log('🔧 To test:');
  console.log('1. Start this server: node dev-server.js');
  console.log('2. Start Vite dev server: npm run dev');
  console.log('3. Load a deck in the frontend');
});