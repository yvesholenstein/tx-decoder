// Unified Etherscan v2 API endpoint (works across all supported chains)
const ETHERSCAN_V2_API = 'https://api.etherscan.io/v2/api';

// Chain configurations with unified Etherscan v2 API
const CHAIN_CONFIG = {
    ethereum: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        explorerUrl: 'https://etherscan.io',
        rpcUrl: 'https://rpc.flashbots.net/',
        //rpcUrl: 'https://eth.llamarpc.com',
        proxyApiUrl: 'https://api.etherscan.io/api',
        nativeCurrency: { symbol: 'ETH', decimals: 18 }
    },
    arbitrum: {
        name: 'Arbitrum One',
        chainId: 42161,
        explorerUrl: 'https://arbiscan.io',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        proxyApiUrl: 'https://api.arbiscan.io/api',
        nativeCurrency: { symbol: 'ETH', decimals: 18 }
    },
    optimism: {
        name: 'Optimism',
        chainId: 10,
        explorerUrl: 'https://optimistic.etherscan.io',
        rpcUrl: 'https://mainnet.optimism.io',
        proxyApiUrl: 'https://api-optimistic.etherscan.io/api',
        nativeCurrency: { symbol: 'ETH', decimals: 18 }
    },
    base: {
        name: 'Base',
        chainId: 8453,
        explorerUrl: 'https://basescan.org',
        rpcUrl: 'https://mainnet.base.org',
        proxyApiUrl: 'https://api.basescan.org/api',
        nativeCurrency: { symbol: 'ETH', decimals: 18 }
    },
    polygon: {
        name: 'Polygon',
        chainId: 137,
        explorerUrl: 'https://polygonscan.com',
        rpcUrl: 'https://polygon-rpc.com',
        proxyApiUrl: 'https://api.polygonscan.com/api',
        nativeCurrency: { symbol: 'MATIC', decimals: 18 }
    },
    avalanche: {
        name: 'Avalanche C-Chain',
        chainId: 43114,
        explorerUrl: 'https://snowtrace.io',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        proxyApiUrl: 'https://api.snowtrace.io/api',
        nativeCurrency: { symbol: 'AVAX', decimals: 18 }
    },
    bsc: {
        name: 'BNB Smart Chain',
        chainId: 56,
        explorerUrl: 'https://bscscan.com',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        proxyApiUrl: 'https://api.bscscan.com/api',
        nativeCurrency: { symbol: 'BNB', decimals: 18 }
    },
    blast: {
        name: 'Blast',
        chainId: 81457,
        explorerUrl: 'https://blastscan.io',
        rpcUrl: 'https://rpc.blast.io',
        proxyApiUrl: 'https://api.blastscan.io/api',
        nativeCurrency: { symbol: 'ETH', decimals: 18 }
    },
    energywebchain: {
        name: 'Energy Web Chain',
        chainId: 246,
        explorerUrl: 'https://explorer.energyweb.org',
        rpcUrl: 'https://rpc.energyweb.org',
        proxyApiUrl: null,
        nativeCurrency: { symbol: 'EWT', decimals: 18 }
    },
    scroll: {
        name: 'Scroll',
        chainId: 534352,
        explorerUrl: 'https://scrollscan.com',
        rpcUrl: 'https://rpc.scroll.io',
        proxyApiUrl: 'https://api.scrollscan.com/api',
        nativeCurrency: { symbol: 'ETH', decimals: 18 }
    },
    taiko: {
        name: 'Taiko',
        chainId: 167000,
        explorerUrl: 'https://taikoscan.io/',
        rpcUrl: 'https://rpc.mainnet.taiko.xyz',
        proxyApiUrl: 'https://api.taikoscan.io/api',
        nativeCurrency: { symbol: 'TAIKO', decimals: 18 }
    },
    zksync: {
        name: 'zkSync Era',
        chainId: 324,
        explorerUrl: 'https://explorer.zksync.io',
        rpcUrl: 'https://mainnet.era.zksync.io',
        proxyApiUrl: 'https://api-era.zksync.network/api',
        nativeCurrency: { symbol: 'ETH', decimals: 18 }
    }
};

