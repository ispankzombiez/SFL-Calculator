/**
 * Main Application Module
 * Orchestrates the entire application flow
 */

import * as api from './api.js';
import * as storage from './storage.js';
import * as itemDetector from './item-detector.js';
import * as firebaseAuth from './firebase-auth.js';

// Import calculators
import * as cowCalc from './calculators/cow.js';
import * as sheepCalc from './calculators/sheep.js';
import * as chickenCalc from './calculators/chicken.js';
import * as resourcesCalc from './calculators/resources.js';
import * as cookingCalc from './calculators/cooking.js';
import * as greenhouseCalc from './calculators/greenhouse.js';

// Calculator registry
const CALCULATORS = {
    cows: cowCalc,
    sheep: sheepCalc,
    chickens: chickenCalc,
    resources: resourcesCalc,
    cooking: cookingCalc,
    greenhouse: greenhouseCalc,
};

// Global state
let appState = {
    isConnected: false,
    farmId: null,
    apiKey: null,
    prices: null,
    farmData: null,
    detectedItems: null,
    boosts: null,
    results: {},
    currentCalculator: 'cows',
};

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[App] 🚀 SFL Calculator initializing...');
    console.log('[App] DOM loaded, starting Firebase initialization');
    
    // Show debug status
    const debugStatus = document.getElementById('debug-status');
    const debugText = document.getElementById('debug-text');
    if (debugStatus) {
        debugStatus.style.display = 'block';
        debugText.textContent = 'JavaScript loaded ✓ Initializing Firebase...';
    }
    
    // Initialize Firebase
    const firebaseInitialized = await firebaseAuth.initializeFirebase();
    
    if (!firebaseInitialized) {
        console.warn('[App] ⚠️ Firebase not initialized - running in localStorage-only mode');
        if (debugText) debugText.textContent = '⚠️ Firebase unavailable - using local storage only';
    } else {
        console.log('[App] ✅ Firebase ready');
        if (debugText) debugText.textContent = '✅ Firebase ready - you can sign in!';
    }
    
    // Set up event listeners
    console.log('[App] Setting up event listeners...');
    setupEventListeners();
    console.log('[App] Event listeners attached');
    
    // Listen for auth state changes
    window.addEventListener('authStateChanged', handleAuthChange);
    console.log('[App] Auth state change listener registered');
    
    // Listen for auth errors
    window.addEventListener('authError', handleAuthError);
    console.log('[App] Auth error listener registered');
    
    // Check initial auth state
    if (firebaseAuth.isSignedIn()) {
        console.log('[App] User already signed in');
        await handleUserSignedIn();
    } else {
        console.log('[App] No user signed in, showing landing screen');
        showScreen('landing');
    }
    
    console.log('[App] ✅ Initialization complete!');
});

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    console.log('[App] setupEventListeners() called');
    
    // Authentication buttons
    const googleSigninBtn = document.getElementById('google-signin-btn');
    console.log('[App] Google sign-in button:', googleSigninBtn);
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', handleGoogleSignIn);
        console.log('[App] Google sign-in listener attached');
    } else {
        console.warn('[App] Google sign-in button not found!');
    }
    
    const anonymousSigninBtn = document.getElementById('anonymous-signin-btn');
    if (anonymousSigninBtn) {
        anonymousSigninBtn.addEventListener('click', handleAnonymousSignIn);
    }
    
    const showEmailLogin = document.getElementById('show-email-login');
    if (showEmailLogin) {
        showEmailLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('email-login-form').style.display = 'block';
        });
    }
    
    const emailSigninBtn = document.getElementById('email-signin-btn');
    if (emailSigninBtn) {
        emailSigninBtn.addEventListener('click', handleEmailSignIn);
    }
    
    const emailSignupBtn = document.getElementById('email-signup-btn');
    if (emailSignupBtn) {
        emailSignupBtn.addEventListener('click', handleEmailSignUp);
    }
    
    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', handleSignOut);
    }
    
    // Connect form submission
    const connectForm = document.getElementById('connect-form');
    if (connectForm) {
        connectForm.addEventListener('submit', handleConnectSubmit);
    }
    
    // Calculator navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const calculator = tab.dataset.calculator;
            switchCalculator(calculator);
        });
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }
    
    // Settings modal actions
    const closeSettings = document.getElementById('close-settings');
    if (closeSettings) {
        closeSettings.addEventListener('click', closeSettingsModal);
    }
    
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', handleClearCache);
    }
    
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', handleDisconnect);
    }
    
    const exportBtn = document.getElementById('export-results-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    // Modal backdrop click to close
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSettingsModal();
            }
        });
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span> Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

