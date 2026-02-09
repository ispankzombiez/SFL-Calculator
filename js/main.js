/**
 * Main Application Module
 * Orchestrates the entire application flow
 */

import * as api from './api.js';
import * as storage from './storage.js';
import * as itemDetector from './item-detector.js';
import * as firebaseAuth from './firebase-auth.js';
import * as dashboardModule from './dashboard.js';
import * as cowView from './views/cow-view.js';

// Import calculators
import * as cowCalc from './calculators/cow.js';
import * as sheepCalc from './calculators/sheep.js';
import * as chickenCalc from './calculators/chicken.js';
import * as resourcesCalc from './calculators/resources.js';
import * as cookingCalc from './calculators/cooking.js';
import * as greenhouseCalc from './calculators/greenhouse.js';

// Calculator registry
const CALCULATORS = {
    overview: { name: 'overview', hasRender: false }, // Special case for overview
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
    currentCalculator: 'overview',
};

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[App] 🚀 SFL Calculator initializing...');
    console.log('[App] DOM loaded, starting Firebase initialization');
    
    // Initialize theme
    initializeTheme();
    
    // Initialize Firebase
    const firebaseInitialized = await firebaseAuth.initializeFirebase();
    
    if (!firebaseInitialized) {
        console.warn('[App] ⚠️ Firebase not initialized - running in localStorage-only mode');
    } else {
        console.log('[App] ✅ Firebase ready');
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
    
    // Expose loadRawAPIData for dashboard.js
    window.loadRawAPIData = firebaseAuth.loadRawAPIData;
    console.log('[App] Exposed loadRawAPIData to window');
    
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
    
    // Profile icon buttons
    const profileIconBtn = document.getElementById('profile-icon-btn');
    const profileIconBtnDashboard = document.getElementById('profile-icon-btn-dashboard');
    
    if (profileIconBtn) {
        profileIconBtn.addEventListener('click', toggleProfileDropdown);
        console.log('[App] Profile icon listener attached (landing)');
    }
    
    if (profileIconBtnDashboard) {
        profileIconBtnDashboard.addEventListener('click', toggleProfileDropdownDashboard);
        console.log('[App] Profile icon listener attached (dashboard)');
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profile-dropdown');
        const dropdownDashboard = document.getElementById('profile-dropdown-dashboard');
        const iconBtn = document.getElementById('profile-icon-btn');
        const iconBtnDashboard = document.getElementById('profile-icon-btn-dashboard');
        
        if (dropdown && !dropdown.contains(e.target) && e.target !== iconBtn && !iconBtn?.contains(e.target)) {
            dropdown.style.display = 'none';
            dropdown.classList.remove('active');
        }
        
        if (dropdownDashboard && !dropdownDashboard.contains(e.target) && e.target !== iconBtnDashboard && !iconBtnDashboard?.contains(e.target)) {
            dropdownDashboard.style.display = 'none';
            dropdownDashboard.classList.remove('active');
        }
    });
    
    // Login modal
    const closeLoginModal = document.getElementById('close-login-modal');
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', hideLoginModal);
    }
    
    // Close modal when clicking outside
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                hideLoginModal();
            }
        });
    }
    
    // Authentication buttons in modal
    const googleSigninBtn = document.getElementById('google-signin-btn');
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', handleGoogleSignIn);
        console.log('[App] Google sign-in listener attached');
    }
    
    const emailSigninBtn = document.getElementById('email-signin-btn');
    if (emailSigninBtn) {
        emailSigninBtn.addEventListener('click', () => {
            // Hide confirm password field
            const confirmGroup = document.getElementById('confirm-password-group');
            if (confirmGroup) {
                confirmGroup.style.display = 'none';
            }
            handleEmailSignIn();
        });
    }
    
    const emailSignupBtn = document.getElementById('email-signup-btn');
    if (emailSignupBtn) {
        emailSignupBtn.addEventListener('click', () => {
            // Show confirm password field
            const confirmGroup = document.getElementById('confirm-password-group');
            if (confirmGroup) {
                confirmGroup.style.display = 'block';
            }
            handleEmailSignUp();
        });
    }
    
    const signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', handleSignOut);
    }
    
    // Credentials form submission (setup modal)
    const credentialsForm = document.getElementById('credentials-form');
    if (credentialsForm) {
        credentialsForm.addEventListener('submit', handleCredentialsSubmit);
    }
    
    // Close credentials modal
    const closeCredentialsModal = document.getElementById('close-credentials-modal');
    if (closeCredentialsModal) {
        closeCredentialsModal.addEventListener('click', hideCredentialsModal);
    }
    
    // Calculator navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const calculator = tab.dataset.calculator;
            switchCalculator(calculator);
        });
    });
    
    // Refresh buttons
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    const refreshBtnLanding = document.getElementById('refresh-btn-landing');
    if (refreshBtnLanding) {
        refreshBtnLanding.addEventListener('click', handleRefreshFromLanding);
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
    
    // Raw data viewer button
    const viewRawDataBtn = document.getElementById('view-raw-data-btn');
    if (viewRawDataBtn) {
        viewRawDataBtn.addEventListener('click', openRawDataViewer);
    }
    
    const closeRawData = document.getElementById('close-raw-data');
    if (closeRawData) {
        closeRawData.addEventListener('click', closeRawDataModal);
    }
    
    const copyRawDataBtn = document.getElementById('copy-raw-data-btn');
    if (copyRawDataBtn) {
        copyRawDataBtn.addEventListener('click', copyRawDataToClipboard);
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
    
    const rawDataModal = document.getElementById('raw-data-modal');
    if (rawDataModal) {
        rawDataModal.addEventListener('click', (e) => {
            if (e.target === rawDataModal) {
                closeRawDataModal();
            }
        });
    }
}

/**
 * Toggle profile dropdown (landing page)
 */
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    const isVisible = dropdown.style.display === 'block';
    
    if (isVisible) {
        dropdown.style.display = 'none';
        dropdown.classList.remove('active');
    } else {
        updateProfileDropdown();
        dropdown.style.display = 'block';
        dropdown.classList.add('active');
    }
}

