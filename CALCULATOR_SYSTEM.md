# SFL Calculator System Documentation

## Overview

The SFL Calculator is a comprehensive farm management and optimization tool for Sunflower Land. It processes raw API data to provide detailed analytics, profit optimization recommendations, and actionable tasks for your farm.

## Architecture

### Core Components

#### 1. Data Parser (`js/parsers/data-parser.js`)
Processes raw API responses into structured, queryable data.

**Key Methods:**
- `getPrice(itemName)` - Get market price for an item
- `getInventory(itemName)` - Get quantity in inventory
- `getAnimals(type)` - Get all animals of a specific type
- `getCrops()` - Get all planted crops
- `getBuildings()` - Get all buildings data
- `getEquipped()` - Get bumpkin's equipped items
- `getSkills()` - Get bumpkin's skills
- `getCollectibles()` - Get placed collectibles

#### 2. Calculator Modules

**Animal Calculator** (`js/calculators/animal-calculator.js`)
- Tracks production status for chickens, cows, and sheep
- Calculates profit per animal and per cycle
- Factors in speed boosts from equipment and collectibles
- Provides feeding schedules and collection times

**Crop Calculator** (`js/calculators/crop-calculator.js`)
- Monitors planted crops and growth progress
- Calculates optimal planting strategies
- Ranks crops by profit per hour and ROI
- Applies growth speed and yield boosts

**Cooking Calculator** (`js/calculators/cooking-calculator.js`)
- Tracks active cooking recipes
- Calculates recipe profitability and XP efficiency
- Recommends most profitable recipes
- Checks ingredient availability

**Resource Calculator** (`js/calculators/resource-calculator.js`)
- Monitors trees, stones, iron, gold, crimstones, sunstones
- Tracks replenishment times
- Calculates resource node profitability
- Prioritizes high-value resources

**Main Calculator** (`js/calculators/main-calculator.js`)
- Coordinates all calculator modules
- Generates comprehensive farm summary
- Produces actionable task list
- Provides optimization recommendations

#### 3. Dashboard Integration (`js/dashboard.js`)
Connects Firebase data storage to calculator modules and renders results to the UI.

**Key Functions:**
- `initializeDashboard()` - Loads cached data and initializes calculators
- `updateDashboardUI()` - Renders all calculated data
- Auto-refreshes when user signs in

## Data Flow

```
1. User Signs In
   ↓
2. Load from Firestore Cache (if available and fresh)
   ↓ (if cache miss or stale)
3. Fetch from API → Save to Firestore
   ↓
4. Parse Data (DataParser)
   ↓
5. Run Calculators
   ↓
6. Update Dashboard UI
```

## Cache Strategy

### Firestore-First Loading
The app prioritizes cached data to minimize API calls and improve load times.

**Cache Logic:**
- On sign-in, check Firestore for cached raw API data
- If cache exists and is < 24 hours old, use it
- If cache is stale or missing, fetch fresh data from API
- "Refresh" button always forces fresh API fetch

**Benefits:**
- Faster load times (no API wait)
- Reduced API quota usage
- Works offline with cached data
- Manual refresh for latest data

## Boost Detection

Calculators automatically detect and apply boosts from:

### Equipment
- Hats: Farmer Hat, Luna's Hat, Miner Hat, Chef Hat
- Tools: Lumberjack Axe, Iron Pickaxe, Shepherds Staff
- Wearables: Sunflower Amulet, Cowbell, etc.

### Collectibles
- Scarecrow, Gnome, Nancy, Kuebiko (crop boosts)
- Woody the Beaver, Rock Golem (resource boosts)
- Grain Grinder, Time Warp Totem (cooking/time boosts)
- And many more...

### Skills
- Green Thumb, Master Farmer (crop yields)
- Lumberjack, Tree Hugger (wood yields)
- Mining Mastery (ore yields)
- Crop Whisperer, Rush Hour (speed boosts)

## Dashboard Features

### 📊 Overview Tab
Shows comprehensive farm summary with:
- Current SFL and Coins balance
- Actionable tasks (prioritized by urgency)
- Animal production status
- Crop growth status
- Resource availability
- Profit optimization recommendations

### Key Metrics

**Animals:**
- Total animals by type
- Ready to collect count
- Hungry count
- Daily profit potential

**Crops:**
- Planted crops count
- Ready to harvest
- Total estimated value
- Next harvest time

**Resources:**
- Ready-to-mine nodes
- Depleted nodes replenishing
- Total available value
- Next replenishment time

### Optimization Recommendations

**Most Profitable Crops:**
- Ranked by profit per hour
- Shows ROI percentage
- Factors in current boosts

**Best Recipes to Cook:**
- Profit per hour calculation
- XP efficiency
- Ingredient availability check

**Priority Resources:**
- Highest value per node
- Best profit per hour
- Replenishment time consideration

## Usage

### Initial Setup
1. Sign in with Google or Email
2. Enter your Farm ID and API Key
3. Data is fetched and cached automatically

