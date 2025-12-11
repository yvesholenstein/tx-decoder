# Babylon Staking Decoder - File Structure

## Main Files

### index.html (19 KB)
The main HTML file that contains the structure and layout of the application.
- References external CSS and JavaScript files
- Contains all the HTML markup for the UI
- Uses the base styles from the parent EVM decoder folder
- **Now uses locally bundled JavaScript libraries** (offline capable)

### babylon-styles.css (4.6 KB)
Babylon-specific CSS styles that extend the base styles.
- Additional styling for Babylon-specific components
- Warning boxes, info boxes, calculation steps
- Hash displays, debug output
- Collapsible sections
- Finality provider items

### babylon-script.js (20 KB)
All JavaScript functionality for the Babylon Staking Decoder.
- Finality provider management
- Babylon staking address calculation (via API)
- Transaction hash calculation
- Settings and localStorage management
- Dark mode toggle
- UI interactions and form handling

## JavaScript Libraries (Offline Bundled)

### libraries/ folder
Contains all bundled JavaScript dependencies for offline use:

- **bitcoinjs-lib.bundle.js** (433 KB)
  - Bitcoin operations and transaction handling
  - Bundled with all dependencies using esbuild
  - IIFE format, exports as global `bitcoin` object

- **secp256k1.bundle.js** (42 KB)
  - Elliptic curve cryptography (Noble library)
  - Essential for Bitcoin key operations
  - Exports as global `nobleSecp256k1` object

- **sha256.bundle.js** (9.7 KB)
  - SHA-256 hashing (Noble library)
  - Required for Bitcoin operations
  - Exports as global `nobleSha256` object

**Total bundle size:** 485 KB (compressed, production-ready)

### Build Configuration Files

- **package.json** - npm configuration with dependencies and build scripts
- **bundle-bitcoinjs.js** - Entry point for bitcoinjs-lib bundling
- **bundle-secp256k1.js** - Entry point for @noble/secp256k1 bundling
- **bundle-sha256.js** - Entry point for @noble/hashes bundling

## Documentation Files

### BABYLON_README.md (~8 KB)
Complete user guide with:
- Overview of features
- Step-by-step instructions
- Hardware wallet setup
- Test examples
- **Offline capability information** ✨
- Troubleshooting

### BABYLON_IMPLEMENTATION_NOTES.md (4 KB)
Technical documentation for developers:
- Implementation details
- API integration notes
- Cryptographic requirements
- Test vectors

### FILE_STRUCTURE.md (this file)
Documentation of the project file organization

### OFFLINE_READINESS.md (5 KB)
Offline capability status and roadmap:
- What works offline
- What requires internet
- Future implementation notes

### OFFLINE_SETUP_GUIDE.md (5 KB)
Complete guide for making libraries offline:
- Browser cache approach
- Node.js bundling instructions
- Testing procedures

### BUNDLE_VERIFICATION.md (4 KB)
Verification report for bundled libraries:
- Bundle file details
- HTML reference verification
- Testing checklist

## Testing Files

### test-offline.html (~4 KB) ✨ NEW
Interactive test page to verify offline library functionality:
- Tests all three bundled libraries
- Verifies Bitcoin address generation
- Shows pass/fail results
- Confirms offline capability

## Backup Files

### babylon-staking-decoder-original.html (46 KB)
Original single-file version (backup)
- Contains everything in one file
- Kept for reference

## File Dependencies (Updated)

```
index.html
├── ../Multi EVM Version/styles.css (parent folder - base styles)
├── babylon-styles.css (local - Babylon-specific styles)
├── libraries/bitcoinjs-lib.bundle.js (LOCAL - offline ✅)
├── libraries/secp256k1.bundle.js (LOCAL - offline ✅)
├── libraries/sha256.bundle.js (LOCAL - offline ✅)
└── babylon-script.js (local - all JavaScript)
```

**Old CDN dependencies (commented out in index.html):**
```
<!-- No longer used - switched to local bundles
├── https://cdnjs.cloudflare.com/.../bitcoinjs-lib.min.js
├── https://cdn.jsdelivr.net/.../secp256k1.min.js
└── https://cdn.jsdelivr.net/.../sha256.min.js
-->
```

## Complete Project Structure

```
Babylon Staking Decoder/
├── index.html (19 KB) - Main app ✅
├── babylon-styles.css (4.6 KB) - Styles ✅
├── babylon-script.js (20 KB) - JavaScript logic ✅
├── test-offline.html (4 KB) - Library verification ✨
│
├── libraries/ 📦 (485 KB total)
│   ├── bitcoinjs-lib.bundle.js (433 KB) ✅ OFFLINE
│   ├── secp256k1.bundle.js (42 KB) ✅ OFFLINE
│   ├── sha256.bundle.js (9.7 KB) ✅ OFFLINE
│   ├── package.json - npm config
│   ├── bundle-bitcoinjs.js - Build entry point
│   ├── bundle-secp256k1.js - Build entry point
│   ├── bundle-sha256.js - Build entry point
│   └── README.md - Library documentation
│
├── Documentation/ 📚
│   ├── BABYLON_README.md (8 KB) - User guide
│   ├── BABYLON_IMPLEMENTATION_NOTES.md (4 KB) - Technical docs
│   ├── FILE_STRUCTURE.md (this file) - Project structure
│   ├── OFFLINE_READINESS.md (5 KB) - Offline status
│   ├── OFFLINE_SETUP_GUIDE.md (5 KB) - Setup instructions
│   └── BUNDLE_VERIFICATION.md (4 KB) - Verification report
│
└── Backup/
    └── babylon-staking-decoder-original.html (46 KB)
```

## How to Use

1. **Open** `index.html` in your web browser
2. The application will automatically load:
   - Base styles from the parent folder
   - Babylon-specific styles
   - **Locally bundled JavaScript libraries** (works offline!)
   - Babylon-specific functionality
3. **Test offline capability** by opening `test-offline.html`

## Offline Capability Status

### ✅ Works Offline
- All HTML, CSS, JavaScript code
- All JavaScript libraries (485 KB bundled)
- UI and forms
- Settings management
- Finality provider management
- Dark mode

### ⚠️ Requires Internet
- Babylon address calculation (API dependency)
- Transaction hash verification (depends on address calculation)

## Advantages of Current Structure

✅ **Better Organization**: Each file has a clear purpose
✅ **Easier Maintenance**: Update CSS or JS without touching HTML
✅ **Offline Capable**: Libraries bundled locally (485 KB)
✅ **Code Reusability**: Styles and scripts can be shared if needed
✅ **Better Development**: Easier to debug and test individual components
✅ **Production Ready**: Minified, bundled, optimized for performance

## Build Process

To rebuild bundles (requires Node.js):

```bash
cd libraries
npm install
npm run bundle
```

This regenerates the three `.bundle.js` files from source dependencies.

## Version

File structure as of **v0.2.0** (with offline library support)

## Note

The application references the base `styles.css` from the parent "Multi EVM Version" folder to maintain consistent styling with the EVM decoder.
