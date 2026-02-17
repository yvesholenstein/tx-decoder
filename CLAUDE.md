# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of client-side, browser-based transaction decoders for verifying hardware wallet signing payloads. No server, no framework, no build step for runtime. All tools open directly as HTML files in a browser.

Three sub-projects:
- **Multi EVM Decoder** (v0.9.1) — Decodes EVM transactions across 14 chains using Etherscan v2 API for ABI lookup. Supports automatic (API) and manual (paste ABI) modes, EIP-1559/Legacy envelope hashing, and `eth_call` simulation.
- **Babylon Staking Decoder** (v0.2.0) — Verifies Bitcoin Babylon staking transactions (Taproot P2TR, BIP340/341). Supports staking entry, exit/unbonding, and rewards claiming.
- **TON Staking Decoder** (v0.0.1) — WIP skeleton for TON staking transaction decoding. Protocol modules are stubs.
- **eip712-encoder.html** — Standalone EIP-712 typed message encoder/decoder.

## Build Commands

Only the Babylon Staking Decoder has a build step (for pre-bundling offline crypto libraries):

```bash
cd "Babylon Staking Decoder/libraries"
npm install
npm run bundle                    # esbuild for secp256k1 + sha256
npx browserify browserify-entry.js --standalone bitcoin -o bitcoinjs-lib.bundle.js
```

All other sub-projects have zero build steps — just open `index.html` in a browser.

## Testing

No formal test framework. Testing is manual via browser:
- `Babylon Staking Decoder/test-offline.html` — Verifies bundled libraries load correctly
- `Babylon Staking Decoder/test-ecc.html` — ECC crypto function tests
- `Multi EVM Decoder/test_proxy_detection.js` — Proxy detection tests (run in browser console)
- `TON staking decoder/test_fallback.js` — Fallback decoding tests

## Architecture

All three decoders follow the same file separation pattern:

| File | Responsibility |
|------|---------------|
| `config.js` | Constants, chain/protocol configs, token databases, known addresses |
| `decoder.js` | Core decoding logic — input parsing, ABI decoding, hash computation |
| `ui.js` | DOM manipulation, settings modal, localStorage, dark mode |
| `index.html` | HTML shell that loads CSS + JS in correct order |
| `styles.css` | Styling with dark mode via `.dark-mode` class on `<body>` |

## Key Technical Details

- **ethers.js versions differ**: EVM Decoder uses v5.7.2; EIP-712 encoder uses v6.7.1. APIs are incompatible between versions.
- **Babylon Decoder shares CSS**: Its `index.html` references `../Multi EVM Decoder/styles.css` as a base stylesheet — this relative path is important.
- **EVM API key**: Stored in `localStorage` under `etherscanApiKey`. Single Etherscan v2 unified endpoint (`api.etherscan.io/v2/api`) works for all 14 chains.
- **EVM Decoder entry points**: `decodeAuto()` (API-based ABI lookup) and `decodeManual()` (user-pasted ABI) in `decoder.js`.
- **All state is in localStorage**: API keys, settings, dark mode preference, address book, finality providers.
