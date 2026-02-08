/**
 * Cow Calculator Module
 * Calculates feeding costs, production yields, and profitability for cows
 */

/**
 * Cow level data (from Feed Costs CSV)
 * Each level defines: food type, XP requirements, food needed, and base yields
 */
const COW_LEVEL_DATA = [
    { level: 1, foodType: 'corn', foodXP: 120, xpNeeded: 180, xpGained: 240, feedings: 2, baseMilk: 4.55, baseLeather: 3.15 },
    { level: 2, foodType: 'corn', foodXP: 120, xpNeeded: 360, xpGained: 360, feedings: 1, baseMilk: 4.55, baseLeather: 3.15 },
    { level: 3, foodType: 'corn', foodXP: 120, xpNeeded: 720, xpGained: 720, feedings: 3, baseMilk: 4.55, baseLeather: 3.15 },
    { level: 4, foodType: 'wheat', foodXP: 120, xpNeeded: 1080, xpGained: 1080, feedings: 3, baseMilk: 5.55, baseLeather: 3.15 },
    { level: 5, foodType: 'wheat', foodXP: 120, xpNeeded: 1440, xpGained: 1440, feedings: 3, baseMilk: 5.55, baseLeather: 3.15 },
    { level: 6, foodType: 'wheat', foodXP: 120, xpNeeded: 1980, xpGained: 2040, feedings: 5, baseMilk: 5.55, baseLeather: 4.15 },
    { level: 7, foodType: 'barley', foodXP: 120, xpNeeded: 2520, xpGained: 2520, feedings: 4, baseMilk: 5.55, baseLeather: 4.15 },
    { level: 8, foodType: 'barley', foodXP: 120, xpNeeded: 3060, xpGained: 3120, feedings: 5, baseMilk: 6.55, baseLeather: 4.15 },
    { level: 9, foodType: 'barley', foodXP: 120, xpNeeded: 3600, xpGained: 3600, feedings: 4, baseMilk: 6.55, baseLeather: 4.15 },
    { level: 10, foodType: 'barley', foodXP: 120, xpNeeded: 4320, xpGained: 4320, feedings: 6, baseMilk: 6.55, baseLeather: 5.15 },
    { level: 11, foodType: 'mixed', foodXP: 160, xpNeeded: 5040, xpGained: 5120, feedings: 5, baseMilk: 6.55, baseLeather: 5.15 },
    { level: 12, foodType: 'mixed', foodXP: 160, xpNeeded: 5760, xpGained: 5760, feedings: 4, baseMilk: 6.55, baseLeather: 5.15 },
    { level: 13, foodType: 'mixed', foodXP: 160, xpNeeded: 6480, xpGained: 6560, feedings: 5, baseMilk: 6.55, baseLeather: 5.15 },
    { level: 14, foodType: 'mixed', foodXP: 160, xpNeeded: 7200, xpGained: 7200, feedings: 4, baseMilk: 6.55, baseLeather: 5.15 },
    { level: 15, foodType: 'mixed', foodXP: 160, xpNeeded: 8160, xpGained: 8160, feedings: 6, baseMilk: 7.55, baseLeather: 6.15 },
];

/**
 * Calculate cow profitability
 * @param {Object} farmData - Detected farm data with items/boosts
 * @param {Object} boosts - Calculated boost multipliers
 * @param {Object} prices - P2P market prices
 * @param {Object} config - User configuration (tax%, sleep hours, etc.)
 * @returns {Object} Calculation results
 */
export function calculate(farmData, boosts, prices, config = {}) {
    // Get configuration with defaults
    const taxPercent = config.taxPercent || 5;
    const sleepHours = config.sleepHours || 8;
    const cowCount = farmData.animalCounts?.cows || config.cowCount || 1;
    const foodPerFeeding = config.foodPerFeeding || 2.411367188; // From Constants CSV
    
    // Get boost multipliers
    const milkBoost = boosts.cow?.milkBoost || 1.0;
    const leatherBoost = boosts.cow?.leatherBoost || 1.0;
    const feedReduction = boosts.cow?.feedReduction || 1.0;
    
    // After-tax multiplier
    const afterTax = 1 - (taxPercent / 100);
    
    // Active hours per day (24 - sleep)
    const activeHours = 24 - sleepHours;
    
    // Calculate results for each level
    const levelResults = COW_LEVEL_DATA.map(levelData => {
        return calculateLevel(
            levelData,
            prices,
            milkBoost,
            leatherBoost,
            feedReduction,
            afterTax,
            foodPerFeeding,
            cowCount,
            activeHours
        );
    });
    
    // Calculate cumulative totals (to reach each level)
    const cumulativeResults = calculateCumulative(levelResults, cowCount);
    
    return {
        levelResults,
        cumulativeResults,
        config: {
            taxPercent,
            sleepHours,
            cowCount,
            milkBoost,
            leatherBoost,
            feedReduction,
            activeHours,
        },
        summary: generateSummary(levelResults, cumulativeResults),
    };
}

