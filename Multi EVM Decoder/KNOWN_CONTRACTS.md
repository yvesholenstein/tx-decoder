# Known Contracts Guide

## How to grow the built-in list
1) **Etherscan verified leaders**: Pull verified names for top routers, bridges, lending hubs, and stablecoin spenders on each chain. Record `chain | address | name | category | source=etherscan`.
2) **Canonical bridges (chain docs / chainlist)**: Add canonical bridge contracts (L1 and L2 sides) from official docs/chainlist. Record `chain | address | name | category=bridge | source=chain-docs`.
3) **Token lists / aggregators**: From major token/aggregator lists (Uniswap, 1inch, 0x, Paraswap), add common spenders/routers wallets prompt approvals for. Record `chain | address | name | category=dex/router | source=token-list`.
4) **Common spenders / DeFi hubs**: Add frequently used approval targets (Aave/Compound, Seaport/Blur, major DEX routers) focusing on safety relevance. Record `chain | address | name | category | source=common-spender`.

Keep addresses lowercased, one entry per line.

## Seed list (ready to ingest)
Format: `chain | address | name | category | source`

### Etherscan verified leaders
- ethereum | 0x7a250d5630b4cf539739df2c5dacb4c659f2488d | Uniswap V2 Router | dex/router | etherscan
- ethereum | 0xe592427a0aece92de3edee1f18e0157c05861564 | Uniswap V3 SwapRouter | dex/router | etherscan
- ethereum | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 | dex/router | etherscan
- ethereum | 0x1111111254eeb25477b68fb85ed929f73a960582 | 1inch Aggregation Router v5 | dex/router | etherscan
- ethereum | 0xdef1c0ded9bec7f1a1670819833240f027b25eff | 0x Exchange Proxy | dex/router | etherscan
- ethereum | 0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f | SushiSwap Router (Ethereum) | dex/router | etherscan
- ethereum | 0x881d40237659c251811cec9c364ef91dc08d300c | Paraswap Augustus v4 (Ethereum) | dex/router | etherscan
- ethereum | 0x11111112542d85b3ef69ae05771c2dccff4faa26 | CowSwap Settlement | aggregator | etherscan
- ethereum | 0xc36442b4a4522e871399cd717abdd847ab11fe88 | Uniswap V3 NonfungiblePositionManager | dex/liquidity | etherscan
- ethereum | 0x000000000022d473030f116ddee9f6b43ac78ba3 | Permit2 (Uniswap) | auth/permit | etherscan
- ethereum | 0x4f3aff3a747fcade12598081e80c6605a8be192f | Aave V2 LendingPool | lending | etherscan
- ethereum | 0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9 | Aave V2 Pool | lending | etherscan
- arbitrum | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Arbitrum) | dex/router | etherscan
- arbitrum | 0xdef171fe48cf0115b1d80b88dc8eab59176fee57 | Paraswap Augustus v5 (Arbitrum) | dex/router | etherscan
- arbitrum | 0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f | SushiSwap Router (Arbitrum) | dex/router | etherscan
- arbitrum | 0x881d40237659c251811cec9c364ef91dc08d300c | Paraswap Augustus v4 (Arbitrum) | dex/router | etherscan
- arbitrum | 0x489ee077994b6658eafa855c308275ead8097c4a | GMX V1 Router | perp/dex | etherscan
- arbitrum | 0x4b19c70da4c6facb446a6f7e1c3a42b748f9ff1f | Camelot V3 Router | dex/router | etherscan
- arbitrum | 0x5fd55a1b9fc24967c4d0ec1c57b8c77e8b0b2ba5 | Arbitrum Sequencer Inbox | bridge | chain-docs
- optimism | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Optimism) | dex/router | etherscan
- optimism | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 (shared) | dex/router | etherscan
- optimism | 0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f | SushiSwap Router (Optimism) | dex/router | etherscan
- optimism | 0xdef1c0ded9bec7f1a1670819833240f027b25eff | 0x Exchange Proxy (Optimism) | dex/router | etherscan
- polygon | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Polygon) | dex/router | etherscan
- polygon | 0x1b02da8cb0d097eb8d57a175b88c7d8b47997506 | SushiSwap Router (Polygon) | dex/router | token-list
- polygon | 0xa5e0829caededf2f5c3f2deb5944a08dbd8f96d5 | QuickSwap Router | dex/router | etherscan
- polygon | 0x1ce0c2827e2ef14d5c7d0c41ff14206942acc0d7 | Aave V3 Pool (Polygon) | lending | etherscan
- base | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (Base) | dex/router | etherscan
- base | 0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f | SushiSwap Router (Base) | dex/router | etherscan
- base | 0x5c9d6f1b17a0cee870c39e0c99bfec23e86e9be5 | Base Canonical Bridge (Portal) | bridge | chain-docs
- bsc | 0x1111111254760f7ab3f16433eea9304126dcf199 | 1inch Aggregation Router v5 (BSC) | dex/router | etherscan
- bsc | 0x10ed43c718714eb63d5aa57b78b54704e256024e | PancakeSwap V2 Router | dex/router | etherscan

