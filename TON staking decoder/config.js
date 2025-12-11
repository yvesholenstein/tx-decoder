// App constants and protocol registry (to be expanded)
const APP_VERSION = 'v0.0.1';

// Known protocol identifiers
const PROTOCOLS = {
  NOMINATOR_POOL: 'Nominator Pool',
  TONSTAKERS: 'Tonstakers',
  TON_WHALES: 'TON Whales',
  TRANSFER: 'Transfer',
  UNKNOWN: 'Unknown'
};

// Known addresses (to be filled with real mainnet pools)
// Use canonical friendly format (e.g., EQC... short) and/or raw bounceable form.
const KNOWN_ADDRESSES = {
  nominatorPools: [
    // TODO: add known pool addresses
  ],
  tonstakers: [
    // TODO: add known Tonstakers addresses
  ],
  tonWhales: [
    // TODO: add known TON Whales addresses
  ]
};

// Op codes map (first 32 bits of body) — placeholders, fill with audited values
const OPCODES = {
  nominatorPool: {
    // deposit: 0x00000000,
    // withdraw: 0x00000000,
    // claim: 0x00000000,
  },
  tonstakers: {
    // deposit: 0x00000000,
    // redeem: 0x00000000,
    // claim: 0x00000000,
  },
  tonwhales: {
    // deposit: 0x00000000,
    // redeem: 0x00000000,
    // claim: 0x00000000,
  }
};

// Settings defaults
const DEFAULT_SETTINGS = {
  showAdvanced: true
};
