/**
 * Crop Calculator - Calculates crop growth times and profits
 */

export class CropCalculator {
    constructor(parser) {
        this.parser = parser;
        
        // Base growth times (in seconds)
        this.GROWTH_TIMES = {
            'Sunflower': 60,
            'Potato': 5 * 60,
            'Pumpkin': 30 * 60,
            'Carrot': 60 * 60,
            'Cabbage': 2 * 60 * 60,
            'Soybean': 3 * 60 * 60,
            'Beetroot': 4 * 60 * 60,
            'Cauliflower': 8 * 60 * 60,
            'Parsnip': 12 * 60 * 60,
            'Eggplant': 16 * 60 * 60,
            'Corn': 20 * 60 * 60,
            'Radish': 24 * 60 * 60,
            'Wheat': 24 * 60 * 60,
            'Kale': 36 * 60 * 60
        };
        
        // Base yields
        this.BASE_YIELD = {
            'Sunflower': 1,
            'Potato': 1,
            'Pumpkin': 1,
            'Carrot': 1,
            'Cabbage': 1,
            'Soybean': 2,
            'Beetroot': 1,
            'Cauliflower': 1,
            'Parsnip': 1,
            'Eggplant': 1,
            'Corn': 1,
            'Radish': 1,
            'Wheat': 1,
            'Kale': 1
        };
    }

    /**
     * Get all planted crops with status
     */
    getPlantedCrops() {
        const crops = this.parser.getCrops();
        const now = Date.now();
        
        const result = {
            total: crops.length,
            ready: 0,
            growing: 0,
            crops: [],
            estimatedValue: 0,
            nextHarvest: null
        };
        
        crops.forEach(crop => {
            const growthTime = this.getGrowthTime(crop.name);
            const readyAt = crop.plantedAt + growthTime - crop.boostedTime;
            
            const cropDetail = {
                name: crop.name,
                plantedAt: crop.plantedAt,
                readyAt,
                timeUntilReady: Math.max(0, readyAt - now),
                percentComplete: 0,
                status: '',
                estimatedYield: this.getYield(crop.name, crop.criticalHit),
                estimatedValue: 0
            };
            
            if (readyAt <= now) {
                result.ready++;
                cropDetail.status = 'Ready to harvest';
                cropDetail.percentComplete = 100;
            } else {
                result.growing++;
                cropDetail.status = 'Growing';
                const elapsed = now - crop.plantedAt;
                cropDetail.percentComplete = Math.min(100, (elapsed / growthTime) * 100);
                
                if (!result.nextHarvest || readyAt < result.nextHarvest) {
                    result.nextHarvest = readyAt;
                }
            }
            
            // Calculate value
            const price = this.parser.getPrice(crop.name);
            cropDetail.estimatedValue = price * cropDetail.estimatedYield;
            result.estimatedValue += cropDetail.estimatedValue;
            
            result.crops.push(cropDetail);
        });
        
        // Sort by ready time
        result.crops.sort((a, b) => a.readyAt - b.readyAt);
        
        return result;
    }

    /**
     * Calculate growth time with boosts
     */
    getGrowthTime(cropName) {
        const baseTime = (this.GROWTH_TIMES[cropName] || 60) * 1000; // Convert to ms
        let multiplier = 1;
        
        const equipped = this.parser.getEquipped();
        const skills = this.parser.getSkills();
        const collectibles = this.parser.getCollectibles();
        
        // Universal crop speed boosts
        if (equipped['Farmer Hat']) multiplier *= 0.9;
        if (equipped['Luna\'s Hat']) multiplier *= 0.5; // 50% faster
        if (skills['Crop Whisperer']) multiplier *= 0.85; // 15% faster
        if (collectibles['Scarecrow']) multiplier *= 0.85;
        if (collectibles['Nancy']) multiplier *= 0.85;
        if (collectibles['Kuebiko']) multiplier *= 0.75; // 25% faster
        if (collectibles['Gnome']) multiplier *= 0.9;
        if (this.parser.hasBoost('Rapid Growth')) multiplier *= 0.5;
        
        // Crop-specific boosts
        if (cropName === 'Sunflower' && equipped['Sunflower Amulet']) multiplier *= 0.8;
        if (cropName === 'Pumpkin' && equipped['Pumpkin Hat']) multiplier *= 0.8;
        if (cropName === 'Carrot' && collectibles['Mysterious Parsnip']) multiplier *= 0.5;
        
        return Math.floor(baseTime * multiplier);
    }

