/**
 * Data Parser - Processes raw API data into structured formats
 */

export class DataParser {
    constructor(rawData) {
        this.prices = rawData.prices?.data?.p2p || {};
        this.farmData = rawData.farmData?.farm || {};
    }

    /**
     * Get price for an item in SFL
     */
    getPrice(itemName) {
        return this.prices[itemName] || 0;
    }

    /**
     * Get inventory quantity for an item
     */
    getInventory(itemName) {
        const quantity = this.farmData.inventory?.[itemName];
        return quantity ? parseFloat(quantity) : 0;
    }

    /**
     * Get all animals of a specific type
     */
    getAnimals(type) {
        const animals = [];
        
        // Check henHouse for chickens
        if (type === 'Chicken' && this.farmData.henHouse?.animals) {
            Object.values(this.farmData.henHouse.animals).forEach(animal => {
                if (animal.type === 'Chicken') {
                    animals.push(animal);
                }
            });
        }
        
        // Check barn for cows and sheep
        if ((type === 'Cow' || type === 'Sheep') && this.farmData.barn?.animals) {
            Object.values(this.farmData.barn.animals).forEach(animal => {
                if (animal.type === type) {
                    animals.push(animal);
                }
            });
        }
        
        return animals;
    }

    /**
     * Get all crops currently planted
     */
    getCrops() {
        const crops = [];
        
        if (this.farmData.crops) {
            Object.entries(this.farmData.crops).forEach(([id, cropData]) => {
                if (cropData.crop) {
                    crops.push({
                        id,
                        name: cropData.crop.name,
                        plantedAt: cropData.crop.plantedAt,
                        boostedTime: cropData.crop.boostedTime || 0,
                        criticalHit: cropData.crop.criticalHit || {},
                        position: { x: cropData.x, y: cropData.y }
                    });
                }
            });
        }
        
        return crops;
    }

    /**
     * Get greenhouse data
     */
    getGreenhouse() {
        return {
            oil: this.farmData.greenhouse?.oil || 0,
            pots: this.farmData.greenhouse?.pots || {}
        };
    }

    /**
     * Get building data
     */
    getBuildings() {
        return this.farmData.buildings || {};
    }

    /**
     * Get bumpkin skills
     */
    getSkills() {
        return this.farmData.bumpkin?.skills || {};
    }

    /**
     * Get bumpkin equipped items
     */
    getEquipped() {
        return this.farmData.bumpkin?.equipped || {};
    }

    /**
     * Get collectibles placed on farm
     */
    getCollectibles() {
        return this.farmData.collectibles || {};
    }

    /**
     * Check if player has a specific buff/boost active
     */
    hasBoost(boostName) {
        const boostsUsedAt = this.farmData.boostsUsedAt || {};
        return !!boostsUsedAt[boostName];
    }

    /**
     * Get all active boosts
     */
    getActiveBoosts() {
        return this.farmData.boostsUsedAt || {};
    }

    /**
     * Calculate total coins
     */
    getCoins() {
        return this.farmData.coins || 0;
    }

    /**
     * Calculate total SFL balance
     */
    getBalance() {
        return parseFloat(this.farmData.balance) || 0;
    }

    /**
     * Get cooking recipes in progress
     */
    getCooking() {
        const cooking = [];
        const buildings = this.getBuildings();
        
        ['Fire Pit', 'Kitchen', 'Bakery', 'Deli', 'Smoothie Shack'].forEach(buildingType => {
            if (buildings[buildingType]) {
                buildings[buildingType].forEach(building => {
                    if (building.crafting && building.crafting.length > 0) {
                        building.crafting.forEach(recipe => {
                            cooking.push({
                                name: recipe.name,
                                readyAt: recipe.readyAt,
                                buildingType,
                                boost: recipe.boost || {},
                                skills: recipe.skills || {}
                            });
                        });
                    }
                });
            }
        });
        
        return cooking;
    }
}
