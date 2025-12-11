# Libraries Folder - Babylon Staking Decoder

## Purpose

This folder contains bundled JavaScript libraries for **offline use** in the Babylon Staking Decoder application.

## Current Status: ✅ COMPLETE (v1.2.0)

All libraries have been successfully bundled using esbuild and are production-ready for offline use.

## Bundled Libraries

### 1. bitcoinjs-lib.bundle.js (433 KB)
- **Source:** npm package `bitcoinjs-lib@6.1.5`
- **Purpose:** Bitcoin JavaScript library for transaction handling and address operations
- **Format:** IIFE (Immediately Invoked Function Expression)
- **Global:** Exports as `window.bitcoin`
- **Status:** ✅ Bundled with all dependencies
- **Build Entry:** `bundle-bitcoinjs.js`

### 2. secp256k1.bundle.js (42 KB)
- **Source:** npm package `@noble/secp256k1@1.7.1`
- **Purpose:** Elliptic curve cryptography for Bitcoin (secp256k1 curve)
- **Format:** IIFE
- **Global:** Exports as `window.nobleSecp256k1`
- **Status:** ✅ Bundled with all dependencies
- **Build Entry:** `bundle-secp256k1.js`

### 3. sha256.bundle.js (9.7 KB)
- **Source:** npm package `@noble/hashes@1.3.0`
- **Purpose:** SHA-256 hashing for Bitcoin operations
- **Format:** IIFE
- **Global:** Exports as `window.nobleSha256`
- **Status:** ✅ Bundled with all dependencies
- **Build Entry:** `bundle-sha256.js`

**Total Bundle Size:** 485 KB (compressed, production-ready)

## How Libraries Were Bundled

The libraries were bundled using **esbuild** with the following configuration:

1. **Created package.json** with all dependencies
2. **Created bundle entry points** for each library
3. **Ran esbuild** with IIFE format for browser compatibility
4. **Verified bundles** with test-offline.html

### Build Commands

**For bitcoinjs-lib (uses browserify):**
```bash
cd libraries
npm install
npx browserify browserify-entry.js --standalone bitcoin -o bitcoinjs-lib.bundle.js
```

**For other libraries (uses esbuild via npm run bundle):**
```bash
cd libraries
npm run bundle
```

This runs two esbuild commands:
```bash
esbuild bundle-secp256k1.js --bundle --format=iife --global-name=nobleSecp256k1 --outfile=secp256k1.bundle.js
esbuild bundle-sha256.js --bundle --format=iife --global-name=nobleSha256 --outfile=sha256.bundle.js
```

**Note:** bitcoinjs-lib uses **browserify** instead of esbuild because:
- It's a CommonJS module that esbuild had difficulty wrapping correctly
- Browserify properly exposes Buffer globally (required by bitcoinjs-lib)
- Browserify's `--standalone` flag correctly creates the global `bitcoin` object

## HTML Integration

The `index.html` file now uses local bundles instead of CDN:

**Old (CDN - Commented Out):**
```html
<!-- OLD (CDN) - No longer used
<script src="https://cdnjs.cloudflare.com/ajax/libs/bitcoinjs-lib/6.1.5/bitcoinjs-lib.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@noble/secp256k1@1.7.1/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@noble/hashes@1.3.0/sha256.min.js"></script>
-->
```

**New (Local - Active):**
```html
<!-- NEW (Local) - Active -->
<script src="libraries/bitcoinjs-lib.bundle.js"></script>
<script src="libraries/secp256k1.bundle.js"></script>
<script src="libraries/sha256.bundle.js"></script>
<script src="babylon-script.js"></script>
```

## Testing Offline Functionality

### Quick Test
Open `test-offline.html` to verify:
- ✅ All libraries load without CDN
- ✅ Bitcoin address generation works
- ✅ SHA-256 hashing works
- ✅ All global objects are accessible

### Full Test
1. Open `index.html` in browser
2. Disconnect from internet
3. Refresh the page
4. Verify all UI features work (except address calculation API)

## Files in This Folder

```
libraries/
├── README.md (this file)
│
├── Production Bundles (485 KB total) ✅
│   ├── bitcoinjs-lib.bundle.js (433 KB)
│   ├── secp256k1.bundle.js (42 KB)
│   └── sha256.bundle.js (9.7 KB)
│
└── Build Configuration
    ├── package.json - npm dependencies and scripts
    ├── package-lock.json - Dependency lock file
    ├── browserify-entry.js - Entry point for bitcoinjs-lib (browserify) ✅ ACTIVE
    ├── bundle-bitcoinjs.js - OLD entry point (esbuild, not used)
    ├── bundle-secp256k1.js - Entry point for noble/secp256k1 (esbuild)
    └── bundle-sha256.js - Entry point for noble/hashes (esbuild) 
```

## Offline Capability Status

### ✅ Works Offline
- All JavaScript libraries (485 KB bundled)
- Complete UI functionality
- Settings and localStorage
- Finality provider management
- Dark mode toggle
- All form interactions
- Offline Babylon staking address calculation
   1. Implemented Babylon staking script construction
   2. Implemented Bitcoin Taproot (BIP340/341) operations
   3. Implemented bech32m address encoding
   4. Removed dependency on christophluescher.pythonanywhere.com API
- Transaction hash verification

### ⚠️ Requires Internet
- Babylon staking address calculation via christophluescher API

## Rebuilding Bundles
If you need to rebuild the bundles (e.g., to update library versions):

1. **Ensure Node.js is installed:**
   ```bash
   node --version  # Should show v16 or higher
   npm --version   # Should show v7 or higher
   ```

2. **Navigate to libraries folder:**
   ```bash
   cd "Babylon Staking Decoder/libraries"
   ```

3. **Clean install (if needed):**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Rebuild bundles:**
   ```bash
   npm run bundle
   ```

5. **Verify bundle sizes:**
   - bitcoinjs-lib.bundle.js: ~433 KB
   - secp256k1.bundle.js: ~42 KB
   - sha256.bundle.js: ~9.7 KB


## Technical Details

### IIFE Format
The bundles use IIFE (Immediately Invoked Function Expression) format, which:
- ✅ Works in all modern browsers
- ✅ Doesn't require module loading systems
- ✅ Exports to global `window` object
- ✅ Self-contained with all dependencies

### Bundle Entry Points

**bundle-bitcoinjs.js:**
```javascript
import * as bitcoin from 'bitcoinjs-lib';
window.bitcoin = bitcoin;
export default bitcoin;
```

**bundle-secp256k1.js:**
```javascript
import * as secp256k1 from '@noble/secp256k1';
window.nobleSecp256k1 = secp256k1;
export default secp256k1;
```

**bundle-sha256.js:**
```javascript
import { sha256 } from '@noble/hashes/sha256';
window.nobleSha256 = { sha256 };
export { sha256 };
```
