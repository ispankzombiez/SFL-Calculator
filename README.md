# Sunflower Land - Unified Farm Calculator

A comprehensive web-based calculator for Sunflower Land farms, providing analytics and optimization for cows, sheep, chickens, resources, cooking, and greenhouse operations.

## 🌻 Features

- **Multi-Calculator Dashboard**: Analyze 6 different aspects of your farm
  - 🐄 Cow Calculator - Milk/leather production and feeding efficiency
  - 🐑 Sheep Calculator - Wool production analysis (coming soon)
  - 🐔 Chicken Calculator - Egg production optimization (coming soon)
  - ⛏️ Resources Calculator - Mining and resource gathering (coming soon)
  - 🍳 Cooking Calculator - Recipe time and profit analysis (coming soon)
  - 🌿 Greenhouse Calculator - Crop efficiency optimization (coming soon)

- **Live Data Integration**
  - Fetches real-time P2P market prices from sfl.world API
  - Pulls your farm data from Sunflower Land API
  - Auto-detects owned items, wearables, and skills
  - Calculates boost multipliers automatically

- **Responsive Design**
  - Mobile-friendly interface
  - Desktop optimized layout
  - Touch-friendly controls

- **Privacy-First**
  - API key stored locally in your browser only
  - Never transmitted to any server except official Sunflower Land API (via CORS proxy)
  - All calculations performed client-side

## ⚠️ Important: CORS Proxy

Due to browser security (CORS policy), GitHub Pages cannot directly access the Sunflower Land APIs. This calculator uses a CORS proxy service (corsproxy.io) to route API requests. This means:

- ✅ Your API key reaches the official Sunflower Land API
- ⚠️ Your requests go through the corsproxy.io service
- 🔒 The proxy cannot store your API key (it's only used for routing)
- 🔄 If the proxy is down, the calculator won't work

**Alternative:** For maximum security, consider running this calculator locally (see Local Development section) or deploying with a backend service.

## 🚀 Demo

Visit: **[Your GitHub Pages URL]** (will be available after deployment)

## 📋 Prerequisites

To use this calculator, you need:

1. **Farm ID**: Your Sunflower Land farm number (numeric)
2. **API Key**: Your personal Sunflower Land API key (starts with "sfl.")

### How to Get Your API Key

[Instructions will be added - contact Sunflower Land support or check their documentation]

## 🔧 Usage

1. **Enter Your Credentials**
   - Input your Farm ID
   - Enter your API Key
   - Click "Connect Farm"

2. **View Your Results**
   - Dashboard loads with all calculator results
   - Switch between calculators using the sidebar tabs
   - Data is cached for 1 hour (prices) and 5 minutes (farm data)

3. **Refresh Data**
   - Click the "Refresh" button to fetch latest data
   - Clears cache and pulls fresh information

4. **Settings**
   - View connection status
   - Check cache timestamps
   - Clear cache or disconnect
   - Export results as JSON

## 🔒 Security & Privacy

### Your API Key is Safe

- **Stored Locally Only**: API key is stored in your browser's localStorage (never sent to GitHub or any external server)
- **Base64 Obfuscation**: Key is obfuscated (not encrypted, since client-side JS is always visible)
- **Single Use**: Key is only sent to official Sunflower Land API endpoints
- **User Control**: You can disconnect and clear all data anytime

### Best Practices

- ⚠️ Never share your API key with others
- ⚠️ Don't use this calculator on public/shared computers
- ✅ Use the "Disconnect" button when done to clear all data
- ✅ Regularly refresh your API key if compromised

## 🛠️ Local Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/SFL-Calculator.git
cd SFL-Calculator

# No build step required - pure static site
# Simply open index.html in a browser or use a local server
```

### Using a Local Server

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# Then visit http://localhost:8000
```

### Project Structure

```
SFL-Calculator/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css          # Global styles
│   ├── mobile.css          # Mobile-specific styles
│   └── desktop.css         # Desktop-specific styles
├── js/
│   ├── main.js             # Application orchestrator
│   ├── api.js              # API integration
│   ├── storage.js          # localStorage management
│   ├── item-detector.js    # Item detection & boosts
│   └── calculators/
│       ├── cow.js          # Cow calculator
│       ├── sheep.js        # Sheep calculator (placeholder)
│       ├── chicken.js      # Chicken calculator (placeholder)
│       ├── resources.js    # Resources calculator (placeholder)
│       ├── cooking.js      # Cooking calculator (placeholder)
│       └── greenhouse.js   # Greenhouse calculator (placeholder)
├── data/
│   └── fallback-prices.json # Fallback price data
└── examples/
    └── cow-sheet/          # Example calculator data
```

## 📊 How It Works

1. **Data Fetching**: Fetches P2P prices from sfl.world and farm data from Sunflower Land API
2. **Item Detection**: Analyzes farm data to detect owned items, wearables, and skills
3. **Boost Calculation**: Calculates multipliers based on detected items
4. **Calculator Execution**: Runs all calculators with detected boosts and live prices
5. **Results Rendering**: Displays comprehensive analysis and recommendations

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Roadmap

- [x] Cow Calculator (Level 1-15 feeding analysis)
- [ ] Sheep Calculator
- [ ] Chicken Calculator
- [ ] Resources Calculator
- [ ] Cooking Calculator
- [ ] Greenhouse Calculator
- [ ] User configuration overrides (custom tax %, sleep hours)
- [ ] Multi-farm comparison
- [ ] Historical price trends
- [ ] Profit optimization recommendations

## ⚠️ Disclaimer

This calculator is a fan-made tool and is not officially affiliated with Sunflower Land. All calculations are estimates based on current game data and market prices. Actual in-game results may vary.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Sunflower Land team for the amazing game
- sfl.world for providing public API endpoints
- Community members who shared calculator logic

## 📧 Contact

For questions or issues, please open an issue on GitHub.

---

Made with 🌻 for the Sunflower Land community
