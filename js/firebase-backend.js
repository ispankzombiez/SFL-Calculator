/**
 * Firebase Backend API Client
 * 
 * Calls Cloudflare Worker backend instead of using Firebase SDK directly.
 * This keeps Firebase credentials secure on the server side.
 * 
 * Your Cloudflare Worker URL: https://sfl-proxy.caleb-bren1.workers.dev
 */

const WORKER_URL = 'https://sfl-proxy.caleb-bren1.workers.dev'

let currentUser = null
let idToken = null

/**
 * Initialize - Load stored session
 */
export function initialize() {
    const stored = localStorage.getItem('sfl_firebase_session')
    if (stored) {
        try {
            const session = JSON.parse(stored)
            currentUser = session.user
            idToken = session.idToken
            return true
        } catch (error) {
            console.warn('Failed to restore session:', error)
            localStorage.removeItem('sfl_firebase_session')
        }
    }
    return false
}

/**
 * Initialize Firebase (compatibility function for firebase-auth.js API)
 */
export async function initializeFirebase() {
    console.log('[Firebase Backend] Using Cloudflare Worker backend');
    console.log('[Firebase Backend] Worker URL:', WORKER_URL);
    
    // No SDK to initialize - we use REST API through worker
    // Just check if we have a stored session
    const hasSession = initialize();
    
    if (hasSession) {
        console.log('[Firebase Backend] Restored session from localStorage');
    } else {
        console.log('[Firebase Backend] No stored session found');
    }
    
    return true; // Always return true since no SDK initialization needed
}

/**
 * Save session to localStorage
 */
function saveSession(user, token) {
    currentUser = user
    idToken = token
    localStorage.setItem('sfl_firebase_session', JSON.stringify({
        user,
        idToken: token,
        timestamp: Date.now()
    }))
}

/**
 * Clear session
 */
function clearSession() {
    currentUser = null
    idToken = null
    localStorage.removeItem('sfl_firebase_session')
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
    try {
        const response = await fetch(`${WORKER_URL}/firebase/auth/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        
        const data = await response.json()
        
        if (data.error) {
            throw new Error(data.error)
        }
        
        saveSession(data.user, data.user.idToken)
        
        // Dispatch auth state changed event
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: data.user } 
        }))
        
        return data.user
        
    } catch (error) {
        console.error('Sign in error:', error)
        throw new Error(mapFirebaseError(error.message))
    }
}

/**
 * Create new account with email and password
 */
export async function createAccount(email, password) {
    try {
        const response = await fetch(`${WORKER_URL}/firebase/auth/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        
        const data = await response.json()
        
        if (data.error) {
            throw new Error(data.error)
        }
        
        saveSession(data.user, data.user.idToken)
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: data.user } 
        }))
        
        return data.user
        
    } catch (error) {
        console.error('Account creation error:', error)
        throw new Error(mapFirebaseError(error.message))
    }
}

/**
 * Sign in with Google (HYBRID: Uses Firebase SDK client-side for better UX)
 * 
 * This uses Firebase SDK directly for Google auth popup (better UX).
 * Only the public web API key is exposed, which is acceptable per Firebase docs.
 * Firestore operations still go through our secure worker backend.
 */
