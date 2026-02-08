/**
 * Item Detection Module
 * Detects owned items, wearables, and skills from farm data
 * Calculates boost multipliers for various calculators
 */

/**
 * Item boost configuration for cows
 * Based on Constants CSV data
 */
const COW_BOOST_ITEMS = {
    // Items that boost milk production
    milk: {
        'Milk Apron': 0.1,
        'Cowbell': 0.25,
        'Cow Fish': 0.15,
        'Cattle Grim': 0.5,
        'Moo-ver': 0.3,
    },
    // Items that boost leather production
    leather: {
        'Leather': 0.1, // Base leather item
    },
    // Items that reduce feed requirements
    feed: {
        'Bale Economy': 0.05,
        'Chunky Feed': 0.1,
    },
};

/**
 * Skill boost configuration
 */
const COW_BOOST_SKILLS = {
    milk: {
        'Abundant Harvest': 0.2,
        'Cow Smart': 0.15,
    },
    leather: {
        'Leather Master': 0.2,
    },
    feed: {
        'Feed Efficiency': 0.1,
    },
};

/**
 * Detect items and calculate boosts from farm data
 * @param {Object} farmData - Raw farm data from API
 * @returns {Object} Detected items and calculated boosts
 */
export function detectItems(farmData) {
    if (!farmData || typeof farmData !== 'object') {
        console.warn('Invalid farm data provided to detectItems');
        return getDefaultBoosts();
    }

    // Extract inventory items
    const inventory = farmData.inventory || {};
    const wardrobe = farmData.wardrobe || [];
    const skills = farmData.skills || [];
    const buildings = farmData.buildings || {};
    
    // Detect owned items
    const ownedItems = {
        inventory: Object.keys(inventory),
        wardrobe: wardrobe,
        skills: skills,
        buildings: Object.keys(buildings),
    };

    // Calculate boosts
    const boosts = calculateBoosts(ownedItems);

    // Count animals
    const animalCounts = countAnimals(farmData);

    return {
        ownedItems,
        boosts,
        animalCounts,
        farmLevel: farmData.level || 1,
        farmData, // Keep reference to full data
    };
}

/**
 * Calculate boost multipliers based on owned items
 * @param {Object} ownedItems - Object containing arrays of owned items
 * @returns {Object} Calculated boost multipliers
 */
export function calculateBoosts(ownedItems) {
    const allItems = [
        ...(ownedItems.inventory || []),
        ...(ownedItems.wardrobe || []),
        ...(ownedItems.skills || []),
        ...(ownedItems.buildings || []),
    ];

    // Initialize boost totals
    let milkBoost = 1.0;
    let leatherBoost = 1.0;
    let feedReduction = 1.0;

    // Calculate milk boosts
    for (const [itemName, boost] of Object.entries(COW_BOOST_ITEMS.milk)) {
        if (allItems.includes(itemName)) {
            milkBoost += boost;
            console.log(`Detected ${itemName}: +${boost} milk boost`);
        }
    }
    for (const [skillName, boost] of Object.entries(COW_BOOST_SKILLS.milk)) {
        if (allItems.includes(skillName)) {
            milkBoost += boost;
            console.log(`Detected ${skillName} skill: +${boost} milk boost`);
        }
    }

    // Calculate leather boosts
    for (const [itemName, boost] of Object.entries(COW_BOOST_ITEMS.leather)) {
        if (allItems.includes(itemName)) {
            leatherBoost += boost;
            console.log(`Detected ${itemName}: +${boost} leather boost`);
        }
    }
    for (const [skillName, boost] of Object.entries(COW_BOOST_SKILLS.leather)) {
        if (allItems.includes(skillName)) {
            leatherBoost += boost;
            console.log(`Detected ${skillName} skill: +${boost} leather boost`);
        }
    }

    // Calculate feed reduction
    for (const [itemName, reduction] of Object.entries(COW_BOOST_ITEMS.feed)) {
        if (allItems.includes(itemName)) {
            feedReduction -= reduction;
            console.log(`Detected ${itemName}: -${reduction} feed cost`);
        }
    }
    for (const [skillName, reduction] of Object.entries(COW_BOOST_SKILLS.feed)) {
        if (allItems.includes(skillName)) {
            feedReduction -= reduction;
            console.log(`Detected ${skillName} skill: -${reduction} feed cost`);
        }
    }

    return {
        cow: {
            milkBoost,
            leatherBoost,
            feedReduction,
        },
        // Placeholder for other animal boosts
        sheep: {
            woolBoost: 1.0,
            feedReduction: 1.0,
        },
        chicken: {
            eggBoost: 1.0,
            feedReduction: 1.0,
        },
    };
}

