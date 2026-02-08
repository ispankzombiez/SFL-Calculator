/**
 * API Integration Module
 * Handles communication with sfl.world and Sunflower Land farm APIs
 */

const API_ENDPOINTS = {
    prices: 'https://sfl.world/api/v1/prices',
    farm: 'https://api.sunflower-land.com/community/farms',
};

const CACHE_DURATION = {
    prices: 60 * 60 * 1000, // 1 hour in milliseconds
    farm: 5 * 60 * 1000, // 5 minutes (can refresh more frequently)
};

// Try multiple CORS proxies in order of preference
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/raw?url=',
];

let currentProxyIndex = 0;

/**
 * Build URL with CORS proxy if needed
 * @param {string} url - Original URL
 * @returns {string} Proxied URL
 */
function proxifyUrl(url) {
    const proxy = CORS_PROXIES[currentProxyIndex];
    return proxy + encodeURIComponent(url);
}

/**
 * Try next CORS proxy in the list
 */
function tryNextProxy() {
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    console.log(`Switching to proxy: ${CORS_PROXIES[currentProxyIndex]}`);
}

/**
 * Fetch P2P market prices from sfl.world
 * @returns {Promise<Object>} Price map { itemName: price }
 */
export async function fetchP2PPrices() {
    try {
        // Check cache first
        const cached = getCachedData('prices');
        if (cached) {
            console.log('Using cached price data');
            return cached.data;
        }

        console.log('Fetching fresh price data from sfl.world...');
        
        // STEP 1: Try direct request first
        try {
            const directResponse = await fetch(API_ENDPOINTS.prices);
            
            if (directResponse.ok) {
                const prices = await directResponse.json();
                setCachedData('prices', prices, CACHE_DURATION.prices);
                console.log(`✅ Fetched ${Object.keys(prices).length} item prices (direct)`);
                return prices;
            }
        } catch (directError) {
            console.log('Direct price request failed, trying proxy...', directError.message);
        }
        
        // STEP 2: Try with proxy if direct failed
        const response = await fetch(proxifyUrl(API_ENDPOINTS.prices));
        
        if (!response.ok) {
            throw new Error(`Price API returned ${response.status}: ${response.statusText}`);
        }

        const prices = await response.json();
        
        // Cache the results
        setCachedData('prices', prices, CACHE_DURATION.prices);
        
        console.log(`✅ Fetched ${Object.keys(prices).length} item prices (via proxy)`);
        return prices;
        
    } catch (error) {
        console.error('Error fetching P2P prices:', error);
        
        // Try to use fallback data
        try {
            console.log('Attempting to load fallback prices...');
            const fallbackResponse = await fetch('data/fallback-prices.json');
            if (fallbackResponse.ok) {
                const fallbackPrices = await fallbackResponse.json();
                console.warn('Using fallback price data');
                return fallbackPrices;
            }
        } catch (fallbackError) {
            console.error('Fallback prices also unavailable:', fallbackError);
        }
        
        // Provide more specific error message
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            throw new Error('Unable to fetch market prices. This could be due to: network issues, CORS restrictions, or the sfl.world API being temporarily unavailable. Using fallback prices if available.');
        }
        throw new Error(`Market prices error: ${error.message}`);
    }
}

/**
 * Fetch farm data from Sunflower Land API
 * @param {string} farmId - The farm ID
 * @param {string} apiKey - User's API key
 * @returns {Promise<Object>} Farm data
 */