export async function signInWithGoogle() {
    try {
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded. Google Sign-In requires Firebase SDK.')
        }
        
        // Initialize Firebase if not already done
        if (!firebase.apps.length) {
            // Use minimal public config (just what's needed for Google Auth)
            firebase.initializeApp({
                apiKey: "AIzaSyAv5mzdWcWJUwfZIwApkyWR9Vn2rGTwnyM",
                authDomain: "sfl-calculator.firebaseapp.com",
                projectId: "sfl-calculator"
            })
        }
        
        const auth = firebase.auth()
        const provider = new firebase.auth.GoogleAuthProvider()
        
        console.log('[Firebase Backend] Starting Google sign-in popup...')
        const result = await auth.signInWithPopup(provider)
        
        console.log('[Firebase Backend] Google sign-in successful:', result.user.email)
        
        // Get the ID token
        const idToken = await result.user.getIdToken()
        
        // Create user object
        const user = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            idToken: idToken
        }
        
        // Save session
        saveSession(user, idToken)
        
        // Dispatch auth state changed event
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user } 
        }))
        
        console.log('[Firebase Backend] Session saved, user signed in')
        
        return user
        
    } catch (error) {
        console.error('[Firebase Backend] Google sign-in error:', error)
        
        // User-friendly error messages
        let userMessage = 'Google sign-in failed. Please try again.'
        if (error.code === 'auth/popup-closed-by-user') {
            userMessage = 'Sign-in cancelled.'
        } else if (error.code === 'auth/popup-blocked') {
            userMessage = 'Pop-up blocked by browser. Please allow pop-ups for this site.'
        } else if (error.code === 'auth/network-request-failed') {
            userMessage = 'Network error. Please check your connection.'
        }
        
        throw new Error(userMessage)
    }
}

/**
 * Sign in anonymously
 */
export async function signInAnonymously() {
    try {
        const response = await fetch(`${WORKER_URL}/firebase/auth/anonymous`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        
        const data = await response.json()
        
        if (data.error) {
            throw new Error(data.error)
        }
        
        saveSession(data.user, data.user.idToken)
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: data.user } 
        }))
        
        return data.user
        
    } catch (error) {
        console.error('Anonymous sign in error:', error)
        throw new Error('Anonymous sign-in failed. Please try again.')
    }
}

/**
 * Sign out
 */
/**
 * Sign out
 */
export async function signOut() {
    try {
        clearSession()
        
        // If Firebase SDK is loaded (Google Sign-In), sign out from there too
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            const auth = firebase.auth()
            if (auth.currentUser) {
                await auth.signOut()
                console.log('[Firebase Backend] Signed out from Firebase SDK')
            }
        }
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: null } 
        }))
        
        return true
    } catch (error) {
        console.error('Sign out error:', error)
        return false
    }
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser
}

/**
 * Check if user is signed in
 */
export function isSignedIn() {
    return currentUser !== null && idToken !== null
}

/**
 * Save user data to Firestore via worker
 */
export async function saveUserData(data) {
    if (!currentUser || !idToken) {
        throw new Error('No user signed in')
    }

    try {
        const response = await fetch(`${WORKER_URL}/firebase/user/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.uid,
                data: {
                    ...data,
                    lastUpdated: new Date().toISOString()
                },
                idToken
            })
        })
        
        const result = await response.json()
        
        if (result.error) {
            throw new Error(result.error)
        }
        
        return true
        
    } catch (error) {
        console.error('Error saving user data:', error)
        throw new Error('Failed to save data to cloud. Using local storage only.')
    }
}

/**
 * Load user data from Firestore via worker
 */
export async function loadUserData() {
    if (!currentUser || !idToken) {
        throw new Error('No user signed in')
    }

    try {
        const response = await fetch(`${WORKER_URL}/firebase/user/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.uid,
                idToken
            })
        })
        
        const result = await response.json()
        
        if (result.error) {
            throw new Error(result.error)
        }
        
        return result.data
        
    } catch (error) {
        console.error('Error loading user data:', error)
        throw new Error('Failed to load data from cloud.')
    }
}

/**
 * Save farm credentials
 */
export async function saveFarmCredentials(farmId, apiKey) {
    return await saveUserData({
        farmId,
        apiKey,
    })
}

/**
 * Load farm credentials
 */
export async function loadFarmCredentials() {
    const data = await loadUserData()
    if (data) {
        return {
            farmId: data.farmId,
            apiKey: data.apiKey,
        }
    }
    return null
}

/**
 * Save calculator results
 */
