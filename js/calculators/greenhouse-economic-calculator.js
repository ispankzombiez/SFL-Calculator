/**
 * Greenhouse Economic Calculator - Oil cost & profit analysis
 * Matches Google Sheets greenhouse calculator logic
 */

export class GreenhouseEconomicCalculator {
    constructor(parser, economicConfig) {
        this.parser = parser;
        this.config = economicConfig;
        
        // Greenhouse crop data
        this.CROPS = {
            'Grape': {
                growTime: 12, // hours
                oilAmount: 3,
                baseYield: 1
            },
            'Rice': {
                growTime: 32, // hours
                oilAmount: 4,
                baseYield: 2
            },
            'Olive': {
                growTime: 42, // hours
                oilAmount: 6,
                baseYield: 1
            }
        };
        
        // Oil crafting cost (materials for drill)
        this.OIL_CRAFT_MATERIALS = {
            'Wood': 20,
            'Iron': 9,
            'Leather': 10
        };
        
        // Drill produces 50 oil per craft
        this.OIL_PER_CRAFT = 50;
    }

    /**
     * Calculate oil cost per unit
     */
    calculateOilCost() {
        // If Infernal Drill owned, oil is free
        if (this.config.hasItem('Infernal Drill')) {
            return 0;
        }
        
        let totalMaterialCost = 0;
        
        Object.entries(this.OIL_CRAFT_MATERIALS).forEach(([material, amount]) => {
            const price = this.parser.getPrice(material);
            totalMaterialCost += price * amount;
        });
        
        // Drill costs 3x to craft
        totalMaterialCost *= 3;
        
        // Cost per oil = total cost / oil per craft
        const costPerOil = totalMaterialCost / this.OIL_PER_CRAFT;
        
        return costPerOil;
    }

    /**
     * Calculate yield boost for a crop
     */
    calculateYieldBoost(cropName) {
        let additiveBoost = 0;
        let hasPharaohGnome = false;
        
        if (cropName === 'Rice') {
            if (this.config.hasItem('Rice Panda')) additiveBoost += 0.25;
            if (this.config.hasItem('Non La Hat')) additiveBoost += 1.0;
            if (this.config.hasItem('Hoot')) additiveBoost += 0.5;
        }
        
        if (cropName === 'Olive') {
            if (this.config.hasItem('Olive Royalty Shirt')) additiveBoost += 0.25;
            if (this.config.hasItem('Olive Shield')) additiveBoost += 1.0;
        }
        
        if (cropName === 'Grape') {
            if (this.config.hasItem('Vinny')) additiveBoost += 0.25;
            if (this.config.hasItem('Grape Pants')) additiveBoost += 0.2;
            if (this.config.hasItem('Grape Granny')) additiveBoost += 1.0;
        }
        
        // Pharaoh Gnome doubles all greenhouse produce
        if (this.config.hasItem('Pharaoh Gnome')) {
            hasPharaohGnome = true;
            additiveBoost *= 2;
        }
        
        return { additiveBoost, hasPharaohGnome };
    }

    /**
     * Calculate growth time reduction
     */
    calculateGrowthTimeReduction(cropName) {
        let multiplier = 1.0;
        
        // Turbo Sprout: 50% faster
        if (this.config.hasItem('Turbo Sprout')) {
            multiplier *= 0.5;
        }
        
        return multiplier;
    }

    /**
     * Calculate profit for a crop
     */
    calculateCropProfit(cropName) {
        const cropData = this.CROPS[cropName];
        if (!cropData) return null;
        
        const oilCost = this.calculateOilCost();
        const totalOilCost = oilCost * cropData.oilAmount;
        
        const { additiveBoost } = this.calculateYieldBoost(cropName);
        const baseYield = cropData.baseYield;
        const normalYield = baseYield + additiveBoost;
        
        // Green Amulet: 10% chance of x10 yield
        const hasGreenAmulet = this.config.hasItem('Green Amulet');
        const greenAmuletYield = hasGreenAmulet ? normalYield * 10 : normalYield;
        const averageYieldWithAmulet = hasGreenAmulet ? 
            (normalYield * 0.9) + (greenAmuletYield * 0.1) : normalYield;
        
        const cropPrice = this.parser.getPrice(cropName);
        const taxMultiplier = this.config.getAfterTaxMultiplier();
        
        // Normal scenario
        const normalRevenue = normalYield * cropPrice * taxMultiplier;
        const normalProfit = normalRevenue - totalOilCost;
        
        // With Green Amulet proc
        const amuletProcRevenue = greenAmuletYield * cropPrice * taxMultiplier;
        const amuletProcProfit = amuletProcRevenue - totalOilCost;
        
        // Average with amulet
        const averageRevenue = averageYieldWithAmulet * cropPrice * taxMultiplier;
        const averageProfit = averageRevenue - totalOilCost;
        
        // Growth time
        const growthReduction = this.calculateGrowthTimeReduction(cropName);
        const actualGrowTime = cropData.growTime * growthReduction;
        
        // Profit per hour
        const profitPerHour = normalProfit / actualGrowTime;
        const avgProfitPerHour = averageProfit / actualGrowTime;
        
        return {
            cropName,
            growTime: actualGrowTime,
            oilAmount: cropData.oilAmount,
            oilCost: totalOilCost,
            
            // Normal scenario
            normalYield,
            normalRevenue,
            normalProfit,
            profitPerHour,
            
            // With Green Amulet
            hasGreenAmulet,
            amuletProcYield: greenAmuletYield,
            amuletProcRevenue,
            amuletProcProfit,
            
            // Average (considering amulet proc chance)
            averageYield: averageYieldWithAmulet,
            averageRevenue,
            averageProfit,
            avgProfitPerHour,
            
            ROI: totalOilCost > 0 ? (averageProfit / totalOilCost) * 100 : 0
        };
    }

