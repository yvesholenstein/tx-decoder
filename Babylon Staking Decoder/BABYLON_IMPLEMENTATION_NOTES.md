# Babylon Staking Address Calculation - Implementation Notes

## Current Status

The babylon-staking-decoder.html file has the UI and workflow complete, as well as the cryptographic calculation for the Babylon staking address with proper implementation of Bitcoin Taproot scripts.

## What was Needed

To properly calculate the Babylon staking address matching the example of `bc1pjujdr7w6lw9k62jq06c5znrnfqwnn3m3ajfcdkfjp83zxl4fn3wqlt7shp`, you need:

### 1. Script Construction
- **Timelock Script**: Staker pubkey + OP_CHECKSIGVERIFY + timelock blocks + OP_CHECKSEQUENCEVERIFY
- **Unbonding Script**: Staker pubkey + covenant multisig (6-of-9)
- **Slashing Script**: Staker + finality provider + covenant multisig (6-of-9)

### 2. Taproot Tree Construction
- Build TapLeaf hashes for each script
- Construct tree: `((timelock, unbonding), slashing)`
- Calculate merkle root

### 3. Cryptographic Operations
- **Tagged SHA256**: Used for TapLeaf, TapBranch, TapTweak
- **secp256k1 Point Addition**: Tweak the internal key with the merkle root
- **Bech32m Encoding**: Convert the tweaked pubkey to bc1p address

## Implementation Options (both implemented)

### Option 1: Use External API (Recommended for Quick Solution)
Call the christophluescher.pythonanywhere.com API:

```javascript
async function computeStakingAddress(params, debugMode) {
    const response = await fetch('https://christophluescher.pythonanywhere.com/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            staker_pubkey: params.stakerPubkey,
            finality_provider_pubkeys: [params.finalityProviderPubkey],
            network: params.network,
            timelock_blocks: params.timelockBlocks,
            covenant_threshold: params.covenantThreshold,
            // ... other params
        })
    });

    const data = await response.json();
    return {
        address: data.final_address,
        scriptType: 'Taproot (P2TR)',
        debug: debugMode ? data : null
    };
}
```

### Option 2: Full Client-Side Implementation
Requires proper Bitcoin libraries:

**Required Libraries:**
- `@noble/secp256k1` - For elliptic curve operations
- `@noble/hashes` - For SHA256 tagged hashing
- `bitcoinjs-lib` - For Bitcoin script operations
- Proper bech32m encoder

**Key Functions Needed:**
1. `taggedHash(tag, data)` - BIP340 tagged hashing
2. `tweakPublicKey(pubkey, tweak)` - secp256k1 point addition
3. `buildTaprootTree(scripts)` - Construct Taproot tree
4. `bech32mEncode(prefix, version, data)` - Address encoding


## Test Vector

**Input:**
- Staker Public Key: `8a762ca4ab2a314e79dbf0e81ed5efa2483f0f52664a4da42ea125b7ed98f4b1`
- Finality Provider: `be2f7942c5dfaa826aec61355ef427fad1095491aa04850c450f812f9b9ca9ed`
- Timelock: 64000 blocks
- Covenant Threshold: 6
- Unbonding Time: 301 blocks

**Expected Output:**
- Address: `bc1pjujdr7w6lw9k62jq06c5znrnfqwnn3m3ajfcdkfjp83zxl4fn3wqlt7shp`
- Output Key: `9724d1f9dafb8b6d2a407eb1414c73481d39c771ec9386d93209e2237ea99c5c`
- Merkle Root: `032218a27dc4626b6d1e1ec52a6bf77dcd86173b3818eba344f47df28202426f`
- Tweak: `5b5d43890f1af3dd414743c961a5098e961549b2c8c0e24893c3fcfd9635a899`


## Current File Status

The `babylon-staking-decoder.html` file contains:
- ✅ Complete UI and workflow
- ✅ All input fields and validation
- ✅ Debug mode toggle
- ✅ Finality provider management
- ✅ All requiered crypto functions 
