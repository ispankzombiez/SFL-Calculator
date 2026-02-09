/**
 * Main Calculator - Coordinates all calculator modules
 */

import { DataParser } from '../parsers/data-parser.js';
import { AnimalCalculator } from './animal-calculator.js';
import { CropCalculator } from './crop-calculator.js';
import { CookingCalculator } from './cooking-calculator.js';
import { ResourceCalculator } from './resource-calculator.js';

export class SFLCalculator {
    constructor(rawData) {
        this.parser = new DataParser(rawData);
        this.animalCalc = new AnimalCalculator(this.parser);
        this.cropCalc = new CropCalculator(this.parser);
        this.cookingCalc = new CookingCalculator(this.parser);
        this.resourceCalc = new ResourceCalculator(this.parser);
    }

    /**
     * Get comprehensive farm summary
     */
    getFarmSummary() {
        return {
            balance: {
                sfl: this.parser.getBalance(),
                coins: this.parser.getCoins()
            },
            animals: this.animalCalc.getSummary(),
            crops: this.cropCalc.getSummary(),
            cooking: this.cookingCalc.getSummary(),
            resources: this.resourceCalc.getSummary(),
            bumpkin: {
                skills: Object.keys(this.parser.getSkills()).length,
                equipped: this.parser.getEquipped()
            }
        };
    }

    /**
     * Get actionable tasks
     */
    getActionableTasks() {
        const tasks = [];
        
        // Check animals
        const animals = this.animalCalc.getSummary();
        if (animals.readyToCollect > 0) {
            tasks.push({
                priority: 'high',
                category: 'animals',
                action: `Collect from ${animals.readyToCollect} animals`,
                details: animals
            });
        }
        if (animals.needFeeding > 0) {
            tasks.push({
                priority: 'medium',
                category: 'animals',
                action: `Feed ${animals.needFeeding} animals`,
                details: animals
            });
        }
        
        // Check crops
        const crops = this.cropCalc.getPlantedCrops();
        if (crops.ready > 0) {
            tasks.push({
                priority: 'high',
                category: 'crops',
                action: `Harvest ${crops.ready} crops`,
                estimatedValue: crops.estimatedValue,
                details: crops
            });
        }
        
        if (crops.nextHarvest) {
            tasks.push({
                priority: 'low',
                category: 'crops',
                action: `Next harvest in ${this.formatTime(crops.nextHarvest - Date.now())}`,
                timestamp: crops.nextHarvest
            });
        }
        
        // Check cooking
        const cooking = this.cookingCalc.getCookingStatus();
        if (cooking.ready > 0) {
            tasks.push({
                priority: 'medium',
                category: 'cooking',
                action: `Collect ${cooking.ready} cooked items`,
                estimatedXP: cooking.estimatedXP,
                details: cooking
            });
        }
        
        // Check resources
        const resources = this.resourceCalc.getSummary();
        if (resources.totalReady > 0) {
            tasks.push({
                priority: 'medium',
                category: 'resources',
                action: `Mine ${resources.totalReady} resource nodes`,
                estimatedValue: resources.totalValue,
                details: resources
            });
        }
        
        // Sort by priority
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        
        return tasks;
    }

    /**
     * Get profit optimization suggestions
     */
    getOptimizationSuggestions() {
        const suggestions = [];
        
        // Best crops to plant
        const bestCrops = this.cropCalc.getBestCrops();
        if (bestCrops.byProfitPerHour.length > 0) {
            suggestions.push({
                category: 'crops',
                title: 'Most profitable crops to plant',
                items: bestCrops.byProfitPerHour.map(crop => ({
                    name: crop.cropName,
                    profitPerHour: crop.profitPerHour,
                    roi: crop.roi
                }))
            });
        }
        
        // Best recipes to cook
        const bestRecipes = this.cookingCalc.getBestRecipes();
        if (bestRecipes.byProfit.length > 0) {
            suggestions.push({
                category: 'cooking',
                title: 'Most profitable recipes',
                items: bestRecipes.byProfit.slice(0, 3).map(recipe => ({
                    name: recipe.recipeName,
                    profitPerHour: recipe.profitPerHour,
                    canMake: recipe.canMake
                }))
            });
        }
        
        // Best resources to prioritize
        const bestResources = this.resourceCalc.getBestResources();
        if (bestResources.byProfitPerHour.length > 0) {
            suggestions.push({
                category: 'resources',
                title: 'Most valuable resources',
                items: bestResources.byProfitPerHour.slice(0, 3).map(resource => ({
                    name: resource.resourceType,
                    profitPerHour: resource.profitPerHour,
                    readyNodes: resource.readyNodes
                }))
            });
        }
        
        // Animal profit analysis
        const animalSummary = this.animalCalc.getSummary();
        suggestions.push({
            category: 'animals',
            title: 'Daily profit from animals',
            totalProfit: animalSummary.totalDailyProfit,
            breakdown: {
                chickens: animalSummary.chickens.profit.profit,
                cows: animalSummary.cows.profit.profit,
                sheep: animalSummary.sheep.profit.profit
            }
        });
        
        return suggestions;
    }

    /**
     * Format milliseconds to human-readable time
     */
    formatTime(ms) {
        if (ms < 0) return 'Ready';
        
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days}d ${remainingHours}h`;
        }
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        
        return `${minutes}m`;
    }

    /**
     * Format SFL currency
     */
    formatSFL(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(2)}M SFL`;
        }
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(2)}K SFL`;
        }
        return `${amount.toFixed(2)} SFL`;
    }

    /**
     * Get full dashboard data
     */
    getDashboard() {
        return {
            timestamp: Date.now(),
            summary: this.getFarmSummary(),
            tasks: this.getActionableTasks(),
            optimizations: this.getOptimizationSuggestions()
        };
    }
}
