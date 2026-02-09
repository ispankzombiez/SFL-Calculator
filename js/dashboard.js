/**
 * Dashboard Integration - Connects Firebase data to calculators
 */

import { SFLCalculator } from './calculators/main-calculator.js';
import { EconomicAnalyzer } from './calculators/economic-analyzer.js';

/**
 * Initialize dashboard with cached data
 */
export async function initializeDashboard() {
    try {
        // Load data from Firebase/localStorage
        const rawData = await window.loadRawAPIData();
        
        if (!rawData) {
            console.log('No cached data available. Please connect your farm first.');
            showNoCacheMessage();
            return null;
        }
        
        // Parse the JSON strings
        const parsedData = {
            prices: JSON.parse(rawData.prices),
            farmData: JSON.parse(rawData.farmData)
        };
        
        // Create calculator instance
        const calculator = new SFLCalculator(parsedData);
        
        // Get dashboard data
        const dashboard = calculator.getDashboard();
        
        // Create economic analyzer
        const economicAnalyzer = new EconomicAnalyzer(parsedData);
        const economicAnalysis = economicAnalyzer.getFullAnalysis();
        
        // Store in global scope for other modules
        window.economicAnalyzer = economicAnalyzer;
        
        // Update UI
        updateDashboardUI(dashboard);
        updateEconomicAnalysis(economicAnalysis);
        
        // Show last updated time
        if (rawData.timestamp) {
            updateLastRefreshTime(rawData.timestamp);
        }
        
        return dashboard;
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorMessage('Failed to load calculator data: ' + error.message);
        return null;
    }
}

/**
 * Update dashboard UI with calculated data
 */
function updateDashboardUI(dashboard) {
    updateBalanceDisplay(dashboard.summary.balance);
    updateAnimalDisplay(dashboard.summary.animals);
    updateCropDisplay(dashboard.summary.crops);
    updateResourceDisplay(dashboard.summary.resources);
    updateTaskList(dashboard.tasks);
    updateOptimizations(dashboard.optimizations);
}

/**
 * Update balance display
 */
function updateBalanceDisplay(balance) {
    const balanceEl = document.getElementById('balance-display');
    if (balanceEl) {
        balanceEl.innerHTML = `
            <div class="balance-item">
                <span class="label">SFL:</span>
                <span class="value">${balance.sfl.toFixed(2)}</span>
            </div>
            <div class="balance-item">
                <span class="label">Coins:</span>
                <span class="value">${balance.coins}</span>
            </div>
        `;
    }
}

/**
 * Update animal display
 */