export async function fetchFarmData(farmId, apiKey) {
    if (!farmId || !apiKey) {
        throw new Error('Farm ID and API key are required');
    }

    try {
        // Check cache first (shorter duration for farm data)
        const cacheKey = `farm_${farmId}`;
        const cached = getCachedData(cacheKey);
        if (cached) {
            console.log('Using cached farm data');
            return cached.data;
        }

        console.log(`Fetching farm data for farm ${farmId}...`);
        const url = `${API_ENDPOINTS.farm}/${farmId}`;
        
        // STEP 1: Try direct request first (API might support CORS natively)
        console.log('Attempting direct API request...');
        try {
            const directResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            });

            if (directResponse.ok) {
                const farmData = await directResponse.json();
                setCachedData(cacheKey, farmData, CACHE_DURATION.farm);
                console.log('✅ Farm data fetched successfully (direct)');
                return farmData;
            } else {
                await handleFarmAPIError(directResponse);
            }
        } catch (directError) {
            console.log('Direct request failed (likely CORS), trying proxies...', directError.message);
        }
        
        // STEP 2: Try with CORS proxies as fallback
        let lastError = null;
        const maxProxyRetries = CORS_PROXIES.length;
        
        for (let i = 0; i < maxProxyRetries; i++) {
            try {
                console.log(`Trying proxy ${i + 1}/${maxProxyRetries}: ${CORS_PROXIES[currentProxyIndex]}`);
                const response = await fetch(proxifyUrl(url), {
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    await handleFarmAPIError(response);
                }

                const farmData = await response.json();
                
                // Cache the results
                setCachedData(cacheKey, farmData, CACHE_DURATION.farm);
                
                console.log('✅ Farm data fetched successfully via proxy');
                return farmData;
                
            } catch (error) {
                console.warn(`❌ Proxy attempt ${i + 1}/${maxProxyRetries} failed:`, error.message);
                lastError = error;
                
                // If not the last attempt, try next proxy
                if (i < maxProxyRetries - 1) {
                    tryNextProxy();
                    await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay before retry
                }
            }
        }
        
        // All proxies failed
        console.error('All proxy attempts exhausted');
        const errorMsg = 'Unable to connect to Sunflower Land API. Tried direct connection and multiple CORS proxies. This may be due to: (1) Network/firewall restrictions, (2) API temporarily unavailable, (3) CORS proxy limitations with custom headers. Please try again later or check your network settings.';
        throw new Error(errorMsg);
        
    } catch (error) {
        console.error('Error fetching farm data:', error);
        
        // Provide more specific error message for fetch failures
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            throw new Error('Unable to connect to Sunflower Land API. Please check: (1) Your internet connection, (2) Your API key is valid, (3) The Sunflower Land API is accessible. Note: Some browsers/networks may block this request due to CORS policies.');
        }
        throw error;
    }
}

/**
 * Handle farm API errors with specific messages
 * @param {Response} response - Fetch response object
 */
async function handleFarmAPIError(response) {
    const status = response.status;
    let errorMessage = '';

    switch (status) {
        case 401:
            errorMessage = 'Invalid API key. Please check your key and try again.';
            break;
        case 404:
            errorMessage = 'Farm not found. Please verify your Farm ID.';
            break;
        case 429:
            errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
            // Implement exponential backoff
            await new Promise(resolve => setTimeout(resolve, 5000));
            break;
        case 500:
        case 502:
        case 503:
            errorMessage = 'Sunflower Land API is temporarily unavailable. Please try again later.';
            break;
        default:
            errorMessage = `API error: ${response.statusText}`;
    }

    throw new Error(errorMessage);
}

/**
 * Fetch both APIs in parallel for faster loading
 * @param {string} farmId - The farm ID
 * @param {string} apiKey - User's API key
 * @returns {Promise<Object>} { prices, farmData }
 */
export async function fetchAllData(farmId, apiKey) {
    try {
        const [prices, farmData] = await Promise.all([
            fetchP2PPrices(),
            fetchFarmData(farmId, apiKey)
        ]);

        return { prices, farmData };
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

/**
 * Clear all cached farm data (useful when disconnecting)
 */
export function clearFarmCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('cache_farm_') || key.startsWith('cache_prices')) {
            localStorage.removeItem(key);
        }
    });
    console.log('Farm cache cleared');
}

/**
 * Clear only price cache (force refresh)
 */
export function clearPriceCache() {
    localStorage.removeItem('cache_prices');
    console.log('Price cache cleared');
}

/**
 * Get cached data if still valid
 * @param {string} key - Cache key
 * @returns {Object|null} { data, timestamp } or null if expired/missing
 */
function getCachedData(key) {
    try {
        const cacheKey = `cache_${key}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) return null;
        
        const { data, timestamp, duration } = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - timestamp < duration) {
            return { data, timestamp };
        }
        
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
        return null;
        
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
}

/**
 * Set cached data with timestamp
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} duration - Cache duration in milliseconds
 */
function setCachedData(key, data, duration) {
    try {
        const cacheKey = `cache_${key}`;
        const cacheObject = {
            data,
            timestamp: Date.now(),
            duration,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
    } catch (error) {
        console.error('Error setting cache:', error);
        // localStorage might be full or disabled
    }
}

/**
 * Get cache timestamp for display
 * @param {string} key - Cache key
 * @returns {string|null} Human-readable timestamp or null
 */
export function getCacheTimestamp(key) {
    const cached = getCachedData(key);
    if (!cached) return null;
    
    const date = new Date(cached.timestamp);
    return date.toLocaleString();
}

/**
 * Check if cache exists and is valid
 * @param {string} key - Cache key
 * @returns {boolean} True if valid cache exists
 */
export function hasCachedData(key) {
    return getCachedData(key) !== null;
}
