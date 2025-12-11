# Improvement Ideas & Architecture Notes

Assumptions: no dedicated backend; we can call RPC nodes (already configured) and explorer APIs (Etherscan/others).

## 1) Deterministic Simulation (State Deltas)
- Goal: Show predicted post-tx effects (balance/allowance deltas, storage touches).
- Functionality: Build `eth_call` (or `debug_traceCall` when available) against latest block; snapshot balances/allowances before/after; show revert reasons.
- JS structure: `simulation/simulation.js` (RPC calls), `simulation/stateDiff.js` (compare pre/post), `utils/providers.js` (RPC selection).
- Backend: None; relies on RPC support.
- Persistence: Cache last-known balances/allowances per address/token in `localStorage` as baselines.
- UI: Input toggle “Simulate effects”; Output “Predicted Changes” panel (balances/allowances before → after, external calls, revert reason); Settings show RPC capability hints.

## 2) Policy Engine (Rules/Thresholds/Allowlists)
- Goal: Enforce org rules (caps, allow/deny lists, function restrictions).
- Functionality: Evaluate decoded tx against rules (e.g., no unlimited approvals, allowed spenders, max transfer sizes).
- JS structure: `policy/policy.js` (evaluation), `policy/ruleset.js` (load/save rules), `policy/profiles.js` (different rule profiles).
- Backend: None (local).
- Persistence: Ruleset in `localStorage`; import/export JSON.
- UI: Settings rule editor (JSON or toggles); Output “Policy Check” box with pass/warn/block + rationale.

## 3) Allowlist & Reputational Context
- Goal: Flag non-verified/first-time/denied contracts and addresses.
- Functionality: Fetch verification status/audit links from explorer APIs; mark first-time interactions; apply allow/deny lists.
- JS structure: `data/reputation.js` (explorer calls + cache), `data/allowlist.js` (local lists).
- Backend: None (explorer APIs only).
- Persistence: `localStorage` for allow/deny lists; TTL cache for verification per address+chain.
- UI: Input shows verification status and first-time flag; Output badges (Verified/Unverified/First-time) and audit links; Settings manage lists.

## 4) Approval Safety (Pre/Post Allowance)
- Goal: Highlight unlimited approvals and resulting allowance.
- Functionality: Read current allowance via `eth_call`; compute post-tx allowance from decoded params; flag unlimited.
- JS structure: `simulation/allowanceDiff.js`.
- Backend: None.
- Persistence: Optional cache of allowances in `localStorage`.
- UI: Output “Allowance Impact” row (current → after) with red badge for unlimited; Settings toggle “Fetch current allowances”.

## 5) Human-Readable Recipients (ENS/RNS/Address Book)
- Goal: Reduce address confusion.
- Functionality: ENS/RNS lookups; local address book labels; reverse-record mismatch warnings.
- JS structure: `utils/nameResolution.js`, `data/addressBook.js`.
- Backend: None (RPC for ENS/RNS).
- Persistence: `localStorage` for address book and name cache.
- UI: Input shows resolved name + mismatch warning; Settings simple address book editor.

## 6) Bridge Sanity Checks
- Goal: Validate bridge-specific params (domain IDs, payload shapes).
- Functionality: Static rule tables per bridge (LayerZero chain IDs, Wormhole chain IDs, Snowbridge addr kinds); length/encoding checks.
- JS structure: `decoders/bridgeRules.js` (tables), `decoders/bridgeValidator.js` (apply rules).
- Backend: None (static).
- Persistence: Static tables; optional cached chain/domain metadata in `localStorage`.
- UI: Output “Bridge Validation” panel with Pass/Warn (expected vs provided IDs, recipient encoding notes); Settings toggle “Strict bridge validation”.

