# Getting Started with Economic Analysis

This guide will help you understand and use the economic analysis features in the SFL Calculator.

## What is Economic Analysis?

The economic analysis system helps you make **profit optimization decisions** for your farm. Instead of just showing what's ready to collect, it answers questions like:

- "Should I feed my cows to level 10 or level 15 for maximum profit?"
- "Which resource should I mine for the best profit per hour?"
- "What crop should I plant in my greenhouse?"
- "How much can I earn per day with my current setup?"

## Quick Start

### 1. View Your Economic Summary

Once you connect your farm, the **Overview** tab will automatically show:

- **Daily Earning Potential**: Total SFL you can earn per day from all sources
- **Breakdown by Activity**: How much each activity (cows, chickens, resources, etc.) contributes
- **Top Profit Opportunities**: Personalized recommendations ranked by profit impact

### 2. Configure Your Settings

Click the "Configure Economic Settings" button to customize:

#### Basic Configuration
- **P2P Tax Rate**: The percentage tax when selling on the P2P market (5%, 7.5%, 10%, etc.)
- **Betty Conversion Rate**: How many coins Betty gives per 1 SFL
  - Check current rate at https://sfl.world/util/prices
  - Default: 250 coins per SFL

#### Animal Sleep Times
- **Cow Sleep Time**: Hours you wait between feeding cycles (default: 12 hours)
- **Chicken Sleep Time**: Default 18 hours
- **Sheep Sleep Time**: Default 24 hours

These affect daily profit calculations: if you feed every 12 hours, you get 2 cycles per day.

#### Number of Animals/Nodes
- Set how many cows, chickens, sheep you own
- Use "Auto-Detect from Farm" to automatically count from your farm data
- Affects total daily profit scaling

### 3. Understand the Recommendations

The system generates prioritized recommendations like:

**HIGH Priority** (Green border):
- Actions with significant profit impact
- Example: "Feed cows to level 12 for optimal profit"

**MEDIUM Priority** (Yellow border):
- Good opportunities but lower impact
- Example: "Mine Gold when resource nodes refill"

**LOW Priority** (Blue border):
- Minor optimizations
- Example: "Plant Grapes in greenhouse for steady income"

Each recommendation shows:
- **Title**: What action to take
- **Reason**: Why it's profitable
- **Profit**: Estimated daily profit increase in SFL

## Understanding the Calculations

### Animal Feeding Economics

The system calculates profit for each level (1-15) considering:

1. **Feed Cost**:
   - Base food ask: 2.54 items per feed
   - Food price from market (Corn, Wheat, Barley, Mixed Grain)
   - XP requirements per level
   - Chunky Feed boost (if owned): 1.5x food cost, 2x XP gain

2. **Output Revenue**:
   - Base output per level (increases with level)
   - Item/skill boosts (Cowbell, Abundant Harvest, etc.)
   - Market prices (Milk, Leather, Wool, Eggs, Feathers)
   - Tax applied to revenue

3. **Profit per Cycle**:
   - Revenue - Feed Cost = Profit

4. **Daily Profit**:
   - Profit × (24 hours / sleep time) × number of animals

**Example**: 
- Cow at level 10 produces 10 milk per cycle
- Feed cost: 50 SFL (20 wheat at 2.5 SFL each)
- Revenue: 75 SFL (10 milk at 7.5 SFL each, minus 5% tax)
- Profit: 25 SFL per cycle
- With 12-hour sleep, 10 cows: 25 × 2 × 10 = **500 SFL/day**

### Resource Mining Economics

Calculates profit per tool use and per full restock:

1. **Tool Cost**:
   - Material costs (wood, stone, iron for tool crafting)
   - Coin costs converted to SFL via Betty rate
   - Divided by tool durability (uses per tool)

2. **Yield per Use**:
   - Base yield: 2 for most resources
   - Additive boosts from items (Squirrel, Tunnel Mole, etc.)
   - Multiplicative boosts (Lumberjack skill: +10%)

3. **Profit Calculation**:
   - Revenue: yield × price × (1 - tax)
   - Profit: revenue - (tool cost / durability)

**Example**:
- Gold mining with iron pickaxe
- Tool cost: 150 SFL / 15 uses = 10 SFL per use
- Yield: 2.5 gold per use (base 2 + boosts)
- Revenue: 2.5 × 50 × 0.95 = 118.75 SFL
- Profit: 108.75 SFL per use
- Daily: 108.75 SFL (one node per day)

### Greenhouse Economics

Factors in oil crafting cost for profitability:

1. **Oil Cost**:
   - Infernal Drill materials: 20 wood, 9 iron, 10 leather
   - Formula: (materials × 3) / 50 oil produced
   - If you own Infernal Drill: oil cost = 0

