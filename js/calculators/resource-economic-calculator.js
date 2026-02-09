/**
 * Resource Economic Calculator - Tool cost & restock profit analysis
 * Matches Google Sheets resource calculator logic
 */

export class ResourceEconomicCalculator {
    constructor(parser, economicConfig) {
        this.parser = parser;
        this.config = economicConfig;
        
        // Tool durability (uses per tool)
        this.TOOL_DURABILITY = {
            'Axe': 350,
            'Wood Pickaxe': 160,
            'Stone Pickaxe': 50,
            'Iron Pickaxe': 15,
            'Gold Pickaxe': 10
        };
        
        // Base yield per swing
        this.BASE_YIELD = {
            'Wood': 2,
            'Stone': 2,
            'Iron': 2,
            'Gold': 2,
            'Crimstone': 1,
            'Sunstone': 1
        };
        
        // Tool costs (in materials)
        this.TOOL_COSTS = {
            'Axe': { wood: 3 },
            'Wood Pickaxe': { wood: 5 },
            'Stone Pickaxe': { wood: 3, stone: 3 },
            'Iron Pickaxe': { wood: 5, iron: 3 },
            'Gold Pickaxe': { wood: 5, gold: 3 }
        };
        
        // Tool to resource mapping
        this.TOOL_FOR_RESOURCE = {
            'Wood': 'Axe',
            'Stone': 'Wood Pickaxe',
            'Iron': 'Stone Pickaxe',
            'Gold': 'Iron Pickaxe',
            'Crimstone': 'Gold Pickaxe',
            'Sunstone': 'Gold Pickaxe'
        };
        
        // Coin cost per tool use (like sharpening)
        this.COIN_COST_PER_USE = 16; // Most tools cost coins to maintain
    }

    /**
     * Calculate yield boost for a resource type
     */
    calculateYieldBoost(resourceType) {
        let additiveBoost = 0;
        let multiplicativeBoost = 1.0;
        
        // Universal boosts
        if (this.config.hasItem('Faction Shield')) {
            if (resourceType === 'Wood') additiveBoost += 0.25;
            else if (['Stone', 'Iron', 'Gold', 'Crimstone', 'Sunstone'].includes(resourceType)) {
                additiveBoost += 0.25;
            }
        }
        
        if (['Stone', 'Iron', 'Gold', 'Crimstone', 'Sunstone'].includes(resourceType)) {
            if (this.config.hasItem('Volcano Gnome')) additiveBoost += 0.1;
            if (this.config.hasItem('Cave Bud')) additiveBoost += 0.2;
            if (this.config.hasItem('Mineral Stem')) additiveBoost += 0.2;
        }
        
        // Wood-specific boosts
        if (resourceType === 'Wood') {
            if (this.config.hasItem('Squirrel')) additiveBoost += 0.1;
            if (this.config.hasItem('Tiki Totem')) additiveBoost += 0.1;
            if (this.config.hasItem('Woody Beaver')) additiveBoost += 0.2;
            if (this.config.hasItem('Apprentice Beaver')) additiveBoost += 0.2;
            if (this.config.hasItem('Foreman Beaver')) additiveBoost += 0.2;
            if (this.config.hasItem('Wood Nymph Wendy')) additiveBoost += 0.2;
            if (this.config.hasItem('Wood Bud')) additiveBoost += 0.2;
            if (this.config.hasItem('Bud Stem')) additiveBoost += 0.1;
            
            if (this.config.hasSkill('Lumberjack')) multiplicativeBoost *= 1.1;
            if (this.config.hasSkill('Tree Hugger')) additiveBoost += 0.2;
        }
        
        // Stone-specific boosts
        if (resourceType === 'Stone') {
            if (this.config.hasItem('Stone Beetle')) additiveBoost += 0.1;
            if (this.config.hasItem('Tunnel Mole')) additiveBoost += 0.25;
            // Rock Golem: 10% chance of +2, averaged as 0.2
            if (this.config.hasItem('Rock Golem')) additiveBoost += 0.2;
            // Tin Turtle: 3x3 AOE effect, adds 0.9 averaged
            if (this.config.hasItem('Tin Turtle')) additiveBoost += 0.9;
            // Emerald Turtle: 3x3 AOE, adds 0.5 per stone
            if (this.config.hasItem('Emerald Turtle')) additiveBoost += 0.5;
        }
        
        // Iron boosts
        if (resourceType === 'Iron') {
            // Emerald Turtle
            if (this.config.hasItem('Emerald Turtle')) additiveBoost += 0.5;
            
            if (this.config.hasSkill('Mining Mastery')) multiplicativeBoost *= 1.2;
        }
        
        // Gold boosts
        if (resourceType === 'Gold') {
            // Emerald Turtle
            if (this.config.hasItem('Emerald Turtle')) additiveBoost += 0.5;
            
            if (this.config.hasSkill('Mining Mastery')) multiplicativeBoost *= 1.15;
        }
        
        // Crimstone boosts
        if (resourceType === 'Crimstone') {
            // Emerald Turtle
            if (this.config.hasItem('Emerald Turtle')) additiveBoost += 0.5;
        }
        
        return { additiveBoost, multiplicativeBoost };
    }

    /**
     * Calculate effective yield per tool use
     */
    calculateYieldPerUse(resourceType) {
        const baseYield = this.BASE_YIELD[resourceType] || 1;
        const { additiveBoost, multiplicativeBoost } = this.calculateYieldBoost(resourceType);
        
        const effectiveYield = (baseYield + additiveBoost) * multiplicativeBoost;
        return effectiveYield;
    }