/**
 * Toggle profile dropdown (dashboard)
 */
function toggleProfileDropdownDashboard() {
    const dropdown = document.getElementById('profile-dropdown-dashboard');
    const isVisible = dropdown.style.display === 'block';
    
    if (isVisible) {
        dropdown.style.display = 'none';
        dropdown.classList.remove('active');
    } else {
        updateProfileDropdownDashboard();
        dropdown.style.display = 'block';
        dropdown.classList.add('active');
    }
}

/**
 * Update profile dropdown content (landing)
 */
function updateProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    const user = firebaseAuth.getCurrentUser();
    const isDarkMode = document.body.classList.contains('dark-mode');
    const themeIcon = isDarkMode ? '🌙' : '☀️';
    const themeText = isDarkMode ? 'Light Mode' : 'Dark Mode';
    
    if (user) {
        // User is signed in
        const displayName = user.email || (user.isAnonymous ? 'Anonymous User' : 'User');
        dropdown.innerHTML = `
            <div class="dropdown-user-info">
                <div class="dropdown-user-label">Signed in as</div>
                <div class="dropdown-user-email">${displayName}</div>
            </div>
            <button class="dropdown-item" id="dropdown-profile">Profile</button>
            <button class="dropdown-item" id="dropdown-settings">Settings</button>
            <button class="dropdown-item" id="dropdown-theme">${themeIcon} ${themeText}</button>
            <button class="dropdown-item danger" id="dropdown-logout">Logout</button>
        `;
        
        // Attach event listeners
        document.getElementById('dropdown-profile')?.addEventListener('click', () => {
            alert('Profile page coming soon!');
            dropdown.style.display = 'none';
        });
        
        document.getElementById('dropdown-settings')?.addEventListener('click', () => {
            openSettings();
            dropdown.style.display = 'none';
        });
        
        document.getElementById('dropdown-theme')?.addEventListener('click', () => {
            toggleTheme();
            updateProfileDropdown();
            updateProfileDropdownDashboard();
        });
        
        document.getElementById('dropdown-logout')?.addEventListener('click', () => {
            handleSignOut();
            dropdown.style.display = 'none';
        });
    } else {
        // User not signed in
        dropdown.innerHTML = `
            <button class="dropdown-item" id="dropdown-login">Login</button>
            <button class="dropdown-item" id="dropdown-theme">${themeIcon} ${themeText}</button>
        `;
        
        document.getElementById('dropdown-login')?.addEventListener('click', () => {
            showLoginModal();
            dropdown.style.display = 'none';
        });
        
        document.getElementById('dropdown-theme')?.addEventListener('click', () => {
            toggleTheme();
            updateProfileDropdown();
            updateProfileDropdownDashboard();
        });
    }
}

