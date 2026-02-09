/**
 * Animal Calculator - Calculates production times and yields for animals
 */

export class AnimalCalculator {
    constructor(parser) {
        this.parser = parser;
        
        // Base production times (in hours)
        this.PRODUCTION_TIMES = {
            'Chicken': 48,
            'Cow': 48,
            'Sheep': 48
        };
        
        // Base output per animal
        this.BASE_OUTPUT = {
            'Chicken': { 'Egg': 3 },
            'Cow': { 'Milk': 1 },
            'Sheep': { 'Merino Wool': 1 }
        };
    }

    /**
     * Get all animals with production status
     */
    getAllAnimals() {
        const result = {
            chickens: this.getAnimalDetails('Chicken'),
            cows: this.getAnimalDetails('Cow'),
            sheep: this.getAnimalDetails('Sheep')
        };
        
        return result;
    }

    /**
     * Get detailed info for a specific animal type
     */
    getAnimalDetails(animalType) {
        const animals = this.parser.getAnimals(animalType);
        const details = {
            type: animalType,
            total: animals.length,
            fed: 0,
            ready: 0,
            hungry: 0,
            animals: [],
            totalProduction: {},
            estimatedCompletion: null
        };
        
        const now = Date.now();
        const productionTime = this.getProductionTime(animalType);
        const baseOutput = this.BASE_OUTPUT[animalType];
        
        animals.forEach(animal => {
            const animalDetail = {
                id: animal.id,
                state: animal.state,
                fedAt: animal.fedAt,
                awakeAt: animal.awakeAt,
                asleepAt: animal.asleepAt,
                timeUntilReady: 0,
                percentComplete: 0,
                willProduce: {}
            };
            
            if (animal.state === 'idle') {
                details.hungry++;
                animalDetail.status = 'Needs feeding';
            } else if (animal.state === 'happy') {
                details.fed++;
                const readyTime = animal.awakeAt;
                
                if (readyTime && readyTime <= now) {
                    details.ready++;
                    animalDetail.status = 'Ready to collect';
                    animalDetail.percentComplete = 100;
                    
                    // Add to total production
                    Object.entries(baseOutput).forEach(([item, amount]) => {
                        details.totalProduction[item] = (details.totalProduction[item] || 0) + amount;
                        animalDetail.willProduce[item] = amount;
                    });
                } else if (readyTime) {
                    const timeLeft = readyTime - now;
                    animalDetail.timeUntilReady = timeLeft;
                    animalDetail.status = 'Producing';
                    
                    // Calculate percentage
                    const timeSinceFed = now - animal.fedAt;
                    animalDetail.percentComplete = Math.min(100, (timeSinceFed / productionTime) * 100);
                    
                    // Update estimated completion
                    if (!details.estimatedCompletion || readyTime > details.estimatedCompletion) {
                        details.estimatedCompletion = readyTime;
                    }
                }
            } else if (animal.state === 'sad') {
                animalDetail.status = 'Sleeping (unfed)';
            }
            
            details.animals.push(animalDetail);
        });
        
        return details;
    }

    /**
     * Calculate production time with boosts
     */
    getProductionTime(animalType) {
        const baseTime = this.PRODUCTION_TIMES[animalType] * 60 * 60 * 1000; // Convert to ms
        let multiplier = 1;
        
        // Check for speed boosts from equipment, skills, etc.
        const equipped = this.parser.getEquipped();
        const collectibles = this.parser.getCollectibles();
        
        // Common boosts
        if (equipped['Cattlegrim']) multiplier *= 0.5; // 50% faster livestock
        if (collectibles['Time Warp Totem']) multiplier *= 0.5; // Various speed boosts
        
        // Animal-specific boosts
        if (animalType === 'Chicken') {
            if (equipped['Chicken Coop']) multiplier *= 0.9;
            if (collectibles['Chicken Coop']) multiplier *= 0.9;
        } else if (animalType === 'Cow') {
            if (equipped['Cowbell']) multiplier *= 0.75;
        } else if (animalType === 'Sheep') {
            if (equipped['Shepherds Staff']) multiplier *= 0.75;
        }
        
        return Math.floor(baseTime * multiplier);
    }

    /**
     * Calculate profit from animals
     */
    calculateProfit(animalType) {
        const details = this.getAnimalDetails(animalType);
        const output = this.BASE_OUTPUT[animalType];
        
        let totalValue = 0;
        Object.entries(output).forEach(([item, amount]) => {
            const price = this.parser.getPrice(item);
            totalValue += price * amount * details.total;
        });
        
        // Calculate feed cost
        const feedCost = this.getFeedCost(animalType) * details.total;
        const profit = totalValue - feedCost;
        
        return {
            totalValue,
            feedCost,
            profit,
            profitPerAnimal: details.total > 0 ? profit / details.total : 0,
            productionTime: this.getProductionTime(animalType)
        };
    }

    /**
     * Get feed cost for animal type
     */
    getFeedCost(animalType) {
        const feedTypes = {
            'Chicken': ['Wheat'],
            'Cow': ['Wheat'],
            'Sheep': ['Wheat']
        };
        
        const feeds = feedTypes[animalType] || [];
        let totalCost = 0;
        
        feeds.forEach(feed => {
            totalCost += this.parser.getPrice(feed);
        });
        
        return totalCost;
    }

    /**
     * Get summary of all animal operations
     */
    getSummary() {
        const chickens = this.getAnimalDetails('Chicken');
        const cows = this.getAnimalDetails('Cow');
        const sheep = this.getAnimalDetails('Sheep');
        
        const chickenProfit = this.calculateProfit('Chicken');
        const cowProfit = this.calculateProfit('Cow');
        const sheepProfit = this.calculateProfit('Sheep');
        
        return {
            chickens: {
                ...chickens,
                profit: chickenProfit
            },
            cows: {
                ...cows,
                profit: cowProfit
            },
            sheep: {
                ...sheep,
                profit: sheepProfit
            },
            totalAnimals: chickens.total + cows.total + sheep.total,
            readyToCollect: chickens.ready + cows.ready + sheep.ready,
            needFeeding: chickens.hungry + cows.hungry + sheep.hungry,
            totalDailyProfit: (chickenProfit.profit / chickenProfit.productionTime + 
                               cowProfit.profit / cowProfit.productionTime + 
                               sheepProfit.profit / sheepProfit.productionTime) * 24 * 60 * 60 * 1000
        };
    }
}
