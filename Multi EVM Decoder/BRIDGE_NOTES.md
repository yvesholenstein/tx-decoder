# Bridge Notes (carry into future sessions)

## Arbitrum Native Bridge (L1 → L2 ETH)
- L1 entrypoint for ETH: **Delayed Inbox** at `0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f`.
- Method: `createRetryableTicket(address to, uint256 l2CallValue, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, bytes data)`.
- Example payload (0.01 ETH from Ethereum to Arbitrum):  
  `0x679b6ded000000000000000000000000de9eb4879e27447a92721acf1c826d72a688cf0e000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000092a4f828c0000000000000000000000000de9eb4879e27447a92721acf1c826d72a688cf0e000000000000000000000000de9eb4879e27447a92721acf1c826d72a688cf0e0000000000000000000000000000000000000000000000000000000000006b77000000000000000000000000000000000000000000000000000000000393870000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000`
  - to: `0xde9eb4879e27447a92721acf1c826d72a688cf0e`
  - l2CallValue: `0x2386f26fc10000` (0.01 ETH)
  - maxSubmissionCost: `0x92a4f828c`
  - excessFeeRefundAddress: same as `to`
  - callValueRefundAddress: same as `to`
  - gasLimit: `0x6b77`
  - maxFeePerGas: `0x39387`
  - data length: 0 → empty calldata (pure ETH transfer)
  - Total msg.value typically = l2CallValue + maxSubmissionCost + (gasLimit * maxFeePerGas) (values above imply ~0.010002 ETH sent)
- L1 ERC20 bridge uses the L1GatewayRouter `outboundTransfer(token, to, amount, maxGas, gasPriceBid, data)` and routes to token-specific gateways (e.g., USDC via L1CustomGateway `0xa3A7B6F88361F48403514059F1F16C8E78d60EeC`).
- Inbox call flow (from Etherscan source of Delayed Inbox proxy): `createRetryableTicket` forwards into the Bridge contract (implements retryable ticket creation); internally funds are escrowed and an L2 submission is enqueued. Decoder should label this as a forwarder calling the Bridge retryable creation, and note that parameters are forwarded (no need to list them twice; show that they are passed through).
- Proxy details: Delayed Inbox is a proxy. Current implementation: `0x7c058ad1d0ee415f7e7f30e62db1bcf568470a10` (as of note time). 
- For all proxy contracts (not just Arbitrum bridge) check for recent upgrades and warn if the implementation changed in the last X days (configurable). Upgrade diff helper: `https://upgradehub.xyz/diffs/etherscan/0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f?selected=9` (replace selected as needed).

### Integration pointers
- Add bridge detection for `createRetryableTicket` on `0x4dbd...bab3f` (any chainId 1→42161 flow) and surface:
  - L2 recipient (`to`)
  - l2CallValue (native amount to deliver)
  - maxSubmissionCost, gasLimit, maxFeePerGas (as fee components)
  - refund addresses (excess/call value)
  - data length (warn if non-empty)
- Compute and display total msg.value vs. l2CallValue to highlight fee overhead.
- Label as “Arbitrum Native Bridge (ETH)” in summary and parameters.
- Optional: Add proxy staleness check (warn if implementation upgraded within configurable X days) and link to UpgradeHub diff.

## HyperEVM (Hyperliquid)
- ChainId: **999**
- RPC: `https://rpc.hyperliquid.xyz/evm`
- Explorer: `https://purrsec.com/` (Etherscan v2 not supported; use this as fallback)
- Native: **HYPE**, decimals 18.

## To-do (not yet implemented)
- Add Hyperliquid/HyperEVM bridge detection once contract addresses & function signatures are known.
- Currently ignore Jumper Exchange / Hyperunit: medium benefit, medium-high effort (router/aggregator payload decoding).
- Currently ignore HyperLend / HyperSwap dApps: medium benefit, medium effort; requires ABIs/verified addresses to be effective.
