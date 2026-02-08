# Cloudflare Worker Setup - SFL API CORS Proxy

## Why We Need This

Browser CORS policies block custom headers (like `x-api-key`) when using public CORS proxies. A Cloudflare Worker acts as your own proxy that properly forwards authentication headers.

## Setup Steps (5 minutes)

### 1. Create Cloudflare Account
- Go to https://workers.cloudflare.com/
- Sign up for free (no credit card required)
- Free tier: 100,000 requests/day

### 2. Create New Worker
- Click "Create a Service"
- Name it: `sfl-api-proxy` (or any name you prefer)
- Select "HTTP Handler" template
- Click "Create Service"

### 3. Edit Worker Code
- Click "Quick Edit" button
- Delete all existing code
- Copy and paste the code from `sfl-proxy.js`
- Click "Save and Deploy"

### 4. Test Your Worker
Your worker URL will be: `https://sfl-api-proxy.YOUR-SUBDOMAIN.workers.dev`

Test it in browser:
```
https://sfl-api-proxy.YOUR-SUBDOMAIN.workers.dev?url=https://sfl.world/api/v1/prices
```

You should see the price data JSON.

### 5. Update SFL Calculator
Edit `js/api.js` and replace the CORS_PROXIES array with your worker URL:

```javascript
// Use your Cloudflare Worker as the CORS proxy
const CORS_PROXY = 'https://sfl-api-proxy.YOUR-SUBDOMAIN.workers.dev?url=';
```

## Usage

The worker accepts requests like:
```
https://your-worker.workers.dev?url=TARGET_API_URL
```

And forwards these headers:
- `x-api-key` (for authentication)
- `Content-Type`

## Cost

- **Free tier**: 100,000 requests/day
- Your calculator usage: ~10-50 requests/day
- Well within free limits!

## Security Note

This worker allows ANY origin to use it. For production, you can restrict it:

```javascript
'Access-Control-Allow-Origin': 'https://ispankzombiez.github.io'
```

## Troubleshooting

**Worker not deploying?**
- Make sure you're logged in
- Check the worker name is valid (lowercase, hyphens only)

**Still getting CORS errors?**
- Verify your worker URL is correct in api.js
- Check browser console for the exact worker URL being called
- Make sure worker is deployed (not just saved)

**API key not working?**
- Worker forwards the x-api-key header correctly
- Check your API key is valid in the SFL Calculator form
- Test with a simple curl: `curl -H "x-api-key: YOUR_KEY" https://your-worker.workers.dev?url=https://api.sunflower-land.com/community/farms/FARM_ID`