    /**
     * Calculate profit for all crops
     */
    analyzeAllCrops() {
        const crops = Object.keys(this.CROPS);
        const analysis = [];
        
        crops.forEach(cropName => {
            analysis.push(this.calculateCropProfit(cropName));
        });
        
        return analysis;
    }

    /**
     * Find best crop to grow
     */
    findBestCrop() {
        const analysis = this.analyzeAllCrops();
        
        // Sort by average profit per hour
        const sortedByProfitPerHour = [...analysis].sort((a, b) => 
            b.avgProfitPerHour - a.avgProfitPerHour
        );
        
        // Sort by ROI
        const sortedByROI = [...analysis].sort((a, b) => b.ROI - a.ROI);
        
        // Sort by total profit
        const sortedByProfit = [...analysis].sort((a, b) => 
            b.averageProfit - a.averageProfit
        );
        
        return {
            bestProfitPerHour: sortedByProfitPerHour[0],
            bestROI: sortedByROI[0],
            bestTotalProfit: sortedByProfit[0],
            allCrops: analysis
        };
    }

    /**
     * Calculate profit from current greenhouse pots
     */
    calculateCurrentGreenhouse() {
        const greenhouse = this.parser.getGreenhouse();
        const pots = greenhouse.pots || {};
        const oilAvailable = greenhouse.oil || 0;
        
        let totalValue = 0;
        let readyToHarvest = 0;
        let growing = 0;
        const now = Date.now();
        
        const potDetails = [];
        
        Object.entries(pots).forEach(([potId, pot]) => {
            if (pot.plant) {
                const cropName = pot.plant.name;
                const plantedAt = pot.plant.plantedAt;
                const cropData = this.CROPS[cropName];
                
                if (cropData) {
                    const growthReduction = this.calculateGrowthTimeReduction(cropName);
                    const growTime = cropData.growTime * 60 * 60 * 1000 * growthReduction; // Convert to ms
                    const readyAt = plantedAt + growTime;
                    const timeLeft = Math.max(0, readyAt - now);
                    
                    const { additiveBoost } = this.calculateYieldBoost(cropName);
                    const yield_ = cropData.baseYield + additiveBoost;
                    const price = this.parser.getPrice(cropName);
                    const value = yield_ * price;
                    
                    if (timeLeft === 0) {
                        readyToHarvest++;
                        totalValue += value;
                    } else {
                        growing++;
                    }
                    
                    potDetails.push({
                        potId,
                        cropName,
                        plantedAt,
                        readyAt,
                        timeLeft,
                        isReady: timeLeft === 0,
                        yield: yield_,
                        value
                    });
                }
            }
        });
        
        return {
            oilAvailable,
            totalPots: Object.keys(pots).length,
            readyToHarvest,
            growing,
            totalValue,
            pots: potDetails
        };
    }

    /**
     * Get comprehensive greenhouse summary
     */
    getSummary() {
        const bestCrops = this.findBestCrop();
        const currentStatus = this.calculateCurrentGreenhouse();
        const oilCostPerUnit = this.calculateOilCost();
        
        return {
            oilCostPerUnit,
            currentStatus,
            recommendations: {
                bestProfitPerHour: bestCrops.bestProfitPerHour.cropName,
                bestROI: bestCrops.bestROI.cropName,
                bestTotalProfit: bestCrops.bestTotalProfit.cropName
            },
            allCrops: bestCrops.allCrops
        };
    }
}
