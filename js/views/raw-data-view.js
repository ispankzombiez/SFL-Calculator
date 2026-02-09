/**
 * Raw Data Viewer
 * Displays raw API responses in a human-readable format for debugging
 */

/**
 * Render the raw data view
 * @param {HTMLElement} container - Container to render into
 */
export async function renderRawDataView(container) {
    if (!window.loadRawAPIData) {
        container.innerHTML = '<p class="error">Raw API data loader not available. Please refresh the page.</p>';
        return;
    }

    // Show loading state
    container.innerHTML = '<div class="loading">Loading raw data...</div>';

    const rawData = await window.loadRawAPIData();
    
    if (!rawData) {
        container.innerHTML = `
            <div class="info-box">
                <p>📭 No cached data available</p>
                <p>Connect your farm first to load API data.</p>
            </div>
        `;
        return;
    }

    const { prices, farmData, timestamp } = rawData;
    
    // Build the HTML
    let html = `
        <div class="raw-data-viewer">
            <div class="data-header">
                <h3>🕐 Data Timestamp</h3>
                <p>${new Date(timestamp).toLocaleString()}</p>
                <button id="refresh-raw-data" class="btn btn-secondary">
                    <span class="icon">🔄</span>
                    <span class="text">Refresh Data</span>
                </button>
            </div>

            <!-- Price Data Section -->
            <section class="data-section">
                <header class="section-header">
                    <h3>💰 Price Data</h3>
                    <p class="section-subtitle">Current P2P market prices from sfl.world</p>
                </header>
                <div class="data-content">
                    ${renderPriceData(prices)}
                </div>
            </section>

            <!-- Farm Data Section -->
            <section class="data-section">
                <header class="section-header">
                    <h3>🏡 Farm Data</h3>
                    <p class="section-subtitle">Your farm information from Sunflower Land API</p>
                </header>
                <div class="data-content">
                    ${renderFarmData(farmData)}
                </div>
            </section>

            <!-- JSON Export Section -->
            <section class="data-section">
                <header class="section-header">
                    <h3>📦 Export Data</h3>
                </header>
                <div class="export-buttons">
                    <button id="copy-prices-json" class="btn btn-secondary">
                        Copy Prices JSON
                    </button>
                    <button id="copy-farm-json" class="btn btn-secondary">
                        Copy Farm JSON
                    </button>
                    <button id="download-all-json" class="btn btn-primary">
                        Download All Data
                    </button>
                </div>
            </section>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Attach event listeners
    attachEventListeners(rawData);
}

/**
 * Render price data in readable format
 */
function renderPriceData(prices) {
    // Extract actual P2P prices from nested structure
    const p2pPrices = prices?.data?.p2p || prices;
    
    if (!p2pPrices || Object.keys(p2pPrices).length === 0) {
        return '<p class="no-data">No price data available</p>';
    }

    // Group items by category
    const categories = {
        'Animals': ['Milk', 'Egg', 'Wool', 'Leather', 'Feather'],
        'Animal Feed': ['Chicken Feed', 'Cow Feed', 'Sheep Feed'],
        'Resources': ['Wood', 'Stone', 'Iron', 'Gold', 'Crimstone', 'Sunstone', 'Oil'],
        'Crops': ['Sunflower', 'Potato', 'Pumpkin', 'Carrot', 'Cabbage', 'Beetroot', 'Cauliflower', 'Parsnip', 'Eggplant', 'Corn', 'Radish', 'Wheat', 'Kale', 'Rice', 'Grape', 'Olive'],
        'Seeds': ['Sunflower Seed', 'Potato Seed', 'Pumpkin Seed', 'Carrot Seed', 'Cabbage Seed', 'Beetroot Seed', 'Cauliflower Seed', 'Parsnip Seed', 'Eggplant Seed', 'Corn Seed', 'Radish Seed', 'Wheat Seed', 'Kale Seed', 'Rice Seed', 'Grape Seed', 'Olive Seed']
    };

    let html = '<div class="price-categories">';

    for (const [category, items] of Object.entries(categories)) {
        const categoryItems = items.filter(item => p2pPrices[item] !== undefined);
        
        if (categoryItems.length > 0) {
            html += `
                <div class="price-category">
                    <h4>${category}</h4>
                    <div class="price-grid">
                        ${categoryItems.map(item => `
                            <div class="price-item">
                                <span class="item-name">${item}</span>
                                <span class="item-price">${formatPrice(p2pPrices[item])} SFL</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    // Add any uncategorized items
    const categorizedItems = Object.values(categories).flat();
    const uncategorizedItems = Object.keys(p2pPrices).filter(item => !categorizedItems.includes(item));
    
    if (uncategorizedItems.length > 0) {
        html += `
            <div class="price-category">
                <h4>Other Items</h4>
                <div class="price-grid">
                    ${uncategorizedItems.map(item => `
                        <div class="price-item">
                            <span class="item-name">${item}</span>
                            <span class="item-price">${formatPrice(p2pPrices[item])} SFL</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

/**
 * Render farm data in readable format
 */
function renderFarmData(farmData) {
    // Extract actual farm data from nested structure
    const farm = farmData?.farm || farmData;
    
    if (!farm) {
        return '<p class="no-data">No farm data available</p>';
    }

    let html = '<div class="farm-sections">';

    // Farm ID and Basic Info
    if (farm.id || farm.farmId) {
        html += `
            <div class="farm-section">
                <h4>🆔 Farm Identification</h4>
                <div class="data-grid">
                    ${farm.id ? `<div class="data-item"><span class="label">ID:</span><span class="value">${farm.id}</span></div>` : ''}
                    ${farm.farmId ? `<div class="data-item"><span class="label">Farm ID:</span><span class="value">${farm.farmId}</span></div>` : ''}
                    ${farm.owner ? `<div class="data-item"><span class="label">Owner:</span><span class="value">${farm.owner.slice(0, 10)}...${farm.owner.slice(-8)}</span></div>` : ''}
                </div>
            </div>
        `;
    }

    // Inventory
    if (farm.inventory) {
        const inv = farm.inventory;
        html += `
            <div class="farm-section">
                <h4>🎒 Inventory</h4>
                <div class="inventory-display">
                    ${renderInventorySection('Resources', inv, ['Wood', 'Stone', 'Iron', 'Gold', 'Crimstone', 'Sunstone', 'Oil'])}
                    ${renderInventorySection('Animal Products', inv, ['Milk', 'Egg', 'Wool', 'Leather', 'Feather'])}
                    ${renderInventorySection('Animal Feed', inv, ['Chicken Feed', 'Cow Feed', 'Sheep Feed'])}
                    ${renderInventorySection('Crops', inv, ['Sunflower', 'Potato', 'Pumpkin', 'Carrot', 'Cabbage', 'Beetroot', 'Cauliflower', 'Parsnip', 'Eggplant', 'Corn', 'Radish', 'Wheat', 'Kale', 'Rice', 'Grape', 'Olive'])}
                </div>
                <details class="expandable-section">
                    <summary>View All Inventory Items (${Object.keys(inv).length} items)</summary>
                    <div class="data-grid">
                        ${Object.entries(inv).sort(([a], [b]) => a.localeCompare(b)).map(([item, qty]) => `
                            <div class="data-item">
                                <span class="label">${item}:</span>
                                <span class="value">${formatNumber(qty)}</span>
                            </div>
                        `).join('')}
                    </div>
                </details>
            </div>
        `;
    }

    // Animals - Parse from henHouse and barn
    const chickens = farm.henHouse?.animals ? Object.values(farm.henHouse.animals) : [];
    const barnAnimals = farm.barn?.animals ? Object.values(farm.barn.animals) : [];
    
    if (chickens.length > 0 || barnAnimals.length > 0) {
        html += `
            <div class="farm-section">
                <h4>🐔 Animals</h4>
        `;
        
        if (chickens.length > 0) {
            html += `
                <div class="animal-group">
                    <h5>Hen House (${chickens.length} chickens)</h5>
                    <div class="data-grid">
                        ${chickens.map((animal, i) => `
                            <div class="data-item">
                                <span class="label">Chicken ${i + 1}:</span>
                                <span class="value">Lvl ${animal.experience || 0} | ${animal.state || 'idle'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (barnAnimals.length > 0) {
            const cows = barnAnimals.filter(a => a.type === 'Cow');
            const sheep = barnAnimals.filter(a => a.type === 'Sheep');
            
            if (cows.length > 0) {
                html += `
                    <div class="animal-group">
                        <h5>Barn - Cows (${cows.length})</h5>
                        <div class="data-grid">
                            ${cows.map((animal, i) => `
                                <div class="data-item">
                                    <span class="label">Cow ${i + 1}:</span>
                                    <span class="value">Lvl ${animal.experience || 0} | ${animal.state || 'idle'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (sheep.length > 0) {
                html += `
                    <div class="animal-group">
                        <h5>Barn - Sheep (${sheep.length})</h5>
                        <div class="data-grid">
                            ${sheep.map((animal, i) => `
                                <div class="data-item">
                                    <span class="label">Sheep ${i + 1}:</span>
                                    <span class="value">Lvl ${animal.experience || 0} | ${animal.state || 'idle'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        html += `</div>`;
    }
    
    // Buildings
    if (farm.buildings && Object.keys(farm.buildings).length > 0) {
        html += `
            <div class="farm-section">
                <h4>🏗️ Buildings</h4>
                <div class="data-grid">
                    ${Object.entries(farm.buildings).map(([building, data]) => {
                        const level = data.coordinates?.length || 1;
                        return `
                            <div class="data-item">
                                <span class="label">${building}:</span>
                                <span class="value">Level ${level}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Skills/Bumpkin
    if (farm.bumpkin?.skills) {
        const skills = farm.bumpkin.skills;
        html += `
            <div class="farm-section">
                <h4>⭐ Bumpkin Skills</h4>
                <div class="data-grid">
                    ${Object.entries(skills).sort(([a], [b]) => a.localeCompare(b)).map(([skill, level]) => `
                        <div class="data-item">
                            <span class="label">${skill}:</span>
                            <span class="value">✓</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Wearables/Collectibles
    if (farm.wardrobe || farm.collectibles) {
        html += `
            <div class="farm-section">
                <h4>👕 Wearables & Collectibles</h4>
                ${farm.wardrobe ? `
                    <details class="expandable-section">
                        <summary>Wardrobe (${Object.keys(farm.wardrobe).length} items)</summary>
                        <div class="data-grid">
                            ${Object.keys(farm.wardrobe).sort().map(item => `
                                <div class="data-item"><span class="label">${item}</span><span class="value">✓</span></div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
                ${farm.collectibles ? `
                    <details class="expandable-section">
                        <summary>Collectibles (${Object.keys(farm.collectibles).length} placed)</summary>
                        <div class="data-grid">
                            ${Object.entries(farm.collectibles).map(([id, data]) => `
                                <div class="data-item">
                                    <span class="label">${data.id || id}:</span>
                                    <span class="value">x:${data.coordinates?.x || 0}, y:${data.coordinates?.y || 0}</span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
            </div>
        `;
    }

    // Full Raw JSON (Collapsible)
    html += `
        <div class="farm-section">
            <h4>🔍 Complete Farm Data (Raw JSON)</h4>
            <details class="expandable-section">
                <summary>Expand to view full JSON structure</summary>
                <pre class="json-block">${JSON.stringify(farm, null, 2)}</pre>
            </details>
        </div>
    `;

    html += '</div>';
    return html;
}

/**
 * Render a specific inventory section
 */
function renderInventorySection(title, inventory, items) {
    const sectionItems = items.filter(item => inventory[item] && inventory[item] > 0);
    
    if (sectionItems.length === 0) return '';
    
    return `
        <div class="inventory-category">
            <h5>${title}</h5>
            <div class="data-grid">
                ${sectionItems.map(item => `
                    <div class="data-item">
                        <span class="label">${item}:</span>
                        <span class="value">${formatNumber(inventory[item])}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Attach event listeners
 */
function attachEventListeners(rawData) {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-raw-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="icon">⏳</span><span class="text">Refreshing...</span>';
            
            // Trigger farm data refresh
            const event = new CustomEvent('refreshFarmData');
            window.dispatchEvent(event);
            
            // Re-render after a short delay
            setTimeout(async () => {
                const container = document.getElementById('raw-data-container');
                if (container) {
                    await renderRawDataView(container);
                }
            }, 2000);
        });
    }

    // Copy prices JSON
    const copyPricesBtn = document.getElementById('copy-prices-json');
    if (copyPricesBtn) {
        copyPricesBtn.addEventListener('click', () => {
            copyToClipboard(JSON.stringify(rawData.prices, null, 2));
            showToast('Prices JSON copied to clipboard!');
        });
    }

    // Copy farm JSON
    const copyFarmBtn = document.getElementById('copy-farm-json');
    if (copyFarmBtn) {
        copyFarmBtn.addEventListener('click', () => {
            copyToClipboard(JSON.stringify(rawData.farmData, null, 2));
            showToast('Farm JSON copied to clipboard!');
        });
    }

    // Download all JSON
    const downloadBtn = document.getElementById('download-all-json');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(rawData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sfl-farm-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Data downloaded!');
        });
    }
}

/**
 * Helper Functions
 */

function formatPrice(price) {
    if (price === undefined || price === null) return 'N/A';
    return parseFloat(price).toFixed(4);
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    if (typeof num === 'string') return num;
    return num.toLocaleString();
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color, #4CAF50);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}
