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

    // Farm Overview - Comprehensive top-level info
    html += `
        <div class="farm-section farm-overview">
            <h4>🏡 Farm Overview</h4>
            <div class="overview-grid">
                ${farm.id ? `
                    <div class="overview-item">
                        <span class="icon">🆔</span>
                        <div class="item-content">
                            <span class="label">Farm ID</span>
                            <span class="value">${farm.id}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.owner ? `
                    <div class="overview-item">
                        <span class="icon">👤</span>
                        <div class="item-content">
                            <span class="label">Owner Address</span>
                            <span class="value">${farm.owner.slice(0, 10)}...${farm.owner.slice(-8)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.bumpkin?.username ? `
                    <div class="overview-item">
                        <span class="icon">🧑‍🌾</span>
                        <div class="item-content">
                            <span class="label">Username</span>
                            <span class="value">${farm.bumpkin.username}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.balance !== undefined ? `
                    <div class="overview-item highlight">
                        <span class="icon">🌻</span>
                        <div class="item-content">
                            <span class="label">SFL Balance</span>
                            <span class="value">${formatNumber(farm.balance)} SFL</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.coins !== undefined ? `
                    <div class="overview-item highlight">
                        <span class="icon">🪙</span>
                        <div class="item-content">
                            <span class="label">Coins</span>
                            <span class="value">${formatNumber(farm.coins)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.gems !== undefined && farm.gems > 0 ? `
                    <div class="overview-item highlight">
                        <span class="icon">💎</span>
                        <div class="item-content">
                            <span class="label">Gems</span>
                            <span class="value">${formatNumber(farm.gems)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.bumpkin?.experience !== undefined ? `
                    <div class="overview-item">
                        <span class="icon">⭐</span>
                        <div class="item-content">
                            <span class="label">Bumpkin XP</span>
                            <span class="value">${formatNumber(farm.bumpkin.experience)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.bumpkin?.level !== undefined ? `
                    <div class="overview-item">
                        <span class="icon">📊</span>
                        <div class="item-content">
                            <span class="label">Bumpkin Level</span>
                            <span class="value">${farm.bumpkin.level}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.previousBalance !== undefined ? `
                    <div class="overview-item">
                        <span class="icon">📈</span>
                        <div class="item-content">
                            <span class="label">Previous Balance</span>
                            <span class="value">${formatNumber(farm.previousBalance)} SFL</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.previousCoins !== undefined ? `
                    <div class="overview-item">
                        <span class="icon">📈</span>
                        <div class="item-content">
                            <span class="label">Previous Coins</span>
                            <span class="value">${formatNumber(farm.previousCoins)}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.createdAt !== undefined ? `
                    <div class="overview-item">
                        <span class="icon">📅</span>
                        <div class="item-content">
                            <span class="label">Farm Created</span>
                            <span class="value">${new Date(farm.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.tradedAt !== undefined ? `
                    <div class="overview-item">
                        <span class="icon">🔄</span>
                        <div class="item-content">
                            <span class="label">Last Trade</span>
                            <span class="value">${new Date(farm.tradedAt).toLocaleString()}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.island?.type ? `
                    <div class="overview-item">
                        <span class="icon">🏝️</span>
                        <div class="item-content">
                            <span class="label">Island Type</span>
                            <span class="value">${farm.island.type}${farm.island.upgradedAt ? ` (Upgraded: ${new Date(farm.island.upgradedAt).toLocaleDateString()})` : ''}${farm.island.previousExpansions ? ` | ${farm.island.previousExpansions} expansions` : ''}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.island?.sunstones !== undefined ? `
                    <div class="overview-item">
                        <span class="icon">🟡</span>
                        <div class="item-content">
                            <span class="label">Island Sunstones</span>
                            <span class="value">${farm.island.sunstones}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${farm.previousInventory ? `
                    <div class="overview-item">
                        <span class="icon">📦</span>
                        <div class="item-content">
                            <span class="label">Previous Inventory Items</span>
                            <span class="value">${Object.keys(farm.previousInventory).length}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Inventory
    if (farm.inventory) {
        const inv = farm.inventory;
        html += `
            <div class="farm-section">
                <h4>🎒 Inventory</h4>
                <div class="inventory-display">
                    ${renderInventorySection('Resources', inv, ['Wood', 'Stone', 'Iron', 'Gold', 'Crimstone', 'Sunstone', 'Oil'])}
                    ${renderInventorySection('Animal Products', inv, ['Milk', 'Egg', 'Wool', 'Merino Wool', 'Leather', 'Feather'])}
                    ${renderInventorySection('Animal Feed', inv, ['Chicken Feed', 'Cow Feed', 'Sheep Feed'])}
                    ${renderInventorySection('Crops', inv, ['Sunflower', 'Potato', 'Pumpkin', 'Carrot', 'Cabbage', 'Beetroot', 'Cauliflower', 'Parsnip', 'Eggplant', 'Corn', 'Radish', 'Wheat', 'Kale', 'Rice', 'Grape', 'Olive'])}
                    ${renderInventorySection('Seeds', inv, ['Sunflower Seed', 'Potato Seed', 'Pumpkin Seed', 'Carrot Seed', 'Cabbage Seed', 'Beetroot Seed', 'Cauliflower Seed', 'Parsnip Seed', 'Eggplant Seed', 'Corn Seed', 'Radish Seed', 'Wheat Seed', 'Kale Seed', 'Rice Seed', 'Grape Seed', 'Olive Seed'])}
                    ${renderInventorySection('Cooked Food', inv, ['Boiled Eggs', 'Mashed Potato', 'Pumpkin Soup', 'Bumpkin Broth', 'Roasted Cauliflower', 'Sauerkraut'])}
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
    
    // Crops Section
    if (farm.crops) {
        const crops = Object.values(farm.crops);
        if (crops.length > 0) {
            html += `
                <div class="farm-section">
                    <h4>🌾 Crops (${crops.length} plots)</h4>
                    <div class="data-grid">
                        ${crops.map((plot, i) => {
                            if (!plot.crop) return `
                                <div class="data-item">
                                    <span class="label">Plot ${i + 1}:</span>
                                    <span class="value">Empty${plot.createdAt ? ` | Created: ${new Date(plot.createdAt).toLocaleDateString()}` : ''}${plot.x !== undefined ? ` | (${plot.x}, ${plot.y})` : ''}</span>
                                </div>
                            `;
                            
                            const crop = plot.crop;
                            const plantedAt = crop.plantedAt ? new Date(crop.plantedAt).toLocaleString() : 'Unknown';
                            const boostTime = crop.boostedTime ? Math.floor(crop.boostedTime / 1000 / 60) : 0;
                            const hasCriticalHit = crop.criticalHit && Object.keys(crop.criticalHit).length > 0;
                            const fertiliser = plot.fertiliser ? `💧 ${plot.fertiliser.name}` : '';
                            const fertilisedAt = plot.fertiliser?.fertilisedAt ? ` (${new Date(plot.fertiliser.fertilisedAt).toLocaleString()})` : '';
                            
                            return `
                                <div class="data-item">
                                    <span class="label">${crop.name || 'Unknown'}:</span>
                                    <span class="value">
                                        Planted: ${plantedAt}
                                        ${boostTime > 0 ? ` | ⚡${boostTime}m boost` : ''}
                                        ${hasCriticalHit ? ' | ⭐ Critical' : ''}
                                        ${fertiliser ? ` | ${fertiliser}${fertilisedAt}` : ''}
                                        ${plot.x !== undefined ? ` | (${plot.x}, ${plot.y})` : ''}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Resource Nodes Section
    const resourceTypes = [
        { key: 'trees', name: 'Trees', icon: '🌳' },
        { key: 'stones', name: 'Stones', icon: '🪨' },
        { key: 'iron', name: 'Iron', icon: '⛏️' },
        { key: 'gold', name: 'Gold', icon: '🏆' },
        { key: 'crimstones', name: 'Crimstones', icon: '🔴' },
        { key: 'sunstones', name: 'Sunstones', icon: '🟡' },
        { key: 'oilReserves', name: 'Oil Reserves', icon: '🛢️' }
    ];
    
    const hasResources = resourceTypes.some(type => farm[type.key] && Object.keys(farm[type.key]).length > 0);
    
    if (hasResources) {
        html += `<div class="farm-section"><h4>⛏️ Resource Nodes</h4>`;
        
        resourceTypes.forEach(({ key, name, icon }) => {
            if (farm[key] && Object.keys(farm[key]).length > 0) {
                const nodes = Object.values(farm[key]);
                html += `
                    <div class="resource-group">
                        <h5>${icon} ${name} (${nodes.length})</h5>
                        <div class="data-grid">
                            ${nodes.map((node, i) => {
                                const amount = node.amount || 0;
                                const minedAt = node.minedAt ? new Date(node.minedAt).toLocaleString() : null;
                                const drilledAt = node.drilledAt ? new Date(node.drilledAt).toLocaleString() : null;
                                const coords = node.x !== undefined ? `(${node.x}, ${node.y})` : '';
                                const oil = node.oil?.amount || 0;
                                
                                return `
                                    <div class="data-item">
                                        <span class="label">${name} ${i + 1}:</span>
                                        <span class="value">
                                            ${amount > 0 ? `${amount} remaining` : oil > 0 ? `${oil} oil remaining` : 'Depleted'}
                                            ${minedAt ? ` | Mined: ${minedAt}` : ''}
                                            ${drilledAt ? ` | Drilled: ${drilledAt}` : ''}
                                            ${coords ? ` | ${coords}` : ''}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        html += `</div>`;
    }

    // Fruit Patches Section
    if (farm.fruitPatches) {
        const patches = Object.values(farm.fruitPatches);
        if (patches.length > 0) {
            html += `
                <div class="farm-section">
                    <h4>🍎 Fruit Patches (${patches.length})</h4>
                    <div class="data-grid">
                        ${patches.map((patch, i) => {
                            if (!patch.fruit) return `
                                <div class="data-item">
                                    <span class="label">Patch ${i + 1}:</span>
                                    <span class="value">Empty${patch.x !== undefined ? ` | (${patch.x}, ${patch.y})` : ''}</span>
                                </div>
                            `;
                            
                            const fruit = patch.fruit;
                            const plantedAt = fruit.plantedAt ? new Date(fruit.plantedAt).toLocaleString() : 'Unknown';
                            const harvestedAt = fruit.harvestedAt ? new Date(fruit.harvestedAt).toLocaleString() : null;
                            const harvestsLeft = fruit.harvestsLeft || 0;
                            
                            return `
                                <div class="data-item">
                                    <span class="label">${fruit.name || 'Unknown'}:</span>
                                    <span class="value">
                                        Planted: ${plantedAt}
                                        ${harvestsLeft > 0 ? ` | ${harvestsLeft} harvests left` : ''}
                                        ${harvestedAt ? ` | Last harvest: ${harvestedAt}` : ''}
                                        ${patch.x !== undefined ? ` | (${patch.x}, ${patch.y})` : ''}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Flower Beds Section
    if (farm.flowerBeds) {
        const beds = Object.values(farm.flowerBeds);
        if (beds.length > 0) {
            html += `
                <div class="farm-section">
                    <h4>🌸 Flower Beds (${beds.length})</h4>
                    <div class="data-grid">
                        ${beds.map((bed, i) => {
                            if (!bed.flower) return `
                                <div class="data-item">
                                    <span class="label">Bed ${i + 1}:</span>
                                    <span class="value">Empty${bed.x !== undefined ? ` | (${bed.x}, ${bed.y})` : ''}</span>
                                </div>
                            `;
                            
                            const flower = bed.flower;
                            const plantedAt = flower.plantedAt ? new Date(flower.plantedAt).toLocaleString() : 'Unknown';
                            const criticalHits = flower.criticalHit ? Object.entries(flower.criticalHit).filter(([k, v]) => v > 0).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
                            
                            return `
                                <div class="data-item">
                                    <span class="label">${flower.name || 'Unknown'}:</span>
                                    <span class="value">
                                        Planted: ${plantedAt}
                                        ${criticalHits ? ` | 🌟 ${criticalHits}` : ''}
                                        ${bed.x !== undefined ? ` | (${bed.x}, ${bed.y})` : ''}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Beehives Section
    if (farm.beehives) {
        const hives = Object.values(farm.beehives);
        if (hives.length > 0) {
            html += `
                <div class="farm-section">
                    <h4>🐝 Beehives (${hives.length})</h4>
                    <div class="data-grid">
                        ${hives.map((hive, i) => {
                            const honey = hive.honey?.produced || 0;
                            const updatedAt = hive.honey?.updatedAt ? new Date(hive.honey.updatedAt).toLocaleString() : null;
                            const swarm = hive.swarm ? '🐝 Swarm active' : '';
                            const flowers = hive.flowers || [];
                            const coords = hive.x !== undefined ? `(${hive.x}, ${hive.y})` : '';
                            
                            return `
                                <div class="data-item">
                                    <span class="label">Hive ${i + 1}:</span>
                                    <span class="value">
                                        ${formatNumber(honey)} honey produced
                                        ${updatedAt ? ` | Updated: ${updatedAt}` : ''}
                                        ${swarm ? ` | ${swarm}` : ''}
                                        ${flowers.length > 0 ? ` | ${flowers.length} flowers attached` : ''}
                                        ${coords ? ` | ${coords}` : ''}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Animals - Parse from henHouse and barn
    const chickens = farm.henHouse?.animals ? Object.values(farm.henHouse.animals) : [];
    const barnAnimals = farm.barn?.animals ? Object.values(farm.barn.animals) : [];
    const henHouseLevel = farm.henHouse?.level;
    const barnLevel = farm.barn?.level;
    
    if (chickens.length > 0 || barnAnimals.length > 0) {
        html += `
            <div class="farm-section">
                <h4>🐔 Animals</h4>
        `;
        
        if (chickens.length > 0) {
            html += `
                <div class="animal-group">
                    <h5>Hen House${henHouseLevel ? ` (Level ${henHouseLevel})` : ''} - ${chickens.length} chickens</h5>
                    <div class="data-grid">
                        ${chickens.map((animal, i) => {
                            const fedAt = animal.fedAt ? new Date(animal.fedAt).toLocaleString() : null;
                            const awakeAt = animal.awakeAt ? new Date(animal.awakeAt).toLocaleString() : null;
                            const asleepAt = animal.asleepAt ? new Date(animal.asleepAt).toLocaleString() : null;
                            const lovedAt = animal.lovedAt && animal.lovedAt > 0 ? new Date(animal.lovedAt).toLocaleString() : null;
                            const healthCheckedAt = animal.healthCheckedAt ? new Date(animal.healthCheckedAt).toLocaleString() : null;
                            const item = animal.item || null;
                            const coords = animal.coordinates ? `(${animal.coordinates.x}, ${animal.coordinates.y})` : '';
                            
                            return `
                                <div class="data-item">
                                    <span class="label">Chicken ${i + 1}:</span>
                                    <span class="value">
                                        Lvl ${animal.experience || 0} | ${animal.state || 'idle'}
                                        ${item ? ` | 🎁 ${item}` : ''}
                                        ${fedAt ? ` | Fed: ${fedAt}` : ''}
                                        ${awakeAt ? ` | Awake: ${awakeAt}` : ''}
                                        ${asleepAt ? ` | Asleep: ${asleepAt}` : ''}
                                        ${lovedAt ? ` | ❤️ Loved: ${lovedAt}` : ''}
                                        ${healthCheckedAt ? ` | 🏥 Checked: ${healthCheckedAt}` : ''}
                                        ${coords ? ` | ${coords}` : ''}
                                    </span>
                                </div>
                            `;
                        }).join('')}
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
                        <h5>Barn${barnLevel ? ` (Level ${barnLevel})` : ''} - Cows (${cows.length})</h5>
                        <div class="data-grid">
                            ${cows.map((animal, i) => {
                                const fedAt = animal.fedAt ? new Date(animal.fedAt).toLocaleString() : null;
                                const awakeAt = animal.awakeAt ? new Date(animal.awakeAt).toLocaleString() : null;
                                const asleepAt = animal.asleepAt ? new Date(animal.asleepAt).toLocaleString() : null;
                                const lovedAt = animal.lovedAt && animal.lovedAt > 0 ? new Date(animal.lovedAt).toLocaleString() : null;
                                const healthCheckedAt = animal.healthCheckedAt ? new Date(animal.healthCheckedAt).toLocaleString() : null;
                                const item = animal.item || null;
                                const coords = animal.coordinates ? `(${animal.coordinates.x}, ${animal.coordinates.y})` : '';
                                
                                return `
                                    <div class="data-item">
                                        <span class="label">Cow ${i + 1}:</span>
                                        <span class="value">
                                            Lvl ${animal.experience || 0} | ${animal.state || 'idle'}
                                            ${item ? ` | 🎁 ${item}` : ''}
                                            ${fedAt ? ` | Fed: ${fedAt}` : ''}
                                            ${awakeAt ? ` | Awake: ${awakeAt}` : ''}
                                            ${asleepAt ? ` | Asleep: ${asleepAt}` : ''}
                                            ${lovedAt ? ` | ❤️ Loved: ${lovedAt}` : ''}
                                            ${healthCheckedAt ? ` | 🏥 Checked: ${healthCheckedAt}` : ''}
                                            ${coords ? ` | ${coords}` : ''}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (sheep.length > 0) {
                html += `
                    <div class="animal-group">
                        <h5>Barn${barnLevel ? ` (Level ${barnLevel})` : ''} - Sheep (${sheep.length})</h5>
                        <div class="data-grid">
                            ${sheep.map((animal, i) => {
                                const fedAt = animal.fedAt ? new Date(animal.fedAt).toLocaleString() : null;
                                const awakeAt = animal.awakeAt ? new Date(animal.awakeAt).toLocaleString() : null;
                                const asleepAt = animal.asleepAt ? new Date(animal.asleepAt).toLocaleString() : null;
                                const lovedAt = animal.lovedAt && animal.lovedAt > 0 ? new Date(animal.lovedAt).toLocaleString() : null;
                                const healthCheckedAt = animal.healthCheckedAt ? new Date(animal.healthCheckedAt).toLocaleString() : null;
                                const item = animal.item || null;
                                const coords = animal.coordinates ? `(${animal.coordinates.x}, ${animal.coordinates.y})` : '';
                                
                                return `
                                    <div class="data-item">
                                        <span class="label">Sheep ${i + 1}:</span>
                                        <span class="value">
                                            Lvl ${animal.experience || 0} | ${animal.state || 'idle'}
                                            ${item ? ` | 🎁 ${item}` : ''}
                                            ${fedAt ? ` | Fed: ${fedAt}` : ''}
                                            ${awakeAt ? ` | Awake: ${awakeAt}` : ''}
                                            ${asleepAt ? ` | Asleep: ${asleepAt}` : ''}
                                            ${lovedAt ? ` | ❤️ Loved: ${lovedAt}` : ''}
                                            ${healthCheckedAt ? ` | 🏥 Checked: ${healthCheckedAt}` : ''}
                                            ${coords ? ` | ${coords}` : ''}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        html += `</div>`;
    }
    
    // Greenhouse Section
    if (farm.greenhouse) {
        const gh = farm.greenhouse;
        const pots = gh.pots ? Object.values(gh.pots) : [];
        
        html += `
            <div class="farm-section">
                <h4>🏡 Greenhouse</h4>
                ${gh.oil !== undefined ? `
                    <div class="data-item">
                        <span class="label">Oil Reserve:</span>
                        <span class="value">${formatNumber(gh.oil)}</span>
                    </div>
                ` : ''}
                ${pots.length > 0 ? `
                    <h5>Pots (${pots.length})</h5>
                    <div class="data-grid">
                        ${pots.map((pot, i) => {
                            if (!pot.plant) return `
                                <div class="data-item">
                                    <span class="label">Pot ${i + 1}:</span>
                                    <span class="value">Empty</span>
                                </div>
                            `;
                            
                            const plant = pot.plant;
                            const plantedAt = plant.plantedAt ? new Date(plant.plantedAt).toLocaleString() : 'Unknown';
                            
                            return `
                                <div class="data-item">
                                    <span class="label">Pot ${i + 1}:</span>
                                    <span class="value">
                                        ${plant.name} | ${plant.amount || 1}x | Planted: ${plantedAt}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Buildings with Crafting Queue
    if (farm.buildings && Object.keys(farm.buildings).length > 0) {
        html += `
            <div class="farm-section">
                <h4>🏗️ Buildings & Crafting</h4>
                ${Object.entries(farm.buildings).map(([building, instances]) => {
                    if (!Array.isArray(instances)) return '';
                    
                    return `
                        <div class="building-group">
                            <h5>${building} (${instances.length})</h5>
                            ${instances.map((instance, i) => {
                                const coords = instance.coordinates ? `(${instance.coordinates.x}, ${instance.coordinates.y})` : '';
                                const crafting = instance.crafting || [];
                                const oil = instance.oil !== undefined ? `🛢️ ${instance.oil} oil` : '';
                                const createdAt = instance.createdAt && instance.createdAt > 0 ? new Date(instance.createdAt).toLocaleDateString() : null;
                                
                                return `
                                    <div class="data-item">
                                        <span class="label">${building} ${i + 1}:</span>
                                        <span class="value">
                                            ${coords ? `${coords}` : 'Placed'}${createdAt ? ` | Created: ${createdAt}` : ''}
                                            ${oil ? ` | ${oil}` : ''}
                                            ${crafting.length > 0 ? `<br/>🔨 Crafting: ${crafting.map(c => {
                                                const readyAt = c.readyAt ? new Date(c.readyAt).toLocaleString() : 'Unknown';
                                                const boost = c.boost ? Object.entries(c.boost).map(([k, v]) => `${k}: ${v}x`).join(', ') : '';
                                                return `${c.name} (Ready: ${readyAt}${boost ? ` | Boost: ${boost}` : ''})`;
                                            }).join(', ')}` : ''}
                                            ${crafting.length === 0 ? ' | Idle' : ''}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Farm Hands Section
    if (farm.farmHands && farm.farmHands.bumpkins) {
        const farmHands = Object.values(farm.farmHands.bumpkins);
        if (farmHands.length > 0) {
            html += `
                <div class="farm-section">
                    <h4>👥 Farm Hands (${farmHands.length})</h4>
                    <div class="data-grid">
                        ${farmHands.map((hand, i) => {
                            const equipped = hand.equipped ? Object.entries(hand.equipped).filter(([k, v]) => v).map(([slot, item]) => `${slot}: ${item}`).join(', ') : 'None';
                            
                            return `
                                <div class="data-item">
                                    <span class="label">Hand ${i + 1}:</span>
                                    <span class="value">${equipped || 'No equipment'}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    // Calendar Section
    if (farm.calendar && Object.keys(farm.calendar).length > 0) {
        html += `
            <div class="farm-section">
                <h4>📅 Calendar Events</h4>
                <div class="data-grid">
                    ${Object.entries(farm.calendar).map(([event, data]) => {
                        const startedAt = data.startedAt ? new Date(data.startedAt).toLocaleString() : null;
                        const triggeredAt = data.triggeredAt ? new Date(data.triggeredAt).toLocaleString() : null;
                        
                        return `
                            <div class="data-item">
                                <span class="label">${event}:</span>
                                <span class="value">
                                    ${startedAt ? `Started: ${startedAt}` : ''}
                                    ${triggeredAt ? ` | Triggered: ${triggeredAt}` : ''}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // Bumpkin Details
    if (farm.bumpkin) {
        const bumpkin = farm.bumpkin;
        html += `
            <div class="farm-section">
                <h4>🧑‍🌾 Bumpkin Details</h4>
                
                ${bumpkin.id ? `
                    <div class="data-item">
                        <span class="label">Bumpkin ID:</span>
                        <span class="value">${bumpkin.id}${bumpkin.tokenUri ? ` | <a href="${bumpkin.tokenUri}" target="_blank">Token URI</a>` : ''}</span>
                    </div>
                ` : ''}
                
                ${bumpkin.achievements && Object.keys(bumpkin.achievements).length > 0 ? `
                    <div class="bumpkin-group">
                        <h5>🏆 Achievements (${Object.keys(bumpkin.achievements).length})</h5>
                        <details class="expandable-section">
                            <summary>View All Achievements</summary>
                            <div class="data-grid">
                                ${Object.keys(bumpkin.achievements).sort().map(achievement => `
                                    <div class="data-item">
                                        <span class="label">${achievement}</span>
                                        <span class="value">✓</span>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    </div>
                ` : ''}
                
                ${bumpkin.equipped ? `
                    <div class="bumpkin-group">
                        <h5>👕 Equipped Items</h5>
                        <div class="data-grid">
                            ${Object.entries(bumpkin.equipped).map(([slot, item]) => `
                                <div class="data-item">
                                    <span class="label">${slot}:</span>
                                    <span class="value">${item || 'None'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${bumpkin.skills && Object.keys(bumpkin.skills).length > 0 ? `
                    <div class="bumpkin-group">
                        <h5>⭐ Skills (${Object.keys(bumpkin.skills).length})</h5>
                        <div class="data-grid">
                            ${Object.entries(bumpkin.skills).sort(([a], [b]) => a.localeCompare(b)).map(([skill, level]) => `
                                <div class="data-item">
                                    <span class="label">${skill}:</span>
                                    <span class="value">${level > 1 ? `Level ${level}` : '✓'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${bumpkin.activity && Object.keys(bumpkin.activity).length > 0 ? `
                    <div class="bumpkin-group">
                        <h5>📊 Activity</h5>
                        <div class="data-grid">
                            ${Object.entries(bumpkin.activity).sort(([a], [b]) => a.localeCompare(b)).slice(0, 10).map(([activity, count]) => `
                                <div class="data-item">
                                    <span class="label">${activity}:</span>
                                    <span class="value">${formatNumber(count)}</span>
                                </div>
                            `).join('')}
                        </div>
                        ${Object.keys(bumpkin.activity).length > 10 ? `
                            <details class="expandable-section">
                                <summary>View All Activities (${Object.keys(bumpkin.activity).length})</summary>
                                <div class="data-grid">
                                    ${Object.entries(bumpkin.activity).sort(([a], [b]) => a.localeCompare(b)).map(([activity, count]) => `
                                        <div class="data-item">
                                            <span class="label">${activity}:</span>
                                            <span class="value">${formatNumber(count)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </details>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Active Boosts
    if (farm.boostsUsedAt && Object.keys(farm.boostsUsedAt).length > 0) {
        html += `
            <div class="farm-section">
                <h4>⚡ Active Boosts</h4>
                <div class="data-grid">
                    ${Object.entries(farm.boostsUsedAt).map(([boost, timestamp]) => `
                        <div class="data-item">
                            <span class="label">${boost}:</span>
                            <span class="value">Used at ${new Date(timestamp).toLocaleString()}</span>
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
                            ${Object.entries(farm.wardrobe).sort(([a], [b]) => a.localeCompare(b)).map(([item, qty]) => `
                                <div class="data-item">
                                    <span class="label">${item}:</span>
                                    <span class="value">${formatNumber(qty)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
                ${farm.collectibles ? `
                    <details class="expandable-section">
                        <summary>Placed Collectibles (${Object.keys(farm.collectibles).length} types)</summary>
                        <div class="data-grid">
                            ${Object.entries(farm.collectibles).map(([type, instances]) => {
                                const count = Array.isArray(instances) ? instances.length : Object.keys(instances).length;
                                return `
                                    <div class="data-item">
                                        <span class="label">${type}:</span>
                                        <span class="value">${count} placed</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <details class="expandable-section">
                            <summary>View Detailed Locations</summary>
                            <div class="data-grid">
                                ${Object.entries(farm.collectibles).flatMap(([type, instances]) => {
                                    const items = Array.isArray(instances) ? instances : Object.values(instances);
                                    return items.map((item, i) => {
                                        const coords = item.coordinates ? `(${item.coordinates.x}, ${item.coordinates.y})` : 'Unknown';
                                        const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
                                        return `
                                            <div class="data-item">
                                                <span class="label">${type} ${i + 1}:</span>
                                                <span class="value">${coords}${createdAt ? ` | ${createdAt}` : ''}</span>
                                            </div>
                                        `;
                                    });
                                }).join('')}
                            </div>
                        </details>
                    </details>
                ` : ''}
            </div>
        `;
    }
    
    // Expansions
    if (farm.expansions && farm.expansions.length > 0) {
        html += `
            <div class="farm-section">
                <h4>🗺️ Expansions</h4>
                <div class="data-grid">
                    ${farm.expansions.map((expansion, i) => {
                        const createdAt = expansion.createdAt ? new Date(expansion.createdAt).toLocaleDateString() : 'Unknown';
                        const readyAt = expansion.readyAt ? new Date(expansion.readyAt).toLocaleDateString() : 'Unknown';
                        return `
                            <div class="data-item">
                                <span class="label">Expansion ${i + 1}:</span>
                                <span class="value">Created: ${createdAt} | Ready: ${readyAt}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
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
