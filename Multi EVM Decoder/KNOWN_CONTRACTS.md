# Known Contracts Guide

## How to grow the built‑in list
1) **Etherscan verified leaders**: Pull verified names for the top routers, bridges, lending hubs, and stablecoin spenders on each chain (use the explorer’s verified source name). Record `chain | address | name | category | source=etherscan`.
2) **Canonical bridges (chain docs / chainlist)**: From each L1/L2’s official docs or chainlist entries, add the canonical bridge contracts (L1 and L2 sides). Record `chain | address | name | category=bridge | source=chain-docs`.
3) **Token lists / aggregators**: From major token/aggregator lists (Uniswap, 1inch, 0x, Paraswap), add the common spenders/routers that wallets regularly prompt approvals for. Record `chain | address | name | category=dex/router | source=token-list`.
4) **Common spenders / DeFi hubs**: Add frequently-used approval targets (Aave pools, Compound comptrollers, Seaport/Blur, major DEX routers) focusing on safety relevance. Record `chain | address | name | category | source=common-spender`.

Keep everything lowercased, one entry per line, to ease machine ingestion.

## Seed list (ready to ingest)
Format: `chain | address | name | category | source`

### Etherscan verified leaders
- ethereum | 0x7a250d5630b4cf539739df2c5dacb4c659f2488d | Uniswap V2 Router | dex/router | etherscan
- ethereum | 0xe592427a0aece92de3edee1f18e0157c05861564 | Uniswap V3 SwapRouter | dex/router | etherscan
- ethereum | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 | dex/router | etherscan
- ethereum | 0x1111111254eeb25477b68fb85ed929f73a960582 | 1inch Aggregation Router v5 | dex/router | etherscan
- ethereum | 0xdef1c0ded9bec7f1a1670819833240f027b25eff | 0x Exchange Proxy | dex/router | etherscan
- arbitrum | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Arbitrum) | dex/router | etherscan
- arbitrum | 0xdef171fe48cf0115b1d80b88dc8eab59176fee57 | Paraswap Augustus v5 (Arbitrum) | dex/router | etherscan
- optimism | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Optimism) | dex/router | etherscan
- polygon | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Polygon) | dex/router | etherscan
- base | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Base) | dex/router | etherscan

### Canonical bridges (chain docs / chainlist)
- ethereum | 0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f | Arbitrum Delayed Inbox (L1 forwarder) | bridge | chain-docs
- ethereum | 0x25ace71c97b33cc4729cf772ae268934f7ab5fa1 | Optimism L1 Standard Bridge | bridge | chain-docs
- ethereum | 0xa0c68c638235ee32657e8f720a23cec1bfc77c77 | Polygon PoS RootChainManager (L1) | bridge | chain-docs
- ethereum | 0x8d3e809fbd258083a5ba004a527159da535c8aba | Base L1 Standard Bridge | bridge | chain-docs
- base | 0x474e3c26b02e3f5f4a5ffcd17a04528d7dc21634 | Base L2 Standard Bridge | bridge | chain-docs
- optimism | 0x6f1e1d7f6f1437e2dfbd64b7b50a1c7c8c8b74f6 | Optimism L2 Standard Bridge | bridge | chain-docs

### Token lists / aggregators
- polygon | 0x1b02da8cb0d097eb8d57a175b88c7d8b47997506 | SushiSwap Router (Polygon) | dex/router | token-list
- arbitrum | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 (shared) | dex/router | token-list
- optimism | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 (shared) | dex/router | token-list
- base | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 (shared) | dex/router | token-list

### Common spenders / DeFi hubs (approvals-heavy)
- arbitrum | 0x794a61358d6845594f94dc1db02a252b5b4814ad | Aave V3 Pool (Arbitrum) | lending | common-spender
- ethereum | 0x8d3e809fbd258083a5ba004a527159da535c8aba | Base L1 Standard Bridge (escrow target) | bridge | common-spender
- polygon | 0x1b02da8cb0d097eb8d57a175b88c7d8b47997506 | SushiSwap Router (Polygon) | dex/router | common-spender

> Add future entries at the end of each section in the same line format. Keep addresses lowercased.
