/**
 * Cow Calculator View - Displays level-by-level analysis like Google Sheets
 */

export function renderCowView(container) {
    if (!window.economicAnalyzer) {
        container.innerHTML = '<p class="error">Economic analyzer not initialized. Please refresh the page.</p>';
        return;
    }

    const animalCalc = window.economicAnalyzer.animalCalc;
    const config = window.economicAnalyzer.config;
    
    // Get all level analysis
    const analysis = animalCalc.analyzeAllLevels('Cow');
    const optimal = animalCalc.findOptimalLevel('Cow');
    
    // Get settings
    const taxRate = (config.getTaxRate() * 100).toFixed(1);
    const numCows = config.getNumAnimals('Cow');
    const sleepTime = config.getSleepTime('Cow');
    const bettyRate = config.getBettyRate();
    
    // Build HTML matching Google Sheets layout
    let html = `
        <div class="cow-calculator">
            <div class="calc-settings-summary">
                <h3>Current Settings</h3>
                <div class="settings-grid">
                    <div class="setting-item">
                        <span class="label">Tax Rate:</span>
                        <span class="value">${taxRate}%</span>
                    </div>
                    <div class="setting-item">
                        <span class="label">Number of Cows:</span>
                        <span class="value">${numCows}</span>
                    </div>
                    <div class="setting-item">
                        <span class="label">Sleep Time:</span>
                        <span class="value">${sleepTime} hours</span>
                    </div>
                    <div class="setting-item">
                        <span class="label">Betty Rate:</span>
                        <span class="value">${bettyRate} coins/SFL</span>
                    </div>
                </div>
                <button id="open-cow-settings" class="btn btn-secondary">
                    <span class="icon">⚙️</span>
                    <span class="text">Configure Settings</span>
                </button>
            </div>
            
            <div class="optimal-recommendation">
                <h3>💡 Optimal Level Recommendation</h3>
                <div class="recommendation-box">
                    <div class="optimal-level">Level ${optimal.level}</div>
                    <div class="optimal-details">
                        <div>Profit per cycle: <strong>${optimal.profit.toFixed(2)} SFL</strong></div>
                        <div>Profit per 24hrs (${numCows} cows): <strong>${optimal.dailyProfit.toFixed(2)} SFL</strong></div>
                        <div>Feed cost: ${optimal.feedCost.toFixed(2)} SFL</div>
                        <div>Revenue: ${optimal.revenue.toFixed(2)} SFL</div>
                    </div>
                </div>
            </div>
            
            <div class="level-table-container">
                <h3>📊 Level-by-Level Analysis</h3>
                <p class="table-description">Feed costs, output, and profitability for each level</p>
                
                <div class="table-responsive">
                    <table class="calculator-table">
                        <thead>
                            <tr>
                                <th>Level</th>
                                <th>Food Type</th>
                                <th>XP Needed</th>
                                <th>Feedings</th>
                                <th>Milk Output</th>
                                <th>Leather Output</th>
                                <th>Feed Cost</th>
                                <th>Revenue</th>
                                <th>Profit/Cycle</th>
                                <th>Profit/24hrs<br/>(${numCows} cows)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analysis.map(level => {
                                const isOptimal = level.level === optimal.level;
                                const rowClass = isOptimal ? 'optimal-row' : '';
                                
                                return `
                                    <tr class="${rowClass}">
                                        <td class="level-col">${level.level}${isOptimal ? ' ⭐' : ''}</td>
                                        <td class="food-col">${level.foodType}</td>
                                        <td class="number-col">${level.xpNeeded}</td>
                                        <td class="number-col">${level.feedsNeeded}</td>
                                        <td class="number-col">${level.milkOutput.toFixed(2)}</td>
                                        <td class="number-col">${level.leatherOutput.toFixed(2)}</td>
                                        <td class="cost-col">${level.feedCost.toFixed(2)} SFL</td>
                                        <td class="revenue-col">${level.revenue.toFixed(2)} SFL</td>
                                        <td class="profit-col ${level.profit > 0 ? 'positive' : 'negative'}">
                                            ${level.profit.toFixed(2)} SFL
                                        </td>
                                        <td class="daily-profit-col ${level.dailyProfit > 0 ? 'positive' : 'negative'}">
                                            ${level.dailyProfit.toFixed(2)} SFL
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="boost-summary">
                <h3>🎯 Active Boosts</h3>
                <div class="boost-list">
                    ${getActiveBoosts(config, 'cow')}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Attach event listeners
    const settingsBtn = document.getElementById('open-cow-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Open economic settings modal
            const event = new CustomEvent('openEconomicSettings');
            window.dispatchEvent(event);
        });
    }
}

/**
 * Get active boosts for display
 */
function getActiveBoosts(config, animalType) {
    const cowItems = [
        { name: 'Milk Apron', effect: '+0.5 milk' },
        { name: 'Cowbell', effect: '+2.0 milk' },
        { name: 'Cowfish', effect: '+0.2 milk' },
        { name: 'Cattlegrim', effect: '+0.25 milk, +0.25 leather' },
        { name: 'Moo-ver', effect: '+0.25 leather' },
        { name: 'Animal Bud', effect: '+0.2 milk, +0.2 leather' },
        { name: 'Mootant', effect: '+0.1 leather' },
        { name: 'Training Whistle', effect: '+1.0 leather' },
        { name: 'Bull Whip', effect: '50% feed reduction' },
        { name: 'Dr. Cow', effect: '5% feed reduction' },
        { name: 'Gold Cow', effect: 'Feed cows for free' },
        { name: 'Collie Shrine', effect: '+0.25 milk, +0.25 leather' }
    ];
    
    const cowSkills = [
        { name: 'Abundant Harvest', effect: '+0.1 to all animal outputs' },
        { name: 'Cow Smart', effect: '+1.0 milk' },
        { name: 'Efficient Feeding', effect: '-20% feed' },
        { name: 'Leathercraft', effect: '+1.0 leather' },
        { name: 'Chunky Feed', effect: '2x XP, 1.5x food cost' }
    ];
    
    const activeItems = cowItems.filter(item => config.hasItem(item.name));
    const activeSkills = cowSkills.filter(skill => config.hasSkill(skill.name));
    
    if (activeItems.length === 0 && activeSkills.length === 0) {
        return '<p class="no-boosts">No boosts active. Configure items/skills in settings to increase profitability!</p>';
    }
    
    let html = '';
    
    if (activeItems.length > 0) {
        html += '<div class="boost-category"><h4>Items:</h4><ul>';
        activeItems.forEach(item => {
            html += `<li><strong>${item.name}</strong>: ${item.effect}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (activeSkills.length > 0) {
        html += '<div class="boost-category"><h4>Skills:</h4><ul>';
        activeSkills.forEach(skill => {
            html += `<li><strong>${skill.name}</strong>: ${skill.effect}</li>`;
        });
        html += '</ul></div>';
    }
    
    return html;
}