/**
 * Show authentication error message
 */
function showAuthErrorMessage(message) {
    // Create or update error display
    let errorDiv = document.getElementById('auth-error-message');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'auth-error-message';
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'background: #fee; border: 1px solid #fcc; color: #c33; padding: 12px; border-radius: 4px; margin: 12px 0; display: none;';
        
        const authSection = document.getElementById('auth-section');
        if (authSection) {
            authSection.appendChild(errorDiv);
        }
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Handle authentication errors
 */
function handleAuthError(event) {
    const message = event.detail?.message || 'An error occurred. Please try again.';
    console.error('Auth error:', message);
    showAuthErrorMessage(message);
}

/**
 * Handle Google sign-in
 */
async function handleGoogleSignIn() {
    console.log('[Auth] 🖱️ Google sign-in button clicked!');
    const button = document.getElementById('google-signin-btn');
    
    try {
        console.log('[Auth] Setting button loading state...');
        setButtonLoading(button, true);
        
        console.log('[Auth] Calling signInWithGoogle()...');
        await firebaseAuth.signInWithGoogle();
        
        console.log('[Auth] Google sign-in succeeded');
        // handleUserSignedIn will be called by auth state change listener
    } catch (error) {
        console.error('[Auth] ❌ Google sign-in failed:', error);
        showAuthErrorMessage(error.message);
    } finally {
        console.log('[Auth] Removing button loading state');
        setButtonLoading(button, false);
    }
}

/**
 * Handle anonymous sign-in
 */
async function handleAnonymousSignIn() {
    const button = document.getElementById('anonymous-signin-btn');
    
    try {
        setButtonLoading(button, true);
        await firebaseAuth.signInAnonymously();
        // handleUserSignedIn will be called by auth state change listener
    } catch (error) {
        console.error('Anonymous sign-in failed:', error);
        showAuthErrorMessage(error.message);
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle email sign-in
 */
async function handleEmailSignIn() {
    const button = document.getElementById('email-signin-btn');
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;
    
    if (!email || !password) {
        showAuthErrorMessage('Please enter both email and password');
        return;
    }
    
    try {
        setButtonLoading(button, true);
        await firebaseAuth.signInWithEmail(email, password);
        // handleUserSignedIn will be called by auth state change listener
    } catch (error) {
        console.error('Email sign-in failed:', error);
        showAuthErrorMessage(error.message);
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle email sign-up
 */
async function handleEmailSignUp() {
    const button = document.getElementById('email-signup-btn');
    const email = document.getElementById('email-input').value.trim();
    const password = document.getElementById('password-input').value;
    
    if (!email || !password) {
        showAuthErrorMessage('Please enter both email and password');
        return;
    }
    
    if (password.length < 6) {
        showAuthErrorMessage('Password must be at least 6 characters');
        return;
    }
    
    try {
        setButtonLoading(button, true);
        await firebaseAuth.createAccount(email, password);
        // handleUserSignedIn will be called by auth state change listener
    } catch (error) {
        console.error('Account creation failed:', error);
        showAuthErrorMessage(error.message);
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle sign-out
 */
async function handleSignOut() {
    if (confirm('Sign out? Your data will remain saved in your account.')) {
        await firebaseAuth.signOut();
        // Reset app state
        appState.isConnected = false;
        showScreen('landing');
    }
}

/**
 * Handle auth state changes
 */
async function handleAuthChange(event) {
    const { user } = event.detail;
    
    if (user) {
        await handleUserSignedIn();
    } else {
        handleUserSignedOut();
    }
}

/**
 * Handle user signed in
 */
async function handleUserSignedIn() {
    const user = firebaseAuth.getCurrentUser();
    console.log('[App] User signed in, loading data...');
    
    // Hide auth section
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        authSection.style.display = 'none';
        console.log('[App] Auth section hidden');
    }
    
    // Show success message
    showSignInSuccess(user);
    
    // Update UI to show user info
    updateUserDisplay(user);
    
    // Try to load saved farm credentials from Firebase
    try {
        const credentials = await firebaseAuth.loadFarmCredentials();
        
        if (credentials && credentials.farmId && credentials.apiKey) {
            console.log('[App] Found saved credentials in Firebase for farm', credentials.farmId);
            
            // Pre-fill form
            const farmIdInput = document.getElementById('farm-id');
            const apiKeyInput = document.getElementById('api-key');
            
            if (farmIdInput && credentials.farmId) {
                farmIdInput.value = credentials.farmId;
            }
            if (apiKeyInput && credentials.apiKey) {
                apiKeyInput.value = credentials.apiKey;
            }
            
            console.log('[App] Credentials pre-filled in form');
        } else {
            console.log('[App] No saved credentials found');
        }
    } catch (error) {
        console.error('[App] Error loading saved credentials:', error);
    }
    
    // Make sure we're on the landing screen
    showScreen('landing');
    console.log('[App] Ready for farm connection');
}

/**
 * Show sign-in success message
 */
function showSignInSuccess(user) {
    // Create or update success message
    let successDiv = document.getElementById('signin-success-message');
    
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'signin-success-message';
        successDiv.style.cssText = 'background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px; border-radius: 4px; margin-bottom: 20px;';
        
        // Insert before the connection card
        const connectionCard = document.querySelector('.connection-card');
        if (connectionCard && connectionCard.parentNode) {
            connectionCard.parentNode.insertBefore(successDiv, connectionCard);
        }
    }
    
    const displayName = user.email || (user.isAnonymous ? 'Anonymous User' : 'User');
    successDiv.innerHTML = `
        <strong>✅ Signed in successfully!</strong><br>
        <small>Logged in as: ${displayName}</small>
    `;
    successDiv.style.display = 'block';
}

/**
 * Handle user signed out
 */
function handleUserSignedOut() {
    console.log('[App] User signed out');
    
    // Show auth section again
    const authSection = document.getElementById('auth-section');
    if (authSection) {
        authSection.style.display = 'block';
        console.log('[App] Auth section shown');
    }
    
    // Hide success message
    const successDiv = document.getElementById('signin-success-message');
    if (successDiv) {
        successDiv.style.display = 'none';
    }
    
    // Hide user info
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.style.display = 'none';
    }
    
    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
        signoutBtn.style.display = 'none';
    }
    
    // Clear farm connection form
    const farmIdInput = document.getElementById('farm-id');
    const apiKeyInput = document.getElementById('api-key');
    if (farmIdInput) farmIdInput.value = '';
    if (apiKeyInput) apiKeyInput.value = '';
    
    // Show landing screen
    showScreen('landing');
}

/**
 * Update user display in navigation
 */
function updateUserDisplay(user) {
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    const userPhoto = document.getElementById('user-photo');
    const signoutBtn = document.getElementById('signout-btn');
    
    if (userInfo && userEmail) {
        userEmail.textContent = user.email || 'Anonymous User';
        userInfo.style.display = 'flex';
        
        if (user.photoURL && userPhoto) {
            userPhoto.src = user.photoURL;
            userPhoto.style.display = 'block';
        }
        
        if (signoutBtn) {
            signoutBtn.style.display = 'inline-flex';
        }
    }
}

/**
 * Handle connect form submission
 */
async function handleConnectSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const farmId = formData.get('farmId').trim();
    const apiKey = formData.get('apiKey').trim();
    
    // Validate inputs
    if (!storage.validateFarmId(farmId)) {
        showError('Invalid Farm ID. Please enter a numeric farm ID.');
        return;
    }
    
    if (!storage.validateApiKey(apiKey)) {
        showError('Invalid API key. Key should start with "sfl." and be at least 20 characters.');
        return;
    }
    
    // Clear any previous errors
    hideError();
    
    // Save credentials to localStorage
    storage.saveFarmId(farmId);
    storage.saveApiKey(apiKey);
    
    // Save to Firebase if user is signed in
    if (firebaseAuth.isSignedIn()) {
        try {
            await firebaseAuth.saveFarmCredentials(farmId, apiKey);
            console.log('Credentials saved to Firebase');
        } catch (error) {
            console.error('Failed to save credentials to Firebase:', error);
            // Non-critical error, continue anyway
        }
    }
    
    await connectFarm(farmId, apiKey);
}

/**
 * Connect to farm and load data
 */
async function connectFarm(farmId, apiKey) {
    try {
        showScreen('loading');
        updateLoadingStep('step-prices', 'loading');
        
        console.log('Starting connection process...');
        console.log('Farm ID:', farmId);
        console.log('API Key length:', apiKey.length);
        
        // Fetch all data
        const { prices, farmData } = await api.fetchAllData(farmId, apiKey);
        
        updateLoadingStep('step-prices', 'complete');
        updateLoadingStep('step-farm', 'complete');
        updateLoadingStep('step-items', 'loading');
        
        // Detect items and calculate boosts
        const detectedItems = itemDetector.detectItems(farmData);
        const boosts = detectedItems.boosts;
        
        updateLoadingStep('step-items', 'complete');
        updateLoadingStep('step-calc', 'loading');
        
        // Run all calculators
        const config = itemDetector.getDefaultConfig();
        const results = {};
        
        for (const [name, calculator] of Object.entries(CALCULATORS)) {
            results[name] = calculator.calculate(detectedItems, boosts, prices, config);
            storage.saveResults(name, results[name]);
            
            // Save to Firebase if signed in
            if (firebaseAuth.isSignedIn()) {
                firebaseAuth.saveCalculatorResults(name, results[name]).catch(err => {
                    console.error(`Failed to save ${name} results to Firebase:`, err);
                });
            }
        }
        
        updateLoadingStep('step-calc', 'complete');
        
        // Update app state
        appState = {
            isConnected: true,
            farmId,
            apiKey,
            prices,
            farmData,
            detectedItems,
            boosts,
            results,
            currentCalculator: 'cows',
        };
        
        // Save last update time
        storage.saveLastUpdate();
        
        // Show dashboard
        showDashboard();
        
    } catch (error) {
        console.error('Connection error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Show detailed error to user
        const errorMsg = error.message || 'An unknown error occurred. Please check the browser console for details.';
        showError(errorMsg);
        showScreen('landing');
        
        // Reset loading steps
        updateLoadingStep('step-prices', 'error');
        updateLoadingStep('step-farm', 'error');
        updateLoadingStep('step-items', 'error');
        updateLoadingStep('step-calc', 'error');
    }
}

/**
 * Show dashboard with results
 */
function showDashboard() {
    showScreen('dashboard');
    
    // Update farm info display
    const farmIdDisplay = document.getElementById('farm-id-display');
    if (farmIdDisplay) {
        farmIdDisplay.textContent = `Farm #${appState.farmId}`;
    }
    
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = `Updated ${storage.getLastUpdateFormatted()}`;
    }
    
    // Render current calculator
    renderCalculator(appState.currentCalculator);
}

/**
 * Switch to different calculator
 */
function switchCalculator(calculatorName) {
    if (!appState.isConnected) return;
    
    appState.currentCalculator = calculatorName;
    
    // Update tab states
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.calculator === calculatorName);
    });
    
    // Update panel visibility
    document.querySelectorAll('.calc-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `calc-${calculatorName}`);
    });
    
    // Render calculator
    renderCalculator(calculatorName);
}

