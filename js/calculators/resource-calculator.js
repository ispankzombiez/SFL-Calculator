/**
 * Resource Calculator - Calculates resource gathering efficiency
 */

export class ResourceCalculator {
    constructor(parser) {
        this.parser = parser;
        
        // Replenishment times (in hours)
        this.REPLENISH_TIMES = {
            'Tree': 2,
            'Stone Rock': 4,
            'Iron Rock': 8,
            'Gold Rock': 24,
            'Crimstone Rock': 48,
            'Sunstone Rock': 72
        };
        
        // Base yields
        this.BASE_YIELDS = {
            'Tree': { 'Wood': 3 },
            'Stone Rock': { 'Stone': 3 },
            'Iron Rock': { 'Iron': 5 },
            'Gold Rock': { 'Gold': 5 },
            'Crimstone Rock': { 'Crimstone': 3 },
            'Sunstone Rock': { 'Sunstone': 3 }
        };
    }

    /**
     * Get all resources on farm
     */
    getAllResources() {
        const farmData = this.parser.farmData;
        const now = Date.now();
        
        const resources = {
            trees: this.getResourceDetails(farmData.trees, 'Tree'),
            stones: this.getResourceDetails(farmData.stones, 'Stone Rock'),
            iron: this.getResourceDetails(farmData.iron, 'Iron Rock'),
            gold: this.getResourceDetails(farmData.gold, 'Gold Rock'),
            crimstones: this.getResourceDetails(farmData.crimstones, 'Crimstone Rock'),
            sunstones: this.getResourceDetails(farmData.sunstones, 'Sunstone Rock')
        };
        
        return resources;
    }

    /**
     * Get detailed info for a resource type
     */
    getResourceDetails(resourceData, resourceType) {
        if (!resourceData) {
            return {
                type: resourceType,
                total: 0,
                ready: 0,
                depleted: 0,
                resources: [],
                estimatedValue: 0,
                nextReplenish: null
            };
        }
        
        const now = Date.now();
        const replenishTime = this.getReplenishTime(resourceType);
        
        const result = {
            type: resourceType,
            total: Object.keys(resourceData).length,
            ready: 0,
            depleted: 0,
            resources: [],
            estimatedValue: 0,
            nextReplenish: null
        };
        
        Object.entries(resourceData).forEach(([id, resource]) => {
            const resourceDetail = {
                id,
                amount: resource.amount,
                minedAt: resource.minedAt,
                replenishAt: resource.minedAt ? resource.minedAt + replenishTime : null,
                timeUntilReady: 0,
                percentComplete: 0,
                status: '',
                estimatedYield: {},
                estimatedValue: 0
            };
            
            if (resource.amount > 0) {
                result.ready++;
                resourceDetail.status = 'Ready to mine';
                resourceDetail.percentComplete = 100;
                
                // Calculate yield and value
                const yields = this.getYield(resourceType);
                resourceDetail.estimatedYield = yields;
                
                Object.entries(yields).forEach(([item, amount]) => {
                    const price = this.parser.getPrice(item);
                    resourceDetail.estimatedValue += price * amount * resource.amount;
                });
                
                result.estimatedValue += resourceDetail.estimatedValue;
            } else if (resource.minedAt) {
                result.depleted++;
                const replenishAt = resource.minedAt + replenishTime;
                
                if (replenishAt <= now) {
                    resourceDetail.status = 'Should be replenished (check game)';
                    resourceDetail.percentComplete = 100;
                } else {
                    resourceDetail.status = 'Replenishing';
                    const elapsed = now - resource.minedAt;
                    resourceDetail.percentComplete = Math.min(100, (elapsed / replenishTime) * 100);
                    resourceDetail.timeUntilReady = replenishAt - now;
                    
                    if (!result.nextReplenish || replenishAt < result.nextReplenish) {
                        result.nextReplenish = replenishAt;
                    }
                }
            }
            
            result.resources.push(resourceDetail);
        });
        
        return result;
    }