    /**
     * Calculate tool cost in SFL
     */
    calculateToolCost(toolName) {
        const materials = this.TOOL_COSTS[toolName] || {};
        let totalCost = 0;
        
        Object.entries(materials).forEach(([material, amount]) => {
            const materialName = material.charAt(0).toUpperCase() + material.slice(1);
            const price = this.parser.getPrice(materialName);
            totalCost += price * amount;
        });
        
        // Add coin cost converted to SFL
        const bettyRate = this.config.getBettyRate();
        const coinCostSFL = this.COIN_COST_PER_USE / bettyRate;
        totalCost += coinCostSFL;
        
        return totalCost;
    }

    /**
     * Calculate profit per tool use
     */
    calculateProfitPerUse(resourceType) {
        const tool = this.TOOL_FOR_RESOURCE[resourceType];
        const yieldPerUse = this.calculateYieldPerUse(resourceType);
        const toolCost = this.calculateToolCost(tool);
        const toolDurability = this.TOOL_DURABILITY[tool];
        const costPerUse = toolCost / toolDurability;
        
        const resourcePrice = this.parser.getPrice(resourceType);
        const taxMultiplier = this.config.getAfterTaxMultiplier();
        
        const revenue = yieldPerUse * resourcePrice * taxMultiplier;
        const profit = revenue - costPerUse;
        
        return {
            resourceType,
            tool,
            yieldPerUse,
            resourcePrice,
            revenue,
            costPerUse,
            profit,
            profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
        };
    }

    /**
     * Calculate profit per full restock
     */
    calculateProfitPerRestock(resourceType) {
        const tool = this.TOOL_FOR_RESOURCE[resourceType];
        const durability = this.TOOL_DURABILITY[tool];
        const yieldPerUse = this.calculateYieldPerUse(resourceType);
        const totalYield = yieldPerUse * durability;
        
        const toolCost = this.calculateToolCost(tool);
        const resourcePrice = this.parser.getPrice(resourceType);
        const taxMultiplier = this.config.getAfterTaxMultiplier();
        
        const totalRevenue = totalYield * resourcePrice * taxMultiplier;
        const profit = totalRevenue - toolCost;
        
        return {
            resourceType,
            tool,
            durability,
            yieldPerUse,
            totalYield,
            toolCost,
            totalRevenue,
            profit,
            profitPercent: toolCost > 0 ? (profit / toolCost) * 100 : 0
        };
    }

    /**
     * Calculate profit with number of nodes owned
     */
    calculateNodeProfit(resourceType) {
        const numNodes = this.config.getNumNodes(resourceType);
        const perUse = this.calculateProfitPerUse(resourceType);
        const perRestock = this.calculateProfitPerRestock(resourceType);
        
        // Estimate cycles per day based on node respawn time
        let respawnHours = 2;
        if (resourceType === 'Stone') respawnHours = 4;
        if (resourceType === 'Iron') respawnHours = 8;
        if (resourceType === 'Gold') respawnHours = 24;
        if (resourceType === 'Crimstone') respawnHours = 48;
        if (resourceType === 'Sunstone') respawnHours = 72;
        
        const cyclesPerDay = 24 / respawnHours;
        const dailyProfitPerNode = perUse.profit * cyclesPerDay;
        const totalDailyProfit = dailyProfitPerNode * numNodes;
        
        return {
            ...perUse,
            ...perRestock,
            numNodes,
            cyclesPerDay,
            dailyProfitPerNode,
            totalDailyProfit
        };
    }

    /**
     * Compare all resources
     */
    compareAllResources() {
        const resources = ['Wood', 'Stone', 'Iron', 'Gold', 'Crimstone', 'Sunstone'];
        const comparison = [];
        
        resources.forEach(resourceType => {
            comparison.push(this.calculateNodeProfit(resourceType));
        });
        
        // Sort by profit per use
        comparison.sort((a, b) => b.profit - a.profit);
        
        return comparison;
    }

    /**
     * Find best resource to prioritize
     */
    findBestResource() {
        const comparison = this.compareAllResources();
        
        // Best by profit per use
        const bestPerUse = comparison.reduce((best, curr) => 
            curr.profit > best.profit ? curr : best
        );
        
        // Best by total daily profit (considering nodes owned)
        const bestDaily = comparison.reduce((best, curr) => 
            curr.totalDailyProfit > best.totalDailyProfit ? curr : best
        );
        
        // Best by profit margin %
        const bestMargin = comparison.reduce((best, curr) => 
            curr.profitMargin > best.profitMargin ? curr : best
        );
        
        return {
            bestPerUse: bestPerUse.resourceType,
            bestDaily: bestDaily.resourceType,
            bestMargin: bestMargin.resourceType,
            details: comparison
        };
    }

    /**
     * Get comprehensive resource economic summary
     */
    getSummary() {
        const comparison = this.compareAllResources();
        const best = this.findBestResource();
        
        let totalDailyProfit = 0;
        comparison.forEach(resource => {
            totalDailyProfit += resource.totalDailyProfit;
        });
        
        return {
            totalDailyProfit,
            bestResource: best.bestPerUse,
            bestDailyResource: best.bestDaily,
            bestMarginResource: best.bestMargin,
            allResources: comparison
        };
    }
}