/**
 * Render calculator results
 */
function renderCalculator(calculatorName) {
    const calculator = CALCULATORS[calculatorName];
    if (!calculator) return;
    
    const container = document.getElementById(`${calculatorName}-results`);
    if (!container) return;
    
    const results = appState.results[calculatorName];
    if (!results) {
        container.innerHTML = '<p>No results available</p>';
        return;
    }
    
    calculator.render(results, container);
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
    if (!appState.isConnected) return;
    
    // Clear cache to force fresh data
    api.clearFarmCache();
    
    // Reconnect
    await connectFarm(appState.farmId, appState.apiKey);
}

/**
 * Open settings modal
 */
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Update user email
        const user = firebaseAuth.getCurrentUser();
        const userEmailSpan = document.getElementById('settings-user-email');
        if (userEmailSpan) {
            userEmailSpan.textContent = user ? (user.email || 'Anonymous') : 'Not signed in';
        }
        
        // Update sync status
        const syncStatus = document.getElementById('settings-sync-status');
        if (syncStatus) {
            syncStatus.textContent = firebaseAuth.isSignedIn() ? 'Enabled ✅' : 'Disabled (localStorage only)';
        }
        
        // Update settings display
        const farmIdDisplay = document.getElementById('settings-farm-id');
        if (farmIdDisplay) {
            farmIdDisplay.textContent = appState.farmId || '-';
        }
        
        const pricesCacheTime = document.getElementById('prices-cache-time');
        if (pricesCacheTime) {
            pricesCacheTime.textContent = api.getCacheTimestamp('prices') || 'Not cached';
        }
        
        const farmCacheTime = document.getElementById('farm-cache-time');
        if (farmCacheTime) {
            farmCacheTime.textContent = api.getCacheTimestamp(`farm_${appState.farmId}`) || 'Not cached';
        }
    }
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Handle clear cache
 */
