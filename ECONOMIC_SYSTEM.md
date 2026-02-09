# Economic Calculator System - Google Sheets Integration

This document describes the enhanced economic calculator system that replicates the Google Sheets calculators' functionality.

## Overview

The economic calculators focus on **profit optimization** rather than just status tracking. They answer questions like:
- "What level should I feed my animals to for maximum profit?"
- "Which resource is most profitable to mine?"
- "What crop should I grow in my greenhouse?"
- "How much daily profit can I make with my current setup?"

## Architecture

### Core Components

#### 1. Economic Configuration (`js/config/economic-config.js`)
Stores user settings and farm configuration:

**Settings:**
- P2P tax rate (default 5%)
- Betty coin conversion rate
- Animal sleep times (Cow: 12h, Chicken: 18h, Sheep: 24h)
- Number of animals owned
- Number of resource nodes owned
- Owned items/boosts (TRUE/FALSE toggles)
- Owned skills

**Features:**
- Auto-detects animals and nodes from farm data
- Persists in localStorage
- Provides getters/setters for all settings

#### 2. Animal Economic Calculator (`js/calculators/animal-economic-calculator.js`)

**Calculates:**
- Feed cost per animal level based on food type (Corn, Wheat, Barley, Mixed Grain)
- Output amount per level with boosts applied
- Profit per feeding cycle
- Profit per 24 hours based on sleep time
- XP requirements and optimal food choices
- Profit with tax considerations

**Key Methods:**
- `calculateLevelProfit(animalType, level)` - Profit analysis for specific level
- `analyzeAllLevels(animalType)` - Compare all 15 levels
- `findOptimalLevel(animalType)` - Find most profitable level
- `calculateDailyProfit(animalType, level)` - Daily profit projection
- `getSummary(animalType)` - Comprehensive animal analysis

**Boost Detection:**
Items:
- **Cows**: Milk Apron, Cowbell, Cowfish, Cattlegrim, Moo-ver, Animal Bud, Mootant, Training Whistle, Bull Whip, Dr. Cow, Gold Cow, Collie Shrine
- **Chickens**: Fat Chicken, Rich Chicken, Alien Chicken, Undead Rooster, Ayam Cemani, Chicken Suit, Cluckulator, Chicken Coop, Gold Egg, Cattlegrim
- **Sheep**: W. Sheep Onesie, Toxic Tuft, Merino Jumper, B. Sheep Onesie, Cattlegrim, Bull Whip, Gold Sheep

Skills:
- Abundant Harvest, Bale Economy, Double Bale, Fine Fibers, Chunky Feed
- Cow Smart, Efficient Feeding, Leathercraft (cows)
- Featherweight, Clucky Grazing (chickens)
- Sheepwise Diet (sheep)

#### 3. Resource Economic Calculator (`js/calculators/resource-economic-calculator.js`)

**Calculates:**
- Tool cost per use (materials + coins)
- Yield per tool swing with boosts
- Profit per tool use
- Profit per full restock
- Daily profit based on respawn times
- Total profit with owned node count

**Tool Economics:**
- Axe (350 uses): Wood gathering
- Wood Pickaxe (160 uses): Stone mining
- Stone Pickaxe (50 uses): Iron mining
- Iron Pickaxe (15 uses): Gold mining
- Gold Pickaxe (10 uses): Crimstone/Sunstone mining

**Respawn Times:**
- Wood: 2 hours
- Stone: 4 hours
- Iron: 8 hours
- Gold: 24 hours
- Crimstone: 48 hours
- Sunstone: 72 hours

**Boost Detection:**
Universal:
- Faction Shield: +0.25 to wood and minerals
- Volcano Gnome: +0.1 to all minerals
- Cave Bud, Mineral Stem: +0.2 to minerals

Wood-specific:
- Squirrel, Tiki Totem: +0.1 wood
- Woody/Apprentice/Foreman Beaver: +0.2 wood
- Wood Nymph Wendy: +0.2 wood
- Wood/Bud Stem: +0.2/0.1 wood
- Lumberjack skill: +10% multiplier

Stone-specific:
- Stone Beetle: +0.1
- Tunnel Mole: +0.25
- Rock Golem: +0.2 (10% chance of +2, averaged)
- Tin Turtle: +0.9 (3x3 AOE effect)
- Emerald Turtle: +0.5 (3x3 AOE effect)

#### 4. Greenhouse Economic Calculator (`js/calculators/greenhouse-economic-calculator.js`)

