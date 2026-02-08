/**
 * Storage Module
 * Manages localStorage for farm credentials and calculator results
 */

const STORAGE_KEYS = {
    farmId: 'sfl_farm_id',
    apiKey: 'sfl_api_key',
    results: 'sfl_calculator_results',
    lastUpdate: 'sfl_last_update',
};

/**
 * Save farm ID to localStorage
 * @param {string} farmId - The farm ID
 */
export function saveFarmId(farmId) {
    try {
        localStorage.setItem(STORAGE_KEYS.farmId, farmId);
        console.log('Farm ID saved');
    } catch (error) {
        console.error('Error saving farm ID:', error);
        throw new Error('Unable to save data. Please check browser settings.');
    }
}

/**
 * Get saved farm ID
 * @returns {string|null} Farm ID or null if not set
 */
export function getFarmId() {
    try {
        return localStorage.getItem(STORAGE_KEYS.farmId);
    } catch (error) {
        console.error('Error reading farm ID:', error);
        return null;
    }
}

/**
 * Save API key to localStorage (obfuscated)
 * @param {string} apiKey - The API key
 */
export function saveApiKey(apiKey) {
    try {
        // Simple obfuscation (not real encryption - client-side JS is always visible)
        // This is mainly to prevent casual viewing, not security against determined attackers
        const obfuscated = btoa(apiKey); // Base64 encode
        localStorage.setItem(STORAGE_KEYS.apiKey, obfuscated);
        console.log('API key saved (obfuscated)');
    } catch (error) {
        console.error('Error saving API key:', error);
        throw new Error('Unable to save data. Please check browser settings.');
    }
}

/**
 * Get saved API key (deobfuscated)
 * @returns {string|null} API key or null if not set
 */
export function getApiKey() {
    try {
        const obfuscated = localStorage.getItem(STORAGE_KEYS.apiKey);
        if (!obfuscated) return null;
        
        // Decode from Base64
        return atob(obfuscated);
    } catch (error) {
        console.error('Error reading API key:', error);
        return null;
    }
}

/**
 * Check if user credentials are saved
 * @returns {boolean} True if both farm ID and API key exist
 */
export function hasCredentials() {
    return getFarmId() !== null && getApiKey() !== null;
}

/**
 * Save calculator results
 * @param {string} calculatorType - Type of calculator (cows, sheep, etc.)
 * @param {Object} results - Calculation results
 */
export function saveResults(calculatorType, results) {
    try {
        const allResults = getAllResults();
        allResults[calculatorType] = {
            data: results,
            timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEYS.results, JSON.stringify(allResults));
        console.log(`Results saved for ${calculatorType}`);
    } catch (error) {
        console.error('Error saving results:', error);
        // Non-critical - don't throw
    }
}

/**
 * Get results for a specific calculator
 * @param {string} calculatorType - Type of calculator
 * @returns {Object|null} Results or null if not found
 */
export function getResults(calculatorType) {
    try {
        const allResults = getAllResults();
        return allResults[calculatorType] || null;
    } catch (error) {
        console.error('Error reading results:', error);
        return null;
    }
}

/**
 * Get all saved calculator results
 * @returns {Object} All results organized by calculator type
 */
export function getAllResults() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.results);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error reading all results:', error);
        return {};
    }
}

/**
 * Save last update timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 */
export function saveLastUpdate(timestamp = Date.now()) {
    try {
        localStorage.setItem(STORAGE_KEYS.lastUpdate, timestamp.toString());
    } catch (error) {
        console.error('Error saving last update time:', error);
    }
}

/**
 * Get last update timestamp
 * @returns {number|null} Unix timestamp or null
 */
export function getLastUpdate() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.lastUpdate);
        return stored ? parseInt(stored, 10) : null;
    } catch (error) {
        console.error('Error reading last update time:', error);
        return null;
    }
}

/**
 * Get human-readable last update time
 * @returns {string} Formatted time string
 */
export function getLastUpdateFormatted() {
    const timestamp = getLastUpdate();
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    
    // Show relative time if recent
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 24 hours
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
        // Show full date/time
        return date.toLocaleString();
    }
}

/**
 * Clear all stored data and disconnect
 */
export function clearAllData() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Also clear any cache data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('All data cleared');
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
}

/**
 * Clear only cached results (keep credentials)
 */
export function clearCache() {
    try {
        localStorage.removeItem(STORAGE_KEYS.results);
        
        // Clear cache data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('Cache cleared');
        return true;
    } catch (error) {
        console.error('Error clearing cache:', error);
        return false;
    }
}

/**
 * Export all data as JSON (for backup/download)
 * @returns {string} JSON string of all data
 */
export function exportData() {
    try {
        const data = {
            farmId: getFarmId(),
            lastUpdate: getLastUpdate(),
            results: getAllResults(),
            exportDate: new Date().toISOString(),
        };
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error exporting data:', error);
        throw new Error('Unable to export data');
    }
}

/**
 * Get storage usage information
 * @returns {Object} Storage stats
 */
export function getStorageInfo() {
    try {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        
        return {
            used: totalSize,
            usedKB: (totalSize / 1024).toFixed(2),
            itemCount: localStorage.length,
        };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return { used: 0, usedKB: '0', itemCount: 0 };
    }
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if format is valid
 */
export function validateApiKey(apiKey) {
    // Basic validation: should start with "sfl." and have reasonable length
    return typeof apiKey === 'string' && 
           apiKey.startsWith('sfl.') && 
           apiKey.length > 20;
}

/**
 * Validate farm ID format
 * @param {string} farmId - Farm ID to validate
 * @returns {boolean} True if format is valid
 */
export function validateFarmId(farmId) {
    // Farm ID should be numeric
    return /^\d+$/.test(farmId);
}