/**
 * Calculate profitability for a single level
 */
function calculateLevel(
    levelData,
    prices,
    milkBoost,
    leatherBoost,
    feedReduction,
    afterTax,
    foodPerFeeding,
    cowCount,
    activeHours
) {
    const { level, foodType, feedings, baseMilk, baseLeather } = levelData;
    
    // Get food price (handle mixed food)
    const foodPrice = getFoodPrice(foodType, prices);
    
    // Calculate actual food amount needed (with feed reduction boost)
    const foodAmount = feedings * foodPerFeeding * feedReduction;
    
    // Calculate food cost
    const foodCost = foodAmount * foodPrice;
    
    // Calculate production (with boosts)
    const milkProduced = baseMilk * milkBoost;
    const leatherProduced = baseLeather * leatherBoost;
    
    // Get product prices
    const milkPrice = prices.Milk || 0.1283;
    const leatherPrice = prices.Leather || 0.1215;
    
    // Calculate revenue
    const milkRevenue = milkProduced * milkPrice;
    const leatherRevenue = leatherProduced * leatherPrice;
    const totalRevenue = (milkRevenue + leatherRevenue) * afterTax;
    
    // Calculate profits (after tax)
    const profitBoth = totalRevenue - foodCost;
    const profitLeatherOnly = (leatherRevenue * afterTax) - foodCost;
    const profitMilkOnly = (milkRevenue * afterTax) - foodCost;
    
    // Calculate scaled profits
    const profitPerCow = profitBoth;
    const profitAllCows = profitBoth * cowCount;
    
    // Estimate feedings per day (rough approximation)
    // Assuming each feeding cycle takes some time
    const feedingsPerDay = Math.floor(activeHours / 2); // Rough estimate: 2 hours per cycle
    const profitPer24Hours = profitAllCows * feedingsPerDay;
    
    return {
        level,
        foodType,
        feedings,
        foodAmount,
        foodCost,
        milkProduced,
        leatherProduced,
        milkRevenue,
        leatherRevenue,
        totalRevenue,
        profitBoth,
        profitLeatherOnly,
        profitMilkOnly,
        profitPerCow,
        profitAllCows,
        profitPer24Hours,
    };
}

/**
 * Calculate cumulative costs/profits to reach each level
 */
function calculateCumulative(levelResults, cowCount) {
    const cumulative = [];
    let totalCost = 0;
    let totalProfit = 0;
    
    levelResults.forEach((result, index) => {
        totalCost += result.foodCost;
        totalProfit += result.profitBoth;
        
        cumulative.push({
            level: result.level,
            totalCost: totalCost,
            totalProfit: totalProfit,
            totalCostAllCows: totalCost * cowCount,
            totalProfitAllCows: totalProfit * cowCount,
        });
    });
    
    return cumulative;
}

/**
 * Get food price (handle mixed food as average)
 */
function getFoodPrice(foodType, prices) {
    switch (foodType) {
        case 'corn':
            return prices.Corn || 0.0197875;
        case 'wheat':
            return prices.Wheat || 0.014;
        case 'barley':
            return prices.Barley || 0.02667398;
        case 'mixed':
            // Mixed is average of available foods + kale
            const corn = prices.Corn || 0.0197875;
            const wheat = prices.Wheat || 0.014;
            const barley = prices.Barley || 0.02667398;
            const kale = prices.Kale || 0.01865405;
            return (corn + wheat + barley + kale) / 4;
        default:
            return 0.02; // Fallback
    }
}

/**
 * Generate summary statistics
 */
