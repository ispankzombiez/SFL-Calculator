/**
 * Economic Analysis Integration - Combines all economic calculators
 * Provides comprehensive profit optimization recommendations
 */

import { DataParser } from '../parsers/data-parser.js';
import { EconomicConfig } from '../config/economic-config.js';
import { AnimalEconomicCalculator } from './animal-economic-calculator.js';
import { ResourceEconomicCalculator } from './resource-economic-calculator.js';
import { GreenhouseEconomicCalculator } from './greenhouse-economic-calculator.js';

export class EconomicAnalyzer {
    constructor(rawData) {
        this.parser = new DataParser(rawData);
        this.config = new EconomicConfig();
        
        // Auto-detect from farm data
        if (rawData.farmData?.farm) {
            this.config.autoDetectFromFarmData(rawData.farmData.farm);
        }
        
        // Initialize calculators
        this.animalCalc = {
            cow: new AnimalEconomicCalculator(this.parser, this.config),
            chicken: new AnimalEconomicCalculator(this.parser, this.config),
            sheep: new AnimalEconomicCalculator(this.parser, this.config)
        };
        
        this.resourceCalc = new ResourceEconomicCalculator(this.parser, this.config);
        this.greenhouseCalc = new GreenhouseEconomicCalculator(this.parser, this.config);
    }

    /**
     * Get comprehensive farm economic analysis
     */
    getFullAnalysis() {
        const analysis = {
            timestamp: Date.now(),
            
            // Configuration
            config: {
                taxRate: this.config.getTaxRate(),
                bettyRate: this.config.getBettyRate(),
                numCows: this.config.getNumAnimals('Cow'),
                numChickens: this.config.getNumAnimals('Chicken'),
                numSheep: this.config.getNumAnimals('Sheep')
            },
            
            // Animals
            animals: {
                cows: this.animalCalc.cow.getSummary('Cow'),
                chickens: this.animalCalc.chicken.getSummary('Chicken'),
                sheep: this.animalCalc.sheep.getSummary('Sheep')
            },
            
            // Resources
            resources: this.resourceCalc.getSummary(),
            
            // Greenhouse
            greenhouse: this.greenhouseCalc.getSummary(),
            
            // Overall recommendations
            recommendations: this.generateRecommendations()
        };
        
        return analysis;
    }

    /**
     * Get animal analysis by type
     */
    getAnimalAnalysis(animalType) {
        switch(animalType.toLowerCase()) {
            case 'cow':
            case 'cows':
                return this.animalCalc.cow.getSummary('Cow');
            case 'chicken':
            case 'chickens':
                return this.animalCalc.chicken.getSummary('Chicken');
            case 'sheep':
                return this.animalCalc.sheep.getSummary('Sheep');
            default:
                return null;
        }
    }

    /**
     * Get detailed level-by-level analysis for an animal
     */
    getAnimalLevelAnalysis(animalType, targetLevel = null) {
        let calc;
        switch(animalType.toLowerCase()) {
            case 'cow':
            case 'cows':
                calc = this.animalCalc.cow;
                animalType = 'Cow';
                break;
            case 'chicken':
            case 'chickens':
                calc = this.animalCalc.chicken;
                animalType = 'Chicken';
                break;
            case 'sheep':
                calc = this.animalCalc.sheep;
                animalType = 'Sheep';
                break;
            default:
                return null;
        }
        
        if (targetLevel) {
            return calc.calculateDailyProfit(animalType, targetLevel);
        } else {
            return calc.findOptimalLevel(animalType);
        }
    }

    /**
     * Compare profit opportunities across all income sources
     */
    compareProfitOpportunities() {
        const opportunities = [];
        
        // Animals
        const cowAnalysis = this.animalCalc.cow.getSummary('Cow');
        if (cowAnalysis.numAnimals > 0) {
            opportunities.push({
                type: 'Cows',
                category: 'Animals',
                dailyProfit: cowAnalysis.dailyProfit,
                description: `Feed ${cowAnalysis.numAnimals} cows to level ${cowAnalysis.optimalLevel}`,
                profitPerUnit: cowAnalysis.dailyProfit / cowAnalysis.numAnimals
            });
        }
        
        const chickenAnalysis = this.animalCalc.chicken.getSummary('Chicken');
        if (chickenAnalysis.numAnimals > 0) {
            opportunities.push({
                type: 'Chickens',
                category: 'Animals',
                dailyProfit: chickenAnalysis.dailyProfit,
                description: `Feed ${chickenAnalysis.numAnimals} chickens to level ${chickenAnalysis.optimalLevel}`,
                profitPerUnit: chickenAnalysis.dailyProfit / chickenAnalysis.numAnimals
            });
        }
        
        const sheepAnalysis = this.animalCalc.sheep.getSummary('Sheep');
        if (sheepAnalysis.numAnimals > 0) {
            opportunities.push({
                type: 'Sheep',
                category: 'Animals',
                dailyProfit: sheepAnalysis.dailyProfit,
                description: `Feed ${sheepAnalysis.numAnimals} sheep to level ${sheepAnalysis.optimalLevel}`,
                profitPerUnit: sheepAnalysis.dailyProfit / sheepAnalysis.numAnimals
            });
        }
        
        // Resources
        const resourceAnalysis = this.resourceCalc.getSummary();
        if (resourceAnalysis.totalDailyProfit > 0) {
            opportunities.push({
                type: 'Resources',
                category: 'Gathering',
                dailyProfit: resourceAnalysis.totalDailyProfit,
                description: `Mine ${resourceAnalysis.bestDailyResource} and other resources`,
                details: resourceAnalysis.allResources
            });
        }
        
        // Sort by daily profit
        opportunities.sort((a, b) => b.dailyProfit - a.dailyProfit);
        
        return opportunities;
    }