// Multi-chain token database
const TOKEN_DATABASE = {
    ethereum: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
        '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18 },
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', decimals: 8 },
        '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18 },
        '0xb8c77482e45f1f44de1745f52c74426c631bdd52': { symbol: 'BNB', decimals: 18 },
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': { symbol: 'UNI', decimals: 18 },
        '0x514910771af9ca656af840dff83e8264ecf986ca': { symbol: 'LINK', decimals: 18 },
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': { symbol: 'AAVE', decimals: 18 },
        '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6': { symbol: 'POL', decimals: 18 },
        '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': { symbol: 'STETH', decimals: 18 },
        '0x8c1bed5b9a0928467c9b1341da1d7bd5e10b6549': { symbol: 'LSETH', decimals: 18 },
        '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39': { symbol: 'BABY', decimals: 18 }
    },
    arbitrum: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { symbol: 'USDC', decimals: 6 },
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { symbol: 'USDT', decimals: 6 },
        '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': { symbol: 'WETH', decimals: 18 },
        '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': { symbol: 'WBTC', decimals: 8 },
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': { symbol: 'DAI', decimals: 18 },
        '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0': { symbol: 'UNI', decimals: 18 },
        '0xf97f4df75117a78c1a5a0dbb814af92458539fb4': { symbol: 'LINK', decimals: 18 }
    },
    optimism: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0x0b2c639c533813f4aa9d7837caf62653d097ff85': { symbol: 'USDC', decimals: 6 },
        '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': { symbol: 'USDT', decimals: 6 },
        '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },
        '0x68f180fcce6836688e9084f035309e29bf0a2095': { symbol: 'WBTC', decimals: 8 },
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': { symbol: 'DAI', decimals: 18 }
    },
    base: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 },
        '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 },
        '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': { symbol: 'DAI', decimals: 18 }
    },
    energywebchain: {
        '0x0000000000000000000000000000000000000000': { symbol: 'EWT', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'EWT', decimals: 18 }
    },
    polygon: {
        '0x0000000000000000000000000000000000000000': { symbol: 'MATIC', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'MATIC', decimals: 18 },
        '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': { symbol: 'USDC', decimals: 6 },
        '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 },
        '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { symbol: 'WETH', decimals: 18 },
        '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': { symbol: 'WBTC', decimals: 8 },
        '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { symbol: 'DAI', decimals: 18 }
    },
    avalanche: {
        '0x0000000000000000000000000000000000000000': { symbol: 'AVAX', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'AVAX', decimals: 18 },
        '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { symbol: 'USDC', decimals: 6 },
        '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': { symbol: 'USDT', decimals: 6 },
        '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': { symbol: 'WETH', decimals: 18 },
        '0x50b7545627a5162f82a992c33b87adc75187b218': { symbol: 'WBTC', decimals: 8 },
        '0xd586e7f844cea2f87f50152665bcbc2c279d8d70': { symbol: 'DAI', decimals: 18 }
    },
    bsc: {
        '0x0000000000000000000000000000000000000000': { symbol: 'BNB', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'BNB', decimals: 18 },
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18 },
        '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 },
        '0x2170ed0880ac9a755fd29b2688956bd959f933f8': { symbol: 'ETH', decimals: 18 },
        '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': { symbol: 'BTCB', decimals: 18 }
    },
    blast: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0x4300000000000000000000000000000000000003': { symbol: 'USDB', decimals: 18 },
        '0x4300000000000000000000000000000000000004': { symbol: 'WETH', decimals: 18 }
    },
    scroll: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4': { symbol: 'USDC', decimals: 6 },
        '0xf55bec9cafdbe8730f096aa55dad6d22d44099df': { symbol: 'USDT', decimals: 6 },
        '0x5300000000000000000000000000000000000004': { symbol: 'WETH', decimals: 18 }
    },
    zksync: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4': { symbol: 'USDC', decimals: 6 },
        '0x493257fd37edb34451f62edf8d2a0c418852ba4c': { symbol: 'USDT', decimals: 6 },
        '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91': { symbol: 'WETH', decimals: 18 }
    },
    taiko: {
        '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
        '0xa51894664a773981c6c112c43ce576f315d5b1b6': { symbol: 'WETH', decimals: 18 },
        '0xa9d23408b9ba935c230493c40c73824df71a0975': { symbol: 'TAIKO', decimals: 18 },
        '0x07d83526730c7438048d55a4fc0b850e2aab6f0b': { symbol: 'USDC', decimals: 6 },
        '0x9c2dc7377717603eb92b2655c5f2e7997a4945bd': { symbol: 'USDT', decimals: 6 }
    }
};

