/**
 * Firebase Authentication Module
 * Handles user authentication and data synchronization with Firestore
 */

// Firebase Configuration (inlined to avoid ES6 module conflicts with compat SDK)
const firebaseConfig = {
    apiKey: "AIzaSyAv5mzdWcWJUwfZIwApkyWR9Vn2rGTwnyM",
    authDomain: "sfl-calculator.firebaseapp.com",
    databaseURL: "https://sfl-calculator-default-rtdb.firebaseio.com",
    projectId: "sfl-calculator",
    storageBucket: "sfl-calculator.firebasestorage.app",
    messagingSenderId: "279520711470",
    appId: "1:279520711470:web:998b6d743a4f3a7e76e0bf",
    measurementId: "G-WR0Q9QQ474"
};

// Firebase will be loaded from CDN in index.html
let auth = null;
let db = null;
let currentUser = null;
let isInitialized = false;

/**
 * Wait for Firebase SDK to load from CDN
 */
async function waitForFirebase(maxAttempts = 20, delayMs = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        if (typeof firebase !== 'undefined') {
            console.log('Firebase SDK loaded successfully');
            return true;
        }
        console.log(`Waiting for Firebase SDK... attempt ${i + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    console.error('Firebase SDK failed to load after maximum attempts');
    return false;
}

/**
 * Initialize Firebase
 */
export async function initializeFirebase() {
    // Already initialized
    if (isInitialized) {
        console.log('Firebase already initialized');
        return true;
    }

    try {
        // Wait for Firebase SDK to load
        const sdkLoaded = await waitForFirebase();
        if (!sdkLoaded) {
            console.error('Firebase SDK not available');
            return false;
        }

        // Initialize Firebase app
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase app initialized');
        }

        // Initialize services
        auth = firebase.auth();
        db = firebase.firestore();

        // Set up auth state listener
        auth.onAuthStateChanged(handleAuthStateChanged);

        isInitialized = true;
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // Show user-friendly error
        showAuthError('Failed to initialize authentication system. Please refresh the page.');
        return false;
    }
}

/**
 * Handle auth state changes
 */
function handleAuthStateChanged(user) {
    currentUser = user;
    
    if (user) {
        console.log('User signed in:', user.email || user.uid);
        // Trigger UI update
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
    } else {
        console.log('User signed out');
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
    }
}

/**
 * Show authentication error to user
 */
function showAuthError(message) {
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('authError', { detail: { message } }));
}

/**
 * Check if Firebase is initialized before operations
 */
function ensureInitialized() {
    if (!isInitialized || !auth) {
        throw new Error('Firebase not initialized. Please refresh the page.');
    }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
    try {
        ensureInitialized();
        console.log('Starting Google sign-in...');
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        console.log('Google sign-in successful:', result.user.email);
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        
        // Provide user-friendly error messages
        let userMessage = 'Sign-in failed. Please try again.';
        if (error.code === 'auth/popup-closed-by-user') {
            userMessage = 'Sign-in cancelled.';
        } else if (error.code === 'auth/popup-blocked') {
            userMessage = 'Pop-up blocked by browser. Please allow pop-ups for this site.';
        } else if (error.code === 'auth/network-request-failed') {
            userMessage = 'Network error. Please check your connection.';
        }
        
        throw new Error(userMessage);
    }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
    try {
        ensureInitialized();
        console.log('Starting email sign-in...');
        
        const result = await auth.signInWithEmailAndPassword(email, password);
        console.log('Email sign-in successful:', result.user.email);
        return result.user;
    } catch (error) {
        console.error('Email sign-in error:', error);
        
        let userMessage = 'Sign-in failed. Please try again.';
        if (error.code === 'auth/user-not-found') {
            userMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            userMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            userMessage = 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
            userMessage = 'This account has been disabled.';
        }
        
        throw new Error(userMessage);
    }
}

/**
 * Create account with email and password
 */
export async function createAccount(email, password) {
    try {
        ensureInitialized();
        console.log('Creating new account...');
        
        const result = await auth.createUserWithEmailAndPassword(email, password);
        console.log('Account created:', result.user.email);
        return result.user;
    } catch (error) {
        console.error('Account creation error:', error);
        
        let userMessage = 'Account creation failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            userMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/invalid-email') {
            userMessage = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            userMessage = 'Password is too weak. Use at least 6 characters.';
        }
        
        throw new Error(userMessage);
    }
}

/**
 * Sign in anonymously (for trying without account)
 */
export async function signInAnonymously() {
    try {
        ensureInitialized();
        console.log('Starting anonymous sign-in...');
        
        const result = await auth.signInAnonymously();
        console.log('Anonymous sign-in successful');
        return result.user;
    } catch (error) {
        console.error('Anonymous sign-in error:', error);
        throw new Error('Anonymous sign-in failed. Please try again.');
    }
}

/**
 * Sign out
 */
export async function signOut() {
    try {
        await auth.signOut();
        console.log('User signed out');
        return true;
    } catch (error) {
        console.error('Sign-out error:', error);
        return false;
    }
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user is signed in
 */
export function isSignedIn() {
    return currentUser !== null;
}

/**
 * Save user data to Firestore
 */
export async function saveUserData(data) {
    if (!currentUser) {
        throw new Error('No user signed in');
    }

    try {
        ensureInitialized();
        
        const userDoc = db.collection('users').doc(currentUser.uid);
        await userDoc.set({
            ...data,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        
        console.log('User data saved to Firestore');
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        throw new Error('Failed to save data to cloud. Using local storage only.');
    }
}

/**
 * Load user data from Firestore
 */
export async function loadUserData() {
    if (!currentUser) {
        throw new Error('No user signed in');
    }

    try {
        ensureInitialized();
        
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            console.log('User data loaded from Firestore');
            return userDoc.data();
        } else {
            console.log('No user data found in Firestore');
            return null;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        throw new Error('Failed to load data from cloud.');
    }
}

/**
 * Save farm credentials to Firestore
 */
export async function saveFarmCredentials(farmId, apiKey) {
    return await saveUserData({
        farmId,
        apiKey,
    });
}

/**
 * Load farm credentials from Firestore
 */
export async function loadFarmCredentials() {
    const data = await loadUserData();
    if (data) {
        return {
            farmId: data.farmId,
            apiKey: data.apiKey,
        };
    }
    return null;
}

/**
 * Save calculator results to Firestore
 */
export async function saveCalculatorResults(calculatorType, results) {
    if (!currentUser) return;

    try {
        const resultsDoc = db.collection('users').doc(currentUser.uid)
            .collection('results').doc(calculatorType);
        
        await resultsDoc.set({
            data: results,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`${calculatorType} results saved to Firestore`);
    } catch (error) {
        console.error('Error saving calculator results:', error);
    }
}

/**
 * Load calculator results from Firestore
 */
export async function loadCalculatorResults(calculatorType) {
    if (!currentUser) return null;

    try {
        const resultsDoc = await db.collection('users').doc(currentUser.uid)
            .collection('results').doc(calculatorType).get();
        
        if (resultsDoc.exists) {
            return resultsDoc.data().data;
        }
        return null;
    } catch (error) {
        console.error('Error loading calculator results:', error);
        return null;
    }
}
