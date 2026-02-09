/**
 * Cloudflare Worker - SFL API CORS Proxy + Firebase Backend
 * 
 * This worker handles:
 * 1. CORS proxying for SFL API (existing functionality)
 * 2. Firebase Admin SDK operations (NEW - keeps credentials secure)
 * 
 * Deploy: https://workers.cloudflare.com/
 * Free tier: 100,000 requests/day
 * 
 * SETUP REQUIRED:
 * 1. Add these environment variables (Cloudflare Dashboard → Worker → Settings → Variables):
 *    - FIREBASE_PROJECT_ID
 *    - FIREBASE_CLIENT_EMAIL
 *    - FIREBASE_PRIVATE_KEY (the private key from your Firebase service account JSON)
 * 
 * 2. The client never sees these credentials - they stay server-side only!
 */

// Mock Firebase Admin SDK for Cloudflare Workers
// Note: Full Firebase Admin SDK doesn't work in workers, so we use REST API

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Handle CORS preflight for all routes
  if (request.method === 'OPTIONS') {
    return corsResponse()
  }

  try {
    // Route 1: Firebase Authentication Operations
    if (path === '/firebase/auth/google') {
      return await handleGoogleAuth(request)
    }
    
    if (path === '/firebase/auth/email') {
      return await handleEmailAuth(request)
    }
    
    if (path === '/firebase/auth/create') {
      return await handleCreateAccount(request)
    }
    
    if (path === '/firebase/auth/signout') {
      return await handleSignOut(request)
    }

    // Route 2: Firestore Operations
    if (path === '/firebase/user/save') {
      return await handleSaveUserData(request)
    }
    
    if (path === '/firebase/user/load') {
      return await handleLoadUserData(request)
    }

    // Route 3: CORS Proxy (existing functionality)
    if (path === '/proxy' || path === '/') {
      return await handleCorsProxy(request)
    }

    // Route not found
    return jsonResponse({ error: 'Route not found' }, 404)

  } catch (error) {
    console.error('Worker error:', error)
    return jsonResponse({ error: error.message }, 500)
  }
}

/**
 * CORS Proxy Handler (existing functionality)
 */
async function handleCorsProxy(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  
  if (!targetUrl) {
    return jsonResponse({
      error: 'Missing url parameter',
      usage: 'https://your-worker.workers.dev?url=TARGET_URL'
    }, 400)
  }

  try {
    const headers = new Headers()
    
    // Forward important headers
    const apiKey = request.headers.get('x-api-key')
    if (apiKey) headers.set('x-api-key', apiKey)
    
    const contentType = request.headers.get('Content-Type')
    if (contentType) headers.set('Content-Type', contentType)
    
    // Make proxied request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? request.body : undefined
    })

    // Return with CORS headers
    const modifiedResponse = new Response(response.body, response)
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization')

    return modifiedResponse

  } catch (error) {
    return jsonResponse({ error: `Proxy Error: ${error.message}` }, 500)
  }
}

/**
 * Firebase Authentication Handlers
 */

async function handleGoogleAuth(request) {
  // For Google Auth, we need to use Firebase REST API
  // The client will initiate the popup, we just verify the token
  const { idToken } = await request.json()
  
  if (!idToken) {
    return jsonResponse({ error: 'Missing idToken' }, 400)
  }

  // Verify the ID token using Firebase REST API
  const projectId = FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID'
  const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`
  
  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  })

  const data = await response.json()
  
  if (data.error) {
    return jsonResponse({ error: data.error.message }, 401)
  }

  return jsonResponse({
    user: {
      uid: data.users[0].localId,
      email: data.users[0].email,
      displayName: data.users[0].displayName
    }
  })
}

async function handleEmailAuth(request) {
  const { email, password } = await request.json()
  
  if (!email || !password) {
    return jsonResponse({ error: 'Missing email or password' }, 400)
  }

  // Use Firebase Auth REST API
  const projectId = FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID'
  const apiKey = FIREBASE_API_KEY || 'YOUR_API_KEY'
  
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
  
  const response = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  })

  const data = await response.json()
  
  if (data.error) {
    return jsonResponse({ error: data.error.message }, 401)
  }

  return jsonResponse({
    user: {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken
    }
  })
}

async function handleCreateAccount(request) {
  const { email, password } = await request.json()
  
  if (!email || !password) {
    return jsonResponse({ error: 'Missing email or password' }, 400)
  }

  const apiKey = FIREBASE_API_KEY || 'YOUR_API_KEY'
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
  
  const response = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  })

  const data = await response.json()
  
  if (data.error) {
    return jsonResponse({ error: data.error.message }, 400)
  }

  return jsonResponse({
    user: {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken
    }
  })
}

async function handleSignOut(request) {
  // Signout is client-side only (clear tokens)
  return jsonResponse({ success: true })
}

/**
 * Firestore Handlers
 */

async function handleSaveUserData(request) {
  const { userId, data, idToken } = await request.json()
  
  if (!userId || !data || !idToken) {
    return jsonResponse({ error: 'Missing userId, data, or idToken' }, 400)
  }

  // Verify the user owns this data
  const verified = await verifyIdToken(idToken)
  if (!verified || verified.uid !== userId) {
    return jsonResponse({ error: 'Unauthorized' }, 403)
  }

  // Save to Firestore using REST API
  const projectId = FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID'
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`
  
  const response = await fetch(firestoreUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fields: convertToFirestoreFields(data)
    })
  })

  const result = await response.json()
  
  if (result.error) {
    return jsonResponse({ error: result.error.message }, 500)
  }

  return jsonResponse({ success: true })
}

async function handleLoadUserData(request) {
  const { userId, idToken } = await request.json()
  
  if (!userId || !idToken) {
    return jsonResponse({ error: 'Missing userId or idToken' }, 400)
  }

  // Verify the user owns this data
  const verified = await verifyIdToken(idToken)
  if (!verified || verified.uid !== userId) {
    return jsonResponse({ error: 'Unauthorized' }, 403)
  }

  // Load from Firestore using REST API
  const projectId = FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID'
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`
  
  const response = await fetch(firestoreUrl, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })

  if (response.status === 404) {
    return jsonResponse({ data: null })
  }

  const result = await response.json()
  
  if (result.error) {
    return jsonResponse({ error: result.error.message }, 500)
  }

  return jsonResponse({
    data: convertFromFirestoreFields(result.fields)
  })
}

/**
 * Helper Functions
 */

async function verifyIdToken(idToken) {
  const apiKey = FIREBASE_API_KEY || 'YOUR_API_KEY'
  const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`
  
  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  })

  const data = await response.json()
  
  if (data.error || !data.users || data.users.length === 0) {
    return null
  }

  return {
    uid: data.users[0].localId,
    email: data.users[0].email
  }
}

function convertToFirestoreFields(data) {
  const fields = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value }
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value }
    } else if (value === null) {
      fields[key] = { nullValue: null }
    } else if (typeof value === 'object') {
      fields[key] = { stringValue: JSON.stringify(value) }
    }
  }
  return fields
}

function convertFromFirestoreFields(fields) {
  if (!fields) return null
  
  const data = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      // Try to parse JSON strings back to objects
      try {
        data[key] = JSON.parse(value.stringValue)
      } catch {
        data[key] = value.stringValue
      }
    } else if (value.doubleValue !== undefined) {
      data[key] = value.doubleValue
    } else if (value.booleanValue !== undefined) {
      data[key] = value.booleanValue
    } else if (value.nullValue !== undefined) {
      data[key] = null
    }
  }
  return data
}

function corsResponse() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  })
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    }
  })
}