2. **Crop Profit**:
   - Yield with boosts (Rice Panda, Olive Shield, etc.)
   - Green Amulet consideration: 90% normal + 10% ×10 yield
   - Revenue: yield × price × (1 - tax)
   - Profit: revenue - oil cost

3. **Profit per Hour**:
   - Profit / growth time
   - Turbo Sprout: 50% faster growth

**Example**:
- Growing Olives (42 hours, 6 oil)
- Oil cost: 3 SFL × 6 = 18 SFL
- Yield: 2 olives (base 1 + Olive Shield +1)
- Revenue: 2 × 30 × 0.95 = 57 SFL
- Profit: 39 SFL per harvest
- Profit per hour: 0.93 SFL/hr

## Tips for Maximum Profit

### 1. Optimize Your Tax Rate Setting

Your actual tax rate depends on your in-game faction status:
- No faction: 50% tax
- Faction member: Lower tax rates (5-25% depending on tier)

**Action**: Join a faction to significantly increase profits!

### 2. Use Auto-Detect

The "Auto-Detect from Farm" button reads your actual farm data to count:
- Number of animals
- Owned items and boosts
- Resource nodes

This ensures accurate calculations without manual entry.

### 3. Feed to Optimal Levels

Don't always feed to max level (15)! The optimal level depends on:
- Feed cost vs. output increase
- Your owned boosts
- Current market prices

**Example**: If feed is expensive, level 10 might be more profitable than level 15.

### 4. Consider Your Schedule

Set sleep times based on **when you actually play**:
- Check farm every 12 hours? Use 12-hour sleep time
- Only play once a day? Use 24-hour sleep time

Accurate sleep times = accurate daily profit estimates.

### 5. Compare Profit Sources

The daily breakdown shows which activities earn the most. Focus your time on:
- Highest profit per time invested
- Activities that fit your schedule
- What you enjoy playing

### 6. Factor in Inventory

The calculator assumes:
- You have food to feed animals
- You have materials to craft tools
- You have oil for greenhouse

**Action**: Keep enough inventory to maintain your profit cycles!

## Common Questions

### Why are my profits different from the calculator?

Possible reasons:
1. **Tax rate mismatch**: Check your faction status and set correct tax rate
2. **Missing boosts**: Not all items placed on farm or equipped
3. **Price fluctuations**: Market prices change; refresh data regularly
4. **Inventory constraints**: Calculator assumes unlimited feed/materials

### What if I don't have certain items?

The system auto-detects items from your farm data. If an item isn't detected:
- You don't own it, OR
- It's not placed on your farm, OR
- It's not equipped (wearables)

Calculations automatically adjust for your actual boosts.

### How often should I feed animals?

The calculator shows profit per 24 hours based on YOUR sleep time setting. 

More frequent feeding = more cycles = more profit (if you have time).
Less frequent = less profit but less time investment.

**Choose based on your availability!**

### Which resources are most profitable?

Check the economic analysis recommendations! Profitability depends on:
- Your tool costs (material availability)
- Your boosts (items like Tunnel Mole)
- Current market prices
- Respawn times

Gold is usually most profitable per node, but:
- Requires rare materials for pickaxe
- Only respawns every 24 hours
- Fewer gold nodes than tree nodes

### Should I use Chunky Feed?

Chunky Feed:
- ✅ 2x XP (reach desired level faster)
- ❌ 1.5x food cost

**Use when**: You want to reach target level quickly (e.g., going from 1 to 10)

**Don't use when**: Farming at optimal level repeatedly (food cost adds up)

## Advanced: Reading the Economic Analysis

The full analysis object contains:

```json
{
  "dailyPotential": {
    "total": 1250.50,
    "breakdown": {
      "cows": 500.00,
      "chickens": 300.00,
      "sheep": 200.00,
      "resources": 150.50,
      "greenhouse": 100.00
    }
  },
  "recommendations": [
    {
      "priority": "high",
      "title": "Optimize Cow Feeding",
      "reason": "Feed cows to level 12 instead of 15 to increase profit by 15%",
      "profit": 75.00
    }
  ]
}
```

This data drives all dashboard visualizations and recommendations.

## Next Steps

1. ✅ Connect your farm
2. ✅ View economic summary on Overview tab
3. ✅ Configure settings (tax rate, sleep times)
4. ✅ Use auto-detect for accurate animal counts
5. ✅ Review recommendations
6. ✅ Test different strategies (feed to different levels)
7. ✅ Compare profit opportunities
8. ✅ Optimize your farming routine!

## Need Help?

- Check [ECONOMIC_SYSTEM.md](./ECONOMIC_SYSTEM.md) for technical details
- See [CALCULATOR_SYSTEM.md](./CALCULATOR_SYSTEM.md) for system architecture
- Report issues on GitHub: https://github.com/calebadrian/SFL-Calculator/issues

Happy farming! 🌻