    /**
     * Get replenishment time with boosts
     */
    getReplenishTime(resourceType) {
        const baseTime = (this.REPLENISH_TIMES[resourceType] || 2) * 60 * 60 * 1000; // Convert to ms
        let multiplier = 1;
        
        const equipped = this.parser.getEquipped();
        const collectibles = this.parser.getCollectibles();
        
        // Universal resource boosts
        if (collectibles['Time Warp Totem']) multiplier *= 0.5; // 50% faster replenish
        if (collectibles['Genie Lamp']) multiplier *= 0.8; // 20% faster
        
        // Resource-specific boosts
        if (resourceType === 'Tree') {
            if (equipped['Forester Hat']) multiplier *= 0.8;
            if (collectibles['Woody the Beaver']) multiplier *= 0.5;
        }
        
        if (resourceType === 'Stone Rock' || resourceType === 'Iron Rock' || resourceType === 'Gold Rock') {
            if (equipped['Miner Hat']) multiplier *= 0.8;
            if (collectibles['Rock Golem']) multiplier *= 0.75;
        }
        
        return Math.floor(baseTime * multiplier);
    }

    /**
     * Get yield with boosts
     */
    getYield(resourceType) {
        const baseYield = this.BASE_YIELDS[resourceType] || {};
        const result = { ...baseYield };
        
        const equipped = this.parser.getEquipped();
        const skills = this.parser.getSkills();
        const collectibles = this.parser.getCollectibles();
        
        // Apply multipliers
        Object.keys(result).forEach(resource => {
            let bonus = 0;
            
            // Universal gathering boosts
            if (skills['Lumberjack']) bonus += 0.1; // 10% more for all resources
            
            // Specific resource boosts
            if (resource === 'Wood') {
                if (equipped['Lumberjack Axe']) bonus += 0.5; // +50%
                if (collectibles['Woody the Beaver']) bonus += 0.2;
                if (skills['Tree Hugger']) bonus += 0.2;
            }
            
            if (resource === 'Stone') {
                if (equipped['Pickaxe']) bonus += 0.3;
                if (collectibles['Rock Golem']) bonus += 0.25;
            }
            
            if (resource === 'Iron' || resource === 'Gold') {
                if (equipped['Iron Pickaxe']) bonus += 0.4;
                if (skills['Mining Mastery']) bonus += 0.2;
            }
            
            result[resource] = Math.floor(result[resource] * (1 + bonus));
        });
        
        return result;
    }

    /**
     * Calculate resource profitability
     */
    calculateResourceProfit(resourceType) {
        const details = this.getAllResources();
        const resourceKey = resourceType.toLowerCase().replace(' rock', '') + 's';
        const resourceData = details[resourceKey];
        
        if (!resourceData) return null;
        
        const yields = this.getYield(resourceType);
        let totalValue = 0;
        
        Object.entries(yields).forEach(([item, amount]) => {
            const price = this.parser.getPrice(item);
            totalValue += price * amount;
        });
        
        const replenishTime = this.getReplenishTime(resourceType);
        const profitPerHour = (totalValue / replenishTime) * 60 * 60 * 1000;
        
        return {
            resourceType,
            totalNodes: resourceData.total,
            readyNodes: resourceData.ready,
            depletedNodes: resourceData.depleted,
            yields,
            valuePerNode: totalValue,
            totalAvailableValue: totalValue * resourceData.ready,
            replenishTime,
            profitPerHour: profitPerHour * resourceData.total
        };
    }

    /**
     * Get best resources to prioritize
     */
    getBestResources() {
        const resourceTypes = Object.keys(this.REPLENISH_TIMES);
        const analysis = resourceTypes
            .map(type => this.calculateResourceProfit(type))
            .filter(r => r !== null);
        
        return {
            byProfitPerHour: [...analysis].sort((a, b) => b.profitPerHour - a.profitPerHour),
            byValuePerNode: [...analysis].sort((a, b) => b.valuePerNode - a.valuePerNode),
            readyToCollect: analysis.filter(r => r.readyNodes > 0).sort((a, b) => b.totalAvailableValue - a.totalAvailableValue)
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        const allResources = this.getAllResources();
        const bestResources = this.getBestResources();
        
        let totalReady = 0;
        let totalDepleted = 0;
        let totalValue = 0;
        let nextReplenish = null;
        
        Object.values(allResources).forEach(resource => {
            totalReady += resource.ready;
            totalDepleted += resource.depleted;
            totalValue += resource.estimatedValue;
            
            if (resource.nextReplenish && (!nextReplenish || resource.nextReplenish < nextReplenish)) {
                nextReplenish = resource.nextReplenish;
            }
        });
        
        return {
            resources: allResources,
            recommendations: bestResources,
            totalReady,
            totalDepleted,
            totalValue,
            nextReplenish: nextReplenish ? new Date(nextReplenish) : null
        };
    }
}