export async function saveCalculatorResults(calculatorType, results) {
    if (!currentUser) return

    try {
        // Save to a subcollection-like structure
        const data = await loadUserData() || {}
        if (!data.results) data.results = {}
        
        data.results[calculatorType] = {
            data: results,
            timestamp: new Date().toISOString()
        }
        
        await saveUserData(data)
        
    } catch (error) {
        console.error('Error saving calculator results:', error)
    }
}

/**
 * Load calculator results
 */
export async function loadCalculatorResults(calculatorType) {
    if (!currentUser) return null

    try {
        const data = await loadUserData()
        if (data && data.results && data.results[calculatorType]) {
            return data.results[calculatorType].data
        }
        return null
    } catch (error) {
        console.error('Error loading calculator results:', error)
        return null
    }
}

/**
 * Save raw API data (localStorage + worker)
 */
export async function saveRawAPIData(prices, farmData) {
    // Always save to localStorage as backup
    try {
        localStorage.setItem('sfl_raw_api_data', JSON.stringify({
            prices,
            farmData,
            timestamp: new Date().toISOString(),
        }))
        console.log('Raw API data saved to localStorage')
    } catch (error) {
        console.warn('Failed to save raw API data to localStorage:', error)
    }
    
    // Save to worker/Firestore if signed in
    if (!currentUser || !idToken) {
        console.log('⚠️ Cannot save to cloud: User not signed in')
        return
    }

    try {
        const userData = await loadUserData() || {}
        userData.apiData = {
            pricesJSON: JSON.stringify(prices),
            farmDataJSON: JSON.stringify(farmData),
            timestamp: new Date().toISOString()
        }
        
        await saveUserData(userData)
        console.log('✅ Raw API data saved to cloud')
        
    } catch (error) {
        console.error('❌ Failed to save raw API data to cloud:', error)
    }
}

/**
 * Load raw API data (localStorage + worker)
 */
export async function loadRawAPIData() {
    // Try cloud first if signed in
    if (currentUser && idToken) {
        try {
            const data = await loadUserData()
            if (data && data.apiData) {
                return {
                    prices: JSON.parse(data.apiData.pricesJSON),
                    farmData: JSON.parse(data.apiData.farmDataJSON),
                    timestamp: data.apiData.timestamp
                }
            }
        } catch (error) {
            console.warn('Could not load from cloud, trying localStorage:', error.message)
        }
    }
    
    // Fallback to localStorage
    try {
        const stored = localStorage.getItem('sfl_raw_api_data')
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        console.error('Error loading raw API data from localStorage:', error)
    }
    
    return null
}

/**
 * Map Firebase error codes to user-friendly messages
 */
function mapFirebaseError(errorMessage) {
    const errorMap = {
        'INVALID_PASSWORD': 'Incorrect password.',
        'EMAIL_NOT_FOUND': 'No account found with this email.',
        'USER_DISABLED': 'This account has been disabled.',
        'EMAIL_EXISTS': 'An account with this email already exists.',
        'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many failed attempts. Please try again later.',
        'INVALID_EMAIL': 'Invalid email address.',
        'WEAK_PASSWORD': 'Password is too weak. Use at least 6 characters.'
    }
    
    for (const [key, message] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
            return message
        }
    }
    
    return errorMessage
}

/**
 * Check if session is expired (tokens expire after 1 hour)
 */
export function isSessionExpired() {
    const stored = localStorage.getItem('sfl_firebase_session')
    if (!stored) return true
    
    try {
        const session = JSON.parse(stored)
        const age = Date.now() - session.timestamp
        const oneHour = 60 * 60 * 1000
        return age > oneHour
    } catch {
        return true
    }
}

/**
 * Refresh session if needed
 */
export async function refreshSessionIfNeeded() {
    if (isSessionExpired() && isSignedIn()) {
        console.log('Session expired, clearing...')
        await signOut()
        throw new Error('Session expired. Please sign in again.')
    }
}

// Initialize on module load
initialize()
