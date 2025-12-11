# EVM Transaction Decoder v0.1

## Overview
Multi-chain Ethereum transaction decoder with best-effort decoding when ABI is unavailable.

## Features
- 10 EVM chains supported (Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BSC, Blast, Scroll, zkSync)
- **Unified Etherscan v2 API** - Single API key works across all supported chains
- **EIP-712 Typed Message Decoding** - Detects and decodes EIP-712 signed messages
  - Paste EIP-712 JSON structure to see complete encoding process
  - Shows type hash, encoded data, struct hash, domain separator, and final signature hash
  - Supports both JSON input and hex-encoded data
- Intelligent risk assessment (distinguishes limited vs unlimited approvals)
- Token amount formatting with USD prices
- Transaction hash verification for hardware wallets
- Best-effort parameter interpretation
- Detects proxy contract ABIs and issues a warning

## Architecture
- index.html: Main UI
- styles.css: Styling with dark mode
- config.js: Chain configs and token databases
- decoder.js: Core decoding logic
- ui.js: UI interactions

## Key Design Decisions
1. **Unified Etherscan v2 API**: Uses single endpoint with chainid parameter for all supported chains
2. Risk assessment checks approval amounts (limited = medium, unlimited = high)
3. Calculates keccak256 hash for hardware wallet verification
4. Falls back to best-effort decoding when ABI unavailable
5. Falls back to hardcoded token formatting information if Etherscan API unavailable

## API Key Setup
Get a free Etherscan API key at https://etherscan.io/apis
- One key works for all 60+ supported chains
- Stored locally in browser (localStorage)
- No server-side storage required