## 7) Payload Inspection (Nested Actions)
- Goal: Decode embedded `bytes` blobs (Permit2, multicall, LayerZero adapter params, Wormhole VAAs).
- Functionality: Detect patterns/signatures; dispatch to specific parsers; flag delegatecall or unknown targets.
- JS structure: `decoders/blobDecoders/permit2.js`, `multicall.js`, `layerzero.js`, `wormholeVaa.js`; `decoders/payloadRouter.js`.
- Backend: None.
- Persistence: None.
- UI: Output expandable “Embedded Actions” section with decoded inner calls/params and warnings.

## 8) Risk Scoring with Explainability
- Goal: Heuristic score plus reasons.
- Functionality: Rule-based scoring (delegatecall, create2, unverified target, first-time interaction, unlimited approval, bridge anomalies).
- JS structure: `risk/riskEngine.js`, `risk/explanations.js`.
- Backend: None.
- Persistence: Optional cache of last scores per contract in `localStorage`.
- UI: Output “Risk Score” badge with triggers; require explicit confirmation on High.

## 9) Cross-Chain Replay / Chain-ID Guardrails
- Goal: Ensure chain IDs and domains are correct.
- Functionality: Validate EIP-155 `chainId`, EIP-712 domain separator, salt; warn if missing or mismatched.
- JS structure: `utils/domainChecks.js`.
- Backend: None.
- Persistence: None.
- UI: Input displays current chain ID; warn if tx/typed data chainId differs; Output “Replay Protection” row.

## 10) UX Guardrails (“After Signing” Diff)
- Goal: Make changes obvious.
- Functionality: Aggregate impacts from risk, policy, simulation/allowance diff into a clear before/after view.
- JS structure: `ui/changeSummary.js`, `ui/renderers.js`.
- Backend: None.
- Persistence: None.
- UI: Output prominent “After Signing” card (balances/allowances/approvals/bridge dest) with red callouts for irreversible/high-risk actions; Input hint to compare with HW wallet screen.

## 11) Audit Log (Local)
- Goal: Track reviews/decisions locally.
- Functionality: Append entries with tx hash/data hash, decoded summary, risk, user decision; export/import.
- JS structure: `data/auditLog.js`.
- Backend: None.
- Persistence: IndexedDB (preferred for volume), export/import JSON.
- UI: Settings toggle logging and export/import buttons; Output small “Logged” indicator with count.

## 12) Offline/Air-Gapped Mode
- Goal: Operate without network.
- Functionality: Bundle common ABIs/protocols; allow manual ABI upload; cache explorer responses; offline flag to avoid network calls.
- JS structure: `data/offlineCache.js`.
- Backend: None.
- Persistence: IndexedDB for ABIs/cache; `localStorage` flag for offline mode.
- UI: Input “Offline mode” toggle + stale-data warning; Output badge when cached data used.

## 13) Team Presets (Profiles)
- Goal: Switch rule sets per workflow.
- Functionality: Named profiles combining ruleset + UI defaults.
- JS structure: `policy/profiles.js`.
- Backend: None.
- Persistence: `localStorage`/IndexedDB for profiles.
- UI: Settings profile selector (Treasury, Settlements, Bridges); per-profile rule configs.

## Suggested File/Module Layout
- `decoders/` (protocol/bridge validators, blob decoders, payload router)
- `policy/` (`policy.js`, `ruleset.js`, `profiles.js`)
- `risk/` (`riskEngine.js`, `explanations.js`)
- `simulation/` (`simulation.js`, `stateDiff.js`, `allowanceDiff.js`)
- `data/` (`allowlist.js`, `addressBook.js`, `reputation.js`, `offlineCache.js`, `auditLog.js`)
- `ui/` (`changeSummary.js`, `renderers.js`, `settings.js`)
- `utils/` (`providers.js`, `nameResolution.js`, `domainChecks.js`)

## UI Additions (Summary)
- Input: toggles for simulate effects, offline mode, policy profile selector, strict bridge validation, allowance fetch, ENS/address book.
- Output: cards for Policy Check, Risk Score, Predicted Changes, Allowance Impact, Bridge Validation, Embedded Actions, Replay Protection, After-Signing Diff.
- Settings: rule editor/import/export, allow/deny lists, address book, offline cache management, audit log export/import.
