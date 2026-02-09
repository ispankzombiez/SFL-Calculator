/**
 * Cooking Calculator - Calculates cooking times, costs, and XP gains
 */

export class CookingCalculator {
    constructor(parser) {
        this.parser = parser;
        
        // Recipe database (simplified - expand as needed)
        this.RECIPES = {
            // Fire Pit
            'Boiled Eggs': {
                ingredients: { 'Egg': 5 },
                cookTime: 60 * 60 * 1000, // 1 hour
                xp: 10,
                building: 'Fire Pit'
            },
            'Mashed Potato': {
                ingredients: { 'Potato': 10 },
                cookTime: 2 * 60 * 60 * 1000,
                xp: 20,
                building: 'Fire Pit'
            },
            'Pumpkin Soup': {
                ingredients: { 'Pumpkin': 10 },
                cookTime: 3 * 60 * 60 * 1000,
                xp: 30,
                building: 'Fire Pit'
            },
            
            // Kitchen
            'Roasted Cauliflower': {
                ingredients: { 'Cauliflower': 10 },
                cookTime: 4 * 60 * 60 * 1000,
                xp: 40,
                building: 'Kitchen'
            },
            'Sauerkraut': {
                ingredients: { 'Cabbage': 10 },
                cookTime: 5 * 60 * 60 * 1000,
                xp: 50,
                building: 'Kitchen'
            },
            
            // Bakery
            'Sunflower Cake': {
                ingredients: { 'Sunflower': 5, 'Wheat': 10, 'Egg': 10 },
                cookTime: 2 * 60 * 60 * 1000,
                xp: 60,
                building: 'Bakery'
            },
            'Potato Cake': {
                ingredients: { 'Potato': 5, 'Wheat': 10, 'Egg': 15 },
                cookTime: 3 * 60 * 60 * 1000,
                xp: 70,
                building: 'Bakery'
            },
            
            // Deli
            'Fermented Carrots': {
                ingredients: { 'Carrot': 20 },
                cookTime: 6 * 60 * 60 * 1000,
                xp: 80,
                building: 'Deli'
            },
            'Sauerkraut': {
                ingredients: { 'Cabbage': 10 },
                cookTime: 5 * 60 * 60 * 1000,
                xp: 90,
                building: 'Deli'
            }
        };
    }

    /**
     * Get all cooking in progress
     */
    getCookingStatus() {
        const cooking = this.parser.getCooking();
        const now = Date.now();
        
        const result = {
            total: cooking.length,
            ready: 0,
            cooking: 0,
            items: [],
            estimatedXP: 0,
            estimatedValue: 0
        };
        
        cooking.forEach(item => {
            const recipe = this.RECIPES[item.name];
            if (!recipe) return;
            
            const cookDetail = {
                name: item.name,
                readyAt: item.readyAt,
                timeUntilReady: Math.max(0, item.readyAt - now),
                percentComplete: 0,
                status: '',
                xp: recipe.xp,
                building: item.buildingType
            };
            
            if (item.readyAt <= now) {
                result.ready++;
                cookDetail.status = 'Ready';
                cookDetail.percentComplete = 100;
            } else {
                result.cooking++;
                cookDetail.status = 'Cooking';
                const cookTime = recipe.cookTime;
                const elapsed = now - (item.readyAt - cookTime);
                cookDetail.percentComplete = Math.min(100, (elapsed / cookTime) * 100);
            }
            
            result.estimatedXP += recipe.xp;
            result.items.push(cookDetail);
        });
        
        return result;
    }

    /**
     * Calculate recipe profitability
     */
    calculateRecipeProfit(recipeName) {
        const recipe = this.RECIPES[recipeName];
        if (!recipe) return null;
        
        // Calculate ingredient cost
        let ingredientCost = 0;
        let canMake = true;
        const ingredientDetails = [];
        
        Object.entries(recipe.ingredients).forEach(([ingredient, amount]) => {
            const price = this.parser.getPrice(ingredient);
            const inInventory = this.parser.getInventory(ingredient);
            
            ingredientCost += price * amount;
            ingredientDetails.push({
                name: ingredient,
                needed: amount,
                available: inInventory,
                cost: price * amount,
                missing: Math.max(0, amount - inInventory)
            });
            
            if (inInventory < amount) canMake = false;
        });
        
        // Calculate product value
        const productPrice = this.parser.getPrice(recipeName);
        const profit = productPrice - ingredientCost;
        
        // Calculate per hour rate
        const cookTime = this.getCookTime(recipe.building, recipe.cookTime);
        const profitPerHour = (profit / cookTime) * 60 * 60 * 1000;
        const xpPerHour = (recipe.xp / cookTime) * 60 * 60 * 1000;
        
        return {
            recipeName,
            building: recipe.building,
            ingredients: ingredientDetails,
            totalCost: ingredientCost,
            productValue: productPrice,
            profit,
            profitPerHour,
            xp: recipe.xp,
            xpPerHour,
            cookTime,
            canMake,
            roi: ingredientCost > 0 ? (profit / ingredientCost) * 100 : 0
        };
    }

    /**
     * Get cook time with boosts
     */
    getCookTime(building, baseTime) {
        let multiplier = 1;
        
        const equipped = this.parser.getEquipped();
        const skills = this.parser.getSkills();
        const collectibles = this.parser.getCollectibles();
        
        // Universal cooking boosts
        if (equipped['Chef Hat']) multiplier *= 0.8; // 20% faster
        if (skills['Rush Hour']) multiplier *= 0.9; // 10% faster
        if (collectibles['Grain Grinder']) multiplier *= 0.8;
        if (this.parser.hasBoost('Kitchen Hand')) multiplier *= 0.5; // 50% faster
        
        // Building-specific boosts
        if (building === 'Fire Pit' && collectibles['Time Warp Totem']) multiplier *= 0.5;
        if (building === 'Bakery' && equipped['Chef Apron']) multiplier *= 0.8;
        
        return Math.floor(baseTime * multiplier);
    }

    /**
     * Find best recipes to cook
     */
    getBestRecipes() {
        const recipes = Object.keys(this.RECIPES);
        const analysis = recipes.map(recipe => this.calculateRecipeProfit(recipe)).filter(r => r !== null);
        
        return {
            byProfit: [...analysis].sort((a, b) => b.profitPerHour - a.profitPerHour).slice(0, 5),
            byXP: [...analysis].sort((a, b) => b.xpPerHour - a.xpPerHour).slice(0, 5),
            canMake: analysis.filter(r => r.canMake).sort((a, b) => b.profitPerHour - a.profitPerHour)
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        const status = this.getCookingStatus();
        const bestRecipes = this.getBestRecipes();
        
        return {
            currentCooking: status,
            recommendations: bestRecipes
        };
    }
}