**Calculates:**
- Oil cost per unit (based on Infernal Drill materials)
- Crop profitability with oil costs
- Green Amulet probability (10% chance of x10 yield)
- Growth time with Turbo Sprout
- Average profit considering amulet procs
- Profit per hour

**Crops:**
- **Grape**: 12 hours, 3 oil, 1 base yield
- **Rice**: 32 hours, 4 oil, 2 base yield
- **Olive**: 42 hours, 6 oil, 1 base yield

**Boost Detection:**
Rice:
- Rice Panda: +0.25
- Non La Hat: +1.0
- Hoot: +0.5

Olive:
- Olive Royalty Shirt: +0.25
- Olive Shield: +1.0

Grape:
- Vinny: +0.25
- Grape Pants: +0.2
- Grape Granny: +1.0

Universal:
- Pharaoh Gnome: Doubles all greenhouse produce
- Turbo Sprout: 50% faster growth
- Green Amulet: 10% chance of x10 yield
- Infernal Drill: Free oil

#### 5. Economic Analyzer (`js/calculators/economic-analyzer.js`)

Integrates all economic calculators to provide comprehensive analysis.

**Main Methods:**
- `getFullAnalysis()` - Complete farm economic breakdown
- `getAnimalAnalysis(type)` - Detailed animal analysis
- `getAnimalLevelAnalysis(type, level)` - Level-by-level details
- `compareProfitOpportunities()` - Rank all income sources
- `generateRecommendations()` - Personalized profit tips
- `getTotalDailyPotential()` - Total daily earning capacity

## Data Flow

```
1. Load Farm Data
   ↓
2. Auto-detect configuration
   - Count animals/nodes
   - Detect owned items
   - Detect learned skills
   ↓
3. Load user settings
   - Tax rate
   - Betty rate
   - Sleep times
   ↓
4. Run economic calculations
   - Feed costs
   - Tool costs
   - Oil costs
   - Output with boosts
   ↓
5. Calculate profits
   - Per cycle
   - Per day
   - With tax
   ↓
6. Generate recommendations
   - Optimal levels
   - Best resources
   - Best crops
```

## Key Calculations

### Animal Feed Cost

```javascript
baseFoodAsk = 2.54 (for all animals)
feedBoost = calculateFeedBoost() // Items/skills reducing feed
actualFoodNeeded = baseFoodAsk * feedBoost

// Chunky Feed: 1.5x food, but 2x XP
if (hasChunkyFeed) {
    actualFoodNeeded *= 1.5
    xpPerFeed *= 2
}

totalFeedCost = actualFoodNeeded * feedsNeeded * foodPrice
```

### Animal Output

```javascript
baseOutput = BASE_OUTPUT[animalType][level - 1]
additiveBoost = sum of all item/skill boosts
totalOutput = baseOutput + additiveBoost

revenue = totalOutput * itemPrice * (1 - taxRate)
profit = revenue - feedCost
```

### Resource Mining

```javascript
baseYield = 2 (most resources)
additiveBoost = sum of all item/skill boosts
multiplicativeBoost = product of all multipliers
effectiveYield = (baseYield + additiveBoost) * multiplicativeBoost

toolCost = materialCost + (coinCost / bettyRate)
costPerUse = toolCost / toolDurability

revenue = effectiveYield * resourcePrice * (1 - taxRate)
profitPerUse = revenue - costPerUse
```

### Greenhouse Crops

```javascript
oilCost = ((woodCost * 20) + (ironCost * 9) + (leatherCost * 10)) * 3 / 50
// If Infernal Drill: oilCost = 0

totalOilCost = oilCost * cropOilAmount
baseYield = CROP_BASE_YIELD[cropName]
yieldWithBoosts = baseY + additiveBoosts

// Green Amulet: 10% chance of x10
if (hasGreenAmulet) {
    normalYield = yieldWithBoosts
    procYield = yieldWithBoosts * 10
    averageYield = (normalYield * 0.9) + (procYield * 0.1)
} else {
    averageYield = yieldWithBoosts
}

revenue = averageYield * cropPrice * (1 - taxRate)
profit = revenue - totalOilCost
profitPerHour = profit / growTime
```

## Usage Examples

### Get Cow Analysis

```javascript
import { EconomicAnalyzer } from './js/calculators/economic-analyzer.js';

const analyzer = new EconomicAnalyzer(rawData);

// Get optimal feeding strategy
const cowAnalysis = analyzer.getAnimalAnalysis('cow');
console.log(`Feed cows to level ${cowAnalysis.optimalLevel}`);
console.log(`Daily profit: ${cowAnalysis.dailyProfit} SFL`);

// Get level-by-level breakdown
const levelDetails = analyzer.getAnimalLevelAnalysis('cow', 10);
console.log(`Level 10 profit: ${levelDetails.profit} SFL`);
console.log(`Feed cost: ${levelDetails.feedCost.totalCost} SFL`);
```