    /**
     * Calculate yield with boosts
     */
    getYield(cropName, criticalHit = {}) {
        let baseYield = this.BASE_YIELD[cropName] || 1;
        
        // Check for critical hit
        if (criticalHit.amount) {
            return baseYield + criticalHit.amount;
        }
        
        const equipped = this.parser.getEquipped();
        const skills = this.parser.getSkills();
        const collectibles = this.parser.getCollectibles();
        
        let bonus = 0;
        
        // Universal yield boosts
        if (skills['Green Thumb']) bonus += 0.05; // 5% more
        if (skills['Master Farmer']) bonus += 0.1; // 10% more
        if (collectibles['Scarecrow']) bonus += 0.2; // 20% more
        if (collectibles['Golden Cauliflower']) bonus += 1; // +1 to all crops
        
        // Crop-specific boosts
        if (cropName === 'Sunflower') {
            if (equipped['Sunflower Shield']) bonus += 0.1;
            if (collectibles['Sunflower Rock']) bonus += 0.1;
        }
        
        if (cropName === 'Pumpkin') {
            if (collectibles['Immortal Pumpkin']) bonus += 0.1;
            if (collectibles['Pumpkin Bear']) bonus += 0.2;
        }
        
        if (cropName === 'Cauliflower' && collectibles['Golden Cauliflower']) {
            bonus += 2; // +2 additional for cauliflower
        }
        
        return baseYield + bonus;
    }

    /**
     * Calculate profit for a crop type
     */
    calculateCropProfit(cropName) {
        const growthTime = this.getGrowthTime(cropName);
        const yield_ = this.getYield(cropName);
        const cropPrice = this.parser.getPrice(cropName);
        const seedPrice = this.parser.getPrice(`${cropName} Seed`) || cropPrice * 0.1;
        
        const revenue = cropPrice * yield_;
        const cost = seedPrice;
        const profit = revenue - cost;
        
        // Calculate per hour rate
        const profitPerHour = (profit / growthTime) * 60 * 60 * 1000;
        
        return {
            cropName,
            growthTime,
            yield: yield_,
            revenue,
            cost,
            profit,
            profitPerHour,
            roi: cost > 0 ? (profit / cost) * 100 : 0
        };
    }

    /**
     * Find most profitable crops
     */
    getBestCrops() {
        const crops = Object.keys(this.GROWTH_TIMES);
        const analysis = crops.map(crop => this.calculateCropProfit(crop));
        
        // Sort by profit per hour
        analysis.sort((a, b) => b.profitPerHour - a.profitPerHour);
        
        return {
            byProfitPerHour: analysis.slice(0, 5),
            byROI: [...analysis].sort((a, b) => b.roi - a.roi).slice(0, 5),
            byTotalProfit: [...analysis].sort((a, b) => b.profit - a.profit).slice(0, 5)
        };
    }

    /**
     * Get crop summary
     */
    getSummary() {
        const planted = this.getPlantedCrops();
        const bestCrops = this.getBestCrops();
        
        return {
            currentCrops: planted,
            recommendations: bestCrops,
            totalValue: planted.estimatedValue,
            readyToHarvest: planted.ready,
            nextHarvest: planted.nextHarvest ? new Date(planted.nextHarvest) : null
        };
    }
}
