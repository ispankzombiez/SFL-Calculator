/**
 * Animal Economic Calculator - Profit analysis per animal level
 * Matches Google Sheets calculator logic
 */

export class AnimalEconomicCalculator {
    constructor(parser, economicConfig) {
        this.parser = parser;
        this.config = economicConfig;
        
        // Animal XP requirements per level
        this.XP_REQUIREMENTS = {
            'Cow': [180, 360, 720, 1080, 1440, 1980, 2520, 3060, 3600, 4320, 5040, 5760, 6480, 7200, 8160],
            'Chicken': [60, 120, 240, 360, 480, 660, 840, 1020, 1200, 1440, 1680, 1920, 2160, 2400, 2720],
            'Sheep': [180, 360, 720, 1080, 1440, 1980, 2520, 3060, 3600, 4320, 5040, 5760, 6480, 7200, 8160]
        };
        
        // Base food ask amounts before boosts
        this.BASE_FOOD_ASK = {
            'Cow': 2.54,
            'Chicken': 2.54,
            'Sheep': 2.54
        };
        
        // Food XP reward
        this.FOOD_XP = 120; // Most foods give 120 XP
        this.MIXED_FOOD_XP = 160; // Mixed grains give 160 XP
        
        // Base output per level (before boosts)
        this.BASE_OUTPUT = {
            'Cow': {
                milk: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4],
                leather: [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4]
            },
            'Chicken': {
                egg: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4],
                feather: [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4]
            },
            'Sheep': {
                wool: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4],
                merino: [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4]
            }
        };
    }

    /**
     * Calculate total feed boost multiplier
     */
    calculateFeedBoost(animalType) {
        let multiplier = 1.0;
        
        // universal boosts
        if (this.config.hasItem('Bull Whip')) multiplier *= 0.5; // 50% reduction
        if (this.config.hasSkill('Efficient Feeding')) multiplier *= 0.95; // 5% reduction
        
        // Animal-specific feed reductions
        if (animalType === 'Cow') {
            if (this.config.hasItem('Dr. Cow')) multiplier *= 0.95; // 5% reduction
            if (this.config.hasItem('Gold Cow')) multiplier = 0; // Free feeding
            if (this.config.hasItem('Collie Shrine')) multiplier *= 0.95; // 5% reduction
            if (this.config.hasSkill('Cow Smart')) multiplier *= 0.75; // 25% reduction
        }
        
        if (animalType === 'Chicken') {
            if (this.config.hasItem('Fat Chicken')) multiplier *= 0.9; // 10% reduction
            if (this.config.hasItem('Cluckulator')) multiplier *= 0.75; // 25% reduction
            if (this.config.hasItem('Gold Egg')) multiplier = 0; // Free feeding
            if (this.config.hasSkill('Clucky Grazing')) multiplier *= 0.75; // 25% reduction
        }
        
        if (animalType === 'Sheep') {
            if (this.config.hasItem('Gold Sheep')) multiplier = 0; // Free feeding
            if (this.config.hasSkill('Sheepwise Diet')) multiplier *= 0.75; // 25% reduction
        }
        
        // Chunky feed increases feed but doubles XP
        if (this.config.hasSkill('Chunky Feed')) {
            multiplier *= 1.5; // 50% MORE feed
        }
        
        return multiplier;
    }

    /**
     * Calculate output boost
     */
    calculateOutputBoost(animalType) {
        const boosts = {};
        
        if (animalType === 'Cow') {
            let milkBoost = 0;
            let leatherBoost = 0;
            
            // Items
            if (this.config.hasItem('Milk Apron')) milkBoost += 0.5;
            if (this.config.hasItem('Cowbell')) milkBoost += 2.0;
            if (this.config.hasItem('Cowfish')) milkBoost += 0.2;
            if (this.config.hasItem('Cattlegrim')) {
                milkBoost += 0.25;
                leatherBoost += 0.25;
            }
            if (this.config.hasItem('Moo-ver')) leatherBoost += 0.25;
            if (this.config.hasItem('Animal Bud')) {
                milkBoost += 0.2;
                leatherBoost += 0.2;
            }
            if (this.config.hasItem('Mootant')) leatherBoost += 0.1;
            if (this.config.hasItem('Training Whistle')) leatherBoost += 1.0;
            
            // Skills
            if (this.config.hasSkill('Abundant Harvest')) milkBoost += 0.2;
            if (this.config.hasSkill('Bale Economy')) milkBoost += 0.1;
            if (this.config.hasSkill('Double Bale')) milkBoost += 0.1;
            if (this.config.hasSkill('Fine Fibers')) leatherBoost += 0.1;
            if (this.config.hasSkill('Leathercraft')) leatherBoost += 0.25;
            
            boosts.milk = milkBoost;
            boosts.leather = leatherBoost;
        }
        
        if (animalType === 'Chicken') {
            let eggBoost = 0;
            let featherBoost = 0;
            
            // Items
            if (this.config.hasItem('Cattlegrim')) {
                eggBoost += 0.25;
                featherBoost += 0.25;
            }
            if (this.config.hasItem('Rich Chicken')) eggBoost += 0.1;
            if (this.config.hasItem('Alien Chicken')) featherBoost += 0.1;
            if (this.config.hasItem('Undead Rooster')) eggBoost += 0.1;
            if (this.config.hasItem('Ayam Cemani')) eggBoost += 0.2;
            if (this.config.hasItem('Chicken Suit')) featherBoost += 1.0;
            if (this.config.hasItem('Chicken Coop')) eggBoost += 1.0;
            
            // Skills
            if (this.config.hasSkill('Abundant Harvest')) eggBoost += 0.2;
            if (this.config.hasSkill('Bale Economy')) eggBoost += 0.1;
            if (this.config.hasSkill('Double Bale')) eggBoost += 0.1;
            if (this.config.hasSkill('Fine Fibers')) featherBoost += 0.1;
            if (this.config.hasSkill('Featherweight')) featherBoost += 0.25;
            
            boosts.egg = eggBoost;
            boosts.feather = featherBoost;
        }
        
        if (animalType === 'Sheep') {
            let woolBoost = 0;
            let merinoBoost = 0;
            
            // Items
            if (this.config.hasItem('W. Sheep Onesie')) woolBoost += 0.25;
            if (this.config.hasItem('Toxic Tuft')) merinoBoost += 0.1;
            if (this.config.hasItem('Merino Jumper')) merinoBoost += 1.0;
            if (this.config.hasItem('B. Sheep Onesie')) woolBoost += 2.0;
            if (this.config.hasItem('Cattlegrim')) {
                woolBoost += 0.25;
                merinoBoost += 0.25;
            }
            
            // Skills
            if (this.config.hasSkill('Efficient Feeding')) ; // Already counted in feed
            if (this.config.hasSkill('Fine Fibers')) merinoBoost += 0.1;
            if (this.config.hasSkill('Double Bale')) woolBoost += 0.1;
            if (this.config.hasSkill('Bale Economy')) woolBoost += 0.1;
            if (this.config.hasSkill('Abundant Harvest')) woolBoost += 0.2;
            
            boosts.wool = woolBoost;
            boosts.merino = merinoBoost;
        }
        
        return boosts;
    }

    /**
     * Calculate feeds needed to reach a level
     */
    calculateFeedsNeeded(animalType, level) {
        const xpNeeded = this.XP_REQUIREMENTS[animalType][level - 1];
        const xpPerFeed = this.config.hasSkill('Chunky Feed') ? this.FOOD_XP * 2 : this.FOOD_XP;
        
        // Determine optimal food type based on level
        let foodType, foodXP;
        if (level <= 3) {
            foodType = 'Corn';
            foodXP = 120;
        } else if (level <= 6) {
            foodType = 'Wheat';
            foodXP = 120;
        } else if (level <= 10) {
            foodType = 'Barley';
            foodXP = 120;
        } else {
            foodType = 'Mixed Grain';
            foodXP = 160;
        }
        
        if (this.config.hasSkill('Chunky Feed')) {
            foodXP *= 2;
        }
        
        const feedsNeeded = Math.ceil(xpNeeded / foodXP);
        return { foodType, feedsNeeded, xpGained: feedsNeeded * foodXP };
    }

    /**
     * Calculate feed cost for a level
     */
    calculateFeedCost(animalType, level) {
        const { foodType, feedsNeeded } = this.calculateFeedsNeeded(animalType, level);
        const baseFoodAsk = this.BASE_FOOD_ASK[animalType];
        const feedBoost = this.calculateFeedBoost(animalType);
        const foodPerFeed = baseFoodAsk * feedBoost;
        const totalFood = foodPerFeed * feedsNeeded;
        
        // Get food price
        let foodPrice = 0;
        switch(foodType) {
            case 'Corn': foodPrice = this.parser.getPrice('Corn'); break;
            case 'Wheat': foodPrice = this.parser.getPrice('Wheat'); break;
            case 'Barley': foodPrice = this.parser.getPrice('Barley'); break;
            case 'Mixed Grain': 
                // Mixed is kale + wheat/barley
                foodPrice = (this.parser.getPrice('Kale') + this.parser.getPrice('Wheat')) / 2;
                break;
        }
        
        const totalCost = totalFood * foodPrice;
        
        return {
            foodType,
            feedsNeeded,
            foodPerFeed,
            totalFood,
            foodPrice,
            totalCost
        };
    }

    /**
     * Calculate output for a level
     */
    calculateOutput(animalType, level) {
        const baseOutput = this.BASE_OUTPUT[animalType];
        const boosts = this.calculateOutputBoost(animalType);
        const output = {};
        
        Object.keys(baseOutput).forEach(resource => {
            const base = baseOutput[resource][level - 1];
            const boost = boosts[resource] || 0;
            output[resource] = base + boost;
        });
        
        return output;
    }

    /**
     * Calculate profit for a specific level
     */
    calculateLevelProfit(animalType, level) {
        const feedCost = this.calculateFeedCost(animalType, level);
        const output = this.calculateOutput(animalType, level);
        const taxMultiplier = this.config.getAfterTaxMultiplier();
        
        // Calculate revenue
        let totalRevenue = 0;
        const revenueBreakdown = {};
        
        Object.entries(output).forEach(([resource, amount]) => {
            let resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
            
            // Map resource names to API names
            if (resource === 'merino') resourceName = 'Merino Wool';
            if (resource === 'wool') resourceName = 'Wool';
            if (resource === 'egg') resourceName = 'Egg';
            if (resource === 'feather') resourceName = 'Feather';
            if (resource === 'milk') resourceName = 'Milk';
            if (resource === 'leather') resourceName = 'Leather';
            
            const price = this.parser.getPrice(resourceName);
            const revenue = amount * price * taxMultiplier;
            revenueBreakdown[resource] = {
                amount,
                pricePerUnit: price,
                revenue
            };
            totalRevenue += revenue;
        });
        
        const profit = totalRevenue - feedCost.totalCost;
        const profitPercent = feedCost.totalCost > 0 ? (profit / feedCost.totalCost) * 100 : 0;
        
        return {
            level,
            feedCost,
            output,
            revenueBreakdown,
            totalRevenue,
            profit,
            profitPercent
        };
    }

    /**
     * Calculate profit analysis for all levels
     */
    analyzeAllLevels(animalType) {
        const analysis = [];
        
        for (let level = 1; level <= 15; level++) {
            analysis.push(this.calculateLevelProfit(animalType, level));
        }
        
        return analysis;
    }

    /**
     * Find optimal feeding strategy
     */
    findOptimalLevel(animalType) {
        const analysis = this.analyzeAllLevels(animalType);
        
        // Find level with highest profit
        const bestProfit = analysis.reduce((best, curr) => 
            curr.profit > best.profit ? curr : best
        );
        
        // Find level with highest profit %
        const bestProfitPercent = analysis.reduce((best, curr) =>
            curr.profitPercent > best.profitPercent ? curr : best
        );
        
        return {
            bestProfitLevel: bestProfit.level,
            bestProfitAmount: bestProfit.profit,
            bestProfitPercentLevel: bestProfitPercent.level,
            bestProfitPercent: bestProfitPercent.profitPercent,
            analysis
        };
    }

    /**
     * Calculate profit per 24 hours
     */
    calculateDailyProfit(animalType, level) {
        const levelProfit = this.calculateLevelProfit(animalType, level);
        const sleepTime = this.config.getSleepTime(animalType);
        const cyclesPerDay = 24 / sleepTime;
        const dailyProfit = levelProfit.profit * cyclesPerDay;
        const numAnimals = this.config.getNumAnimals(animalType);
        const totalDailyProfit = dailyProfit * numAnimals;
        
        return {
            ...levelProfit,
            cyclesPerDay,
            profitPerCycle: levelProfit.profit,
            profitPerDay: dailyProfit,
            numAnimals,
            totalDailyProfit
        };
    }

    /**
     * Get comprehensive animal economic summary
     */
    getSummary(animalType) {
        const optimal = this.findOptimalLevel(animalType);
        const dailyAtOptimal = this.calculateDailyProfit(animalType, optimal.bestProfitLevel);
        
        return {
            animalType,
            optimalLevel: optimal.bestProfitLevel,
            optimalProfit: optimal.bestProfitAmount,
            dailyProfit: dailyAtOptimal.totalDailyProfit,
            numAnimals: this.config.getNumAnimals(animalType),
            allLevels: optimal.analysis
        };
    }
}