### Daily Workflow
1. Open calculator - loads from cache instantly
2. Review actionable tasks in Overview tab
3. Check "Ready to Collect" items
4. Plan next crops/recipes based on recommendations
5. Hit "Refresh" when you want latest data from game

### Manual Refresh
Click the "Refresh" button to:
- Fetch latest data from API
- Update cache in Firestore
- Recalculate all metrics
- Update dashboard display

## File Structure

```
js/
├── parsers/
│   └── data-parser.js          # Parses raw API data
├── calculators/
│   ├── main-calculator.js      # Coordinates all calculators
│   ├── animal-calculator.js    # Chickens, cows, sheep
│   ├── crop-calculator.js      # Crop growth and profits
│   ├── cooking-calculator.js   # Recipe optimization
│   ├── resource-calculator.js  # Mining and gathering
│   └── [legacy calculators]    # Older individual calcs
├── dashboard.js                # Dashboard UI integration
├── firebase-auth.js            # Data persistence
├── main.js                     # App orchestration
└── api.js                      # API communication
```

## Extending the System

### Adding a New Calculator

1. **Create Calculator File** (`js/calculators/new-calculator.js`)
```javascript
export class NewCalculator {
    constructor(parser) {
        this.parser = parser;
    }
    
    calculate() {
        // Your calculation logic
        return results;
    }
    
    getSummary() {
        // Return summary data
    }
}
```

2. **Import in Main Calculator** (`js/calculators/main-calculator.js`)
```javascript
import { NewCalculator } from './new-calculator.js';

// In constructor
this.newCalc = new NewCalculator(this.parser);

// In getFarmSummary()
newFeature: this.newCalc.getSummary()
```

3. **Add UI Section** (`index.html`)
```html
<div id="new-feature-summary"></div>
```

4. **Update Dashboard** (`js/dashboard.js`)
```javascript
function updateNewFeatureDisplay(data) {
    // Render your data
}
```

### Adding Boost Detection

Edit the relevant calculator to check for your boost:

```javascript
const equipped = this.parser.getEquipped();
if (equipped['Your Item Name']) {
    multiplier *= 0.8; // 20% faster
}
```

## Troubleshooting

### Dashboard not loading
- Check browser console for errors
- Verify Firebase is connected
- Try manual refresh
- Clear browser cache

### Incorrect calculations
- Ensure boosts are properly detected
- Check that prices data is fresh
- Verify farm data structure matches parser expectations

### Cache issues
- Cache is stale after 24 hours
- Manual refresh always gets fresh data
- Check Firestore connection in console

## Performance

- **Initial load (cached):** < 1 second
- **API refresh:** 3-5 seconds
- **Calculator execution:** < 100ms
- **Cache size:** ~50-100KB per farm

## Future Enhancements

The following calculators are planned for future updates:
- ✅ Data Parser
- ✅ Animal Calculator (chickens, cows, sheep)
- ✅ Crop Calculator
- ✅ Resource Calculator (trees, stones, ores)
- ✅ Cooking Calculator
- ⬜ Greenhouse Calculator (advanced crop optimization)
- ⬜ Equipment/Wearables Analyzer (compare gear)
- ⬜ Seasonal Items Calculator (event tracking)
- ⬜ Fishing Calculator
- ⬜ Delivery Optimization
- ⬜ Land Expansion Planner

## API Reference

### DataParser
```javascript
const parser = new DataParser(rawData);

// Prices
parser.getPrice('Sunflower') // returns SFL value

// Inventory
parser.getInventory('Egg') // returns quantity

// Animals
parser.getAnimals('Chicken') // returns array of chickens

// Crops
parser.getCrops() // returns array of planted crops

// Buildings
parser.getBuildings() // returns buildings object

// Bumpkin
parser.getEquipped() // returns equipped items
parser.getSkills() // returns learned skills
```

### SFLCalculator
```javascript
const calculator = new SFLCalculator(rawData);

// Get comprehensive summary
const summary = calculator.getFarmSummary();

// Get actionable tasks
const tasks = calculator.getActionableTasks();

// Get optimization suggestions
const optimizations = calculator.getOptimizationSuggestions();

// Get full dashboard data
const dashboard = calculator.getDashboard();
```

## Version History

### v2.7.0 (Current)
- ✅ Comprehensive calculator system
- ✅ Data parser module
- ✅ Animal, crop, cooking, resource calculators
- ✅ Firestore-first data loading
- ✅ Dashboard overview tab
- ✅ Optimization recommendations
- ✅ Actionable task prioritization

### v2.6.0
- Firebase authentication and cloud storage
- Raw API data persistence
- Dark mode support

### v2.5.0
- Initial calculator implementation
- Cow calculator baseline

## Contributing

When adding new features:
1. Follow the existing calculator pattern
2. Use DataParser for all data access
3. Document new boosts and their sources
4. Update this README with new features
5. Test with real farm data

## Support

For issues or questions:
- GitHub Issues: [github.com/ispankzombiez/SFL-Calculator](https://github.com/ispankzombiez/SFL-Calculator)
- Check console logs for detailed error information
- Include farm ID (without API key) when reporting bugs