/**
 * Count animals on the farm
 * @param {Object} farmData - Farm data from API
 * @returns {Object} Animal counts
 */
function countAnimals(farmData) {
    const animals = farmData.animals || farmData.livestock || {};
    
    return {
        cows: animals.cows?.length || 0,
        sheep: animals.sheep?.length || 0,
        chickens: animals.chickens?.length || 0,
    };
}

/**
 * Get default boosts (when no items detected)
 * @returns {Object} Default boost configuration
 */
function getDefaultBoosts() {
    return {
        ownedItems: {
            inventory: [],
            wardrobe: [],
            skills: [],
            buildings: [],
        },
        boosts: {
            cow: {
                milkBoost: 1.0,
                leatherBoost: 1.0,
                feedReduction: 1.0,
            },
            sheep: {
                woolBoost: 1.0,
                feedReduction: 1.0,
            },
            chicken: {
                eggBoost: 1.0,
                feedReduction: 1.0,
            },
        },
        animalCounts: {
            cows: 0,
            sheep: 0,
            chickens: 0,
        },
        farmLevel: 1,
    };
}

/**
 * Get boolean toggles for all possible boost items (for debugging/display)
 * @param {Object} ownedItems - Object containing arrays of owned items
 * @returns {Object} Boolean map of all items
 */
export function getBooleanToggles(ownedItems) {
    const allItems = [
        ...(ownedItems.inventory || []),
        ...(ownedItems.wardrobe || []),
        ...(ownedItems.skills || []),
        ...(ownedItems.buildings || []),
    ];

    const toggles = {};

    // Check all cow boost items
    Object.keys(COW_BOOST_ITEMS.milk).forEach(item => {
        toggles[item] = allItems.includes(item);
    });
    Object.keys(COW_BOOST_ITEMS.leather).forEach(item => {
        toggles[item] = allItems.includes(item);
    });
    Object.keys(COW_BOOST_ITEMS.feed).forEach(item => {
        toggles[item] = allItems.includes(item);
    });

    // Check all cow boost skills
    Object.keys(COW_BOOST_SKILLS.milk).forEach(skill => {
        toggles[skill] = allItems.includes(skill);
    });
    Object.keys(COW_BOOST_SKILLS.leather).forEach(skill => {
        toggles[skill] = allItems.includes(skill);
    });
    Object.keys(COW_BOOST_SKILLS.feed).forEach(skill => {
        toggles[skill] = allItems.includes(skill);
    });

    return toggles;
}

/**
 * Extract resources from farm data
 * @param {Object} farmData - Farm data from API
 * @returns {Object} Resource counts
 */
export function extractResources(farmData) {
    const inventory = farmData.inventory || {};
    
    return {
        coins: farmData.coins || 0,
        wood: inventory.Wood || 0,
        stone: inventory.Stone || 0,
        iron: inventory.Iron || 0,
        gold: inventory.Gold || 0,
        crimstone: inventory.Crimstone || 0,
        oil: inventory.Oil || 0,
        // Crops
        corn: inventory.Corn || 0,
        wheat: inventory.Wheat || 0,
        barley: inventory.Barley || 0,
        kale: inventory.Kale || 0,
        // Animal products
        milk: inventory.Milk || 0,
        leather: inventory.Leather || 0,
        wool: inventory.Wool || 0,
        egg: inventory.Egg || 0,
    };
}

/**
 * Check if farm has specific building
 * @param {Object} farmData - Farm data from API
 * @param {string} buildingName - Building name to check
 * @returns {boolean} True if building exists
 */
export function hasBuilding(farmData, buildingName) {
    const buildings = farmData.buildings || {};
    return buildingName in buildings;
}

/**
 * Get farm configuration parameters (from Constants CSV equivalent)
 * These can be overridden by user settings later
 * @returns {Object} Default configuration
 */
export function getDefaultConfig() {
    return {
        taxPercent: 5, // Default 5% tax
        sleepHours: 8, // Default 8 hours sleep
        bettyConversionRate: 100, // Coins per SFL
        foodRequirementPerFeeding: 2.54,
    };
}
