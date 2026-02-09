/**
 * Economic Configuration - User settings for profit calculations
 */

export class EconomicConfig {
    constructor() {
        // Load from localStorage or use defaults
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('sfl-economic-config');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default settings
        return {
            // Tax rates (percentage as decimal)
            p2pTaxRate: 0.05, // 5% default
            
            // Coin conversion rate (Betty)
            bettyConversionRate:1019,
            
            // Animal sleep times (hours)
            cowSleepTime: 12,
            chickenSleepTime: 18,
            sheepSleepTime: 24,
            
            // Number of animals owned
            numCows: 0,
            numChickens: 0,
            numSheep: 0,
            
            // Number of resource nodes
            numTrees: 0,
            numStones: 0,
            numIron: 0,
            numGold: 0,
            numCrimstone: 0,
            numSunstone: 0,
            
            // Owned items/boosts (for calculations)
            ownedItems: {
                // Cows
                'Milk Apron': false,
                'Cowbell': false,
                'Cowfish': false,
                'Cattlegrim': false,
                'Moo-ver': false,
                'Animal Bud': false,
                'Mootant': false,
                'Training Whistle': false,
                'Bull Whip': false,
                'Dr. Cow': false,
                'Gold Cow': false,
                'Collie Shrine': false,
                
                // Chickens
                'Fat Chicken': false,
                'Rich Chicken': false,
                'Alien Chicken': false,
                'Undead Rooster': false,
                'Ayam Cemani': false,
                'Chicken Suit': false,
                'Cluckulator': false,
                'Chicken Coop': false,
                'Gold Egg': false,
                
                // Sheep
                'W. Sheep Onesie': false,
                'Toxic Tuft': false,
                'Merino Jumper': false,
                'B. Sheep Onesie': false,
                'Gold Sheep': false,
                
                // Resources
                'Faction Shield': false,
                'Volcano Gnome': false,
                'Cave Bud': false,
                'Mineral Stem': false,
                'Squirrel': false,
                'Tiki Totem': false,
                'Woody Beaver': false,
                'Apprentice Beaver': false,
                'Foreman Beaver': false,
                'Wood Nymph Wendy': false,
                'Wood Bud': false,
                'Bud Stem': false,
                'Stone Beetle': false,
                'Tunnel Mole': false,
                'Rock Golem': false,
                'Tin Turtle': false,
                'Emerald Turtle': false,
                
                // Greenhouse
                'Rice Panda': false,
                'Olive Royalty Shirt': false,
                'Vinny': false,
                'Grape Pants': false,
                'Olive Shield': false,
                'Non La Hat': false,
                'Grape Granny': false,
                'Turbo Sprout': false,
                'Pharaoh Gnome': false,
                'Hoot': false,
                'Green Amulet': false,
                'Infernal Drill': false
            },
            
            // Owned skills
            ownedSkills: {
                'Abundant Harvest': false,
                'Bale Economy': false,
                'Double Bale': false,
                'Fine Fibers': false,
                'Chunky Feed': false,
                'Cow Smart': false,
                'Efficient Feeding': false,
                'Leathercraft': false,
                'Featherweight': false,
                'Clucky Grazing': false,
                'Sheepwise Diet': false,
                'Green Thumb': false,
                'Master Farmer': false,
                'Lumberjack': false,
                'Tree Hugger': false,
                'Mining Mastery': false,
                'Crop Whisperer': false,
                'Rush Hour': false
            }
        };
    }

    saveSettings() {
        localStorage.setItem('sfl-economic-config', JSON.stringify(this.settings));
    }

    // Getters
    getTaxRate() {
        return this.settings.p2pTaxRate;
    }

    getAfterTaxMultiplier() {
        return 1 - this.settings.p2pTaxRate;
    }

    getBettyRate() {
        return this.settings.bettyConversionRate;
    }

    getSleepTime(animalType) {
        switch(animalType) {
            case 'Cow': return this.settings.cowSleepTime;
            case 'Chicken': return this.settings.chickenSleepTime;
            case 'Sheep': return this.settings.sheepSleepTime;
            default: return 24;
        }
    }

    getNumAnimals(animalType) {
        switch(animalType) {
            case 'Cow': return this.settings.numCows;
            case 'Chicken': return this.settings.numChickens;
            case 'Sheep': return this.settings.numSheep;
            default: return 0;
        }
    }

    getNumNodes(nodeType) {
        switch(nodeType) {
            case 'Tree': return this.settings.numTrees;
            case 'Stone': return this.settings.numStones;
            case 'Iron': return this.settings.numIron;
            case 'Gold': return this.settings.numGold;
            case 'Crimstone': return this.settings.numCrimstone;
            case 'Sunstone': return this.settings.numSunstone;
            default: return 0;
        }
    }