function handleClearCache() {
    if (confirm('Clear all cached data? You will need to refresh to load new data.')) {
        storage.clearCache();
        api.clearFarmCache();
        alert('Cache cleared successfully');
    }
}

/**
 * Handle disconnect
 */
function handleDisconnect() {
    if (confirm('Disconnect and clear all data? You will need to re-enter your credentials.')) {
        storage.clearAllData();
        api.clearFarmCache();
        
        // Reset state
        appState = {
            isConnected: false,
            farmId: null,
            apiKey: null,
            prices: null,
            farmData: null,
            detectedItems: null,
            boosts: null,
            results: {},
            currentCalculator: 'cows',
        };
        
        showScreen('landing');
        closeSettingsModal();
    }
}

/**
 * Handle export results
 */
function handleExport() {
    try {
        const exportData = {
            farmId: appState.farmId,
            exportDate: new Date().toISOString(),
            lastUpdate: storage.getLastUpdate(),
            results: appState.results,
            config: {
                boosts: appState.boosts,
                detectedItems: appState.detectedItems?.ownedItems,
            },
        };
        
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sfl-calculator-farm${appState.farmId}-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting data');
    }
}

/**
 * Show specific screen
 */
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) {
        screen.classList.add('active');
    }
}

/**
 * Update loading step status
 */
function updateLoadingStep(stepId, status) {
    const step = document.getElementById(stepId);
    if (!step) return;
    
    const icon = step.querySelector('.step-icon');
    if (!icon) return;
    
    switch (status) {
        case 'loading':
            icon.textContent = '⏳';
            break;
        case 'complete':
            icon.textContent = '✅';
            break;
        case 'error':
            icon.textContent = '❌';
            break;
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

/**
 * Hide error message
 */
function hideError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}
