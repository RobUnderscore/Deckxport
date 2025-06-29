# Moxfield API Access Solution

## Problem
The main Moxfield API (api.moxfield.com) is protected by Cloudflare and blocks browser requests:
1. **CORS**: No Access-Control-Allow-Origin headers
2. **Cloudflare Protection**: Returns 403 Forbidden
3. **Bot Detection**: Blocks automated requests

## Solution Found!
We discovered that `api2.moxfield.com` with v3 endpoints works through a CORS proxy:
- **API Endpoint**: `https://api2.moxfield.com/v3/decks/all/{deckId}`
- **CORS Proxy**: `https://corsproxy.io/?url=`
- **Working URL**: `https://corsproxy.io/?url=https://api2.moxfield.com/v3/decks/all/{deckId}`

1. **Development**: All requests to `/api/moxfield/*` are proxied to `https://api.moxfield.com/*`
2. **Production**: Would need a backend server or serverless functions to handle API requests

## Configuration
See `vite.config.ts` for the proxy setup:
- `/api/moxfield` → `https://api.moxfield.com`
- `/api/scryfall` → `https://api.scryfall.com`

## Usage
The services automatically use the proxy URLs in development:
```typescript
const MOXFIELD_API_BASE = import.meta.env.DEV 
  ? '/api/moxfield' 
  : 'https://api.moxfield.com';
```

## Important
- Restart the dev server after making proxy changes
- This only works in development
- For production, you'll need:
  - A backend API that makes the requests
  - Serverless functions (Vercel, Netlify, etc.)
  - Or a CORS proxy service