    hasItem(itemName) {
        return this.settings.ownedItems[itemName] === true;
    }

    hasSkill(skillName) {
        return this.settings.ownedSkills[skillName] === true;
    }

    // Setters
    setTaxRate(rate) {
        this.settings.p2pTaxRate = rate;
        this.saveSettings();
    }

    setBettyRate(rate) {
        this.settings.bettyConversionRate = rate;
        this.saveSettings();
    }

    setSleepTime(animalType, hours) {
        switch(animalType) {
            case 'Cow': this.settings.cowSleepTime = hours; break;
            case 'Chicken': this.settings.chickenSleepTime = hours; break;
            case 'Sheep': this.settings.sheepSleepTime = hours; break;
        }
        this.saveSettings();
    }

    setNumAnimals(animalType, count) {
        switch(animalType) {
            case 'Cow': this.settings.numCows = count; break;
            case 'Chicken': this.settings.numChickens = count; break;
            case 'Sheep': this.settings.numSheep = count; break;
        }
        this.saveSettings();
    }

    setNumNodes(nodeType, count) {
        switch(nodeType) {
            case 'Tree': this.settings.numTrees = count; break;
            case 'Stone': this.settings.numStones = count; break;
            case 'Iron': this.settings.numIron = count; break;
            case 'Gold': this.settings.numGold = count; break;
            case 'Crimstone': this.settings.numCrimstone = count; break;
            case 'Sunstone': this.settings.numSunstone = count; break;
        }
        this.saveSettings();
    }

    setItem(itemName, owned) {
        if (this.settings.ownedItems.hasOwnProperty(itemName)) {
            this.settings.ownedItems[itemName] = owned;
            this.saveSettings();
        }
    }

    setSkill(skillName, owned) {
        if (this.settings.ownedSkills.hasOwnProperty(skillName)) {
            this.settings.ownedSkills[skillName] = owned;
            this.saveSettings();
        }
    }

    // Bulk operations
    setMultipleItems(items) {
        Object.entries(items).forEach(([name, owned]) => {
            if (this.settings.ownedItems.hasOwnProperty(name)) {
                this.settings.ownedItems[name] = owned;
            }
        });
        this.saveSettings();
    }

    setMultipleSkills(skills) {
        Object.entries(skills).forEach(([name, owned]) => {
            if (this.settings.ownedSkills.hasOwnProperty(name)) {
                this.settings.ownedSkills[name] = owned;
            }
        });
        this.saveSettings();
    }

    // Auto-detect from farm data
    autoDetectFromFarmData(farmData) {
        // Count animals
        const henHouse = farmData.henHouse?.animals || {};
        const barn = farmData.barn?.animals || {};
        
        let cows = 0, chickens = 0, sheep = 0;
        
        Object.values(henHouse).forEach(animal => {
            if (animal.type === 'Chicken') chickens++;
        });
        
        Object.values(barn).forEach(animal => {
            if (animal.type === 'Cow') cows++;
            if (animal.type === 'Sheep') sheep++;
        });
        
        this.setNumAnimals('Cow', cows);
        this.setNumAnimals('Chicken', chickens);
        this.setNumAnimals('Sheep', sheep);
        
        // Count resource nodes
        this.setNumNodes('Tree', Object.keys(farmData.trees || {}).length);
        this.setNumNodes('Stone', Object.keys(farmData.stones || {}).length);
        this.setNumNodes('Iron', Object.keys(farmData.iron || {}).length);
        this.setNumNodes('Gold', Object.keys(farmData.gold || {}).length);
        this.setNumNodes('Crimstone', Object.keys(farmData.crimstones || {}).length);
        this.setNumNodes('Sunstone', Object.keys(farmData.sunstones || {}).length);
        
        // Detect owned items from collectibles
        const collectibles = farmData.collectibles || {};
        Object.keys(collectibles).forEach(itemName => {
            if (this.settings.ownedItems.hasOwnProperty(itemName)) {
                this.setItem(itemName, true);
            }
        });
        
        // Detect equipped items
        const equipped = farmData.bumpkin?.equipped || {};
        Object.values(equipped).forEach(itemName => {
            if (this.settings.ownedItems.hasOwnProperty(itemName)) {
                this.setItem(itemName, true);
            }
        });
        
        // Detect skills
        const skills = farmData.bumpkin?.skills || {};
        Object.keys(skills).forEach(skillName => {
            if (this.settings.ownedSkills.hasOwnProperty(skillName)) {
                this.setSkill(skillName, true);
            }
        });
    }
}
