/**
 * Firebase Authentication Module
 * Handles user authentication and data synchronization with Firestore
 */

import firebaseConfig from './firebase-config.js';

// Firebase will be loaded from CDN in index.html
let auth = null;
let db = null;
let currentUser = null;

/**
 * Initialize Firebase
 */
export async function initializeFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }

        // Initialize Firebase app
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Initialize services
        auth = firebase.auth();
        db = firebase.firestore();

        // Set up auth state listener
        auth.onAuthStateChanged(handleAuthStateChanged);

        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
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
 * Sign in with Google
 */
export async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log('Google sign-in successful:', result.user.email);
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw new Error(`Sign-in failed: ${error.message}`);
    }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        console.log('Email sign-in successful:', result.user.email);
        return result.user;
    } catch (error) {
        console.error('Email sign-in error:', error);
        throw new Error(`Sign-in failed: ${error.message}`);
    }
}

/**
 * Create account with email and password
 */
export async function createAccount(email, password) {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        console.log('Account created:', result.user.email);
        return result.user;
    } catch (error) {
        console.error('Account creation error:', error);
        throw new Error(`Account creation failed: ${error.message}`);
    }
}

/**
 * Sign in anonymously (for trying without account)
 */
export async function signInAnonymously() {
    try {
        const result = await auth.signInAnonymously();
        console.log('Anonymous sign-in successful');
        return result.user;
    } catch (error) {
        console.error('Anonymous sign-in error:', error);
        throw new Error(`Anonymous sign-in failed: ${error.message}`);
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
        const userDoc = db.collection('users').doc(currentUser.uid);
        await userDoc.set({
            ...data,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        
        console.log('User data saved to Firestore');
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        throw error;
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
        throw error;
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
