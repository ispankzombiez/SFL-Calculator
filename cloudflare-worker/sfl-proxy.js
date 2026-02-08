/**
 * Cloudflare Worker - SFL API CORS Proxy
 * Deploys at: https://your-worker.your-subdomain.workers.dev
 * 
 * This worker forwards requests to Sunflower Land API while:
 * 1. Adding proper CORS headers
 * 2. Forwarding the x-api-key header (which CORS proxies block)
 * 3. Handling preflight OPTIONS requests
 * 
 * Deploy: https://workers.cloudflare.com/
 * Free tier: 100,000 requests/day
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Get the target URL from query parameter
  const targetUrl = url.searchParams.get('url')
  
  if (!targetUrl) {
    return new Response('Missing url parameter. Usage: https://your-worker.workers.dev?url=TARGET_URL', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  try {
    // Forward the request to the target URL
    const headers = new Headers()
    
    // Copy important headers from original request
    const apiKey = request.headers.get('x-api-key')
    if (apiKey) {
      headers.set('x-api-key', apiKey)
    }
    
    const contentType = request.headers.get('Content-Type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    }
    
    // Make request to target API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? request.body : undefined
    })

    // Clone response and add CORS headers
    const modifiedResponse = new Response(response.body, response)
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key')

    return modifiedResponse

  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
