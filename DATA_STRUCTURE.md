# Data Structure Reference

This document describes the raw API data structure used by the calculator system.

## Prices API Response Structure

```javascript
{
  "data": {
    "p2p": {
      // Crops & Resources
      "Sunflower": 0.01,
      "Potato": 0.14,
      "Pumpkin": 0.40,
      "Carrot": 0.80,
      "Wood": 0.05,
      "Stone": 0.05,
      "Iron": 0.20,
      "Gold": 2.50,
      
      // Animal Products
      "Egg": 0.16,
      "Milk": 0.40,
      "Merino Wool": 0.40,
      
      // Cooked Items
      "Boiled Eggs": 1.60,
      "Mashed Potato": 2.80,
      "Pumpkin Soup": 8.00,
      
      // ... all other items with SFL prices
    }
  }
}
```

## Farm Data API Response Structure

```javascript
{
  "farm": {
    // Basic Info
    "farmId": 123456,
    "balance": "100.5",  // SFL balance as string
    "coins": 5000,
    
    // Inventory
    "inventory": {
      "Sunflower": "250",
      "Wood": "100",
      "Egg": "45",
      // ... all owned items with quantities
    },
    
    // Animals - Chickens
    "henHouse": {
      "animals": {
        "0": {
          "id": "0",
          "type": "Chicken",
          "state": "idle",  // idle, happy, sad
          "coordinates": { "x": 0, "y": 0 }
        },
        "1": {
          "id": "1",
          "type": "Chicken",
          "state": "happy",
          "fedAt": 1707350000000,
          "awakeAt": 1707522000000,
          "asleepAt": null
        }
      }
    },
    
    // Animals - Cows & Sheep
    "barn": {
      "animals": {
        "0": {
          "id": "0",
          "type": "Cow",
          "state": "happy",
          "fedAt": 1707350000000,
          "awakeAt": 1707522000000
        },
        "1": {
          "id": "1",
          "type": "Sheep",
          "state": "idle",
          "coordinates": { "x": 10, "y": 5 }
        }
      }
    },
    
    // Crops
    "crops": {
      "1": {
        "crop": {
          "name": "Sunflower",
          "plantedAt": 1707350000000,
          "boostedTime": 0,
          "criticalHit": {}
        },
        "createdAt": 1707350000000,
        "x": -2,
        "y": 0
      },
      "2": {
        "crop": {
          "name": "Potato",
          "plantedAt": 1707350000000,
          "boostedTime": 3600000,  // 1 hour boost
          "criticalHit": {
            "amount": 2,
            "trigger": "Some Boost"
          }
        },
        "x": -1,
        "y": 0
      }
    },
    
    // Resources
    "trees": {
      "0": {
        "amount": 3,
        "wood": { "amount": 3 },
        "x": 5,
        "y": -5
      },
      "1": {
        "amount": 0,  // Depleted
        "minedAt": 1707350000000,
        "wood": { "amount": 0 },
        "x": 6,
        "y": -5
      }
    },
    
    "stones": {
      "0": {
        "amount": 2,
        "stone": { "amount": 2 },
        "x": 10,
        "y": 5
      }
    },
    
    "iron": {
      "0": {
        "amount": 5,
        "stone": { "amount": 5 },
        "x": 15,
        "y": 10
      }
    },
    
    "gold": {
      "0": {
        "amount": 5,
        "stone": { "amount": 5 },
        "x": 20,
        "y": 10
      }
    },
    
    "crimstones": {
      "0": {
        "amount": 3,
        "stone": { "amount": 3 },
        "minesAt": null,
        "x": 25,
        "y": 15
      }
    },
    
    "sunstones": {
      "0": {
        "amount": 3,
        "stone": { "amount": 3 },
        "x": 30,
        "y": 15
      }
    },
    
    // Buildings
    "buildings": {
      "Fire Pit": [
        {
          "id": "fire-pit-1",
          "coordinates": { "x": 0, "y": 0 },
          "crafting": [
            {
              "name": "Boiled Eggs",
              "readyAt": 1707360000000,
              "boost": {},
              "skills": {}
            }
          ]
        }
      ],
      "Kitchen": [
        {
          "id": "kitchen-1",
          "coordinates": { "x": 5, "y": 0 },
          "crafting": []
        }
      ],
      "Bakery": [],
      "Deli": [],
      "Smoothie Shack": []
    },
    
    // Greenhouse
    "greenhouse": {
      "oil": 10,
      "pots": {
        "0": {
          "plant": {
            "name": "Sunflower",
            "plantedAt": 1707350000000,
            "amount": 1
          }
        }
      }
    },
    
    // Bumpkin
    "bumpkin": {
      "id": 12345,
      "experience": 15000,
      
      // Skills
      "skills": {
        "Green Thumb": 1,
        "Master Farmer": 1,
        "Lumberjack": 1,
        "Crop Whisperer": 1
      },
      
      // Equipped Items
      "equipped": {
        "body": "Farmer Shirt",
        "hair": "Basic Hair",
        "hat": "Farmer Hat",
        "tool": "Lumberjack Axe",
        "background": "Farm Background"
      },
      
      "activity": {},
      "tokenUri": ""
    },
    
    // Collectibles (placed decorations)
    "collectibles": {
      "Scarecrow": [
        {
          "id": "scarecrow-1",
          "coordinates": { "x": -5, "y": 0 },
          "createdAt": 1700000000000
        }
      ],
      "Gnome": [
        {
          "id": "gnome-1",
          "coordinates": { "x": 0, "y": 5 },
          "createdAt": 1700000000000
        }
      ],
      "Nancy": [
        {
          "id": "nancy-1",
          "coordinates": { "x": 5, "y": 5 },
          "createdAt": 1700000000000
        }
      ]
    },
    
    // Active Boosts
    "boostsUsedAt": {
      "Rapid Growth": 1707350000000,
      "Kitchen Hand": 1707350000000
    },
    
    // Expansions (legacy structure)
    "expansions": [
      {
        "createdAt": 1700000000000,
        "readyAt": 1700000000000
      }
    ]
  }
}
```