    /**
     * Generate personalized recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Animal recommendations
        const cowAnalysis = this.animalCalc.cow.findOptimalLevel('Cow');
        const chickenAnalysis = this.animalCalc.chicken.findOptimalLevel('Chicken');
        const sheepAnalysis = this.animalCalc.sheep.findOptimalLevel('Sheep');
        
        if (this.config.getNumAnimals('Cow') > 0) {
            recommendations.push({
                category: 'Cows',
                priority: 'high',
                title: `Feed cows to level ${cowAnalysis.bestProfitLevel}`,
                reason: `Maximizes profit at ${cowAnalysis.bestProfitAmount.toFixed(2)} SFL per cow`,
                profit: cowAnalysis.bestProfitAmount
            });
        }
        
        if (this.config.getNumAnimals('Chicken') > 0) {
            recommendations.push({
                category: 'Chickens',
                priority: 'high',
                title: `Feed chickens to level ${chickenAnalysis.bestProfitLevel}`,
                reason: `Maximizes profit at ${chickenAnalysis.bestProfitAmount.toFixed(2)} SFL per chicken`,
                profit: chickenAnalysis.bestProfitAmount
            });
        }
        
        if (this.config.getNumAnimals('Sheep') > 0) {
            recommendations.push({
                category: 'Sheep',
                priority: 'high',
                title: `Feed sheep to level ${sheepAnalysis.bestProfitLevel}`,
                reason: `Maximizes profit at ${sheepAnalysis.bestProfitAmount.toFixed(2)} SFL per sheep`,
                profit: sheepAnalysis.bestProfitAmount
            });
        }
        
        // Resource recommendations
        const bestResource = this.resourceCalc.findBestResource();
        recommendations.push({
            category: 'Resources',
            priority: 'medium',
            title: `Prioritize ${bestResource.bestPerUse} mining`,
            reason: `Highest profit per tool use`,
            profit: bestResource.details.find(r => r.resourceType === bestResource.bestPerUse)?.profit || 0
        });
        
        // Greenhouse recommendations
        const bestCrop = this.greenhouseCalc.findBestCrop();
        recommendations.push({
            category: 'Greenhouse',
            priority: 'medium',
            title: `Grow ${bestCrop.bestProfitPerHour.cropName}`,
            reason: `Best profit per hour at ${bestCrop.bestProfitPerHour.avgProfitPerHour.toFixed(3)} SFL/hr`,
            profit: bestCrop.bestProfitPerHour.averageProfit
        });
        
        // Sort by profit
        recommendations.sort((a, b) => b.profit - a.profit);
        
        return recommendations;
    }

    /**
     * Calculate total daily earning potential
     */
    getTotalDailyPotential() {
        const cowDaily = this.animalCalc.cow.getSummary('Cow').dailyProfit || 0;
        const chickenDaily = this.animalCalc.chicken.getSummary('Chicken').dailyProfit || 0;
        const sheepDaily = this.animalCalc.sheep.getSummary('Sheep').dailyProfit || 0;
        const resourceDaily = this.resourceCalc.getSummary().totalDailyProfit || 0;
        
        const total = cowDaily + chickenDaily + sheepDaily + resourceDaily;
        
        return {
            total,
            breakdown: {
                cows: cowDaily,
                chickens: chickenDaily,
                sheep: sheepDaily,
                resources: resourceDaily
            }
        };
    }

    /**
     * Get configuration for UI settings
     */
    getConfiguration() {
        return this.config.settings;
    }

    /**
     * Update configuration
     */
    updateConfiguration(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            if (key === 'p2pTaxRate') this.config.setTaxRate(value);
            else if (key === 'bettyConversionRate') this.config.setBettyRate(value);
            else if (key === 'cowSleepTime') this.config.setSleepTime('Cow', value);
            else if (key === 'chickenSleepTime') this.config.setSleepTime('Chicken', value);
            else if (key === 'sheepSleepTime') this.config.setSleepTime('Sheep', value);
            else if (key === 'numCows') this.config.setNumAnimals('Cow', value);
            else if (key === 'numChickens') this.config.setNumAnimals('Chicken', value);
            else if (key === 'numSheep') this.config.setNumAnimals('Sheep', value);
        });
    }
}