function updateAnimalDisplay(animalData) {
    const container = document.getElementById('animals-summary');
    if (!container) return;
    
    container.innerHTML = `
        <div class="summary-card">
            <h3>Animals</h3>
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-label">Total Animals:</span>
                    <span class="stat-value">${animalData.totalAnimals}</span>
                </div>
                <div class="stat ready">
                    <span class="stat-label">Ready to Collect:</span>
                    <span class="stat-value">${animalData.readyToCollect}</span>
                </div>
                <div class="stat warning">
                    <span class="stat-label">Need Feeding:</span>
                    <span class="stat-value">${animalData.needFeeding}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Daily Profit:</span>
                    <span class="stat-value">${animalData.totalDailyProfit.toFixed(2)} SFL</span>
                </div>
            </div>
            
            <div class="animal-breakdown">
                <div class="animal-type">
                    <h4>🐔 Chickens (${animalData.chickens.total})</h4>
                    <p>Ready: ${animalData.chickens.ready} | Fed: ${animalData.chickens.fed} | Hungry: ${animalData.chickens.hungry}</p>
                    <p class="profit">Profit: ${animalData.chickens.profit.profit.toFixed(2)} SFL/cycle</p>
                </div>
                
                <div class="animal-type">
                    <h4>🐄 Cows (${animalData.cows.total})</h4>
                    <p>Ready: ${animalData.cows.ready} | Fed: ${animalData.cows.fed} | Hungry: ${animalData.cows.hungry}</p>
                    <p class="profit">Profit: ${animalData.cows.profit.profit.toFixed(2)} SFL/cycle</p>
                </div>
                
                <div class="animal-type">
                    <h4>🐑 Sheep (${animalData.sheep.total})</h4>
                    <p>Ready: ${animalData.sheep.ready} | Fed: ${animalData.sheep.fed} | Hungry: ${animalData.sheep.hungry}</p>
                    <p class="profit">Profit: ${animalData.sheep.profit.profit.toFixed(2)} SFL/cycle</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update crop display
 */
function updateCropDisplay(cropData) {
    const container = document.getElementById('crops-summary');
    if (!container) return;
    
    const currentCrops = cropData.currentCrops;
    const nextHarvest = currentCrops.nextHarvest ? 
        new Date(currentCrops.nextHarvest).toLocaleString() : 'None';
    
    let bestCropsHTML = '';
    if (cropData.recommendations.byProfitPerHour.length > 0) {
        bestCropsHTML = '<h4>Most Profitable to Plant:</h4><ul>';
        cropData.recommendations.byProfitPerHour.slice(0, 3).forEach(crop => {
            bestCropsHTML += `<li>${crop.cropName}: ${crop.profitPerHour.toFixed(2)} SFL/hr</li>`;
        });
        bestCropsHTML += '</ul>';
    }
    
    container.innerHTML = `
        <div class="summary-card">
            <h3>Crops</h3>
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-label">Planted:</span>
                    <span class="stat-value">${currentCrops.total}</span>
                </div>
                <div class="stat ready">
                    <span class="stat-label">Ready to Harvest:</span>
                    <span class="stat-value">${currentCrops.ready}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Value:</span>
                    <span class="stat-value">${currentCrops.estimatedValue.toFixed(2)} SFL</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Next Harvest:</span>
                    <span class="stat-value small">${nextHarvest}</span>
                </div>
            </div>
            ${bestCropsHTML}
        </div>
    `;
}

/**
 * Update resource display
 */
function updateResourceDisplay(resourceData) {
    const container = document.getElementById('resources-summary');
    if (!container) return;
    
    const nextReplenish = resourceData.nextReplenish ? 
        new Date(resourceData.nextReplenish).toLocaleString() : 'None';
    
    container.innerHTML = `
        <div class="summary-card">
            <h3>Resources</h3>
            <div class="summary-stats">
                <div class="stat ready">
                    <span class="stat-label">Ready to Mine:</span>
                    <span class="stat-value">${resourceData.totalReady}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Depleted:</span>
                    <span class="stat-value">${resourceData.totalDepleted}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Value:</span>
                    <span class="stat-value">${resourceData.totalValue.toFixed(2)} SFL</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Next Replenish:</span>
                    <span class="stat-value small">${nextReplenish}</span>
                </div>
            </div>
            
            <div class="resource-breakdown">
                <div>🪵 Trees: ${resourceData.resources.trees.ready}/${resourceData.resources.trees.total}</div>
                <div>🪨 Stones: ${resourceData.resources.stones.ready}/${resourceData.resources.stones.total}</div>
                <div>⚙️ Iron: ${resourceData.resources.iron.ready}/${resourceData.resources.iron.total}</div>
                <div>🏆 Gold: ${resourceData.resources.gold.ready}/${resourceData.resources.gold.total}</div>
                <div>💎 Crimstones: ${resourceData.resources.crimstones.ready}/${resourceData.resources.crimstones.total}</div>
                <div>☀️ Sunstones: ${resourceData.resources.sunstones.ready}/${resourceData.resources.sunstones.total}</div>
            </div>
        </div>
    `;
}

/**
 * Update task list
 */
function updateTaskList(tasks) {
    const container = document.getElementById('task-list');
    if (!container) return;
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="no-tasks">No urgent tasks! 🎉</p>';
        return;
    }
    
    let html = '<ul class="tasks">';
    tasks.forEach(task => {
        const priorityClass = `priority-${task.priority}`;
        html += `
            <li class="task ${priorityClass}">
                <span class="task-icon">${getCategoryIcon(task.category)}</span>
                <span class="task-text">${task.action}</span>
                ${task.estimatedValue ? `<span class="task-value">${task.estimatedValue.toFixed(2)} SFL</span>` : ''}
            </li>
        `;
    });
    html += '</ul>';
    
    container.innerHTML = html;
}

/**
 * Update optimization suggestions
 */
function updateOptimizations(optimizations) {
    const container = document.getElementById('optimizations');
    if (!container) return;
    
    let html = '';
    optimizations.forEach(opt => {
        html += `<div class="optimization-card">`;
        html += `<h4>${opt.title || opt.category}</h4>`;
        
        if (opt.items) {
            html += '<ul>';
            opt.items.forEach(item => {
                html += `<li>${item.name}: ${item.profitPerHour ? item.profitPerHour.toFixed(2) + ' SFL/hr' : ''}`;
                if (item.canMake !== undefined) {
                    html += ` ${item.canMake ? '✅' : '❌'}`;
                }
                html += '</li>';
            });
            html += '</ul>';
        }
        
        if (opt.totalProfit !== undefined) {
            html += `<p>Total: ${opt.totalProfit.toFixed(2)} SFL/day</p>`;
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

/**
 * Update economic analysis display
 */
function updateEconomicAnalysis(analysis) {
    const container = document.getElementById('economic-analysis');
    if (!container) return;
    
    // Create daily potential breakdown
    const potential = analysis.dailyPotential || {};
    const breakdown = potential.breakdown || {};
    
    // Top recommendations
    const recommendations = analysis.recommendations || [];
    const topRecs = recommendations.slice(0, 5);
    
    let html = `
        <div class="economic-summary">
            <div class="daily-potential">
                <h4>💰 Daily Earning Potential</h4>
                <div class="total-potential">${(potential.total || 0).toFixed(2)} SFL/day</div>
                <div class="potential-breakdown">
                    ${breakdown.cows ? `<div class="breakdown-item">
                        <span class="icon">🐄</span>
                        <span class="label">Cows:</span>
                        <span class="value">${breakdown.cows.toFixed(2)} SFL</span>
                    </div>` : ''}
                    ${breakdown.chickens ? `<div class="breakdown-item">
                        <span class="icon">🐔</span>
                        <span class="label">Chickens:</span>
                        <span class="value">${breakdown.chickens.toFixed(2)} SFL</span>
                    </div>` : ''}
                    ${breakdown.sheep ? `<div class="breakdown-item">
                        <span class="icon">🐑</span>
                        <span class="label">Sheep:</span>
                        <span class="value">${breakdown.sheep.toFixed(2)} SFL</span>
                    </div>` : ''}
                    ${breakdown.resources ? `<div class="breakdown-item">
                        <span class="icon">⛏️</span>
                        <span class="label">Resources:</span>
                        <span class="value">${breakdown.resources.toFixed(2)} SFL</span>
                    </div>` : ''}
                    ${breakdown.greenhouse ? `<div class="breakdown-item">
                        <span class="icon">🌿</span>
                        <span class="label">Greenhouse:</span>
                        <span class="value">${breakdown.greenhouse.toFixed(2)} SFL</span>
                    </div>` : ''}
                </div>
            </div>
            
            <div class="economic-recommendations">
                <h4>💡 Top Profit Opportunities</h4>
                ${topRecs.length > 0 ? `
                    <ul class="recommendations-list">
                        ${topRecs.map(rec => `
                            <li class="recommendation ${rec.priority || 'medium'}">
                                <span class="rec-title">${rec.title}</span>
                                <span class="rec-reason">${rec.reason}</span>
                                ${rec.profit !== undefined ? `<span class="rec-profit">+${rec.profit.toFixed(2)} SFL/day</span>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="no-recommendations">No specific recommendations at this time.</p>'}
                <button id="open-economic-settings-btn" class="btn btn-secondary">
                    <span class="icon">⚙️</span>
                    <span class="text">Configure Economic Settings</span>
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Attach event listener for settings button
    const settingsBtn = document.getElementById('open-economic-settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openEconomicSettings);
    }
}

/**
 * Open economic settings modal
 */
function openEconomicSettings() {
    const modal = document.getElementById('economic-settings-modal');
    if (!modal) {
        console.error('Economic settings modal not found');
        return;
    }
    
    // Load current settings into form
    if (window.economicAnalyzer && window.economicAnalyzer.config) {
        const config = window.economicAnalyzer.config;
        const settings = config.settings;
        
        // Load values
        document.getElementById('tax-rate').value = settings.p2pTaxRate;
        document.getElementById('betty-rate').value = settings.bettyRate;
        document.getElementById('cow-sleep-time').value = settings.animalSleepTime.Cow;
        document.getElementById('chicken-sleep-time').value = settings.animalSleepTime.Chicken;
        document.getElementById('sheep-sleep-time').value = settings.animalSleepTime.Sheep;
        document.getElementById('num-cows').value = settings.numAnimals.Cow || 0;
        document.getElementById('num-chickens').value = settings.numAnimals.Chicken || 0;
        document.getElementById('num-sheep').value = settings.numAnimals.Sheep || 0;
    }
    
    // Show modal
    modal.style.display = 'flex';
    
    // Set up event listeners if not already done
    if (!modal.dataset.listenersAttached) {
        setupEconomicSettingsListeners();
        modal.dataset.listenersAttached = 'true';
    }
}

/**
 * Close economic settings modal
 */
function closeEconomicSettings() {
    const modal = document.getElementById('economic-settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Set up economic settings modal event listeners
 */
function setupEconomicSettingsListeners() {
    // Close button
    const closeBtn = document.getElementById('close-economic-settings-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEconomicSettings);
    }
    
    // Click outside to close
    const modal = document.getElementById('economic-settings-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEconomicSettings();
            }
        });
    }
    
    // Form submission
    const form = document.getElementById('economic-settings-form');
    if (form) {
        form.addEventListener('submit', handleEconomicSettingsSave);
    }
    
    // Auto-detect button
    const autoDetectBtn = document.getElementById('auto-detect-settings-btn');
    if (autoDetectBtn) {
        autoDetectBtn.addEventListener('click', handleAutoDetectSettings);
    }
}

/**
 * Handle economic settings save
 */
async function handleEconomicSettingsSave(e) {
    e.preventDefault();
    
    if (!window.economicAnalyzer) {
        showSettingsError('Economic analyzer not initialized');
        return;
    }
    
    try {
        const config = window.economicAnalyzer.config;
        
        // Get form values
        const taxRate = parseFloat(document.getElementById('tax-rate').value);
        const bettyRate = parseInt(document.getElementById('betty-rate').value);
        const cowSleep = parseFloat(document.getElementById('cow-sleep-time').value);
        const chickenSleep = parseFloat(document.getElementById('chicken-sleep-time').value);
        const sheepSleep = parseFloat(document.getElementById('sheep-sleep-time').value);
        const numCows = parseInt(document.getElementById('num-cows').value);
        const numChickens = parseInt(document.getElementById('num-chickens').value);
        const numSheep = parseInt(document.getElementById('num-sheep').value);
        
        // Update configuration
        config.setTaxRate(taxRate);
        config.setBettyRate(bettyRate);
        config.setSleepTime('Cow', cowSleep);
        config.setSleepTime('Chicken', chickenSleep);
        config.setSleepTime('Sheep', sheepSleep);
        config.setNumAnimals('Cow', numCows);
        config.setNumAnimals('Chicken', numChickens);
        config.setNumAnimals('Sheep', numSheep);
        
        // Save to localStorage
        config.saveSettings();
        
        // Refresh economic analysis
        const economicAnalysis = window.economicAnalyzer.getFullAnalysis();
        updateEconomicAnalysis(economicAnalysis);
        
        // Show success message
        showSettingsSuccess('Settings saved successfully!');
        
        // Close modal after 1 second
        setTimeout(() => {
            closeEconomicSettings();
        }, 1000);
    } catch (error) {
        console.error('Error saving settings:', error);
        showSettingsError('Failed to save settings: ' + error.message);
    }
}

/**
 * Handle auto-detect settings from farm data
 */
async function handleAutoDetectSettings() {
    if (!window.economicAnalyzer) {
        showSettingsError('Economic analyzer not initialized');
        return;
    }
    
    try {
        const config = window.economicAnalyzer.config;
        
        // Load raw data
        const rawData = await window.loadRawAPIData();
        if (!rawData) {
            showSettingsError('No farm data available');
            return;
        }
        
        const parsedData = {
            prices: JSON.parse(rawData.prices),
            farmData: JSON.parse(rawData.farmData)
        };
        
        // Auto-detect from farm data
        config.autoDetectFromFarmData(parsedData.farmData);
        
        // Reload form values
        const settings = config.settings;
        document.getElementById('num-cows').value = settings.numAnimals.Cow || 0;
        document.getElementById('num-chickens').value = settings.numAnimals.Chicken || 0;
        document.getElementById('num-sheep').value = settings.numAnimals.Sheep || 0;
        
        showSettingsSuccess('Auto-detected ' + 
            (settings.numAnimals.Cow || 0) + ' cows, ' + 
            (settings.numAnimals.Chicken || 0) + ' chickens, ' + 
            (settings.numAnimals.Sheep || 0) + ' sheep from your farm!');
    } catch (error) {
        console.error('Error auto-detecting:', error);
        showSettingsError('Failed to auto-detect: ' + error.message);
    }
}

/**
 * Show settings success message
 */
function showSettingsSuccess(message) {
    const successEl = document.getElementById('settings-success');
    const errorEl = document.getElementById('settings-error');
    
    if (errorEl) errorEl.style.display = 'none';
    
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 3000);
    }
}

/**
 * Show settings error message
 */
function showSettingsError(message) {
    const errorEl = document.getElementById('settings-error');
    const successEl = document.getElementById('settings-success');
    
    if (successEl) successEl.style.display = 'none';
    
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

/**
 * Get category icon
 */
function getCategoryIcon(category) {
    const icons = {
        'animals': '🐔',
        'crops': '🌾',
        'cooking': '🍳',
        'resources': '⛏️'
    };
    return icons[category] || '📋';
}

/**
 * Show no cache message
 */
function showNoCacheMessage() {
    const dashboard = document.getElementById('dashboard-container');
    if (dashboard) {
        dashboard.innerHTML = `
            <div class="message info">
                <h3>No Data Available</h3>
                <p>Please connect your farm using the "Connect Farm" button to load data.</p>
            </div>
        `;
    }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    const dashboard = document.getElementById('dashboard-container');
    if (dashboard) {
        dashboard.innerHTML = `
            <div class="message error">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Update last refresh time display
 */
function updateLastRefreshTime(timestamp) {
    const timeEl = document.getElementById('last-update-time');
    if (timeEl) {
        const date = new Date(timestamp);
        const now = Date.now();
        const diff = now - timestamp;
        
        let timeAgo = '';
        if (diff < 60000) {
            timeAgo = 'just now';
        } else if (diff < 3600000) {
            timeAgo = `${Math.floor(diff / 60000)} minutes ago`;
        } else if (diff < 86400000) {
            timeAgo = `${Math.floor(diff / 3600000)} hours ago`;
        } else {
            timeAgo = `${Math.floor(diff / 86400000)} days ago`;
        }
        
        timeEl.textContent = `Last updated: ${timeAgo}`;
    }
}

// Auto-refresh dashboard when user signs in
if (window.auth) {
    window.auth.onAuthStateChanged(user => {
        if (user) {
            // Wait a bit for data to load, then initialize dashboard
            setTimeout(() => initializeDashboard(), 1000);
        }
    });
}