## Animal States

- **idle**: Unfed, ready to be fed
- **happy**: Fed and producing
- **sad**: Unfed and sleeping

## Timestamps

All timestamps are in milliseconds since Unix epoch (JavaScript `Date.now()` format).

## Common Calculations

### Animal Ready Time
```javascript
readyAt = fedAt + productionTime - boostedTime
```

### Crop Ready Time
```javascript
readyAt = plantedAt + growthTime - boostedTime
```

### Resource Replenish Time
```javascript
replenishAt = minedAt + replenishTime
```

## Testing Data

For testing without API access, you can create mock data:

```javascript
const mockData = {
  prices: {
    data: {
      p2p: {
        'Sunflower': 0.01,
        'Egg': 0.16,
        'Wood': 0.05
        // ... minimal set for testing
      }
    }
  },
  farmData: {
    farm: {
      farmId: 999999,
      balance: "100",
      coins: 1000,
      inventory: {
        'Sunflower': "100",
        'Wood': "50"
      },
      henHouse: {
        animals: {
          '0': {
            id: '0',
            type: 'Chicken',
            state: 'happy',
            fedAt: Date.now() - (24 * 60 * 60 * 1000), // 24h ago
            awakeAt: Date.now() - (1 * 60 * 60 * 1000)  // 1h ago (ready)
          }
        }
      },
      bumpkin: {
        skills: {},
        equipped: {}
      }
    }
  }
};
```

## Data Access Patterns

### Via DataParser

```javascript
const parser = new DataParser(rawData);

// Safe access with defaults
parser.getInventory('Egg')        // Returns 0 if not found
parser.getPrice('Sunflower')      // Returns 0 if not found
parser.getAnimals('Chicken')      // Returns [] if none
parser.getCrops()                 // Returns [] if none
```

### Direct Access (Not Recommended)

```javascript
// Unsafe - may throw errors if structure changes
rawData.farmData.farm.inventory['Egg']
rawData.prices.data.p2p['Sunflower']
```

Always use DataParser for robust data access!

## Common Gotchas

1. **Inventory values are strings**: `"100"` not `100`
2. **Balance is a string**: `"15.25"` not `15.25`
3. **Timestamps are milliseconds**: `1707350000000` not `1707350000`
4. **Missing animals return undefined**: Always check or use `getAnimals()`
5. **Empty arrays vs undefined**: Some collections may be `[]` vs `undefined`
6. **Object keys are strings**: Even numeric IDs like `"0"`, `"1"`

## Validation

Before processing, validate data structure:

```javascript
function isValidFarmData(data) {
  return (
    data?.farm?.farmId &&
    data?.farm?.inventory &&
    typeof data.farm.balance === 'string'
  );
}

function isValidPricesData(data) {
  return (
    data?.data?.p2p &&
    typeof data.data.p2p === 'object'
  );
}
```
