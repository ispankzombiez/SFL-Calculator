# Security Policy

## API Key Storage

This calculator stores your Sunflower Land API key **locally in your browser only** using localStorage. The key is:

- ✅ **Never transmitted** to GitHub, our servers, or any third party
- ⚠️ **Transmitted through a CORS proxy** (corsproxy.io) to reach the Sunflower Land API
- ✅ **Only used** to authenticate with official Sunflower Land API endpoints
- ✅ **Obfuscated** using Base64 encoding (not full encryption, as client-side JavaScript is always visible)
- ✅ **User-controlled** - you can disconnect and clear all data anytime

## CORS Proxy Notice

**Why we need it:** Browsers block direct requests from GitHub Pages to external APIs (CORS policy).

**What it does:** The CORS proxy (corsproxy.io) acts as a middleman that forwards your API requests to the Sunflower Land API.

**Security implications:**
- Your API key passes through the proxy service
- The proxy cannot permanently store your key (it's only used for request forwarding)
- If you're concerned, run the calculator locally (no proxy needed)

**To run without proxy:** See the Local Development section in README.md

## Important Security Notes

### ⚠️ API Key Safety

1. **Never share your API key** with anyone
2. **Don't use this calculator on public/shared computers** unless you click "Disconnect" when done
3. **Regularly refresh your API key** if you suspect it's been compromised
4. **Clear your browser data** if using a public computer

### 🔒 What We Do

- All code is open source and auditable on GitHub
- No backend server - everything runs in your browser
- No analytics or tracking
- No data collection or transmission (except to official Sunflower Land APIs)

### 🛡️ What You Should Do

1. **Review the code** - Feel free to audit [js/api.js](js/api.js) and [js/storage.js](js/storage.js) to verify where your API key is used
2. **Use HTTPS** - Always access via https:// (GitHub Pages provides this automatically)
3. **Keep your browser updated** - Ensures localStorage security features are up to date
4. **Disconnect when done** - Click "Settings" → "Disconnect & Clear All Data" when finished

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email: [Your Email] or create a private security advisory on GitHub
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work to resolve the issue promptly.

## localStorage Limitations

localStorage is **not encrypted** by the browser. While we obfuscate your API key, anyone with physical access to your computer could theoretically:

- Read browser localStorage data
- Extract your API key if they know what to look for

**Mitigation**: Always use the "Disconnect" feature when you're done, especially on shared devices.

## API Rate Limits

To respect Sunflower Land API rate limits, this calculator:

- Caches price data for 1 hour
- Caches farm data for 5 minutes
- Implements retry logic with exponential backoff
- Never polls automatically (refresh only on user request)

## Third-Party APIs Used

1. **sfl.world API** (https://sfl.world/api/v1/prices)
   - Public endpoint, no authentication required
   - CORS-enabled
   - Used for P2P market prices

2. **Sunflower Land API** (https://api.sunflower-land.com/community/farms/{farmId})
   - Requires your personal API key
   - Rate-limited
   - Used for farm data retrieval

## Browser Compatibility

This calculator uses:
- localStorage (supported in all modern browsers)
- ES6 modules (requires modern browser)
- Fetch API (requires modern browser)

Recommended browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Updates and Patches

We will:
- Monitor for security issues
- Update dependencies if any are added
- Notify users of critical security updates via GitHub releases

---

**Last Updated**: February 8, 2026