// Common ABIs for all chains
const COMMON_ABIS = {
    'ERC20': [
        { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" },
        { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" },
        { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }
    ],
    'ERC721': [
        { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "tokenId", "type": "uint256" }], "name": "approve", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" },
        { "constant": false, "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "tokenId", "type": "uint256" }], "name": "safeTransferFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" },
        { "constant": false, "inputs": [{ "name": "operator", "type": "address" }, { "name": "approved", "type": "bool" }], "name": "setApprovalForAll", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" },
        { "constant": false, "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "tokenId", "type": "uint256" }], "name": "transferFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }
    ],
    'UniswapV2Router': [
        { "inputs": [{ "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactETHForTokens", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "payable", "type": "function" },
        { "inputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactTokensForTokens", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "nonpayable", "type": "function" }
    ],
    'UniswapV3Router': [
        { "inputs": [{ "components": [{ "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" }, { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }], "internalType": "struct ISwapRouter.ExactInputSingleParams", "name": "params", "type": "tuple" }], "name": "exactInputSingle", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }], "stateMutability": "payable", "type": "function" }
    ],
    'UniswapUniversalRouter': [
        { "inputs": [{ "internalType": "bytes", "name": "commands", "type": "bytes" }, { "internalType": "bytes[]", "name": "inputs", "type": "bytes[]" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "execute", "outputs": [], "stateMutability": "payable", "type": "function" }
    ],
    'EisenFinance': [
        { "inputs": [{ "components": [{ "internalType": "uint256", "name": "srcAmount", "type": "uint256" }, { "internalType": "uint256", "name": "minReturnAmount", "type": "uint256" }, { "internalType": "uint256", "name": "guaranteedAmount", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "address", "name": "referrer", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "bytes", "name": "distribution", "type": "bytes" }, { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }], "internalType": "struct SwapDescription", "name": "desc", "type": "tuple" }], "name": "swap", "outputs": [{ "internalType": "uint256", "name": "returnAmount", "type": "uint256" }], "stateMutability": "payable", "type": "function" }
    ],
    'PortalForwarder': [
        {
            "inputs": [
                { "internalType": "bytes", "name": "forwarderData", "type": "bytes" },
                { "internalType": "address", "name": "tokenIn", "type": "address" },
                { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                {
                    "components": [
                        { "internalType": "uint256", "name": "fee", "type": "uint256" },
                        { "internalType": "address", "name": "payee", "type": "address" }
                    ], "internalType": "struct FeeArgs", "name": "feeArgs", "type": "tuple"
                }
            ],
            "name": "forwardERC20",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "bytes", "name": "forwarderData", "type": "bytes" },
                {
                    "components": [
                        { "internalType": "uint256", "name": "fee", "type": "uint256" },
                        { "internalType": "address", "name": "payee", "type": "address" }
                    ], "internalType": "struct FeeArgs", "name": "feeArgs", "type": "tuple"
                }
            ],
            "name": "forwardEth",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }
    ],
    'EWCLiftContract': [
        { "type": "constructor", "stateMutability": "nonpayable", "inputs": [] }, { "type": "error", "name": "AddressMismatch", "inputs": [] }, { "type": "error", "name": "AlreadyAdded", "inputs": [] }, { "type": "error", "name": "AuthorsDisabled", "inputs": [] }, { "type": "error", "name": "BadConfirmations", "inputs": [] }, { "type": "error", "name": "BelowMinimumLift", "inputs": [] }, { "type": "error", "name": "CannotChangeT2Key", "inputs": [{ "type": "bytes32", "name": "existingT2PubKey", "internalType": "bytes32" }] }, {
            "type": "error", "name": "InvalidProof",
            "inputs": []
        }, { "type": "error", "name": "InvalidT1Key", "inputs": [] }, { "type": "error", "name": "InvalidT2Key", "inputs": [] }, { "type": "error", "name": "InvalidTxData", "inputs": [] }, { "type": "error", "name": "LiftDisabled", "inputs": [] }, { "type": "error", "name": "LiftFailed", "inputs": [] }, { "type": "error", "name": "LiftLimitHit", "inputs": [] }, { "type": "error", "name": "Locked", "inputs": [] }, { "type": "error", "name": "LowerDisabled", "inputs": [] }, { "type": "error", "name": "LowerIsUsed", "inputs": [] }, { "type": "error", "name": "MissingKeys", "inputs": [] }, { "type": "error", "name": "NotALowerTx", "inputs": [] }, { "type": "error", "name": "NotAnAuthor", "inputs": [] }, { "type": "error", "name": "NotEnoughAuthors", "inputs": [] },
        { "type": "error", "name": "PaymentFailed", "inputs": [] }, { "type": "error", "name": "PendingOwnerOnly", "inputs": [] }, { "type": "error", "name": "RenounceOwnershipDisabled", "inputs": [] }, { "type": "error", "name": "RootHashIsUsed", "inputs": [] }, { "type": "error", "name": "T1AddressInUse", "inputs": [{ "type": "address", "name": "t1Address", "internalType": "address" }] }, { "type": "error", "name": "T2KeyInUse", "inputs": [{ "type": "bytes32", "name": "t2PubKey", "internalType": "bytes32" }] }, { "type": "error", "name": "TxIdIsUsed", "inputs": [] }, { "type": "error", "name": "UnsignedTx", "inputs": [] }, { "type": "error", "name": "WindowExpired", "inputs": [] }, {
            "type": "event", "name": "AdminChanged",
            "inputs": [{ "type": "address", "name": "previousAdmin", "internalType": "address", "indexed": false }, { "type": "address", "name": "newAdmin", "internalType": "address", "indexed": false }], "anonymous": false
        }, { "type": "event", "name": "BeaconUpgraded", "inputs": [{ "type": "address", "name": "beacon", "internalType": "address", "indexed": true }], "anonymous": false }, { "type": "event", "name": "Initialized", "inputs": [{ "type": "uint8", "name": "version", "internalType": "uint8", "indexed": false }], "anonymous": false }, { "type": "event", "name": "LogAuthorAdded", "inputs": [{ "type": "address", "name": "t1Address", "internalType": "address", "indexed": true }, { "type": "bytes32", "name": "t2PubKey", "internalType": "bytes32", "indexed": true }, { "type": "uint32", "name": "t2TxId", "internalType": "uint32", "indexed": true }], "anonymous": false },
        { "type": "event", "name": "LogAuthorRemoved", "inputs": [{ "type": "address", "name": "t1Address", "internalType": "address", "indexed": true }, { "type": "bytes32", "name": "t2PubKey", "internalType": "bytes32", "indexed": true }, { "type": "uint32", "name": "t2TxId", "internalType": "uint32", "indexed": true }], "anonymous": false }, { "type": "event", "name": "LogAuthorsEnabled", "inputs": [{ "type": "bool", "name": "state", "internalType": "bool", "indexed": true }], "anonymous": false }, { "type": "event", "name": "LogDefaultMinimumLift", "inputs": [{ "type": "uint256", "name": "denominator", "internalType": "uint256", "indexed": false }], "anonymous": false }, {
            "type": "event", "name": "LogLegacyLowered", "inputs": [{ "type": "address", "name": "token", "internalType": "address", "indexed": true },
            { "type": "address", "name": "t1Address", "internalType": "address", "indexed": true }, { "type": "bytes32", "name": "t2PubKey", "internalType": "bytes32", "indexed": true }, { "type": "uint256", "name": "amount", "internalType": "uint256", "indexed": false }], "anonymous": false
        }, { "type": "event", "name": "LogLifted", "inputs": [{ "type": "address", "name": "token", "internalType": "address", "indexed": true }, { "type": "bytes32", "name": "t2PubKey", "internalType": "bytes32", "indexed": true }, { "type": "uint256", "name": "amount", "internalType": "uint256", "indexed": false }], "anonymous": false }, { "type": "event", "name": "LogLiftingEnabled", "inputs": [{ "type": "bool", "name": "state", "internalType": "bool", "indexed": true }], "anonymous": false }, {
            "type": "event", "name": "LogLowerClaimed",
            "inputs": [{ "type": "uint32", "name": "lowerId", "internalType": "uint32", "indexed": true }], "anonymous": false
        }, { "type": "event", "name": "LogLowered", "inputs": [{ "type": "uint32", "name": "lowerId", "internalType": "uint32", "indexed": true }, { "type": "address", "name": "token", "internalType": "address", "indexed": true }, { "type": "address", "name": "recipient", "internalType": "address", "indexed": true }, { "type": "uint256", "name": "amount", "internalType": "uint256", "indexed": false }], "anonymous": false }, { "type": "event", "name": "LogLoweringEnabled", "inputs": [{ "type": "bool", "name": "state", "internalType": "bool", "indexed": true }], "anonymous": false }, { "type": "event", "name": "LogMinimumLiftAmount", "inputs": [{ "type": "address", "name": "token", "internalType": "address", "indexed": true }, { "type": "uint256", "name": "amount", "internalType": "uint256", "indexed": false }], "anonymous": false },
        { "type": "event", "name": "LogRootPublished", "inputs": [{ "type": "bytes32", "name": "rootHash", "internalType": "bytes32", "indexed": true }, { "type": "uint32", "name": "t2TxId", "internalType": "uint32", "indexed": true }], "anonymous": false }, { "type": "event", "name": "OwnershipTransferStarted", "inputs": [{ "type": "address", "name": "previousOwner", "internalType": "address", "indexed": true }, { "type": "address", "name": "newOwner", "internalType": "address", "indexed": true }], "anonymous": false }, { "type": "event", "name": "OwnershipTransferred", "inputs": [{ "type": "address", "name": "previousOwner", "internalType": "address", "indexed": true }, { "type": "address", "name": "newOwner", "internalType": "address", "indexed": true }], "anonymous": false }, { "type": "event", "name": "Upgraded", "inputs": [{ "type": "address", "name": "implementation", "internalType": "address", "indexed": true }], "anonymous": false },
        { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "_unused1_", "inputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "acceptOwnership", "inputs": [] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "addAuthor", "inputs": [{ "type": "bytes", "name": "t1PubKey", "internalType": "bytes" }, { "type": "bytes32", "name": "t2PubKey", "internalType": "bytes32" }, { "type": "uint256", "name": "expiry", "internalType": "uint256" }, { "type": "uint32", "name": "t2TxId", "internalType": "uint32" }, { "type": "bytes", "name": "confirmations", "internalType": "bytes" }] }, {
            "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "authorIsActive",
            "inputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }]
        }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "authorsEnabled", "inputs": [] }, {
            "type": "function", "stateMutability": "view", "outputs": [{ "type": "address", "name": "token", "internalType": "address" }, { "type": "uint256", "name": "amount", "internalType": "uint256" }, { "type": "address", "name": "recipient", "internalType": "address" }, { "type": "uint32", "name": "lowerId", "internalType": "uint32" }, { "type": "uint256", "name": "confirmationsRequired", "internalType": "uint256" }, { "type": "uint256", "name": "confirmationsProvided", "internalType": "uint256" }, { "type": "bool", "name": "proofIsValid", "internalType": "bool" }, { "type": "bool", "name": "lowerIsClaimed", "internalType": "bool" }], "name": "checkLower",
            "inputs": [{ "type": "bytes", "name": "proof", "internalType": "bytes" }]
        }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "claimLower", "inputs": [{ "type": "bytes", "name": "proof", "internalType": "bytes" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "confirmTransaction", "inputs": [{ "type": "bytes32", "name": "leafHash", "internalType": "bytes32" }, { "type": "bytes32[]", "name": "merklePath", "internalType": "bytes32[]" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "int8", "name": "", "internalType": "int8" }], "name": "corroborate", "inputs": [{ "type": "uint32", "name": "t2TxId", "internalType": "uint32" }, { "type": "uint256", "name": "expiry", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "defaultMinimumLiftDenominator", "inputs": [] },
        { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "hasLowered", "inputs": [{ "type": "bytes32", "name": "", "internalType": "bytes32" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "address", "name": "", "internalType": "address" }], "name": "idToT1Address", "inputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bytes32", "name": "", "internalType": "bytes32" }], "name": "idToT2PubKey", "inputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "initialize", "inputs": [{ "type": "address[]", "name": "t1Addresses", "internalType": "address[]" }, { "type": "bytes32[]", "name": "t1PubKeysLHS", "internalType": "bytes32[]" }, { "type": "bytes32[]", "name": "t1PubKeysRHS", "internalType": "bytes32[]" }, { "type": "bytes32[]", "name": "t2PubKeys", "internalType": "bytes32[]" }] },
        { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "isAuthor", "inputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "isPublishedRootHash", "inputs": [{ "type": "bytes32", "name": "", "internalType": "bytes32" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "isUsedT2TxId", "inputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "legacyLower", "inputs": [{ "type": "bytes", "name": "leaf", "internalType": "bytes" }, { "type": "bytes32[]", "name": "merklePath", "internalType": "bytes32[]" }] }, {
            "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "lift", "inputs": [{ "type": "address", "name": "token", "internalType": "address" },
            { "type": "bytes", "name": "t2PubKey", "internalType": "bytes" }, { "type": "uint256", "name": "amount", "internalType": "uint256" }]
        }, { "type": "function", "stateMutability": "payable", "outputs": [], "name": "liftEWT", "inputs": [{ "type": "bytes", "name": "t2PubKey", "internalType": "bytes" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "liftingEnabled", "inputs": [] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bool", "name": "", "internalType": "bool" }], "name": "loweringEnabled", "inputs": [] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "minimumLiftAmount", "inputs": [{ "type": "address", "name": "", "internalType": "address" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "nextAuthorId", "inputs": [] }, {
            "type": "function", "stateMutability": "view",
            "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "numActiveAuthors", "inputs": []
        }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "numBytesToLowerData", "inputs": [{ "type": "bytes2", "name": "", "internalType": "bytes2" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "address", "name": "", "internalType": "address" }], "name": "owner", "inputs": [] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "address", "name": "", "internalType": "address" }], "name": "pendingOwner", "inputs": [] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "bytes32", "name": "", "internalType": "bytes32" }], "name": "proxiableUUID", "inputs": [] }, {
            "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "publishRoot",
            "inputs": [{ "type": "bytes32", "name": "rootHash", "internalType": "bytes32" }, { "type": "uint256", "name": "expiry", "internalType": "uint256" }, { "type": "uint32", "name": "t2TxId", "internalType": "uint32" }, { "type": "bytes", "name": "confirmations", "internalType": "bytes" }]
        }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "removeAuthor", "inputs": [{ "type": "bytes32", "name": "t2PubKey", "internalType": "bytes32" }, { "type": "bytes", "name": "t1PubKey", "internalType": "bytes" }, { "type": "uint256", "name": "expiry", "internalType": "uint256" }, { "type": "uint32", "name": "t2TxId", "internalType": "uint32" }, { "type": "bytes", "name": "confirmations", "internalType": "bytes" }] }, { "type": "function", "stateMutability": "view", "outputs": [], "name": "renounceOwnership", "inputs": [] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "setDefaultMinimumLift", "inputs": [{ "type": "uint256", "name": "denominator", "internalType": "uint256" }] },
        { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "setMinimumLiftAmount", "inputs": [{ "type": "address", "name": "token", "internalType": "address" }, { "type": "uint256", "name": "amount", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "t1AddressToId", "inputs": [{ "type": "address", "name": "", "internalType": "address" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "t2PubKeyToId", "inputs": [{ "type": "bytes32", "name": "", "internalType": "bytes32" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "toggleAuthors", "inputs": [{ "type": "bool", "name": "state", "internalType": "bool" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "toggleLifting", "inputs": [{ "type": "bool", "name": "state", "internalType": "bool" }] },
        { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "toggleLowering", "inputs": [{ "type": "bool", "name": "state", "internalType": "bool" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "transferOwnership", "inputs": [{ "type": "address", "name": "newOwner", "internalType": "address" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "upgradeTo", "inputs": [{ "type": "address", "name": "newImplementation", "internalType": "address" }] }, { "type": "function", "stateMutability": "payable", "outputs": [], "name": "upgradeToAndCall", "inputs": [{ "type": "address", "name": "newImplementation", "internalType": "address" }, { "type": "bytes", "name": "data", "internalType": "bytes" }] }
    ],
    'EWCEthereumBridgeContract': [
        { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "target", "type": "address" }], "name": "AddressEmptyCode", "type": "error" },
        { "inputs": [], "name": "AddressIsZero", "type": "error" }, { "inputs": [], "name": "AddressMismatch", "type": "error" }, { "inputs": [], "name": "AlreadyAdded", "type": "error" }, { "inputs": [{ "internalType": "string", "name": "", "type": "string" }, { "internalType": "bool", "name": "", "type": "bool" }], "name": "AlreadyInState", "type": "error" },
        { "inputs": [], "name": "AmountIsZero", "type": "error" }, { "inputs": [], "name": "BadConfirmations", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "CannotChangeT2Key", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "implementation", "type": "address" }], "name": "ERC1967InvalidImplementation", "type": "error" },
        { "inputs": [], "name": "ERC1967NonPayable", "type": "error" }, { "inputs": [], "name": "EnforcedPause", "type": "error" }, { "inputs": [], "name": "ExpectedPause", "type": "error" }, { "inputs": [], "name": "FailedCall", "type": "error" }, { "inputs": [], "name": "InvalidImplementation", "type": "error" }, { "inputs": [], "name": "InvalidInitialization", "type": "error" },
        { "inputs": [], "name": "InvalidProof", "type": "error" }, { "inputs": [], "name": "InvalidT1Key", "type": "error" }, { "inputs": [], "name": "InvalidT2Key", "type": "error" }, { "inputs": [], "name": "InvalidToken", "type": "error" }, { "inputs": [], "name": "LiftFailed", "type": "error" }, { "inputs": [], "name": "LiftLimitHit", "type": "error" }, { "inputs": [], "name": "LiftingDisabled", "type": "error" },
        { "inputs": [], "name": "LowerIsUsed", "type": "error" }, { "inputs": [], "name": "LoweringDisabled", "type": "error" }, { "inputs": [], "name": "MintFailed", "type": "error" }, { "inputs": [], "name": "MissingKeys", "type": "error" }, { "inputs": [], "name": "NotAnAuthor", "type": "error" }, { "inputs": [], "name": "NotEnoughAuthors", "type": "error" }, { "inputs": [], "name": "NotInitializing", "type": "error" },
        { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "inputs": [], "name": "PeriodIsUsed", "type": "error" }, { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
        { "inputs": [], "name": "RootHashIsUsed", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "SafeERC20FailedOperation", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "T1AddressInUse", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "T2KeyInUse", "type": "error" },
        { "inputs": [], "name": "TxIdIsUsed", "type": "error" }, { "inputs": [], "name": "UUPSUnauthorizedCallContext", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "slot", "type": "bytes32" }], "name": "UUPSUnsupportedProxiableUUID", "type": "error" },
        { "inputs": [], "name": "WindowExpired", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint64", "name": "version", "type": "uint64" }], "name": "Initialized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "t1Address", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "indexed": true, "internalType": "uint32", "name": "t2TxId", "type": "uint32" }], "name": "LogAuthorAdded", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "t1Address", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "indexed": true, "internalType": "uint32", "name": "t2TxId", "type": "uint32" }], "name": "LogAuthorRemoved", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": true, "internalType": "uint32", "name": "period", "type": "uint32" }], "name": "LogGrowth", "type": "event" },
        { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }, { "indexed": true, "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "LogLifted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bool", "name": "state", "type": "bool" }], "name": "LogLiftingEnabled", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint32", "name": "lowerId", "type": "uint32" }], "name": "LogLowerClaimed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bool", "name": "state", "type": "bool" }], "name": "LogLoweringEnabled", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }], "name": "LogRemovedFromWhitelist", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "rootHash", "type": "bytes32" }, { "indexed": true, "internalType": "uint32", "name": "t2TxId", "type": "uint32" }], "name": "LogRootPublished", "type": "event" },
        { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint16", "name": "newVersion", "type": "uint16" }, { "indexed": true, "internalType": "address", "name": "implementation", "type": "address" }], "name": "LogVersion", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }], "name": "LogWhitelisted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferStarted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Paused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Unpaused", "type": "event" },
        { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "implementation", "type": "address" }], "name": "Upgraded", "type": "event" }, { "inputs": [], "name": "EWT", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "GROWTH_PER_PERIOD", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "UPGRADE_INTERFACE_VERSION", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "acceptOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, {
            "inputs": [{ "internalType": "bytes", "name": "t1PubKey", "type": "bytes" }, { "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" },
            { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "addAuthor", "outputs": [], "stateMutability": "nonpayable", "type": "function"
        }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "authorIsActive", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "lowerProof", "type": "bytes" }], "name": "checkLower", "outputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint32", "name": "lowerId", "type": "uint32" }, { "internalType": "uint256", "name": "confirmationsRequired", "type": "uint256" }, { "internalType": "uint256", "name": "confirmationsProvided", "type": "uint256" }, { "internalType": "bool", "name": "proofIsValid", "type": "bool" }, { "internalType": "bool", "name": "lowerIsClaimed", "type": "bool" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "bytes", "name": "lowerProof", "type": "bytes" }], "name": "claimLower", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "leafHash", "type": "bytes32" }, { "internalType": "bytes32[]", "name": "merklePath", "type": "bytes32[]" }], "name": "confirmTransaction", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "contractVersion", "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }], "name": "corroborate", "outputs": [{ "internalType": "int8", "name": "", "type": "int8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }], "name": "growthAmount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "hasLowered", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "idToT1Address", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "idToT2PubKey", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "ewt", "type": "address" }, { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address[]", "name": "t1Addresses", "type": "address[]" }, { "internalType": "bytes32[]", "name": "t1PubKeysLHS", "type": "bytes32[]" }, { "internalType": "bytes32[]", "name": "t1PubKeysRHS", "type": "bytes32[]" }, { "internalType": "bytes32[]", "name": "t2PubKeys", "type": "bytes32[]" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "isAuthor", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "isPublishedRootHash", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "isUsedT2TxId", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "lift", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "liftingEnabled", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "loweringEnabled", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
        { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "pure", "type": "function" }, { "inputs": [], "name": "nextAuthorId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "numActiveAuthors", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "paused", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pendingOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "permitLift", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "proxiableUUID", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "rootHash", "type": "bytes32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "publishRoot", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "bytes", "name": "t1PubKey", "type": "bytes" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "removeAuthor", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "removeFromWhitelist", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "t1AddressToId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "t2PubKeyToId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "bool", "name": "state", "type": "bool" }], "name": "toggleLifting", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bool", "name": "state", "type": "bool" }], "name": "toggleLowering", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "tokenIsWhitelisted", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "rewards", "type": "uint256" }, { "internalType": "uint256", "name": "avgStaked", "type": "uint256" }, { "internalType": "uint32", "name": "period", "type": "uint32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "triggerGrowth", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newImplementation", "type": "address" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "upgradeToAndCall", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "whitelistToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
    ],
    'Aave': [
        { "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "onBehalfOf", "type": "address" }, { "internalType": "uint16", "name": "referralCode", "type": "uint16" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }], "name": "withdraw", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "interestRateMode", "type": "uint256" }, { "internalType": "uint16", "name": "referralCode", "type": "uint16" }, { "internalType": "address", "name": "onBehalfOf", "type": "address" }], "name": "borrow", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint16", "name": "newVersion", "type": "uint16" }, { "indexed": true, "internalType": "address", "name": "implementation", "type": "address" }], "name": "LogVersion", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }], "name": "LogWhitelisted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferStarted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Paused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Unpaused", "type": "event" },
        { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "implementation", "type": "address" }], "name": "Upgraded", "type": "event" }, { "inputs": [], "name": "EWT", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "GROWTH_PER_PERIOD", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "UPGRADE_INTERFACE_VERSION", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "acceptOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, {
            "inputs": [{ "internalType": "bytes", "name": "t1PubKey", "type": "bytes" }, { "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" },
            { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "addAuthor", "outputs": [], "stateMutability": "nonpayable", "type": "function"
        }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "authorIsActive", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "lowerProof", "type": "bytes" }], "name": "checkLower", "outputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint32", "name": "lowerId", "type": "uint32" }, { "internalType": "uint256", "name": "confirmationsRequired", "type": "uint256" }, { "internalType": "uint256", "name": "confirmationsProvided", "type": "uint256" }, { "internalType": "bool", "name": "proofIsValid", "type": "bool" }, { "internalType": "bool", "name": "lowerIsClaimed", "type": "bool" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "bytes", "name": "lowerProof", "type": "bytes" }], "name": "claimLower", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "leafHash", "type": "bytes32" }, { "internalType": "bytes32[]", "name": "merklePath", "type": "bytes32[]" }], "name": "confirmTransaction", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "contractVersion", "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }], "name": "corroborate", "outputs": [{ "internalType": "int8", "name": "", "type": "int8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }], "name": "growthAmount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "hasLowered", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "idToT1Address", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "idToT2PubKey", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "ewt", "type": "address" }, { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address[]", "name": "t1Addresses", "type": "address[]" }, { "internalType": "bytes32[]", "name": "t1PubKeysLHS", "type": "bytes32[]" }, { "internalType": "bytes32[]", "name": "t1PubKeysRHS", "type": "bytes32[]" }, { "internalType": "bytes32[]", "name": "t2PubKeys", "type": "bytes32[]" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "isAuthor", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "isPublishedRootHash", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "isUsedT2TxId", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "lift", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "liftingEnabled", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "loweringEnabled", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
        { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "pure", "type": "function" }, { "inputs": [], "name": "nextAuthorId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "numActiveAuthors", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "paused", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pendingOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "permitLift", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "proxiableUUID", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "rootHash", "type": "bytes32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "publishRoot", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "bytes32", "name": "t2PubKey", "type": "bytes32" }, { "internalType": "bytes", "name": "t1PubKey", "type": "bytes" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "removeAuthor", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "removeFromWhitelist", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "t1AddressToId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "t2PubKeyToId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "bool", "name": "state", "type": "bool" }], "name": "toggleLifting", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bool", "name": "state", "type": "bool" }], "name": "toggleLowering", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "tokenIsWhitelisted", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "rewards", "type": "uint256" }, { "internalType": "uint256", "name": "avgStaked", "type": "uint256" }, { "internalType": "uint32", "name": "period", "type": "uint32" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint32", "name": "t2TxId", "type": "uint32" }, { "internalType": "bytes", "name": "confirmations", "type": "bytes" }], "name": "triggerGrowth", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newImplementation", "type": "address" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "upgradeToAndCall", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "whitelistToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
    ],
    'Aave': [
        { "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "onBehalfOf", "type": "address" }, { "internalType": "uint16", "name": "referralCode", "type": "uint16" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }], "name": "withdraw", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "interestRateMode", "type": "uint256" }, { "internalType": "uint16", "name": "referralCode", "type": "uint16" }, { "internalType": "address", "name": "onBehalfOf", "type": "address" }], "name": "borrow", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "rateMode", "type": "uint256" }, { "internalType": "address", "name": "onBehalfOf", "type": "address" }], "name": "repay", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }
    ]
};