### Canonical bridges (chain docs / chainlist)
- ethereum | 0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f | Arbitrum Delayed Inbox (L1 forwarder) | bridge | chain-docs
- ethereum | 0x25ace71c97b33cc4729cf772ae268934f7ab5fa1 | Optimism L1 Standard Bridge | bridge | chain-docs
- ethereum | 0xa0c68c638235ee32657e8f720a23cec1bfc77c77 | Polygon PoS RootChainManager (L1) | bridge | chain-docs
- ethereum | 0x8d3e809fbd258083a5ba004a527159da535c8aba | Base L1 Standard Bridge | bridge | chain-docs
- base | 0x474e3c26b02e3f5f4a5ffcd17a04528d7dc21634 | Base L2 Standard Bridge | bridge | chain-docs
- optimism | 0x6f1e1d7f6f1437e2dfbd64b7b50a1c7c8c8b74f6 | Optimism L2 Standard Bridge | bridge | chain-docs
- ethereum | 0x5e4e65926ba27467555eb562121fac00d24e9dd2 | Optimism L1 Message Passer | bridge | chain-docs
- ethereum | 0xf55041e37e12cd407ad00ce2910b8269b01263b9 | Polygon PoS Checkpoint Manager | bridge | chain-docs
- base | 0x5c9d6f1b17a0cee870c39e0c99bfec23e86e9be5 | Base Canonical Bridge (Portal) | bridge | chain-docs
- arbitrum | 0x5fd55a1b9fc24967c4d0ec1c57b8c77e8b0b2ba5 | Arbitrum Sequencer Inbox | bridge | chain-docs

### Token lists / aggregators
- polygon | 0x1b02da8cb0d097eb8d57a175b88c7d8b47997506 | SushiSwap Router (Polygon) | dex/router | token-list
- arbitrum | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 (shared) | dex/router | token-list
- optimism | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 (shared) | dex/router | token-list
- base | 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45 | Uniswap Universal Router 02 (shared) | dex/router | token-list

### Common spenders / DeFi hubs (approvals-heavy)
- arbitrum | 0x794a61358d6845594f94dc1db02a252b5b4814ad | Aave V3 Pool (Arbitrum) | lending | common-spender
- ethereum | 0x8d3e809fbd258083a5ba004a527159da535c8aba | Base L1 Standard Bridge (escrow target) | bridge | common-spender
- polygon | 0x1b02da8cb0d097eb8d57a175b88c7d8b47997506 | SushiSwap Router (Polygon) | dex/router | common-spender
- optimism | 0xdef1c0ded9bec7f1a1670819833240f027b25eff | 0x Exchange Proxy (Optimism) | dex/router | common-spender
- base | 0x5c9d6f1b17a0cee870c39e0c99bfec23e86e9be5 | Base Canonical Bridge (Portal) | bridge | common-spender