/**
 * Update profile dropdown content (dashboard)
 */
function updateProfileDropdownDashboard() {
    const dropdown = document.getElementById('profile-dropdown-dashboard');
    const user = firebaseAuth.getCurrentUser();
    const isDarkMode = document.body.classList.contains('dark-mode');
    const themeIcon = isDarkMode ? '🌙' : '☀️';
    const themeText = isDarkMode ? 'Light Mode' : 'Dark Mode';
    
    if (!dropdown) return;
    
    if (user) {
        // User is signed in
        const displayName = user.email || (user.isAnonymous ? 'Anonymous User' : 'User');
        dropdown.innerHTML = `
            <div class="dropdown-user-info">
                <div class="dropdown-user-label">Signed in as</div>
                <div class="dropdown-user-email">${displayName}</div>
            </div>
            <button class="dropdown-item" id="dropdown-profile-dash">Profile</button>
            <button class="dropdown-item" id="dropdown-settings-dash">Settings</button>
            <button class="dropdown-item" id="dropdown-theme-dash">${themeIcon} ${themeText}</button>
            <button class="dropdown-item danger" id="dropdown-logout-dash">Logout</button>
        `;
        
        // Attach event listeners
        document.getElementById('dropdown-profile-dash')?.addEventListener('click', () => {
            alert('Profile page coming soon!');
            dropdown.style.display = 'none';
        });
        
        document.getElementById('dropdown-settings-dash')?.addEventListener('click', () => {
            openSettings();
            dropdown.style.display = 'none';
        });
        
        document.getElementById('dropdown-theme-dash')?.addEventListener('click', () => {
            toggleTheme();
            updateProfileDropdown();
            updateProfileDropdownDashboard();
        });
        
        document.getElementById('dropdown-logout-dash')?.addEventListener('click', () => {
            handleSignOut();
            dropdown.style.display = 'none';
        });
    } else {
        // User not signed in
        dropdown.innerHTML = `
            <button class="dropdown-item" id="dropdown-login-dash">Login</button>
            <button class="dropdown-item" id="dropdown-theme-dash">${themeIcon} ${themeText}</button>
        `;
        
        document.getElementById('dropdown-login-dash')?.addEventListener('click', () => {
            showLoginModal();
            dropdown.style.display = 'none';
        });
        
        document.getElementById('dropdown-theme-dash')?.addEventListener('click', () => {
            toggleTheme();
            updateProfileDropdown();
            updateProfileDropdownDashboard();
        });
    }
}

/**
 * Toggle theme between light and dark mode
 */
function toggleTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
}

/**
 * Initialize theme from localStorage
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Show login modal
 */
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Hide login modal
 */