// Uniswap Universal Router command mappings
const UNISWAP_COMMANDS = {
    '0x00': 'V3_SWAP_EXACT_IN',
    '0x01': 'V3_SWAP_EXACT_OUT',
    '0x02': 'PERMIT2_TRANSFER_FROM',
    '0x03': 'PERMIT2_PERMIT_BATCH',
    '0x04': 'SWEEP',
    '0x05': 'TRANSFER',
    '0x06': 'PAY_PORTION',
    '0x08': 'V2_SWAP_EXACT_IN',
    '0x09': 'V2_SWAP_EXACT_OUT',
    '0x0a': 'PERMIT2_PERMIT',
    '0x0b': 'WRAP_ETH',
    '0x0c': 'UNWRAP_WETH',
    '0x0d': 'PERMIT2_TRANSFER_FROM_BATCH',
    '0x10': 'V4_SWAP',
    '0x11': 'V3_POSITION_MANAGER_PERMIT',
    '0x12': 'V3_POSITION_MANAGER_CALL'
};

let currentChain = 'ethereum';
let settings = { formatAmounts: true, showUSD: false, customRpcUrls: {} };
let priceCache = {};

// Address Book Management
const ADDRESS_BOOK_KEY = 'evm_decoder_address_book';

function getAddressBook() {
    try {
        const stored = localStorage.getItem(ADDRESS_BOOK_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error('Failed to load address book', e);
        return {};
    }
}

function saveAddressBook(book) {
    try {
        localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(book));
    } catch (e) {
        console.error('Failed to save address book', e);
    }
}

function addToAddressBook(address, label) {
    if (!address || !label) return;
    const book = getAddressBook();
    book[address.toLowerCase()] = { label, timestamp: Date.now() };
    saveAddressBook(book);
}

function removeFromAddressBook(address) {
    if (!address) return;
    const book = getAddressBook();
    delete book[address.toLowerCase()];
    saveAddressBook(book);
}

function getAddressLabel(address) {
    if (!address) return null;
    const book = getAddressBook();
    return book[address.toLowerCase()];
}
