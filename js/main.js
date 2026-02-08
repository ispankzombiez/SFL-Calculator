/**
 * Main Application Module
 * Orchestrates the entire application flow
 */

import * as api from './api.js';
import * as storage from './storage.js';
import * as itemDetector from './item-detector.js';

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
document.addEventListener('DOMContentLoaded', () => {
    console.log('SFL Calculator initializing...');
    
    // Check if user has saved credentials
    if (storage.hasCredentials()) {
        const farmId = storage.getFarmId();
        const apiKey = storage.getApiKey();
        
        console.log('Found saved credentials, auto-connecting...');
        connectFarm(farmId, apiKey);
    } else {
        showScreen('landing');
    }
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Set up all event listeners
 */
function setupEventListeners() {
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
    
    // Save credentials and connect
    storage.saveFarmId(farmId);
    storage.saveApiKey(apiKey);
    
    await connectFarm(farmId, apiKey);
}

/**
 * Connect to farm and load data
 */
async function connectFarm(farmId, apiKey) {
    try {
        showScreen('loading');
        updateLoadingStep('step-prices', 'loading');
        
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
        showError(error.message);
        showScreen('landing');
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