function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form fields
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const confirmPasswordInput = document.getElementById('password-confirm-input');
    const confirmGroup = document.getElementById('confirm-password-group');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    if (confirmGroup) confirmGroup.style.display = 'none';
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
        hideLoginModal();
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
        hideLoginModal();
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
    const confirmPassword = document.getElementById('password-confirm-input').value;
    
    if (!email || !password) {
        showAuthErrorMessage('Please enter both email and password');
        return;
    }
    
    if (password.length < 6) {
        showAuthErrorMessage('Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthErrorMessage('Passwords do not match');
        return;
    }
    
    try {
        setButtonLoading(button, true);
        await firebaseAuth.createAccount(email, password);
        hideLoginModal();
        // Reset confirm password field
        document.getElementById('password-confirm-input').value = '';
        document.getElementById('confirm-password-group').style.display = 'none';
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
    
    // Update profile dropdowns
    updateProfileDropdown();
    updateProfileDropdownDashboard();
    
    // Show landing status
    updateLandingStatus('Loading your farm credentials...');
    
    // Try to load saved farm credentials from Firebase
    try {
        const credentials = await firebaseAuth.loadFarmCredentials();
        
        if (credentials && credentials.farmId && credentials.apiKey) {
            console.log('[App] Found saved credentials for farm', credentials.farmId);
            
            // Show refresh button on landing
            const refreshBtnLanding = document.getElementById('refresh-btn-landing');
            if (refreshBtnLanding) {
                refreshBtnLanding.style.display = 'block';
            }
            
            // Try to load cached data from Firestore first
            updateLandingStatus('Loading cached farm data...');
            const cachedData = await firebaseAuth.loadRawAPIData();
            
            if (cachedData && cachedData.prices && cachedData.farmData) {
                console.log('[App] Found cached data in Firestore');
                
                // Check if cache is stale (older than 24 hours)
                const cacheAge = cachedData.timestamp ? Date.now() - cachedData.timestamp : Infinity;
                const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (cacheAge < maxCacheAge) {
                    console.log('[App] Cache is fresh, using cached data');
                    updateLandingStatus('Loading from cache...');
                    
                    // Load from cache
                    await loadFromCache(credentials.farmId, credentials.apiKey, cachedData);
                    return;
                } else {
                    console.log('[App] Cache is stale, refreshing from API');
                    updateLandingStatus('Cache is stale, fetching fresh data...');
                }
            } else {
                console.log('[App] No cached data found, fetching from API');
            }
            
            // Cache miss or stale - fetch from API
            updateLandingStatus('Connecting to your farm...');
            await connectFarm(credentials.farmId, credentials.apiKey);
        } else {
            console.log('[App] No saved credentials found, showing setup modal');
            updateLandingStatus('Ready to connect your farm!');
            
            // Show credentials setup modal
            showCredentialsModal();
        }
    } catch (error) {
        console.error('[App] Error loading saved credentials:', error);
        updateLandingStatus('Error loading credentials. Please try again.');
        
        // Show credentials setup modal as fallback
        setTimeout(() => showCredentialsModal(), 1000);
    }
}

/**
 * Load from cached data without hitting the API
 */
async function loadFromCache(farmId, apiKey, cachedData) {
    try {
        showScreen('loading');
        updateLoadingStep('step-prices', 'complete');
        updateLoadingStep('step-farm', 'complete');
        updateLoadingStep('step-items', 'loading');
        
        // Parse cached JSON data
        const prices = JSON.parse(cachedData.prices);
        const farmData = JSON.parse(cachedData.farmData);
        
        // Detect items and calculate boosts
        const detectedItems = itemDetector.detectItems(farmData);
        const boosts = detectedItems.boosts;
        
        updateLoadingStep('step-items', 'complete');
        updateLoadingStep('step-calc', 'loading');
        
        // Run all calculators
        const config = itemDetector.getDefaultConfig();
        const results = {};
        
        for (const [name, calculator] of Object.entries(CALCULATORS)) {
            if (calculator.calculate) {
                results[name] = calculator.calculate(detectedItems, boosts, prices, config);
                storage.saveResults(name, results[name]);
                
                // Save to Firebase if signed in
                if (firebaseAuth.isSignedIn()) {
                    firebaseAuth.saveCalculatorResults(name, results[name]).catch(err => {
                        console.error(`Failed to save ${name} results to Firebase:`, err);
                    });
                }
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
            currentCalculator: 'overview',
        };
        
        // Show dashboard
        showDashboard();
        
    } catch (error) {
        console.error('[App] Error loading from cache:', error);
        
        // Fall back to API fetch
        console.log('[App] Cache load failed, falling back to API');
        await connectFarm(farmId, apiKey);
    }
}

/**
 * Update landing page status message
 */
function updateLandingStatus(message) {
    const statusElement = document.getElementById('landing-status');
    if (statusElement) {
        statusElement.innerHTML = `<p style="color: #666; font-size: 14px;">${message}</p>`;
    }
}

/**
 * Show credentials setup modal
 */
function showCredentialsModal() {
    const modal = document.getElementById('credentials-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Clear any previous values
        const farmIdInput = document.getElementById('setup-farm-id');
        const apiKeyInput = document.getElementById('setup-api-key');
        if (farmIdInput) farmIdInput.value = '';
        if (apiKeyInput) apiKeyInput.value = '';
        
        // Hide error
        const errorDiv = document.getElementById('credentials-error');
        if (errorDiv) errorDiv.style.display = 'none';
    }
}

/**
 * Hide credentials setup modal
 */
function hideCredentialsModal() {
    const modal = document.getElementById('credentials-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Handle credentials form submission
 */
async function handleCredentialsSubmit(e) {
    e.preventDefault();
    
    const farmIdInput = document.getElementById('setup-farm-id');
    const apiKeyInput = document.getElementById('setup-api-key');
    const submitBtn = document.getElementById('save-credentials-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const errorDiv = document.getElementById('credentials-error');
    
    const farmId = farmIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    // Validate inputs
    if (!storage.validateFarmId(farmId)) {
        errorDiv.textContent = 'Invalid Farm ID. Please enter a numeric farm ID.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!storage.validateApiKey(apiKey)) {
        errorDiv.textContent = 'Invalid API key. Key should start with "sfl." and be at least 20 characters.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Hide error
    errorDiv.style.display = 'none';
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    submitBtn.disabled = true;
    
    try {
        // Save to localStorage
        storage.saveFarmId(farmId);
        storage.saveApiKey(apiKey);
        
        // Save to Firebase
        await firebaseAuth.saveFarmCredentials(farmId, apiKey);
        console.log('Credentials saved to Firebase');
        
        // Hide modal
        hideCredentialsModal();
        
        // Show refresh button
        const refreshBtnLanding = document.getElementById('refresh-btn-landing');
        if (refreshBtnLanding) {
            refreshBtnLanding.style.display = 'block';
        }
        
        // Connect to farm
        await connectFarm(farmId, apiKey);
        
    } catch (error) {
        console.error('Error saving credentials:', error);
        errorDiv.textContent = error.message || 'Failed to save credentials. Please try again.';
        errorDiv.style.display = 'block';
        
        // Reset button state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

/**
 * Handle refresh from landing page
 */
async function handleRefreshFromLanding() {
    const refreshBtn = document.getElementById('refresh-btn-landing');
    if (!refreshBtn) return;
    
    // Get saved credentials
    const farmId = storage.getFarmId();
    const apiKey = storage.getApiKey();
    
    if (!farmId || !apiKey) {
        showCredentialsModal();
        return;
    }
    
    // Disable button during refresh
    refreshBtn.disabled = true;
    refreshBtn.style.opacity = '0.6';
    
    try {
        await connectFarm(farmId, apiKey);
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.style.opacity = '1';
    }
}

/**
 * Show sign-in success message
 */
function showSignInSuccess(user) {
    // This function is no longer needed but kept for compatibility
    console.log('User signed in:', user.email || user.uid);
}

/**
 * Handle user signed out
 */
function handleUserSignedOut() {
    console.log('[App] User signed out');
    
    // Update profile dropdowns
    updateProfileDropdown();
    updateProfileDropdownDashboard();
    
    // Hide refresh button on landing
    const refreshBtnLanding = document.getElementById('refresh-btn-landing');
    if (refreshBtnLanding) {
        refreshBtnLanding.style.display = 'none';
    }
    
    // Update landing status
    updateLandingStatus('👆 Click the profile icon above to sign in');
    
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
 * Load all calculator results from Firebase
 * Returns null if no data exists or user not signed in
 */
async function loadAllResultsFromFirebase() {
    if (!firebaseAuth.isSignedIn()) {
        return null;
    }
    
    try {
        console.log('Loading calculator results from Firebase...');
        const results = {};
        let hasAnyData = false;
        
        // Load results for each calculator type
        for (const name of Object.keys(CALCULATORS)) {
            const data = await firebaseAuth.loadCalculatorResults(name);
            if (data) {
                results[name] = data;
                hasAnyData = true;
                console.log(`✅ Loaded ${name} results from Firebase`);
            }
        }
        
        if (!hasAnyData) {
            console.log('No cached results found in Firebase');
            return null;
        }
        
        console.log('✅ All calculator results loaded from Firebase');
        return results;
    } catch (error) {
        console.error('Error loading results from Firebase:', error);
        return null;
    }
}

/**
 * Connect to farm and load data
 * @param {string} farmId - Farm ID
 * @param {string} apiKey - API Key
 * @param {number} retryCount - Number of retries attempted (internal use)
 */
async function connectFarm(farmId, apiKey, retryCount = 0) {
    try {
        showScreen('loading');
        updateLoadingStep('step-prices', 'loading');
        
        // Reset loading status message
        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus) {
            loadingStatus.textContent = 'Fetching farm data...';
            loadingStatus.style.color = '';
        }
        
        console.log('Starting connection process...');
        console.log('Farm ID:', farmId);
        console.log('API Key length:', apiKey.length);
        
        // Fetch all data
        const { prices, farmData } = await api.fetchAllData(farmId, apiKey);
        
        // Save raw API data to Firebase if signed in
        if (firebaseAuth.isSignedIn()) {
            firebaseAuth.saveRawAPIData(prices, farmData).catch(err => {
                console.error('Failed to save raw API data to Firebase:', err);
            });
        }
        
        updateLoadingStep('step-prices', 'complete');
        updateLoadingStep('step-farm', 'complete');
        updateLoadingStep('step-items', 'loading');
        
        // Detect items and calculate boosts
        const detectedItems = itemDetector.detectItems(farmData);
        const boosts = detectedItems.boosts;
        
        updateLoadingStep('step-items', 'complete');
        updateLoadingStep('step-calc', 'loading');
        
        // Update app state - calculators will run via dashboard.js
        appState = {
            isConnected: true,
            farmId,
            apiKey,
            prices,
            farmData,
            detectedItems,
            boosts,
            results: {}, // Will be populated by dashboard
            currentCalculator: 'overview',
        };
        
        // Save last update time
        storage.saveLastUpdate();
        
        updateLoadingStep('step-calc', 'complete');
        
        // Show dashboard - this will initialize all calculators via dashboard.js
        showDashboard();
        
    } catch (error) {
        console.error('Connection error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Check if it's a rate limit error
        if (error.message.includes('Rate limit exceeded') && retryCount < 3) {
            const waitTime = 15;
            console.log(`⏳ Rate limit hit. Waiting ${waitTime} seconds before retry ${retryCount + 1}/3...`);
            
            // Update loading screen message
            const loadingStatus = document.getElementById('loading-status');
            if (loadingStatus) {
                loadingStatus.textContent = `⏳ Rate limit error; waiting ${waitTime} seconds and retrying (${retryCount + 1}/3)...`;
                loadingStatus.style.color = '#ff9800';
            }
            
            // Wait 15 seconds
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            // Reset loading status message
            if (loadingStatus) {
                loadingStatus.textContent = 'Retrying connection...';
                loadingStatus.style.color = '';
            }
            
            // Retry the connection
            console.log('🔄 Retrying connection...');
            return await connectFarm(farmId, apiKey, retryCount + 1);
        }
        
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
    
    // Initialize dashboard overview with cached data
    dashboardModule.initializeDashboard().catch(err => {
        console.error('Failed to initialize dashboard:', err);
    });
    
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
    // Special case for overview - it's handled by dashboard.js
    if (calculatorName === 'overview') {
        dashboardModule.initializeDashboard().catch(err => {
            console.error('Failed to render overview:', err);
        });
        return;
    }
    
    // Handle calculator views
    const container = document.getElementById(`${calculatorName}-results`);
    if (!container) return;
    
    // Check if economic analyzer is ready
    if (!window.economicAnalyzer) {
        container.innerHTML = '<p class="error">Loading calculator... Please wait.</p>';
        return;
    }
    
    // Render based on calculator type
    switch(calculatorName) {
        case 'cows':
            cowView.renderCowView(container);
            break;
        case 'chickens':
            container.innerHTML = '<p>Chicken calculator coming soon! Will display level-by-level egg production analysis.</p>';
            break;
        case 'sheep':
            container.innerHTML = '<p>Sheep calculator coming soon! Will display level-by-level wool production analysis.</p>';
            break;
        case 'resources':
            container.innerHTML = '<p>Resource calculator coming soon! Will display tool cost and profit analysis.</p>';
            break;
        case 'greenhouse':
            container.innerHTML = '<p>Greenhouse calculator coming soon! Will display crop profitability with oil costs.</p>';
            break;
        case 'cooking':
            container.innerHTML = '<p>Cooking calculator coming soon! Will display recipe time and profit analysis.</p>';
            break;
        default:
            container.innerHTML = '<p>Calculator not found</p>';
    }
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
 * Open raw data viewer modal
 */
async function openRawDataViewer() {
    const modal = document.getElementById('raw-data-modal');
    const content = document.getElementById('raw-data-content');
    
    if (!modal || !content) return;
    
    // Show modal
    modal.style.display = 'flex';
    content.textContent = 'Loading raw API data...';
    
    try {
        // Try to load from Firebase first
        let rawData = null;
        if (firebaseAuth.isSignedIn()) {
            rawData = await firebaseAuth.loadRawAPIData();
        }
        
        // If no Firebase data, use current app state
        if (!rawData && appState.prices && appState.farmData) {
            rawData = {
                prices: appState.prices,
                farmData: appState.farmData,
                timestamp: new Date(),
            };
        }
        
        if (rawData) {
            const formattedData = {
                timestamp: rawData.timestamp ? new Date(rawData.timestamp.seconds * 1000).toISOString() : new Date().toISOString(),
                prices: rawData.prices,
                farmData: rawData.farmData,
            };
            content.textContent = JSON.stringify(formattedData, null, 2);
        } else {
            content.textContent = 'No API data available. Please connect to your farm first.';
        }
    } catch (error) {
        console.error('Error loading raw data:', error);
        content.textContent = 'Error loading raw API data. Check console for details.';
    }
}

/**
 * Close raw data viewer modal
 */
function closeRawDataModal() {
    const modal = document.getElementById('raw-data-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Copy raw data to clipboard
 */
async function copyRawDataToClipboard() {
    const content = document.getElementById('raw-data-content');
    if (!content) return;
    
    try {
        await navigator.clipboard.writeText(content.textContent);
        
        // Show feedback
        const btn = document.getElementById('copy-raw-data-btn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Copy error:', error);
        alert('Failed to copy to clipboard');
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