function generateSummary(levelResults, cumulativeResults) {
    // Find most profitable level
    const mostProfitable = levelResults.reduce((best, current) => {
        return current.profitPer24Hours > best.profitPer24Hours ? current : best;
    }, levelResults[0]);
    
    // Find least profitable level
    const leastProfitable = levelResults.reduce((worst, current) => {
        return current.profitPer24Hours < worst.profitPer24Hours ? current : worst;
    }, levelResults[0]);
    
    // Calculate average profit
    const avgProfit = levelResults.reduce((sum, r) => sum + r.profitPer24Hours, 0) / levelResults.length;
    
    // Get final cumulative (level 15)
    const finalLevel = cumulativeResults[cumulativeResults.length - 1];
    
    return {
        mostProfitable: {
            level: mostProfitable.level,
            profit24h: mostProfitable.profitPer24Hours,
        },
        leastProfitable: {
            level: leastProfitable.level,
            profit24h: leastProfitable.profitPer24Hours,
        },
        avgProfit24h: avgProfit,
        totalCostToLevel15: finalLevel.totalCostAllCows,
        totalProfitAtLevel15: finalLevel.totalProfitAllCows,
    };
}

/**
 * Render cow calculator results to HTML
 * @param {Object} results - Calculation results
 * @param {HTMLElement} container - Container element
 */
export function render(results, container) {
    if (!results || !container) return;
    
    const { levelResults, cumulativeResults, config, summary } = results;
    
    let html = `
        <div class="calc-summary">
            <div class="summary-card">
                <h3>Configuration</h3>
                <ul>
                    <li>Cows owned: <strong>${config.cowCount}</strong></li>
                    <li>Milk boost: <strong>${(config.milkBoost * 100 - 100).toFixed(1)}%</strong></li>
                    <li>Leather boost: <strong>${(config.leatherBoost * 100 - 100).toFixed(1)}%</strong></li>
                    <li>Feed reduction: <strong>${((1 - config.feedReduction) * 100).toFixed(1)}%</strong></li>
                    <li>Tax rate: <strong>${config.taxPercent}%</strong></li>
                    <li>Active hours: <strong>${config.activeHours}/24</strong></li>
                </ul>
            </div>
            
            <div class="summary-card">
                <h3>Best Performance</h3>
                <ul>
                    <li>Most profitable: <strong>Level ${summary.mostProfitable.level}</strong> (${summary.mostProfitable.profit24h.toFixed(2)} SFL/day)</li>
                    <li>Least profitable: <strong>Level ${summary.leastProfitable.level}</strong> (${summary.leastProfitable.profit24h.toFixed(2)} SFL/day)</li>
                    <li>Average profit: <strong>${summary.avgProfit24h.toFixed(2)} SFL/day</strong></li>
                </ul>
            </div>
        </div>
        
        <div class="results-table-container">
            <h3>Level-by-Level Analysis</h3>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Level</th>
                        <th>Food</th>
                        <th>Feedings</th>
                        <th>Food Cost</th>
                        <th>Milk</th>
                        <th>Leather</th>
                        <th>Profit (Both)</th>
                        <th>Profit/Day (${config.cowCount} cows)</th>
                    </tr>
                </thead>
                <tbody>
                    ${levelResults.map(r => `
                        <tr class="${r.profitBoth >= 0 ? 'profit-positive' : 'profit-negative'}">
                            <td>${r.level}</td>
                            <td>${r.foodType}</td>
                            <td>${r.feedings}</td>
                            <td>${r.foodCost.toFixed(4)} SFL</td>
                            <td>${r.milkProduced.toFixed(2)}</td>
                            <td>${r.leatherProduced.toFixed(2)}</td>
                            <td>${r.profitBoth.toFixed(4)} SFL</td>
                            <td><strong>${r.profitPer24Hours.toFixed(2)} SFL</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="results-table-container">
            <h3>Cumulative Costs (Total to Reach Level)</h3>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Target Level</th>
                        <th>Total Cost (1 cow)</th>
                        <th>Total Cost (${config.cowCount} cows)</th>
                        <th>Total Profit (1 cow)</th>
                        <th>Total Profit (${config.cowCount} cows)</th>
                    </tr>
                </thead>
                <tbody>
                    ${cumulativeResults.filter(r => [5, 10, 15].includes(r.level)).map(r => `
                        <tr>
                            <td><strong>${r.level}</strong></td>
                            <td>${r.totalCost.toFixed(2)} SFL</td>
                            <td>${r.totalCostAllCows.toFixed(2)} SFL</td>
                            <td>${r.totalProfit.toFixed(2)} SFL</td>
                            <td>${r.totalProfitAllCows.toFixed(2)} SFL</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}
