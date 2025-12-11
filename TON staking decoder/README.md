# TON Staking Decoder - Plan

Goal: Build a client-side decoder (similar UX and code structure to "Multi EVM Version") that takes a TON transaction payload and renders a human-readable explanation of the intended staking action, along with the exact hash shown on the hardware wallet (Ledger), so users can verify they are signing the intended transaction.

## Scope
- Decode TON staking actions initiated via dApps and software wallets (TON Wallet, Tonkeeper, MyTonWallet), potentially connected to hardware wallets.
- Support the three staking flavors:
  - Native TON staking via "Nominator Pool" smart contract.
  - Staking via "TON Whales" smart contract
  - Liquid TON staking via "Tonstakers" smart contract.
- Input: pasted transaction payload in common TON formats (base64 BOC, hex, ton:// links), extract and decode inner message(s).
- Output: human-readable summary + details, and the hash that the hardware wallet (Ledger app) displays for the signed external message.

## High-Level Architecture
- UI: mirror the "Multi EVM Version" structure (single-page app with clean inputs/outputs, reusable CSS). No chain selector; add input format helper and validation.
- Core decode engine (browser JS/TS):
  - Parse external message BOC ? extract one or more internal messages.
  - Compute the external message hash (exactly as Ledger displays).
  - Decode inner message(s): destination address, TON value, and message body cell.
  - Identify target protocol (Nominator Pool vs Tonstakers) and decode body by known op codes and schemas.
  - Fallback: generic cell pretty-printer + op code/method ID display when unknown.
- Libraries: use TON client/core libraries in the browser (e.g., @ton/core / ton-core or tonweb). Prefer well-maintained libs with BOC parsing, address codecs, and cell hashing.

## Input Formats to Support
- Base64 BOC (typical wallet "payload" / external message): te6cc� strings.
- Hex BOC (0x�)
- Raw message body base64/hex (if a dApp exposes only the inner message body): we�ll wrap it for decoding as best-effort.
- ton://transfer or tonconnect URL formats: parse and fetch the `boc` or `payload` parameter.

## Hash Computation (What Ledger Shows)
- Compute the root BOC hash of the external message (message to be signed). Display as 0x� and base64url to match common UI conventions; allow users to switch formats.
- Also surface internal message hash(es) as advanced info (not the primary hardware-wallet hash).
- Cross-check by testing known sample payloads from popular wallets to ensure hash matches hardware wallet display.

## Protocol-Specific Decoding
1) Nominator Pool (Native TON staking)
- Identify pool contracts (either by address allowlist or by message body op codes and layout).
- Decode actions:
  - Deposit/stake: TON value, beneficiary/owner address, optional query_id/comment.
  - Withdraw/unstake request: amount or shares, query_id.
  - Claim/payout: target owner.
- Present: "Stake X TON to Pool P" (or withdraw/claim), with parsed parameters.

2) Tonstakers (Liquid Staking)
- Identify Tonstakers contracts and the LST mint/redeem flows by op codes.
- Decode actions:
  - Deposit: TON in, mint tsTON/stTON output (show min out if present, slippage, ref address if applicable).
  - Request withdraw/redeem: requested amount/shares.
  - Claim: receivable details.
- Present: human-readable intent with key parameters.

Note: Exact op codes and field layouts should be confirmed from official contract sources or audited wrappers. We'll encapsulate them in small, versioned decoders to simplify maintenance.

## Error Handling & Safety
- Validate input type and format; explain what's wrong and how to fix (e.g., "expected base64 BOC").
- If contract is unrecognized, still display: destination address, TON value, op code (first 32 bits), body slice preview, and any parsed refs.
- Never broadcast or submit anything; offline decode only.
- No external RPC required for core decode; use local parsing only.

## UI/UX Plan (modeled after Multi EVM)
- Single page: header, dark mode toggle, settings modal, input box, decode button, output panel.
- Inputs:
  - Payload textarea with format auto-detection.
  - Optional advanced toggle: show raw cell tree and internal hashes.
- Output:
  - Summary card: action, amount, destination, pool/protocol, wallet hash.
  - Details: parsed fields by protocol module; unknown fields tab for experts.
  - Copy buttons for hash and addresses.

## File Structure (initial)
- `index.html` � UI shell (borrow styles and layout conventions from Multi EVM Version).
- `styles.css` � adapted styles.
- `config.js` � constants: protocol registry, known pool addresses, op codes mapping.
- `decoder.js` � input parsing, BOC ? messages, hash computation, dispatch to protocol modules, fallbacks.
- `protocols/`
  - `nominatorPool.js` � decode logic and pretty-printing.
  - `tonstakers.js` � decode logic and pretty-printing.
- `ui.js` � interactions, settings, rendering helpers.
- `samples/` � example payloads for offline verification.

## Implementation Steps
1. Scaffold UI and basic input handling.
2. Integrate TON cell/BOC library; implement payload detection and parsing.
3. Compute and display external message hash reliably.
4. Extract inner message(s): destination, value, body cell.
5. Add generic body inspector (op code, refs, parsed ints/addrs).
6. Implement Nominator Pool decoder (deposit/withdraw/claim).
7. Implement Tonstakers decoder (deposit/redeem/claim).
8. Add samples and verify hashes vs known wallet outputs.
9. Polish UI, copy buttons, settings, dark mode.

## Dependencies
- TON libs: `@ton/core` / `ton-core` or `tonweb` (for BOC, addresses, cells, hashing). Include via CDN in `index.html`.
- No RPCs required; all parsing is local.

## Verification & Testing
- Include known sample payload BOCs (from test vectors) and expected wallet hashes.
- Unit-style helpers (in browser) to assert parse results vs expected decodings.
- Manual checks with multiple wallet payload formats and `ton://` links.

## Notes on Parity with "Multi EVM Version"
- Keep separation of concerns:
  - `config.js` for constants/registries
  - `decoder.js` for core logic
  - `ui.js` for rendering/UX
- Reuse existing CSS patterns for consistent look & feel.
- No external API dependency by default (unlike Etherscan usage in Multi EVM); faster and more private.

## Open Questions / To Confirm
- Exact Ledger-displayed hash source for TON (expected: external message root BOC hash). Include a toggle to show both external and inner message hashes to help users reconcile displays.
- Finalized op codes and field layouts for Nominator Pool and Tonstakers (to be filled from official sources/tests).

