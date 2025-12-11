# Babylon Staking Decoder - User Guide

## Overview

The Babylon Staking Decoder is a web application for calculating and verifying Babylon BTC staking transactions. It helps you verify transactions before signing them on your hardware wallets (Keystone 3 and Ledger Flex).

## Features

### 1. Babylon Staking Address Calculator
- Calculates the correct Taproot staking address based on your parameters
- Uses the verified christophluescher.pythonanywhere.com API or a local javascript implementation of the calculation logic
- Supports debug mode to see all calculation details
- Works with Mainnet, Testnet, and Signet

### 2. Transaction Hash Verification
- Calculates expected transaction hashes for all 5 staking transactions
- Allows visual comparison with your hardware wallet displays
- No need to type long hashes manually!

### 3. Three Operation Modes
- **Staking Entry**: Calculate address and verify all 5 transactions
- **Staking Exit/Unbonding**: Information and guidance for unbonding
- **Rewards Claiming**: Instructions for claiming staking rewards

## How to Use

### Step 1: Calculate Babylon Staking Address

1. Enter your **Staker Public Key** (64 hex characters)
2. Select your **Finality Provider** (default: BitcoinSuisse)
3. Choose **Network** (Mainnet/Testnet/Signet)
4. Enter **Bitcoin Amount** to stake
5. Set **Network Fee Rate** (default: 3 sats/vB)
6. (Optional) Expand **Advanced Parameters** to customize:
   - Timelock Blocks (default: 64000)
   - Covenant Threshold (default: 6)
   - Unbonding Time (default: 301 blocks)
   - Covenant Public Keys
7. Toggle **Debug Mode** if you want to see detailed calculation info
8. Click **Calculate Staking Address**

**Result**: You'll get the Babylon staking address (bc1p...) that you need to verify matches what your wallet shows.

### Step 2: Calculate Transaction Hashes

1. Enter your **Staking Taproot Address** (the address holding your funds)
2. Click **Calculate All Transaction Hashes**

**Result**: The app calculates 5 transaction hashes that you should visually compare with your Keystone 3 or Ledger Flex:

#### Transaction 1: Slashing Transaction (Regular Stakes)
**Verify on Keystone:**
- Input is NOT your staking address
- Outputs: 0.0015 BTC (fees), 0.1% of stake (slashed amount), remainder

#### Transaction 2: Slashing Transaction (Unbonding Stakes)
**Verify on Keystone:**
- Same as Transaction 1

#### Transaction 3: BTC Address Link to Babylon Chain
**Verify on Keystone:**
- Transaction amount must be 0 BTC
- Output must be OP_RETURN

#### Transaction 4: Stake Announcement on Babylon Chain
**Note:** No verification required - sign directly on Keplr/Ledger

#### Transaction 5: Actual Staking Transaction
**Verify on Keystone:**
- Staking output address matches the calculated Babylon address from Step 1
- Amount matches your intended stake

## Settings

Access settings by clicking the gear icon in the top right.

### Managing Finality Providers

- **View**: See all configured finality providers
- **Add**: Enter provider name and Bitcoin public key (64 hex characters)
- **Delete**: Remove providers you no longer need
- **Default**: BitcoinSuisse is pre-configured

## Hardware Wallet Setup

### Bitcoin (Keystone 3)
- Software: Sparrow wallet
- Hardware: Keystone 3 with BTC-only firmware
- Address: First Taproot address

### Babylon Chain (Ledger Flex)
- Software: Keplr wallet
- Hardware: Ledger Flex

## Test Example

You can test the calculator with these values:

**Input:**
- Staker Public Key: `8a762ca4ab2a314e79dbf0e81ed5efa2483f0f52664a4da42ea125b7ed98f4b1`
- Finality Provider: BitcoinSuisse (default)
- Network: Mainnet
- Timelock: 64000 blocks

**Expected Output:**
- Address: `bc1pjujdr7w6lw9k62jq06c5znrnfqwnn3m3ajfcdkfjp83zxl4fn3wqlt7shp`

## Security Notes

- Always verify transaction hashes on your hardware wallet screen
- Never sign transactions with unverified hashes
- For unbonding, ensure your staking address has no substantial balance beyond the staked amount
- The app uses HTTPS API calls to christophluescher.pythonanywhere.com for address calculation

## Troubleshooting

### "Error: API request failed"
- Check your internet connection
- The christophluescher.pythonanywhere.com service might be temporarily unavailable
- Try again in a few moments

### "Invalid public key format"
- Ensure your public key is exactly 64 hexadecimal characters
- Remove any spaces or special characters
- Use lowercase or uppercase hex (both work)

### Address doesn't match
- Verify all parameters match exactly (timelock, threshold, etc.)
- Check you're using the correct network (Mainnet vs Testnet)
- Enable debug mode to see detailed calculation steps

## Offline Capability

### ✅ What Works Offline

The application now has **partial offline support** with locally bundled JavaScript libraries:

- ✅ **Full UI and functionality** - All HTML, CSS, and JavaScript are local
- ✅ **JavaScript libraries** - bitcoinjs-lib, @noble/secp256k1, @noble/hashes (485 KB bundled)
- ✅ **Settings management** - Uses localStorage, fully offline
- ✅ **Finality provider management** - Add, edit, delete providers offline
- ✅ **Dark mode** - Works completely offline
- ✅ **Address calculation** - using offline mode
- ✅ **Transaction hash verification** - Depends on address calculation

### ⚠️ What Requires Internet

- **Address calculation** - via christophluescher.pythonanywhere.com API

### Testing Offline

1. Open `test-offline.html` to verify libraries work
2. All UI features work offline except address calculation
3. Load the page once online, then use offline for UI/settings

For more details, see `OFFLINE_READINESS.md` and `BUNDLE_VERIFICATION.md`.

## Technical Details

### JavaScript Libraries
All JavaScript libraries are bundled locally for offline use:
- **bitcoinjs-lib** (433 KB) - Bitcoin operations and address handling
- **@noble/secp256k1** (42 KB) - Elliptic curve cryptography
- **@noble/hashes** (9.7 KB) - SHA-256 and other hash functions

### Address Calculation
The application uses the christophluescher.pythonanywhere.com API to compute Babylon staking addresses. This ensures:
- Correct implementation of Bitcoin Taproot scripts
- Proper BIP340/BIP341 tagged hashing
- Accurate secp256k1 point operations
- Valid bech32m address encoding

All calculations follow the Babylon protocol specification for BTC staking.

## Version

Current Version: 0.2.0 (with offline support)

## Credits

- Inspired by: [christophluescher.pythonanywhere.com](https://christophluescher.pythonanywhere.com/)
- Created for: Babylon BTC Staking
- Copyright © 2025 by Yves Holenstein