### Compare Resources

```javascript
const resourceAnalysis = analyzer.resourceCalc.getSummary();
console.log(`Best resource: ${resourceAnalysis.bestResource}`);
console.log(`Total daily profit: ${resourceAnalysis.totalDailyProfit} SFL`);

// Get details for specific resource
const goldProfit = analyzer.resourceCalc.calculateNodeProfit('Gold');
console.log(`Gold profit per use: ${goldProfit.profit} SFL`);
```

### Configure Settings

```javascript
// Update tax rate
analyzer.config.setTaxRate(0.075); // 7.5%

// Set number of animals
analyzer.config.setNumAnimals('Cow', 28);

// Enable owned items
analyzer.config.setItem('Cowbell', true);
analyzer.config.setSkill('Abundant Harvest', true);

// Save all changes (persists to localStorage)
analyzer.config.saveSettings();
```

### Get All Recommendations

```javascript
const full = analyzer.getFullAnalysis();

console.log('=== Recommendations ===');
full.recommendations.forEach(rec => {
    console.log(`[${rec.priority}] ${rec.title}`);
    console.log(`  ${rec.reason}`);
    console.log(`  Profit: ${rec.profit.toFixed(2)} SFL`);
});

console.log('=== Daily Potential ===');
const potential = analyzer.getTotalDailyPotential();
console.log(`Total: ${potential.total.toFixed(2)} SFL/day`);
console.log(`  Cows: ${potential.breakdown.cows.toFixed(2)}`);
console.log(`  Chickens: ${potential.breakdown.chickens.toFixed(2)}`);
console.log(`  Sheep: ${potential.breakdown.sheep.toFixed(2)}`);
console.log(`  Resources: ${potential.breakdown.resources.toFixed(2)}`);
```

## Configuration UI Integration

The system supports a configuration UI where users can:

1. **Set Tax Rate** (7.5%, 10%, 15%, 20%, 25%, 50%)
2. **Set Betty Conversion Rate** (check https://sfl.world/util/prices)
3. **Set Animal Sleep Times**
4. **Toggle Owned Items** (TRUE/FALSE for each boost)
5. **Toggle Owned Skills** (TRUE/FALSE for each skill)

All settings are stored in localStorage and automatically applied to calculations.

## Comparison to Google Sheets

### Matching Features

✅ Feed cost calculation per level
✅ Profit per animal level analysis
✅ Tax rate configuration
✅ Betty coin conversion
✅ Item/skill boost toggles
✅ Tool cost & restock economics
✅ Oil cost calculation
✅ Green Amulet probability
✅ Profit per 24 hours
✅ Optimal level recommendations

### Enhancements

🆕 Auto-detection of animals/nodes from farm data
🆕 Auto-detection of owned items from collectibles
🆕 Real-time profit comparison across all income sources
🆕 Integrated dashboard showing all opportunities
🆕 Persistent configuration (localStorage)
🆕 Export/import settings functionality

## Performance

- **Calculation speed**: < 50ms for full analysis
- **Storage**: ~10KB for configuration
- **Memory**: Minimal impact (calculators don't persist state)

## Future Enhancements

Planned features:
- Crop profit calculator (regular farming)
- Cooking economic analysis with ingredient costs
- Fishing profit calculator
- Delivery optimization
- Seasonal event profit tracking
- Multi-farm comparison

## Troubleshooting

**Incorrect profits:**
- Check tax rate setting (default 5%)
- Verify Betty conversion rate is current
- Ensure owned items are correctly toggled
- Check animal sleep times are accurate

**Missing boosts:**
- Items must be placed on farm (collectibles) or equipped
- Skills must be learned
- Some boosts don't stack (e.g., different beaver types)

**Configuration not saving:**
- Check localStorage is enabled
- Try clearing browser cache
- Verify no private browsing mode

## API Reference

See `ECONOMIC_API_REFERENCE.md` for complete API documentation of all calculator methods.

## Credits

Economic calculator logic based on community Google Sheets calculators:
- Cow Calculator (Public) V1.0.014
- Chicken Calculator (Public)
- Sheep Calculator (Public)
- Resource Calculator (Public)
- Greenhouse Calculator (Public)

Enhanced and integrated for the SFL Calculator web application.
