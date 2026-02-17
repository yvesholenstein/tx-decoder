// HTML escaping utility to prevent XSS via innerHTML (fallback if ui.js not loaded first)
if (typeof escapeHtml !== 'function') {
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Suppress console warnings
(function () {
    const originalWarn = console.warn;
    console.warn = function (...args) {
        const message = args.join(' ');
        if (message.includes('initEternlDomAPI')) return;
        originalWarn.apply(console, args);
    };
})();

// Ensure debug settings are available (config.js may define DEBUG_SETTINGS)
if (typeof window !== 'undefined') {
    if (!window.DEBUG_SETTINGS && typeof DEBUG_SETTINGS !== 'undefined') {
        window.DEBUG_SETTINGS = DEBUG_SETTINGS;
    }
}

function debugLog(topic, ...args) {
    try {
        const cfg = (typeof window !== 'undefined' && window.DEBUG_SETTINGS)
            ? window.DEBUG_SETTINGS
            : (typeof DEBUG_SETTINGS !== 'undefined' ? DEBUG_SETTINGS : null);
        if (!cfg) return;
        if (cfg[topic] || cfg.all) {
            console.log(`[debug:${topic}]`, ...args);
        }
    } catch (_) { }
}

// Format number with thousands separators (using apostrophe)
function formatWithCommas(numStr) {
    try {
        // Handle decimal numbers
        const parts = numStr.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1];

        // Add apostrophes to integer part as thousands separator
        const withSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

        // Return with decimal part if it exists
        return decimalPart !== undefined ? `${withSeparators}.${decimalPart}` : withSeparators;
    } catch (e) {
        return numStr;
    }
}

function formatValueForLedger(rawValue) {
    if (!rawValue || !rawValue.startsWith('0x')) return null;
    try {
        const normalized = rawValue.slice(2).padStart(rawValue.length % 64 === 0 ? rawValue.length : Math.ceil(rawValue.length / 2) * 2, '0');
        const bytes = normalized.match(/.{1,2}/g) || [];
        return bytes.map(b => b.toUpperCase()).join(':');
    } catch (e) {
        return null;
    }
}

// Minimal Base58 encoder for SS58 addresses
function base58Encode(bytes) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const digits = [0];
    for (let i = 0; i < bytes.length; ++i) {
        let carry = bytes[i];
        for (let j = 0; j < digits.length; ++j) {
            carry += digits[j] << 8;
            digits[j] = carry % 58;
            carry = (carry / 58) | 0;
        }
        while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
        }
    }
    for (let k = 0; k < bytes.length && bytes[k] === 0; k++) {
        digits.push(0);
    }
    return digits.reverse().map(d => alphabet[d]).join('');
}

// Lightweight blake2b (fixed 64-byte output), adapted from blakejs (MIT)
const BLAKE2B_IV32 = new Uint32Array([
    0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b,
    0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f,
    0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179
]);
const SIGMA8 = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
    11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
    7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
    9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
    2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
    12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
    13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
    6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
    10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3
];
function ROTR64(x) {
    return ((x >>> 16) | (x << 16)) >>> 0;
}
function B2B_G(v, a, b, c, d, x, y) {
    v[a] = (v[a] + v[b] + x) >>> 0;
    v[d] = ROTR64(v[d] ^ v[a]);
    v[c] = (v[c] + v[d]) >>> 0;
    v[b] = ROTR64(v[b] ^ v[c]);
    v[a] = (v[a] + v[b] + y) >>> 0;
    v[d] = ROTR64(v[d] ^ v[a]);
    v[c] = (v[c] + v[d]) >>> 0;
    v[b] = ROTR64(v[b] ^ v[c]);
}
function compress(ctx, last) {
    const v = new Uint32Array(32);
    const m = new Uint32Array(32);
    for (let i = 0; i < 16; i++) {
        v[i] = ctx.h[i];
        v[i + 16] = BLAKE2B_IV32[i];
    }
    v[24] ^= ctx.t;
    v[25] ^= ctx.t / 0x100000000;
    if (last) {
        v[28] = ~v[28];
        v[29] = ~v[29];
    }
    for (let i = 0; i < 16; i++) {
        m[i] = ctx.b[i * 2] + (ctx.b[i * 2 + 1] << 8);
        m[i + 16] = ctx.b[i * 2 + 32] + (ctx.b[i * 2 + 33] << 8);
    }
    for (let i = 0; i < 12; i++) {
        const s = i * 16;
        B2B_G(v, 0, 8, 16, 24, m[SIGMA8[s + 0]], m[SIGMA8[s + 1]]);
        B2B_G(v, 1, 9, 17, 25, m[SIGMA8[s + 2]], m[SIGMA8[s + 3]]);
        B2B_G(v, 2, 10, 18, 26, m[SIGMA8[s + 4]], m[SIGMA8[s + 5]]);
        B2B_G(v, 3, 11, 19, 27, m[SIGMA8[s + 6]], m[SIGMA8[s + 7]]);
        B2B_G(v, 4, 12, 20, 28, m[SIGMA8[s + 8]], m[SIGMA8[s + 9]]);
        B2B_G(v, 5, 13, 21, 29, m[SIGMA8[s + 10]], m[SIGMA8[s + 11]]);
        B2B_G(v, 6, 14, 22, 30, m[SIGMA8[s + 12]], m[SIGMA8[s + 13]]);
        B2B_G(v, 7, 15, 23, 31, m[SIGMA8[s + 14]], m[SIGMA8[s + 15]]);
        B2B_G(v, 0, 12, 24, 16, m[SIGMA8[s + 1]], m[SIGMA8[s + 2]]);
        B2B_G(v, 1, 13, 25, 17, m[SIGMA8[s + 3]], m[SIGMA8[s + 4]]);
        B2B_G(v, 2, 14, 26, 18, m[SIGMA8[s + 5]], m[SIGMA8[s + 6]]);
        B2B_G(v, 3, 15, 27, 19, m[SIGMA8[s + 7]], m[SIGMA8[s + 8]]);
        B2B_G(v, 4, 8, 20, 28, m[SIGMA8[s + 9]], m[SIGMA8[s + 10]]);
        B2B_G(v, 5, 9, 21, 29, m[SIGMA8[s + 11]], m[SIGMA8[s + 12]]);
        B2B_G(v, 6, 10, 22, 30, m[SIGMA8[s + 13]], m[SIGMA8[s + 14]]);
        B2B_G(v, 7, 11, 23, 31, m[SIGMA8[s + 15]], m[SIGMA8[s + 0]]);
    }
    for (let i = 0; i < 16; i++) {
        ctx.h[i] ^= v[i] ^ v[i + 16];
    }
}
function blake2b(input, outlen = 64) {
    const ctx = {
        h: new Uint32Array(BLAKE2B_IV32),
        b: new Uint8Array(128),
        c: 0,
        t: 0
    };
    ctx.h[0] ^= 0x01010000 ^ outlen;
    const update = (arr) => {
        for (let i = 0; i < arr.length; i++) {
            if (ctx.c === 128) {
                ctx.t += ctx.c;
                compress(ctx, false);
                ctx.c = 0;
            }
            ctx.b[ctx.c++] = arr[i];
        }
    };
    const finish = () => {
        ctx.t += ctx.c;
        while (ctx.c < 128) ctx.b[ctx.c++] = 0;
        compress(ctx, true);
    };
    update(input);
    finish();
    const out = new Uint8Array(outlen);
    for (let i = 0; i < outlen; i++) {
        out[i] = ctx.h[i >> 2] >> (8 * (i & 3));
    }
    return out;
}

function bytes32ToSS58(hexValue, prefix = 42) {
    try {
        const pubkey = ethers.utils.arrayify(hexValue);
        if (pubkey.length !== 32) return null;

        let prefixBytes;
        if (prefix < 64) {
            prefixBytes = new Uint8Array([prefix]);
        } else {
            prefixBytes = new Uint8Array([
                ((prefix & 0b1111100000) >> 2) | 0b01000000 | (prefix & 0b00000011),
                (prefix >> 8) & 0xff
            ]);
        }

        const data = new Uint8Array(prefixBytes.length + pubkey.length);
        data.set(prefixBytes);
        data.set(pubkey, prefixBytes.length);

        const ss58Prefix = ethers.utils.toUtf8Bytes('SS58PRE');
        const checksumInput = new Uint8Array(ss58Prefix.length + data.length);
        checksumInput.set(ss58Prefix);
        checksumInput.set(data, ss58Prefix.length);

        const checksum = blake2b(checksumInput, 64).slice(0, 2);
        const addressBytes = new Uint8Array(data.length + 2);
        addressBytes.set(data);
        addressBytes.set(checksum, data.length);

        return base58Encode(addressBytes);
    } catch (e) {
        return null;
    }
}

// Convert bytes32 (or 32-byte hex) to Base58 (Solana-style) for display
function bytes32ToBase58(hexValue) {
    try {
        const bytes = ethers.utils.arrayify(hexValue);
        if (bytes.length !== 32) return null;
        return base58Encode(bytes);
    } catch (_) {
        return null;
    }
}

// Decode 32-byte chunks from a hex payload into candidate Base58 pubkeys (Solana-style)
function extractSolanaPubkeysFromBytes(hexPayload) {
    const results = [];
    if (!hexPayload || typeof hexPayload !== 'string' || !hexPayload.startsWith('0x')) return results;
    try {
        const bytes = ethers.utils.arrayify(hexPayload);
        for (let i = 0; i + 32 <= bytes.length; i += 32) {
            const chunk = bytes.slice(i, i + 32);
            try {
                const b58 = base58Encode(chunk);
                results.push(b58);
            } catch (_) { /* ignore invalid */ }
        }
    } catch (_) { }
    return Array.from(new Set(results)); // unique
}

function getHexValueForParam(paramDefinition, value) {
    if (value === undefined || value === null) return null;
    try {
        const paramType = (ethers?.utils?.ParamType?.from && paramDefinition)
            ? ethers.utils.ParamType.from(paramDefinition)
            : paramDefinition;
        if (!paramType || !ethers?.utils?.defaultAbiCoder) return null;
        return ethers.utils.defaultAbiCoder.encode([paramType], [value]);
    } catch (encodeError) {
        try {
            if (ethers.BigNumber.isBigNumber(value)) {
                return ethers.utils.hexlify(value);
            }
            if (typeof value === 'number') {
                return ethers.utils.hexlify(value);
            }
            if (typeof value === 'boolean') {
                return value ? '0x01' : '0x00';
            }
            if (typeof value === 'string') {
                if (value.startsWith('0x')) return value;
                return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(value));
            }
            if (value instanceof Uint8Array) {
                return ethers.utils.hexlify(value);
            }
        } catch (fallbackError) {
            console.warn('Fallback hex encoding failed:', fallbackError);
        }
        console.warn('Unable to encode parameter for raw hex display:', encodeError);
        return null;
    }
}

// Get current chain configuration
function getCurrentChain() {
    return CHAIN_CONFIG[currentChain];
}

function getEffectiveRpcUrl() {
    if (settings?.customRpcUrls && settings.customRpcUrls[currentChain]) {
        return settings.customRpcUrls[currentChain];
    }
    const chain = getCurrentChain();
    return chain?.rpcUrl;
}

function isSimulationEnabled(mode) {
    const el = document.getElementById(`simulate-toggle-${mode}`);
    return el ? el.checked : false;
}

function extractRevertReason(error) {
    try {
        const data = error?.error?.data || error?.data;
        if (typeof data === 'string' && data.startsWith('0x08c379a0') && data.length >= 138) {
            const reasonHex = '0x' + data.slice(10);
            const [reason] = ethers.utils.defaultAbiCoder.decode(['string'], reasonHex);
            return reason;
        }
    } catch (_) { }
    const message = error?.error?.message || error?.message;
    return message || 'Reverted (no reason provided)';
}

async function runDeterministicSimulation(params) {
    const rpcUrl = getEffectiveRpcUrl();
    if (!rpcUrl) {
        return { status: 'error', message: 'No RPC URL configured for this chain.' };
    }
    if (!params?.to || !params?.data) {
        return { status: 'error', message: 'Missing contract address or transaction data for simulation.' };
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const callRequest = {
        to: params.to,
        data: params.data
    };

    try {
        if (params.value !== undefined && params.value !== null) {
            const valueBn = ethers.BigNumber.from(params.value);
            if (!valueBn.isZero()) {
                callRequest.value = valueBn.toHexString();
            }
        }
    } catch (_) { }

    if (params.from) {
        callRequest.from = params.from;
    }

    let gasEstimate = null;
    try {
        gasEstimate = await provider.estimateGas(callRequest);
    } catch (_) { }

    try {
        const returnData = await provider.call(callRequest);
        return { status: 'success', gasEstimate, returnData, rpcUrl };
    } catch (callError) {
        return {
            status: 'reverted',
            gasEstimate,
            returnData: callError?.data || callError?.error?.data,
            revertReason: extractRevertReason(callError),
            rpcUrl
        };
    }
}

function renderSimulationBlock(result, targetAddress) {
    if (!result) return '';
    const statusClass = result.status === 'success' ? 'success' : (result.status === 'reverted' ? 'error' : 'warning');
    const statusLabel = result.status === 'success' ? 'Success' : (result.status === 'reverted' ? 'Reverted' : 'Error');
    const gasText = result.gasEstimate ? ethers.BigNumber.from(result.gasEstimate).toString() : 'N/A';
    const lines = [];

    if (result.status === 'success') {
        lines.push('eth_call succeeded (dry-run only; no state persisted).');
        if (result.returnData && result.returnData !== '0x') {
            lines.push(`Return data: ${result.returnData.slice(0, 74)}${result.returnData.length > 74 ? '...' : ''}`);
        }
    } else if (result.status === 'reverted') {
        lines.push(`Revert reason: ${result.revertReason || 'Unknown'}`);
        if (result.returnData && typeof result.returnData === 'string') {
            lines.push(`Return data: ${result.returnData.slice(0, 74)}${result.returnData.length > 74 ? '...' : ''}`);
        }
    } else {
        lines.push(result.message || 'Simulation unavailable.');
    }

    const rpcLine = result.rpcUrl ? `<div class="small-text">RPC: ${result.rpcUrl}</div>` : '';
    return `<div class="info-row">
        <div class="info-label">Simulation (eth_call)
            <span class="tooltip-container" style="margin-left:6px;">
                <span class="tooltip-icon">?</span>
                <span class="tooltip-text">
                    This dry-run checks the function exists, calldata is well-formed, and the chain would accept it with the shown gas estimate.
                    Return data confirms the call completed without revert. It is a sanity check only—no state is changed.
                </span>
            </span>
        </div>
        <div class="info-value">
            <div class="simulation-box">
                <div><span class="status-pill ${statusClass}">${statusLabel}</span>Target: ${targetAddress}</div>
                <div>Gas estimate: ${gasText}</div>
                ${lines.map(line => `<div>${line}</div>`).join('')}
                ${rpcLine}
            </div>
        </div>
    </div>`;
}

async function fetchErc20InfoWithRpc(tokenAddress) {
    const tokenInfo = getTokenInfo(tokenAddress);
    if (tokenInfo) return tokenInfo;
    const fetched = await fetchTokenDecimals(tokenAddress);
    if (fetched) return { symbol: fetched.symbol, decimals: fetched.decimals };
    return null;
}

async function getErc20Balance(provider, tokenAddress, owner) {
    try {
        const contract = new ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)'], provider);
        return await contract.balanceOf(owner);
    } catch (_) {
        return null;
    }
}

async function getErc20Allowance(provider, tokenAddress, owner, spender) {
    try {
        const contract = new ethers.Contract(tokenAddress, ['function allowance(address,address) view returns (uint256)'], provider);
        return await contract.allowance(owner, spender);
    } catch (_) {
        return null;
    }
}

async function buildAssetImpact(decoded, options) {
    const owner = options.senderAddress;
    if (!owner || !ethers.utils.isAddress(owner)) return null;

    const rpcUrl = getEffectiveRpcUrl();
    if (!rpcUrl) {
        return { html: `<div class=\"simulation-box\"><span class=\"status-pill warning\">Skipped</span>No RPC configured for balance impact.</div>` };
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const impacts = [];

    const chainInfo = getCurrentChain();
    const nativeSymbol = chainInfo?.nativeCurrency?.symbol || chainInfo?.nativeSymbol || 'ETH';

    try {
        const nativeBefore = await provider.getBalance(owner);
        const nativeValue = options.txMeta?.value || decoded.value || ethers.BigNumber.from(0);
        if (nativeValue && !ethers.BigNumber.from(nativeValue).isZero()) {
            const after = nativeBefore.sub(nativeValue);
            impacts.push({
                type: 'native',
                symbol: nativeSymbol,
                before: nativeBefore,
                delta: ethers.BigNumber.from(nativeValue).mul(-1),
                after
            });
        }
    } catch (_) { }

    const fn = (decoded.functionName || '').toLowerCase();
    const args = decoded.args || [];

    if (fn === 'transfer' && args.length >= 2 && decoded.contractAddress) {
        const amount = ethers.BigNumber.from(args[1]);
        impacts.push({ type: 'erc20-transfer', token: decoded.contractAddress, amount });
    }

    if (fn.includes('approve') && args.length >= 2 && decoded.contractAddress) {
        const spender = args[0];
        const amount = ethers.BigNumber.from(args[1]);
        impacts.push({ type: 'erc20-approve', token: decoded.contractAddress, spender, amount });
    }

    // Circle/Portal CCTP burn: count USDC outflow even though value is burned
    if (decoded.signature === 'send((uint256,uint16,uint32,bytes32,address,bytes32,uint256,uint256,uint256,address,bytes,bytes))' && args.length >= 1) {
        const payload = args[0];
        if (payload?.amount) {
            impacts.push({ type: 'erc20-transfer', token: CIRCLE_USDC, amount: ethers.BigNumber.from(payload.amount) });
        }
    }
    if (fn === 'depositforburn' && args.length >= 2) {
        // Support both Circle CCTP depositForBurn overloads:
        // v1: depositForBurn(address burnToken, uint256 amount, ...)
        // v2: depositForBurn(uint256 amount, uint16 dstChain, uint32 dstDomain, bytes32 mintRecipient, address burnToken, ...)
        let burnToken = null;
        let amount = null;
        if (args.length >= 5 && !ethers.utils.isAddress(args[0]) && ethers.utils.isAddress(args[4])) {
            amount = args[0];
            burnToken = args[4];
        } else {
            burnToken = args[0];
            amount = args[1];
        }
        debugLog('balanceImpact', 'depositForBurn detected', { burnToken, amount: amount?.toString?.() });
        impacts.push({ type: 'erc20-transfer', token: burnToken || CIRCLE_USDC, amount: ethers.BigNumber.from(amount) });
    } else if (decoded.signature && decoded.signature.toLowerCase().startsWith('depositforburn(') && args.length >= 1) {
        // Fallback: force-count burn amount even if functionName parsing failed
        try {
            let burnToken = null;
            let amount = null;
            if (args.length >= 5 && ethers.utils.isAddress(args[4])) {
                amount = args[0];
                burnToken = args[4];
            } else if (args.length >= 2) {
                burnToken = args[0];
                amount = args[1];
            }
            if (amount) {
                debugLog('balanceImpact', 'depositForBurn fallback detected', { burnToken, amount: amount?.toString?.() });
                impacts.push({
                    type: 'erc20-transfer',
                    token: burnToken || CIRCLE_USDC,
                    amount: ethers.BigNumber.from(amount),
                    note: 'Circle CCTP burn detected.'
                });
            }
        } catch (_) { /* ignore */ }
    }

    // Heuristic: contract is not an ERC-20, but params look like (token address + amount) and could spend via allowance
    if (!impacts.some(i => i.type === 'erc20-transfer')) {
        let tokenAddress = null;
        let amountCandidate = null;

        if (decoded.fragment && Array.isArray(decoded.fragment.inputs)) {
            decoded.fragment.inputs.forEach((input, idx) => {
                const v = args[idx];
                if (!tokenAddress && input.type === 'address' && getTokenInfo(v)) {
                    tokenAddress = v;
                }
                if (!amountCandidate && input.type.startsWith('uint')) {
                    try {
                        const bn = ethers.BigNumber.from(v);
                        if (!bn.isZero()) amountCandidate = bn;
                    } catch (_) { }
                }
            });
        }

        // Fallback scan if ABI metadata missing
        if (!tokenAddress) {
            for (const v of args) {
                if (typeof v === 'string' && ethers.utils.isAddress(v) && getTokenInfo(v)) {
                    tokenAddress = v;
                    break;
                }
            }
        }
        if (!amountCandidate) {
            for (const v of args) {
                try {
                    const bn = ethers.BigNumber.from(v);
                    if (!bn.isZero()) { amountCandidate = bn; break; }
                } catch (_) { }
            }
        }

        if (tokenAddress && amountCandidate) {
            impacts.push({
                type: 'erc20-transfer',
                token: tokenAddress,
                amount: amountCandidate,
                note: 'Heuristic: call likely spends approved tokens from your wallet.'
            });
        }
    }

    // Heuristic: if the contract itself is an ERC-20 and we have a numeric arg, surface a possible outflow
    if (!impacts.some(i => i.type === 'erc20-transfer') && decoded.contractAddress) {
        const tokenInfo = getTokenInfo(decoded.contractAddress);
        if (tokenInfo) {
            const candidate = args.find(a => {
                try { return ethers.BigNumber.isBigNumber(a) || a?._isBigNumber || typeof a === 'number' || (typeof a === 'string' && a !== '' && !isNaN(a)); } catch (_) { return false; }
            });
            if (candidate !== undefined) {
                try {
                    const amt = ethers.BigNumber.from(candidate);
                    impacts.push({ type: 'erc20-transfer', token: decoded.contractAddress, amount: amt, note: 'Heuristic: contract is ERC-20; showing possible token outflow.' });
                } catch (_) { /* ignore */ }
            }
        }
    }

    if (impacts.length === 0 && args.length >= 2 && ethers.utils.isAddress(args[0]) && decoded.fragment?.inputs?.[0]?.type === 'address') {
        try {
            const amt = ethers.BigNumber.from(args[1]);
            impacts.push({ type: 'erc20-transfer', token: args[0], amount: amt });
        } catch (_) { }
    }

    if (impacts.length === 0) {
        const html = `<div class=\"info-row\">
            <div class=\"info-label\">Balance & Allowance Impact</div>
            <div class=\"info-value\">
                <div class=\"simulation-box\">
                    <div><span class=\"status-pill warning\">No change detected</span>No direct balance or allowance changes were inferred for ${owner} from the decoded parameters.</div>
                    <div class=\"small-text\">If the call moves value in a nested way the static analysis may miss it.</div>
                </div>
            </div>
        </div>`;
        return { html };
    }

    const rows = [];
    for (const impact of impacts) {
        if (impact.type === 'native') {
            const symbol = impact.symbol;
            const deltaAbs = impact.delta.abs();
            const changeLine = `Change: -${formatWithCommas(ethers.utils.formatEther(deltaAbs))} ${symbol}`;
            rows.push({
                title: `Native Outflow (${symbol})`,
                details: [
                    `Before: ${formatWithCommas(ethers.utils.formatEther(impact.before))} ${symbol}`,
                    deltaAbs.isZero() ? changeLine : `<span class="impact-change-highlight">${changeLine}</span>`,
                    `After: ${formatWithCommas(ethers.utils.formatEther(impact.after))} ${symbol}`
                ]
            });
        } else if (impact.type === 'erc20-transfer') {
            const info = await fetchErc20InfoWithRpc(impact.token);
            const decimals = info?.decimals ?? 18;
            const symbol = info?.symbol || 'TOKEN';
            const before = await getErc20Balance(provider, impact.token, owner);
            const delta = impact.amount.mul(-1);
            const after = before ? before.add(delta) : null;
            const changeLine = `Change: -${formatWithCommas(ethers.utils.formatUnits(impact.amount, decimals))} ${symbol}`;
            rows.push({
                title: `Token Outflow (${symbol})`,
                details: [
                    `Token: ${impact.token}`,
                    `Before: ${before ? formatWithCommas(ethers.utils.formatUnits(before, decimals)) : 'N/A'} ${symbol}`,
                    impact.amount.isZero() ? changeLine : `<span class="impact-change-highlight">${changeLine}</span>`,
                    `After: ${after ? formatWithCommas(ethers.utils.formatUnits(after, decimals)) : 'N/A'} ${symbol}`,
                    impact.note ? `<span class="small-text">${impact.note}</span>` : ''
                ]
            });
        } else if (impact.type === 'erc20-approve') {
            const info = await fetchErc20InfoWithRpc(impact.token);
            const decimals = info?.decimals ?? 18;
            const symbol = info?.symbol || 'TOKEN';
            const before = await getErc20Allowance(provider, impact.token, owner, impact.spender);
            const after = ethers.BigNumber.from(impact.amount);
            rows.push({
                title: `Allowance Change (${symbol})`,
                details: [
                    `Token: ${impact.token}`,
                    `Spender: ${impact.spender}`,
                    `Before: ${before ? formatWithCommas(ethers.utils.formatUnits(before, decimals)) : 'N/A'} ${symbol}`,
                    `After: ${formatWithCommas(ethers.utils.formatUnits(after, decimals))} ${symbol}`,
                    after.gte(ethers.constants.MaxUint256.div(2)) ? 'Warning: Unlimited/very large approval' : ''
                ]
            });
        }
    }

    const html = `<div class=\"info-row\">
        <div class=\"info-label\">Balance & Allowance Impact</div>
        <div class=\"info-value\">
            <div class=\"simulation-box\">
                ${rows.map(r => `<div style=\"margin-bottom:10px;\">
                    <strong>${r.title}</strong><br>
                    ${r.details.filter(Boolean).map(d => `<div>${d}</div>`).join('')}
                </div>`).join('')}
                <div class=\"small-text\">Calculated for wallet: ${owner}</div>
            </div>
        </div>
    </div>`;

    return { html };
}

function getSavedApiKey() {
    const input = document.getElementById('api-key');
    if (input && input.value.trim()) return input.value.trim();
    const saved = localStorage.getItem('etherscanApiKey');
    return saved ? saved.trim() : '';
}

function updateDecodeStatus(message, level = 'info') {
    const el = document.getElementById('decoder-status');
    if (!el) return;
    if (!message) {
        el.style.display = 'none';
        el.textContent = '';
        el.className = 'status-banner';
        return;
    }
    el.style.display = 'block';
    el.textContent = message;
    el.className = `status-banner ${level}`;
}

function clearDecodeStatus() {
    updateDecodeStatus('', 'info');
}

function displayHeuristicFallback(txData, contractAddress, proxyInfo = null, txMeta = null) {
    const decoded = manualDecode(txData);
    decoded.contractAddress = contractAddress;
    if (proxyInfo?.proxyType) {
        decoded.proxyWarning = `Detected ${proxyInfo.proxyType.toUpperCase()} proxy. Showing heuristic decode for ${contractAddress}.`;
    }
    attachTransactionHash(decoded, txMeta, txData);
    displayManualDecoded(decoded);
}

// Read optional transaction metadata fields (nonce, chain ID, gas info, etc.)
function readOptionalTxMeta(prefix, defaultToAddress = null) {
    const typeEl = document.getElementById(`${prefix}-tx-type`);
    if (!typeEl) return null;

    const nonceValue = document.getElementById(`${prefix}-tx-nonce`)?.value.trim() || '';
    const chainIdValue = document.getElementById(`${prefix}-tx-chainid`)?.value.trim() || '';
    const gasLimitValue = document.getElementById(`${prefix}-tx-gaslimit`)?.value.trim() || '';
    const valueValue = document.getElementById(`${prefix}-tx-value`)?.value.trim() || '';
    const toValue = document.getElementById(`${prefix}-tx-to`)?.value.trim() || defaultToAddress || '';

    // If nothing is filled out, we simply skip optional metadata processing
    if (!nonceValue && !chainIdValue && !gasLimitValue && !valueValue && !toValue) {
        return null;
    }

    const fromValue = document.getElementById(`${prefix}-wallet-address`)?.value.trim();

    // Basic requirements must all be present to compute the full transaction hash
    const hasFullSet = nonceValue && chainIdValue && gasLimitValue && toValue;

    try {
        const meta = {
            type: typeEl.value === 'eip1559' ? 'eip1559' : 'legacy',
            value: ethers.BigNumber.from(valueValue || '0')
        };

        if (hasFullSet) {
            meta.nonce = ethers.BigNumber.from(nonceValue);
            meta.chainId = ethers.BigNumber.from(chainIdValue);
            meta.gasLimit = ethers.BigNumber.from(gasLimitValue);
            meta.to = ethers.utils.getAddress(toValue);
        }

        if (meta.type === 'legacy') {
            const gasPriceValue = document.getElementById(`${prefix}-tx-gasprice`)?.value.trim();
            if (gasPriceValue) {
                meta.gasPrice = ethers.BigNumber.from(gasPriceValue);
            } else if (hasFullSet) {
                return null;
            }
        } else {
            const maxFeeValue = document.getElementById(`${prefix}-tx-maxfee`)?.value.trim();
            const maxPriorityValue = document.getElementById(`${prefix}-tx-maxpriority`)?.value.trim();
            if (maxFeeValue && maxPriorityValue) {
                meta.maxFeePerGas = ethers.BigNumber.from(maxFeeValue);
                meta.maxPriorityFeePerGas = ethers.BigNumber.from(maxPriorityValue);
            } else if (hasFullSet) {
                return null;
            }
        }

        if (fromValue && ethers.utils.isAddress(fromValue)) {
            meta.from = ethers.utils.getAddress(fromValue);
        }

        return hasFullSet ? meta : Object.keys(meta).length ? meta : null;
    } catch (error) {
        console.warn('Invalid optional transaction metadata:', error.message || error);
        return null;
    }
}

// Attach a reconstructed transaction hash when envelope metadata is available
function attachTransactionHash(decoded, txMeta, txData) {
    if (!txMeta || !txMeta.chainId || !txMeta.nonce || !txMeta.gasLimit || !txMeta.to) return;
    try {
        const chainIdNum = txMeta.chainId.toNumber();
        const nonceNum = txMeta.nonce.toNumber();

        const tx = {
            chainId: chainIdNum,
            nonce: nonceNum,
            gasLimit: txMeta.gasLimit,
            to: txMeta.to,
            data: txData,
            value: txMeta.value
        };

        if (txMeta.type === 'legacy') {
            tx.gasPrice = txMeta.gasPrice;
        } else {
            tx.type = 2;
            tx.maxFeePerGas = txMeta.maxFeePerGas;
            tx.maxPriorityFeePerGas = txMeta.maxPriorityFeePerGas;
            tx.accessList = [];
        }

        const serialized = ethers.utils.serializeTransaction(tx);
        decoded.transactionHash = ethers.utils.keccak256(serialized);
    } catch (error) {
        console.warn('Failed to compute transaction hash from optional metadata:', error.message || error);
    }
}

// Get token info for current chain
function getTokenInfo(address) {
    const normalized = address.toLowerCase();
    const chainTokens = TOKEN_DATABASE[currentChain] || {};
    return chainTokens[normalized] || null;
}

// Fetch token decimals from blockchain
async function fetchTokenDecimals(address) {
    try {
        const explorerInfo = await fetchTokenInfoViaExplorer(address);
        if (explorerInfo) return explorerInfo;

        const rpcUrl = getEffectiveRpcUrl();
        if (!rpcUrl) throw new Error('No RPC URL configured for this chain');
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(
            address,
            ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'],
            provider
        );

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('RPC timeout')), 5000)
        );

        const [decimals, symbol] = await Promise.race([
            Promise.all([
                contract.decimals(),
                contract.symbol().catch(() => 'TOKEN')
            ]),
            timeout
        ]);

        return { decimals, symbol };
    } catch (error) {
        console.warn(`Could not fetch token info for ${address}:`, error.message);
        return null;
    }
}

async function fetchTokenInfoViaExplorer(address) {
    try {
        const apiKey = getSavedApiKey();
        if (!apiKey) return null;
        const chain = getCurrentChain();
        if (!chain) return null;

        const endpoints = [
            `${ETHERSCAN_V2_API}?chainid=${chain.chainId}&module=token&action=tokeninfo&contractaddress=${address}&apikey=${apiKey}`
        ];

        if (chain.proxyApiUrl) {
            endpoints.push(`${chain.proxyApiUrl}?module=token&action=tokeninfo&contractaddress=${address}&apikey=${apiKey}`);
        }

        for (const endpoint of endpoints) {
            const data = await fetchTokenInfoFromEndpoint(endpoint);
            if (data) return data;
        }
    } catch (error) {
        console.info('Explorer token info lookup failed, falling back to RPC.', error.message || error);
    }
    return null;
}

async function fetchTokenInfoFromEndpoint(url) {
    try {
        const data = await fetchJsonWithCorsFallback(url);
        if (data?.status === '1' && Array.isArray(data.result) && data.result.length) {
            const info = data.result[0];
            const decimals = parseInt(info.decimals, 10);
            const symbol = info.symbol || 'TOKEN';
            if (!isNaN(decimals)) {
                return { decimals, symbol };
            }
        }
    } catch (error) {
        console.warn('Token info endpoint failed:', error.message || error);
    }
    return null;
}

async function fetchJsonWithCorsFallback(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('CORS_BLOCKED');
        return await response.json();
    } catch (error) {
        if (error.message === 'CORS_BLOCKED') {
            // Strip API key before sending through third-party CORS proxy to prevent key leakage
            const sanitizedUrl = url.replace(/([?&])apikey=[^&]*/gi, '$1apikey=');
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sanitizedUrl)}`;
            const proxyResponse = await fetch(proxyUrl);
            if (!proxyResponse.ok) throw error;
            return await proxyResponse.json();
        }
        throw error;
    }
}

// Fetch token price from CoinGecko
async function fetchTokenPrice(symbol) {
    if (priceCache[symbol] && Date.now() - priceCache[symbol].timestamp < 300000) {
        return priceCache[symbol].price;
    }

    try {
        const coinIds = {
            'ETH': 'ethereum',
            'WETH': 'ethereum',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'WBTC': 'wrapped-bitcoin',
            'DAI': 'dai',
            'BNB': 'binancecoin',
            'UNI': 'uniswap',
            'LINK': 'chainlink',
            'AAVE': 'aave',
            'POL': 'polygon-ecosystem-token',
            'MATIC': 'matic-network',
            'AVAX': 'avalanche-2',
            'STETH': 'lido-staked-ether',
            'LSETH': 'liquid-staked-ethereum',
            'BABY': 'babyswap'
        };

        const coinId = coinIds[symbol];
        if (!coinId) return null;

        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        const data = await response.json();

        const price = data[coinId]?.usd;
        if (price) {
            priceCache[symbol] = { price, timestamp: Date.now() };
        }

        return price;
    } catch (error) {
        console.error('Error fetching price:', error);
        return null;
    }
}

// Format token amount
async function formatTokenAmount(value, tokenAddress) {
    if (!settings.formatAmounts) return null;

    let tokenInfo = getTokenInfo(tokenAddress);

    if (!tokenInfo && ethers.utils.isAddress(tokenAddress)) {
        const fetched = await fetchTokenDecimals(tokenAddress);
        if (fetched) {
            tokenInfo = { symbol: fetched.symbol, decimals: fetched.decimals };
        }
    }

    if (!tokenInfo) return null;

    const formatted = ethers.utils.formatUnits(value, tokenInfo.decimals);
    let result = `${formatted} ${tokenInfo.symbol}`;

    if (settings.showUSD) {
        const price = await fetchTokenPrice(tokenInfo.symbol);
        if (price) {
            const usdValue = (parseFloat(formatted) * price).toFixed(2);
            result += ` ($${usdValue})`;
        }
    }

    return result;
}

// Try to decode with common ABIs
function tryCommonAbis(txData) {
    for (const [name, abi] of Object.entries(COMMON_ABIS)) {
        try {
            const iface = createInterfaceSuppressingDuplicates(abi);
            const decoded = iface.parseTransaction({ data: txData });
            if (decoded) {
                return { abi, protocol: name };
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

const ENERGY_WEB_BRIDGE_ADDRESSES = {
    ewcLift: '0x0bdb4ff8396fbd0b8baa9cf2ea188cc620d5d2b1',
    ethPermitLift: '0x5dded30f8cd557257ccdc4a530cb77ac45f0259d'
};
const ARBITRUM_DELAYED_INBOX_ADDRESS = '0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f';
const ENERGY_WEB_PERMIT_TOKEN = '0xb66a5d30d04f076e78ffb0d045c55846fdcde928';
const SNOWBRIDGE_GATEWAY_ADDRESS = '0x27ca963c279c93801941e1eb8799c23f407d68e7';
const PORTAL_FORWARDER_ADDRESSES = new Set([
    '0x87a26566dbb3bf206634c1792a96ff4989e3f56e'
]);
const CIRCLE_PORTAL_EXECUTOR = '0x2ccf230467fe7387674baa657747f0b5485c7fec';
const CIRCLE_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const CIRCLE_DOMAIN_NAMES = {
    0: 'Ethereum',
    1: 'Avalanche',
    2: 'OP',
    3: 'Arbitrum',
    5: 'Solana',
    6: 'Base',
    7: 'Polygon PoS',
    10: 'Unichain',
    11: 'Linea',
    12: 'Codex',
    13: 'Sonic',
    14: 'World Chain',
    15: 'Monad',
    16: 'Sei',
    17: 'BNB Smart Chain',
    18: 'XDC',
    19: 'HyperEVM',
    21: 'Ink',
    22: 'Plume',
    25: 'Starknet',
    26: 'Arc Testnet'
};
const CIRCLE_PORTAL_SELECTOR = '0xe59ced5d';

const WORMHOLE_PORTAL_ADDRESSES = {
    ethereum: {
        core: '0x98f3c9e6e3face36baad05fe09d375ef1464288b',
        tokenBridge: '0x3ee18b2214aff97000d974cf647e7c347e8fa585',
        nftBridge: '0x6ffd7ede62328b3af38fcd61461bbfc52f5651fe'
    },
    bsc: {
        core: '0x98f3c9e6e3face36baad05fe09d375ef1464288b',
        tokenBridge: '0xb6f6d86a8f9879a9c87f643768d9efc38c1da6e7',
        nftBridge: '0x5a58505a96d1dbf8df91cb21b54419fc36e93fde'
    },
    polygon: {
        core: '0x7a4b5a56256163f07b2c80a7ca55abe66c4ec4d7',
        tokenBridge: '0x5a58505a96d1dbf8df91cb21b54419fc36e93fde',
        nftBridge: '0x90bbd86a6fe93d3bc3ed6335935447e75fab7fcf'
    },
    avalanche: {
        core: '0x54a8e5f9c4cba08f9943965859f6c34eaf03e26c',
        tokenBridge: '0x0e082f06ff657d94310cb8ce8b0d9a04541d8052',
        nftBridge: '0xf7b6737ca9c4e08ae573f75a97b73d7a813f5de5'
    },
    arbitrum: {
        core: '0xa5f208e072434bc67592e4c49c1b991ba79bca46',
        tokenBridge: '0x0b2402144bb366a632d14b83f244d2e0e21bd39c',
        nftBridge: '0x3dd14d553cfd986eac8e3bddf629d82073e188c8'
    },
    optimism: {
        core: '0xee91c335eab126df5fdb3797ea9d6ad93aec9722',
        tokenBridge: '0x1d68124e65fafc907325e3edbf8c4d84499daa8b',
        nftBridge: '0xfe8cd454b4a1ca468b57d79c0cc77ef5b6f64585'
    },
    base: {
        core: '0xbebdb6c8ddc678ffa9f8748f85c815c556dd8ac6',
        tokenBridge: '0x8d2de8d2f73f1f4cab472ac9a881c9b123c79627',
        nftBridge: '0xda3adc6621b2677bef9ad26598e6939cf0d92f88'
    },
    scroll: {
        core: '0xbebdb6c8ddc678ffa9f8748f85c815c556dd8ac6',
        tokenBridge: '0x24850c6f61c438823f01b7a3bf2b89b72174fa9d',
        nftBridge: null
    },
    blast: {
        core: '0xbebdb6c8ddc678ffa9f8748f85c815c556dd8ac6',
        tokenBridge: '0x24850c6f61c438823f01b7a3bf2b89b72174fa9d',
        nftBridge: null
    }
};

const WORMHOLE_CHAIN_NAME_MAP = {
    1: 'Solana',
    2: 'Ethereum',
    3: 'Terra',
    4: 'BNB Chain',
    5: 'Polygon',
    6: 'Avalanche',
    7: 'Oasis',
    8: 'Algorand',
    9: 'Aurora',
    10: 'Fantom',
    11: 'Karura',
    12: 'Acala',
    13: 'Klaytn',
    14: 'Celo',
    15: 'NEAR',
    16: 'Moonbeam',
    18: 'Terra 2',
    19: 'Injective',
    21: 'Sui',
    22: 'Aptos',
    23: 'Arbitrum',
    24: 'Optimism',
    25: 'Gnosis',
    30: 'Base',
    34: 'Scroll',
    36: 'Blast'
};

const WORMHOLE_SIGNATURES = new Set([
    'transferTokens(address,uint256,uint16,bytes32,uint32)',
    'transferTokensWithPayload(address,uint256,uint16,bytes32,uint32,bytes)',
    'wrapAndTransferETH(uint16,bytes32,uint32)',
    'wrapAndTransferETHWithPayload(uint16,bytes32,uint32,bytes)',
    'completeTransfer(bytes)',
    'completeTransferWithPayload(bytes)',
    'registerToken(address)'
]);

const LAYERZERO_ENDPOINT_ADDRESSES = new Set([
    '0x3c2269811836af69497e5f486a85d7316753cf62',
    '0x6ab5a55e353f8c5958230afa347e79dbcd1f662',
    '0xb6319c42f4addd0aa5b7dd54836dd543c7c5b47f',
    '0x1a44076050125825900e736c501f859c50fe728c'
].map(addr => addr.toLowerCase()));

const LAYERZERO_SIGNATURES = new Set([
    'send(uint16,bytes,bytes,address,address,bytes)',
    'receivePayload(uint16,bytes,address,uint64,uint256,bytes)',
    'retryPayload(uint16,bytes,bytes)'
]);

const WORMHOLE_ADDRESS_SET = new Set();
Object.values(WORMHOLE_PORTAL_ADDRESSES).forEach(info => {
    ['core', 'tokenBridge', 'nftBridge'].forEach(key => {
        if (info[key]) {
            WORMHOLE_ADDRESS_SET.add(info[key].toLowerCase());
        }
    });
});

const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const EIP1967_BEACON_SLOT = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';
const BEACON_IMPLEMENTATION_SELECTOR = '0x5c60da1b';

function createInterfaceSuppressingDuplicates(abi) {
    const originalWarn = console.warn;
    console.warn = function (...args) {
        const message = args.join(' ');
        if (message.includes('duplicate definition')) return;
        originalWarn.apply(console, args);
    };
    try {
        return new ethers.utils.Interface(abi);
    } finally {
        console.warn = originalWarn;
    }
}

function parseStorageSlotAddress(value) {
    if (!value || value === '0x' || /^0x0+$/.test(value)) return null;
    const trimmed = value.slice(-40);
    const candidate = '0x' + trimmed.padStart(40, '0');
    try {
        return ethers.utils.getAddress(candidate);
    } catch (_) {
        return null;
    }
}

async function resolveProxyImplementation(address, statusCallback = () => { }) {
    try {
        const rpcUrl = getEffectiveRpcUrl();
        if (!rpcUrl) return null;
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        statusCallback('Inspecting proxy storage via RPC...', 'info');

        const storageValue = await tryGetStorage(provider, address, EIP1967_IMPLEMENTATION_SLOT, statusCallback);
        const implAddress = parseStorageSlotAddress(storageValue);
        if (implAddress) {
            return { implementation: implAddress, proxyType: 'eip1967' };
        }

        const beaconSlotValue = await tryGetStorage(provider, address, EIP1967_BEACON_SLOT, statusCallback);
        const beaconAddress = parseStorageSlotAddress(beaconSlotValue);
        if (beaconAddress) {
            try {
                const implData = await provider.call({ to: beaconAddress, data: BEACON_IMPLEMENTATION_SELECTOR });
                const beaconImpl = parseStorageSlotAddress(implData);
                if (beaconImpl) {
                    return { implementation: beaconImpl, proxyType: 'beacon' };
                }
            } catch (beaconError) {
                console.warn('Beacon implementation lookup failed:', beaconError.message || beaconError);
            }
        }
    } catch (error) {
        console.warn('Proxy slot inspection failed:', error.message || error);
    }
    return null;
}

async function tryGetStorage(provider, address, slot, statusCallback = () => { }) {
    try {
        return await provider.getStorageAt(address, slot);
    } catch (error) {
        if (error?.code === -32603 || error?.code === 'SERVER_ERROR') {
            statusCallback('RPC blocked while reading contract storage. Trying explorer fallback...', 'warning');
            const explorerValue = await fetchStorageViaExplorer(address, slot, statusCallback);
            return explorerValue || null;
        }
        throw error;
    }
}

async function fetchStorageViaExplorer(address, slot, statusCallback = () => { }) {
    try {
        const chain = getCurrentChain();
        if (!chain?.proxyApiUrl) return null;
        const apiKey = getSavedApiKey();
        if (!apiKey) return null;
        const url = `${chain.proxyApiUrl}?module=proxy&action=eth_getStorageAt&address=${address}&position=${slot}&tag=latest&apikey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data?.result && data.result !== '0x') {
            statusCallback('Explorer storage fallback succeeded.', 'info');
            return data.result;
        }
    } catch (error) {
        console.warn('Explorer storage fallback failed:', error.message || error);
        statusCallback('Explorer storage fallback failed.', 'warning');
    }
    return null;
}

// Fetch ABI from unified Etherscan v2 API
async function fetchAbiFromEtherscan(address, apiKey) {
    const chain = getCurrentChain();

    try {
        const url = `${ETHERSCAN_V2_API}?chainid=${chain.chainId}&module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('CORS_BLOCKED');
        }

        const data = await response.json();

        if (data.status !== '1') {
            if (data.result && (data.result.includes('not verified') || data.result.includes('Contract source code not verified'))) {
                throw new Error('CONTRACT_NOT_VERIFIED');
            }
            throw new Error(data.result || 'Unknown error from Etherscan API');
        }

        return JSON.parse(data.result);
    } catch (directError) {
        if (directError.message === 'CONTRACT_NOT_VERIFIED') {
            throw directError;
        }

        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${ETHERSCAN_V2_API}?chainid=${chain.chainId}&module=contract&action=getabi&address=${address}&apikey=${apiKey}`)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (data.status !== '1') {
                if (data.result && (data.result.includes('not verified') || data.result.includes('Contract source code not verified'))) {
                    throw new Error('CONTRACT_NOT_VERIFIED');
                }
                throw new Error(data.result || 'Unknown error from Etherscan API');
            }

            return JSON.parse(data.result);
        } catch (proxyError) {
            if (proxyError.message === 'CONTRACT_NOT_VERIFIED') {
                throw proxyError;
            }
            throw new Error('CORS_BLOCKED');
        }
    }
}

async function fetchImplementationFromExplorer(address, apiKey) {
    const chain = getCurrentChain();

    async function request(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('CORS_BLOCKED');
        const data = await response.json();
        if (!Array.isArray(data.result) || data.result.length === 0) {
            throw new Error(data.result || 'Unknown response from explorer');
        }
        const info = data.result[0];
        const impl = info?.Implementation;
        if (impl && impl !== '' && impl !== '0x0000000000000000000000000000000000000000') {
            return impl;
        }
        return null;
    }

    const baseUrl = `${ETHERSCAN_V2_API}?chainid=${chain.chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

    try {
        const result = await request(baseUrl);
        if (result) return result;
    } catch (error) {
        if (error.message === 'CORS_BLOCKED') {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;
            try {
                const fallback = await request(proxyUrl);
                if (fallback) return fallback;
            } catch (proxyError) {
                console.warn('Explorer implementation fallback failed:', proxyError.message || proxyError);
            }
        } else {
            console.warn('Explorer implementation lookup failed:', error.message || error);
        }
    }
    return null;
}

// Decode transaction data
async function decodeTxData(txData, abi, protocol = null, contractAddress = null) {
    const iface = createInterfaceSuppressingDuplicates(abi);
    const decoded = iface.parseTransaction({ data: txData });

    return {
        functionName: decoded.name,
        signature: decoded.signature,
        selector: decoded.sighash || (txData ? txData.slice(0, 10) : null),
        args: decoded.args,
        fragment: decoded.functionFragment,
        protocol: protocol,
        contractAddress: contractAddress,
        txData: txData,  // Add raw transaction data
        value: decoded.value
    };
}

// Decode specific Universal Router command inputs
function decodeCommandInput(commandCode, inputData) {
    if (!inputData) return null;

    try {
        const abiCoder = ethers.utils.defaultAbiCoder;

        switch (commandCode) {
            case '0x00': // V3_SWAP_EXACT_IN
                const v3SwapParams = abiCoder.decode(
                    ['address', 'uint256', 'uint256', 'bytes', 'bool'],
                    inputData
                );
                return {
                    recipient: v3SwapParams[0],
                    amountIn: v3SwapParams[1].toString(),
                    amountOutMin: v3SwapParams[2].toString(),
                    path: v3SwapParams[3],
                    payerIsUser: v3SwapParams[4]
                };

            case '0x08': // V2_SWAP_EXACT_IN
                const v2SwapParams = abiCoder.decode(
                    ['address', 'uint256', 'uint256', 'address[]', 'bool'],
                    inputData
                );
                return {
                    recipient: v2SwapParams[0],
                    amountIn: v2SwapParams[1].toString(),
                    amountOutMin: v2SwapParams[2].toString(),
                    path: v2SwapParams[3],
                    payerIsUser: v2SwapParams[4]
                };

            case '0x0a': // PERMIT2_PERMIT
                // PERMIT2_PERMIT has a complex nested structure with PermitSingle struct
                try {
                    const permitParams = abiCoder.decode(
                        ['tuple(tuple(address token, uint160 amount, uint48 expiration, uint48 nonce) details, address spender, uint256 sigDeadline)', 'bytes'],
                        inputData
                    );
                    const details = permitParams[0][0];
                    const spender = permitParams[0][1];
                    const sigDeadline = permitParams[0][2];
                    const signature = permitParams[1];

                    // Format date as ISO with 24h time
                    const expirationDate = new Date(details[2] * 1000);
                    const isoExpiration = expirationDate.toISOString().replace('T', ' ').slice(0, 19);

                    return {
                        token: details[0],
                        amount: details[1].toString(),
                        expiration: isoExpiration,
                        nonce: details[3].toString(),
                        spender: spender,
                        sigDeadline: sigDeadline.toString(),
                        signature: signature.slice(0, 20) + '...'
                    };
                } catch (e) {
                    // Fallback to simpler decoding if nested structure fails
                    console.warn('PERMIT2_PERMIT nested decode failed, trying flat:', e);
                    const flatParams = abiCoder.decode(
                        ['address', 'uint160', 'uint48', 'uint48', 'address', 'uint256'],
                        inputData
                    );

                    // Format date as ISO with 24h time
                    const expirationDate = new Date(flatParams[2] * 1000);
                    const isoExpiration = expirationDate.toISOString().replace('T', ' ').slice(0, 19);

                    return {
                        token: flatParams[0],
                        amount: flatParams[1].toString(),
                        expiration: isoExpiration,
                        nonce: flatParams[3].toString(),
                        spender: flatParams[4],
                        sigDeadline: flatParams[5].toString()
                    };
                }

            case '0x02': // PERMIT2_TRANSFER_FROM
                const transferParams = abiCoder.decode(
                    ['address', 'address', 'uint160'],
                    inputData
                );
                return {
                    token: transferParams[0],
                    recipient: transferParams[1],
                    amount: transferParams[2].toString()
                };

            case '0x04': // SWEEP
                const sweepParams = abiCoder.decode(
                    ['address', 'address', 'uint256'],
                    inputData
                );
                return {
                    token: sweepParams[0],
                    recipient: sweepParams[1],
                    amountMin: sweepParams[2].toString()
                };

            case '0x0b': // WRAP_ETH
                const wrapParams = abiCoder.decode(
                    ['address', 'uint256'],
                    inputData
                );
                return {
                    recipient: wrapParams[0],
                    amountMin: wrapParams[1].toString()
                };

            case '0x0c': // UNWRAP_WETH
                const unwrapParams = abiCoder.decode(
                    ['address', 'uint256'],
                    inputData
                );
                return {
                    recipient: unwrapParams[0],
                    amountMin: unwrapParams[1].toString()
                };

            case '0x06': // PAY_PORTION
                const payPortionParams = abiCoder.decode(
                    ['address', 'address', 'uint256'],
                    inputData
                );
                return {
                    token: payPortionParams[0],
                    recipient: payPortionParams[1],
                    bips: payPortionParams[2].toString()
                };

            case '0x10': // V4_SWAP
                const v4SwapParams = abiCoder.decode(
                    ['address', 'address', 'uint256'],
                    inputData
                );
                return {
                    poolManager: v4SwapParams[0],
                    recipient: v4SwapParams[1],
                    actions: v4SwapParams[2].toString()
                };

            default:
                return { raw: inputData };
        }
    } catch (error) {
        console.error(`Error decoding command ${commandCode}:`, error);
        return { raw: inputData, error: error.message };
    }
}

// Decode Uniswap Universal Router execute command
function decodeUniversalRouterCommands(commandsBytes, inputs) {
    const commands = [];
    const commandsData = commandsBytes.startsWith('0x') ? commandsBytes.slice(2) : commandsBytes;

    for (let i = 0; i < commandsData.length; i += 2) {
        const commandByte = '0x' + commandsData.slice(i, i + 2);
        const commandName = UNISWAP_COMMANDS[commandByte] || `UNKNOWN(${commandByte})`;
        const commandIndex = i / 2;

        const inputData = inputs && inputs[commandIndex] ? inputs[commandIndex] : null;
        const decodedInput = inputData ? decodeCommandInput(commandByte, inputData) : null;

        commands.push({
            index: commandIndex,
            code: commandByte,
            name: commandName,
            input: inputData,
            decoded: decodedInput
        });
    }

    return commands;
}

// Assess risk level with improved logic for approvals
function assessRisk(functionName, params, protocol) {
    const highRiskFunctions = ['setApprovalForAll', 'transferOwnership', 'delegatecall'];
    const mediumRiskFunctions = ['transfer', 'transferFrom', 'withdraw', 'borrow'];

    const lowerName = functionName.toLowerCase();

    // Special handling for Uniswap Universal Router execute
    if (lowerName === 'execute' && protocol === 'UniswapUniversalRouter') {
        return 'high'; // Execute function spends tokens/ETH
    }

    // Special handling for approve functions
    if (lowerName.includes('approve') && !lowerName.includes('setapprovalforall')) {
        // Check if there's an amount parameter
        if (params && params.length >= 2) {
            try {
                // Typically the second parameter is the amount
                const amount = ethers.BigNumber.from(params[1]);

                // Check if it's unlimited approval (max uint256 or very large numbers)
                const maxUint256 = ethers.constants.MaxUint256;
                const almostMax = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

                // If amount is max uint256 or within 1% of it, it's unlimited
                if (amount.eq(maxUint256) || amount.gte(almostMax.mul(99).div(100))) {
                    return 'high'; // Unlimited approval
                } else {
                    return 'medium'; // Limited approval
                }
            } catch (e) {
                // If we can't parse the amount, default to high risk to be safe
                return 'high';
            }
        }
        return 'high'; // Default for approve if we can't determine
    }

    // Check other high risk functions
    if (highRiskFunctions.some(fn => lowerName.includes(fn.toLowerCase()))) {
        return 'high';
    }

    // Check medium risk functions
    if (mediumRiskFunctions.some(fn => lowerName.includes(fn.toLowerCase()))) {
        return 'medium';
    }

    return 'low';
}

// Detect if data is EIP-712 JSON structure
function isEIP712JSON(txData) {
    try {
        // Quick check before parsing
        if (!txData.trim().startsWith('{')) {
            return false;
        }

        const data = JSON.parse(txData);
        return !!(data.types && data.domain && data.primaryType && data.message);
    } catch (e) {
        return false;
    }
}

// Detect if data is EIP-712 encoded typed message (hex)
function isEIP712Data(txData) {
    // First check if it's JSON - if so, it's not hex-encoded EIP-712
    if (txData.trim().startsWith('{')) {
        return false;
    }

    // Remove 0x prefix if present
    const cleanData = txData.startsWith('0x') ? txData.slice(2) : txData;

    // EIP-712 encoded data is typically:
    // - Long (> 256 bytes typically)
    // - Contains multiple 32-byte chunks
    // - Can be parsed as valid ABI encoding

    if (cleanData.length < 512) {
        return false; // Too short to be a typical EIP-712 message
    }

    // Check if it's valid hex
    if (!/^[0-9a-fA-F]+$/.test(cleanData)) {
        return false;
    }

    // Length should be multiple of 64 (32 bytes in hex)
    if (cleanData.length % 64 !== 0) {
        return false;
    }

    // If it starts with a common function selector (4 bytes), it's likely a regular transaction
    // EIP-712 ABI-encoded messages typically start with full 32-byte values
    const potentialSelector = '0x' + cleanData.slice(0, 8);
    const commonSelectors = ['0x095ea7b3', '0xa9059cbb', '0x23b872dd', '0x18160ddd'];
    if (commonSelectors.includes(potentialSelector.toLowerCase())) {
        return false;
    }

    return true; // Possibly EIP-712 encoded data
}

// Encode and decode EIP-712 JSON structure
async function encodeAndDecodeEIP712JSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        // Validate required fields
        if (!data.types || !data.domain || !data.primaryType || !data.message) {
            throw new Error('Invalid EIP-712 data structure. Must include types, domain, primaryType, and message.');
        }

        const domain = data.domain;
        const types = {};

        // Copy types excluding EIP712Domain
        for (const [key, value] of Object.entries(data.types)) {
            if (key !== 'EIP712Domain') {
                types[key] = value;
            }
        }

        // Get the primary type
        const primaryType = data.primaryType;
        const message = data.message;

        // Step 1: Compute type hash
        const encoder = ethers.utils._TypedDataEncoder.from(types);
        const typeString = encoder.encodeType(primaryType);
        const typeHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(typeString));

        // Step 2: ABI-encode the message
        const messageTypes = types[primaryType].map(field => field.type);
        const messageValues = types[primaryType].map(field => message[field.name]);
        const encodedMessage = ethers.utils.defaultAbiCoder.encode(messageTypes, messageValues);

        // Step 3: Compute struct hash (typeHash + encodedMessage)
        const structHashData = ethers.utils.concat([typeHash, encodedMessage]);
        const structHash = ethers.utils.keccak256(structHashData);

        // Step 4: Compute domain separator
        const domainHash = ethers.utils._TypedDataEncoder.hashDomain(domain);

        // Final: Compute EIP-712 hash
        const finalHashData = ethers.utils.concat([
            ethers.utils.toUtf8Bytes('\x19\x01'),
            domainHash,
            structHash
        ]);
        const finalHash = ethers.utils.keccak256(finalHashData);

        // Parse encoded message into chunks for display
        const chunks = [];
        const cleanData = encodedMessage.slice(2);
        for (let i = 0; i < cleanData.length; i += 64) {
            chunks.push('0x' + cleanData.slice(i, i + 64));
        }

        const interpretations = [];
        chunks.forEach((chunk, index) => {
            const interpretation = { index, raw: chunk, possibleTypes: [] };

            // Check for addresses
            if (chunk.slice(0, 26) === '0x000000000000000000000000') {
                const addr = '0x' + chunk.slice(26);
                interpretation.possibleTypes.push({ type: 'address', value: addr });
            }

            // Check for uint256
            try {
                const bigNum = ethers.BigNumber.from(chunk);
                interpretation.possibleTypes.push({ type: 'uint256', value: bigNum.toString() });
            } catch (e) {
                // Not a valid number
            }

            interpretation.possibleTypes.push({ type: 'bytes32', value: chunk });
            interpretations.push(interpretation);
        });

        return {
            isEIP712: true,
            isFromJSON: true,
            typeHash: typeHash,
            rawData: encodedMessage,
            structHash: structHash,
            domainSeparator: domainHash,
            finalHash: finalHash,
            interpretations: interpretations,
            primaryType: primaryType,
            domain: domain
        };
    } catch (error) {
        throw new Error('Failed to process EIP-712 JSON: ' + error.message);
    }
}

// Decode EIP-712 encoded message (hex only)
async function decodeEIP712(txData) {
    try {
        const cleanData = txData.startsWith('0x') ? txData : '0x' + txData;

        // Parse the data into 32-byte chunks
        const chunks = [];
        const data = cleanData.slice(2);
        for (let i = 0; i < data.length; i += 64) {
            chunks.push('0x' + data.slice(i, i + 64));
        }

        // Try to identify common EIP-712 structures
        // Common patterns: Order, Permit, Message, etc.

        const result = {
            isEIP712: true,
            rawData: cleanData,
            chunks: chunks,
            interpretations: []
        };

        // Analyze chunks for common patterns
        chunks.forEach((chunk, index) => {
            const interpretation = { index, raw: chunk, possibleTypes: [] };

            // Check for addresses
            if (chunk.slice(0, 26) === '0x000000000000000000000000') {
                const addr = '0x' + chunk.slice(26);
                interpretation.possibleTypes.push({ type: 'address', value: addr });
            }

            // Check for uint256
            try {
                const bigNum = ethers.BigNumber.from(chunk);
                interpretation.possibleTypes.push({ type: 'uint256', value: bigNum.toString() });
            } catch (e) {
                // Not a valid number
            }

            // Check for bytes32/hash (could be type hash, domain separator, etc.)
            interpretation.possibleTypes.push({ type: 'bytes32', value: chunk });

            result.interpretations.push(interpretation);
        });

        // Try to compute potential EIP-712 hashes
        try {
            // Attempt to identify type hash (usually first 32 bytes or early in structure)
            const potentialTypeHash = chunks[0];

            // Compute struct hash (keccak256 of all the data)
            const structHash = ethers.utils.keccak256(cleanData);

            result.potentialTypeHash = potentialTypeHash;
            result.structHash = structHash;

            // Note: Without the actual EIP-712 typed data JSON, we can only show the encoded form
            result.note = 'This appears to be ABI-encoded data, possibly from an EIP-712 typed message. ' +
                'The original typed data structure is needed for complete decoding.';
        } catch (e) {
            result.error = e.message;
        }

        return result;
    } catch (error) {
        throw new Error('Failed to decode as EIP-712: ' + error.message);
    }
}

// Manual decode without ABI
function manualDecode(txData) {
    const selector = txData.slice(0, 10);
    const params = txData.slice(10);

    const chunks = [];
    for (let i = 0; i < params.length; i += 64) {
        chunks.push('0x' + params.slice(i, i + 64));
    }

    const decoded = {
        selector: selector,
        rawParams: chunks,
        interpretations: [],
        txData: txData  // Add raw transaction data
    };

    chunks.forEach((chunk, index) => {
        const interpretation = { index, raw: chunk, possibleTypes: [] };

        // Check if it could be an address
        if (chunk.slice(0, 26) === '0x000000000000000000000000') {
            const addr = '0x' + chunk.slice(26);
            interpretation.possibleTypes.push({ type: 'address', value: addr });

            const tokenInfo = getTokenInfo(addr);
            if (tokenInfo) {
                interpretation.possibleTypes.push({
                    type: 'token_address',
                    value: addr,
                    symbol: tokenInfo.symbol,
                    decimals: tokenInfo.decimals
                });
            }
        }

        // Check if it could be a uint256
        try {
            const bigNum = ethers.BigNumber.from(chunk);
            interpretation.possibleTypes.push({ type: 'uint256', value: bigNum.toString() });

            if (bigNum.gt(0) && bigNum.lt(ethers.BigNumber.from('1000000000000000000000000'))) {
                [18, 6, 8].forEach(decimals => {
                    const formatted = ethers.utils.formatUnits(bigNum, decimals);
                    if (parseFloat(formatted) > 0 && parseFloat(formatted) < 1000000000) {
                        interpretation.possibleTypes.push({
                            type: `amount_${decimals}decimals`,
                            value: formatted
                        });
                    }
                });
            }
        } catch (e) {
            // Not a valid number
        }

        interpretation.possibleTypes.push({ type: 'bytes32', value: chunk });

        decoded.interpretations.push(interpretation);
    });

    return decoded;
}

// AI assessment of transaction
function assessTransaction(decoded) {
    const assessment = {
        likelyFunction: 'Unknown',
        confidence: 'low',
        description: '',
        parameters: []
    };

    const params = decoded.interpretations || [];
    const normalizedTarget = (decoded.contractAddress || '').toLowerCase();

    const bridgeOverride = buildBridgeAssessment(decoded, params);
    if (bridgeOverride) {
        bridgeOverride.parameters = bridgeOverride.parameters || [];
        return bridgeOverride;
    }

    const hasTokenAddress = params.some(p => p.possibleTypes.some(t => t.type === 'token_address'));
    const hasMultipleAmounts = params.filter(p => p.possibleTypes.some(t => t.type.startsWith('amount_'))).length >= 2;
    const hasBytes32 = params.some(p => p.possibleTypes.some(t => t.type === 'bytes32'));

    if (hasTokenAddress && hasMultipleAmounts) {
        assessment.likelyFunction = 'Bridge/Transfer Token';
        assessment.confidence = 'medium';

        params.forEach((param, index) => {
            const tokenType = param.possibleTypes.find(t => t.type === 'token_address');
            const addressType = param.possibleTypes.find(t => t.type === 'address');
            const amountTypes = param.possibleTypes.filter(t => t.type.startsWith('amount_'));
            const uint256Type = param.possibleTypes.find(t => t.type === 'uint256');

            if (tokenType) {
                assessment.parameters.push({
                    index,
                    name: 'token',
                    type: 'address',
                    description: `Token to transfer: ${tokenType.symbol}`,
                    value: tokenType.value
                });
            } else if (amountTypes.length > 0) {
                const rawValue = ethers.BigNumber.from(param.raw);

                const tokenParam = params.find(p => p.possibleTypes.some(t => t.type === 'token_address'));
                if (tokenParam) {
                    const token = tokenParam.possibleTypes.find(t => t.type === 'token_address');
                    const formatted = ethers.utils.formatUnits(rawValue, token.decimals);

                    const isFee = parseFloat(formatted) < 0.1 && index < params.length - 1;

                    assessment.parameters.push({
                        index,
                        name: isFee ? 'destinationFee' : 'amount',
                        type: `uint128 or uint256`,
                        description: isFee
                            ? `Destination chain fee: ${formatted} ${token.symbol}`
                            : `Transfer amount: ${formatted} ${token.symbol}`,
                        value: rawValue.toString(),
                        formatted: `${formatted} ${token.symbol}`
                    });
                }
            } else if (hasBytes32 && param.possibleTypes.some(t => t.type === 'bytes32')) {
                assessment.parameters.push({
                    index,
                    name: 'destinationAddress',
                    type: 'bytes32',
                    description: 'Destination address (possibly on another chain)',
                    value: param.raw
                });
            } else if (addressType && !tokenType) {
                assessment.parameters.push({
                    index,
                    name: 'recipient',
                    type: 'address',
                    description: 'Recipient address',
                    value: addressType.value
                });
            } else if (uint256Type) {
                const num = ethers.BigNumber.from(param.raw);
                if (num.eq(0) || num.eq(1)) {
                    assessment.parameters.push({
                        index,
                        name: 'flag',
                        type: 'bool or uint8',
                        description: `Boolean flag: ${num.eq(1) ? 'true' : 'false'}`,
                        value: num.toString()
                    });
                } else {
                    assessment.parameters.push({
                        index,
                        name: `param${index}`,
                        type: 'uint256',
                        description: `Numeric parameter: ${num.toString()}`,
                        value: num.toString()
                    });
                }
            }
        });

        if (hasBytes32) {
            assessment.description = 'This appears to be a cross-chain bridge transaction. It transfers tokens from this chain to another blockchain.';
        } else {
            assessment.description = 'This appears to be a token transfer or swap with multiple amounts (possibly including fees).';
        }

        const paramTypes = assessment.parameters.map(p => `${p.type} ${p.name}`).join(', ');
        assessment.likelyFunction = `sendToken(${paramTypes})`;
        assessment.confidence = 'medium-high';

    } else if (hasTokenAddress && params.length === 2) {
        assessment.likelyFunction = 'approve(address spender, uint256 amount)';
        assessment.confidence = 'high';
        assessment.description = 'Standard ERC20 approval to allow another address to spend tokens.';

    } else {
        assessment.description = 'Unable to determine specific function pattern. See parameter interpretations below.';
    }

    return assessment;
}

function buildBridgeAssessment(decoded, interpretations = []) {
    const target = (decoded.contractAddress || '').toLowerCase();
    const signature = decoded.signature || '';
    debugLog('bridge', { target, signature, fn: decoded.functionName });

    if (target) {
        if (target === ENERGY_WEB_BRIDGE_ADDRESSES.ewcLift ||
            target === ENERGY_WEB_BRIDGE_ADDRESSES.ethPermitLift) {
            return buildEnergyWebBridgeSummary(decoded, interpretations, target);
        }
        if (target === ARBITRUM_DELAYED_INBOX_ADDRESS) {
            return buildArbitrumBridgeSummary(decoded);
        }
        if (target === SNOWBRIDGE_GATEWAY_ADDRESS) {
            return buildSnowbridgeSummary(decoded, interpretations);
        }
        if (PORTAL_FORWARDER_ADDRESSES.has(target)) {
            return buildPortalForwarderSummary(decoded);
        }
        if (target === CIRCLE_PORTAL_EXECUTOR) {
            return buildCirclePortalSummary(decoded);
        }
        if (WORMHOLE_ADDRESS_SET.has(target)) {
            return buildWormholeSummary(decoded, interpretations);
        }
        if (LAYERZERO_ENDPOINT_ADDRESSES.has(target)) {
            return buildLayerZeroSummary(decoded);
        }
    }

    if (signature) {
        if (WORMHOLE_SIGNATURES.has(signature)) {
            return buildWormholeSummary(decoded, interpretations);
        }
        if (signature === 'forwardERC20(bytes,address,uint256,(uint256,address))') {
            return buildPortalForwarderSummary(decoded);
        }
        if (signature === 'send((uint256,uint16,uint32,bytes32,address,bytes32,uint256,uint256,uint256,address,bytes,bytes))' || signature === CIRCLE_PORTAL_SELECTOR) {
            return buildCirclePortalSummary(decoded);
        }
        if (signature === 'depositForBurn(address,uint256,uint32,bytes32)' ||
            signature === 'depositForBurn(uint256,uint16,uint32,bytes32,address,bytes32,uint256,uint32,(address,bytes,bytes),(uint16,address))') {
            return buildCirclePortalSummary(decoded);
        }
        if (LAYERZERO_SIGNATURES.has(signature)) {
            return buildLayerZeroSummary(decoded);
        }
        if (signature === 'createRetryableTicket(address,uint256,uint256,address,address,uint256,uint256,bytes)') {
            return buildArbitrumBridgeSummary(decoded);
        }
    }

    return null;
}

function formatAddressWithTokenInfo(address) {
    if (!address) return address;
    try {
        const info = getTokenInfo(address);
        if (info) {
            return `${address} (${info.symbol})`;
        }
    } catch (_) {
        // ignore lookup issues
    }
    return address;
}

function formatAddressWithName(address) {
    if (!address) return address;
    try {
        const known = getKnownContract(address);
        if (known?.name) {
            return `${address} (${known.name})`;
        }
        const book = getAddressLabel(address);
        if (book?.label) {
            return `${address} (${book.label})`;
        }
    } catch (_) {
        // ignore lookup issues
    }
    return address;
}

function buildEnergyWebBridgeSummary(decoded, interpretations, matchedAddress) {
    const summary = {
        bridgeName: 'Energy Web Bridge',
        confidence: 'high',
        parameters: [],
        hint: 'Energy Web locks tokens on the source chain and mints them on Energy Web X. The recipient key is derived from a Substrate (SS58) address and shown here as bytes32.',
        docUrl: 'https://www.energyweb.org/'
    };

    if (matchedAddress === ENERGY_WEB_BRIDGE_ADDRESSES.ewcLift) {
        const destinationKey = extractBytes32Arg(decoded, 0) || findFirstBytes32(interpretations);
        const ss58 = destinationKey ? bytes32ToSS58(destinationKey) : null;
        summary.likelyFunction = 'liftEWT(bytes t2PublicKey)';
        summary.description = 'Bridge native EWT from Energy Web Chain to Energy Web X via liftEWT().';

        if (destinationKey) {
            summary.parameters.push({
                index: 0,
                name: 't2PubKey',
                type: 'bytes32',
                description: `Recipient public key for Energy Web X (converted from SS58 address to bytes32)`,
                value: destinationKey,
                formatted: ss58 ? `Original SS58: ${ss58}` : null
            });
        }
        return summary;
    }

    if (matchedAddress === ENERGY_WEB_BRIDGE_ADDRESSES.ethPermitLift) {
        const tokenAddress = extractAddressArg(decoded, 0) || ENERGY_WEB_PERMIT_TOKEN;
        const destinationKey = extractBytes32Arg(decoded, 1) || findFirstBytes32(interpretations);
        const ss58 = destinationKey ? bytes32ToSS58(destinationKey) : null;
        const amountInfo = extractAmountArg(decoded, 2);
        const deadlineInfo = extractDeadlineArg(decoded, 3);
        const vValue = extractNumericArg(decoded, 4);
        const rValue = extractBytes32Arg(decoded, 5);
        const sValue = extractBytes32Arg(decoded, 6);

        summary.likelyFunction = 'permitLift(address token, bytes32 t2PublicKey, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)';
        summary.description = 'Permit-based bridge of AVT from Ethereum to Energy Web X via permitLift().';

        if (tokenAddress) {
            summary.parameters.push({
                index: 0,
                name: 'token',
                type: 'address',
                description: 'ERC20 token to bridge (typically AVT/EWT on Ethereum)',
                value: tokenAddress
            });
        }

        if (amountInfo) {
            summary.parameters.push({
                index: 1,
                name: 'amount',
                type: 'uint256',
                description: 'Amount permitted for bridging',
                value: amountInfo.raw,
                formatted: `${amountInfo.formatted} AVT`
            });
        }

        if (destinationKey) {
            summary.parameters.push({
                index: 2,
                name: 't2PubKey',
                type: 'bytes32',
                description: `Recipient public key for Energy Web X (converted from SS58 address to bytes32)${ss58 ? ` — original SS58: ${ss58}` : ''}`,
                value: destinationKey,
                formatted: ss58 ? `Original SS58: ${ss58}` : null
            });
        }

        if (deadlineInfo) {
            summary.parameters.push({
                index: 3,
                name: 'deadline',
                type: 'uint256',
                description: `Permit expires at ${deadlineInfo.humanReadable}`,
                value: deadlineInfo.raw
            });
        }

        if (vValue !== null && vValue !== undefined) {
            summary.parameters.push({
                index: 4,
                name: 'v',
                type: 'uint8',
                description: 'Signature component v',
                value: vValue.toString()
            });
        }

        if (rValue) {
            summary.parameters.push({
                index: 5,
                name: 'r',
                type: 'bytes32',
                description: 'Signature component r',
                value: rValue
            });
        }

        if (sValue) {
            summary.parameters.push({
                index: 6,
                name: 's',
                type: 'bytes32',
                description: 'Signature component s',
                value: sValue
            });
        }
        return summary;
    }

    return null;
}

function buildArbitrumBridgeSummary(decoded) {
    const args = decoded.args || [];
    const chainInfo = getCurrentChain();
    const nativeSymbol = chainInfo?.nativeCurrency?.symbol || chainInfo?.nativeSymbol || 'ETH';
    const l2Recipient = args[0];
    const l2CallValue = args[1] ? ethers.BigNumber.from(args[1]) : null;
    const maxSubmissionCost = args[2] ? ethers.BigNumber.from(args[2]) : null;
    const excessFeeRefundAddress = args[3];
    const callValueRefundAddress = args[4];
    const gasLimit = args[5] ? ethers.BigNumber.from(args[5]) : null;
    const maxFeePerGas = args[6] ? ethers.BigNumber.from(args[6]) : null;
    const dataBytes = args[7];
    const msgValue = decoded.value ? ethers.BigNumber.from(decoded.value) : ethers.BigNumber.from(0);

    let totalCost = null;
    if (l2CallValue && maxSubmissionCost && gasLimit && maxFeePerGas) {
        totalCost = l2CallValue.add(maxSubmissionCost).add(gasLimit.mul(maxFeePerGas));
    }

    const summary = {
        bridgeName: 'Arbitrum Native Bridge',
        confidence: 'high',
        likelyFunction: 'createRetryableTicket(address to, uint256 l2CallValue, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, bytes data)',
        description: 'Delayed Inbox (L1 forwarder) sends a retryable ticket into the Arbitrum Bridge. Funds are escrowed on L1 and delivered to L2 with the provided calldata.',
        hint: 'Parameters are forwarded as-is to the Arbitrum Bridge. Verify the L2 recipient, amount, and fee caps before signing.',
        docUrl: 'https://docs.arbitrum.io/',
        parameters: []
    };

    if (l2Recipient) {
        summary.parameters.push({
            name: 'L2 recipient',
            type: 'address',
            description: 'Address that receives the call/value on Arbitrum',
            value: l2Recipient
        });
    }

    if (l2CallValue) {
        summary.parameters.push({
            name: 'L2 call value',
            type: 'uint256',
            description: `Native amount delivered on L2`,
            value: l2CallValue.toString(),
            formatted: `${formatWithCommas(ethers.utils.formatEther(l2CallValue))} ${nativeSymbol}`
        });
    }

    if (maxSubmissionCost) {
        summary.parameters.push({
            name: 'Max submission cost',
            type: 'uint256',
            description: 'Fee ceiling for posting the retryable ticket on L1',
            value: maxSubmissionCost.toString(),
            formatted: `${formatWithCommas(ethers.utils.formatEther(maxSubmissionCost))} ${nativeSymbol}`
        });
    }

    if (gasLimit && maxFeePerGas) {
        const gasCost = gasLimit.mul(maxFeePerGas);
        summary.parameters.push({
            name: 'Gas budget & bid',
            type: 'uint256',
            description: 'L2 execution gas limit and max fee per gas for the retryable',
            value: `${gasLimit.toString()} @ ${maxFeePerGas.toString()}`,
            formatted: `${gasLimit.toString()} gas × ${ethers.utils.formatUnits(maxFeePerGas, 'gwei')} gwei = ${formatWithCommas(ethers.utils.formatEther(gasCost))} ${nativeSymbol}`
        });
    }

    if (totalCost) {
        const formattedTotal = formatWithCommas(ethers.utils.formatEther(totalCost));
        const msgValNote = msgValue && !msgValue.isZero()
            ? ` (tx value: ${formatWithCommas(ethers.utils.formatEther(msgValue))} ${nativeSymbol})`
            : '';
        summary.parameters.push({
            name: 'Total escrowed on L1',
            type: 'uint256',
            description: 'Expected total funding for retryable ticket',
            value: totalCost.toString(),
            formatted: `${formattedTotal} ${nativeSymbol}${msgValNote}`
        });
    }

    if (excessFeeRefundAddress) {
        summary.parameters.push({
            name: 'Excess fee refund',
            type: 'address',
            description: 'Receives surplus submission/gas fees',
            value: excessFeeRefundAddress
        });
    }

    if (callValueRefundAddress) {
        summary.parameters.push({
            name: 'Call value refund',
            type: 'address',
            description: 'Receives refund if L2 execution fails',
            value: callValueRefundAddress
        });
    }

    if (dataBytes !== undefined) {
        const hexData = typeof dataBytes === 'string' ? dataBytes : (dataBytes?.toString?.() || '');
        const dataLength = hexData.startsWith('0x') ? (hexData.length - 2) / 2 : hexData.length / 2;
        const preview = hexData && hexData.length > 10 ? `${hexData.slice(0, 66)}...` : (hexData || '0x');
        summary.parameters.push({
            name: 'Calldata forwarded',
            type: 'bytes',
            description: dataLength === 0 ? 'Empty calldata (pure value transfer on L2)' : `Forwarded to L2 target; non-empty calldata length ${dataLength} bytes`,
            value: preview
        });
    }

    summary.parameters.push({
        name: 'Forwarder',
        type: 'note',
        description: 'Delayed Inbox is a proxy/forwarder; it forwards these parameters into the Arbitrum Bridge to create the retryable ticket.',
        value: 'Parameters are passed through unchanged.'
    });

    return summary;
}

function buildSnowbridgeSummary(decoded) {
    const fn = (decoded.functionName || '').toLowerCase();
    const summary = {
        bridgeName: 'Snowbridge Gateway',
        confidence: 'high',
        likelyFunction: decoded.signature || 'Snowbridge call',
        description: 'Snowbridge routes cross-chain messages between Ethereum and Polkadot. Token calls lock assets here and mint them on the target parachain.',
        hint: 'Ensure the destination parachain ID and recipient address match the destination shown on your wallet or dApp before signing.',
        docUrl: 'https://docs.snowbridge.network/',
        parameters: []
    };

    if (fn === 'sendtoken' && decoded.args && decoded.args.length >= 5) {
        const token = decoded.args[0];
        const destChain = decoded.args[1];
        const destination = decoded.args[2];
        const destinationFee = decoded.args[3];
        const amount = decoded.args[4];

        const tokenInfo = token ? getTokenInfo(token) : null;
        let formattedAmount = null;
        if (tokenInfo && ethers.BigNumber.isBigNumber(amount)) {
            try {
                formattedAmount = `${formatWithCommas(ethers.utils.formatUnits(amount, tokenInfo.decimals))} ${tokenInfo.symbol}`;
            } catch (_) {
                formattedAmount = null;
            }
        }

        summary.likelyFunction = 'sendToken(address token, ParaID destinationChain, MultiAddress destinationAddress, uint128 destinationFee, uint128 amount)';
        const chainId = ethers.BigNumber.isBigNumber(destChain) ? destChain.toNumber() : Number(destChain);
        summary.description = `Locks ${tokenInfo?.symbol || 'tokens'} on this chain and queues delivery to Polkadot parachain ${chainId || destChain}.`;

        summary.parameters.push({
            name: 'token',
            type: 'address',
            description: 'Asset being locked on Ethereum',
            value: token,
            formatted: tokenInfo ? `${tokenInfo.symbol} (${tokenInfo.decimals} decimals)` : null
        });

        summary.parameters.push({
            name: 'destinationChain',
            type: 'ParaID',
            description: 'Target Polkadot parachain identifier',
            value: chainId ? chainId.toString() : destChain?.toString?.() || String(destChain)
        });

        const destinationInfo = describeSnowbridgeDestination(destination);
        summary.parameters.push({
            name: 'destination',
            type: destinationInfo.type,
            description: 'Recipient on the Polkadot side',
            value: destinationInfo.value
        });

        summary.parameters.push({
            name: 'destinationFee',
            type: 'uint128',
            description: 'DOT fee reserved to cover execution on AssetHub',
            value: (destinationFee && destinationFee.toString) ? destinationFee.toString() : String(destinationFee)
        });

        summary.parameters.push({
            name: 'amount',
            type: 'uint128',
            description: 'Tokens being bridged through Snowbridge',
            value: amount && amount.toString ? amount.toString() : String(amount),
            formatted: formattedAmount
        });

        return summary;
    }

    if (fn === 'registertoken' && decoded.args && decoded.args.length >= 1) {
        summary.likelyFunction = 'registerToken(address token)';
        summary.description = 'Registers an ERC-20 so it can be minted as a wrapped asset on Polkadot Asset Hub.';
        summary.parameters.push({
            name: 'token',
            type: 'address',
            description: 'Token contract being registered for bridging',
            value: decoded.args[0]
        });
        if (decoded.value) {
            summary.parameters.push({
                name: 'msg.value',
                type: 'uint256',
                description: 'ETH deposited to cover Snowbridge delivery costs',
                value: decoded.value.toString()
            });
        }
        return summary;
    }

    if (fn === 'submitv1' && decoded.args && decoded.args.length > 0) {
        const inbound = decoded.args[0];
        summary.likelyFunction = 'submitV1((ChannelID,uint64,uint8,bytes,uint64,uint256,uint256,bytes32),bytes32[],(bytes32,uint64,uint64,uint64,bytes32),bytes)';
        summary.description = 'Submits a proof from Polkadot BridgeHub so the gateway can unlock or mint assets.';
        if (inbound) {
            summary.parameters.push({
                name: 'channelID',
                type: 'bytes32',
                description: 'Origin BridgeHub channel identifier',
                value: inbound.channelID || inbound.channelId || ''
            });
            summary.parameters.push({
                name: 'nonce',
                type: 'uint64',
                description: 'Message nonce within the channel',
                value: inbound.nonce ? inbound.nonce.toString() : ''
            });
            summary.parameters.push({
                name: 'command',
                type: 'uint8',
                description: 'Command enum sent from Polkadot',
                value: inbound.command ? inbound.command.toString() : ''
            });
            summary.parameters.push({
                name: 'reward',
                type: 'uint256',
                description: 'Reward (in wei) paid to relayers',
                value: inbound.reward ? inbound.reward.toString() : ''
            });
        }
        return summary;
    }

    return summary;
}

function buildWormholeSummary(decoded) {
    const fn = (decoded.functionName || '').toLowerCase();
    const summary = {
        bridgeName: 'Portal (Wormhole)',
        confidence: 'high',
        likelyFunction: decoded.signature || 'Portal call',
        description: 'Portal (Wormhole) locks tokens on this chain and mints or releases them on the destination after guardians attest the transfer.',
        hint: 'Check the Wormhole destination chain ID, recipient, and amount before approving. Compare the VAA hash on your wallet if possible.',
        docUrl: 'https://wormhole.com/',
        parameters: []
    };

    const args = decoded.args || [];

    if ((fn === 'transfertokens' || fn === 'transfertokenswithpayload') && args.length >= 5) {
        const token = args[0];
        const amount = args[1];
        const recipientChain = args[2];
        const recipient = args[3];
        const nonce = args[4];

        const formattedAmount = tryFormatTokenAmount(amount, token);
        const chainId = ethers.BigNumber.isBigNumber(recipientChain) ? recipientChain.toNumber() : Number(recipientChain);
        summary.likelyFunction = 'transferTokens(address token, uint256 amount, uint16 recipientChain, bytes32 recipient, uint32 nonce)';
        summary.description = `Locks tokens and emits a Wormhole VAA targeting ${formatWormholeChainName(chainId)}.`;

        summary.parameters.push({
            name: 'token',
            type: 'address',
            description: 'Asset being sent through Portal',
            value: token
        });
        summary.parameters.push({
            name: 'amount',
            type: 'uint256',
            description: 'Raw amount locked on this chain',
            value: amount?.toString?.() || String(amount),
            formatted: formattedAmount
        });
        summary.parameters.push({
            name: 'recipientChain',
            type: 'uint16',
            description: 'Wormhole chain ID the VAA targets',
            value: chainId ? chainId.toString() : recipientChain?.toString?.() || String(recipientChain),
            formatted: formatWormholeChainName(chainId)
        });
        summary.parameters.push({
            name: 'recipient',
            type: 'bytes32',
            description: 'Address on the target chain (bytes32)',
            value: recipient
        });
        summary.parameters.push({
            name: 'nonce',
            type: 'uint32',
            description: 'Wormhole nonce to prevent replay',
            value: nonce?.toString?.() || String(nonce)
        });

        if (fn === 'transfertokenswithpayload' && args.length >= 6) {
            summary.likelyFunction = 'transferTokensWithPayload(address token, uint256 amount, uint16 recipientChain, bytes32 recipient, uint32 nonce, bytes payload)';
            summary.description = `Locks tokens and forwards an arbitrary payload to ${formatWormholeChainName(chainId)}.`;
            summary.parameters.push({
                name: 'payload',
                type: 'bytes',
                description: 'Arbitrary data forwarded to the destination contract',
                value: args[5] ? `${args[5].slice(0, 66)}...` : '0x'
            });
        }

        return summary;
    }

    if (fn === 'wrapandtransfereth' && args.length >= 3) {
        const recipientChain = args[0];
        const recipient = args[1];
        const nonce = args[2];
        const chainId = ethers.BigNumber.isBigNumber(recipientChain) ? recipientChain.toNumber() : Number(recipientChain);
        summary.likelyFunction = 'wrapAndTransferETH(uint16 recipientChain, bytes32 recipient, uint32 nonce)';
        summary.description = `Wraps native ETH into WETH and sends it across Wormhole to ${formatWormholeChainName(chainId)}.`;
        summary.parameters.push({
            name: 'recipientChain',
            type: 'uint16',
            description: 'Target chain for the wrapped ETH',
            value: chainId ? chainId.toString() : recipientChain?.toString?.() || String(recipientChain),
            formatted: formatWormholeChainName(chainId)
        });
        summary.parameters.push({
            name: 'recipient',
            type: 'bytes32',
            description: 'Destination address (bytes32 representation)',
            value: recipient
        });
        summary.parameters.push({
            name: 'nonce',
            type: 'uint32',
            description: 'Message nonce',
            value: nonce?.toString?.() || String(nonce)
        });
        return summary;
    }

    if (fn === 'wrapandtransferethwithpayload' && args.length >= 4) {
        const recipientChain = args[0];
        const recipient = args[1];
        const nonce = args[2];
        const payload = args[3];
        const chainId = ethers.BigNumber.isBigNumber(recipientChain) ? recipientChain.toNumber() : Number(recipientChain);
        summary.likelyFunction = 'wrapAndTransferETHWithPayload(uint16 recipientChain, bytes32 recipient, uint32 nonce, bytes payload)';
        summary.description = `Wraps native ETH and delivers a payload to ${formatWormholeChainName(chainId)}.`;
        summary.parameters.push({
            name: 'recipientChain',
            type: 'uint16',
            description: 'Target chain for the wrapped ETH',
            value: chainId ? chainId.toString() : recipientChain?.toString?.() || String(recipientChain),
            formatted: formatWormholeChainName(chainId)
        });
        summary.parameters.push({
            name: 'recipient',
            type: 'bytes32',
            description: 'Destination address (bytes32 representation)',
            value: recipient
        });
        summary.parameters.push({
            name: 'nonce',
            type: 'uint32',
            description: 'Message nonce',
            value: nonce?.toString?.() || String(nonce)
        });
        summary.parameters.push({
            name: 'payload',
            type: 'bytes',
            description: 'Forwarded data for the destination contract',
            value: payload ? `${payload.slice(0, 66)}...` : '0x'
        });
        return summary;
    }

    if (fn === 'completetransfer' && args.length >= 1) {
        summary.likelyFunction = 'completeTransfer(bytes encodedVAA)';
        summary.description = 'Redeems a Wormhole VAA on this chain to unlock previously bridged assets.';
        summary.parameters.push({
            name: 'vaa',
            type: 'bytes',
            description: 'Signed guardian VAA proving the cross-chain transfer',
            value: `${args[0].slice(0, 66)}...`
        });
        return summary;
    }

    if (fn === 'registertoken' && args.length >= 1) {
        summary.likelyFunction = 'registerToken(address token)';
        summary.description = 'Registers a new ERC-20 so it can be bridged via Wormhole.';
        summary.parameters.push({
            name: 'token',
            type: 'address',
            description: 'Token address being approved by Portal',
            value: args[0]
        });
        return summary;
    }

    return summary;
}

function buildCirclePortalSummary(decoded) {
    const arg = decoded.args && decoded.args[0];
    debugLog('circle', 'buildCirclePortalSummary invoked', {
        functionName: decoded.functionName,
        signature: decoded.signature,
        args: decoded.args
    });
    const summary = {
        bridgeName: 'Portal USDC (Circle CCTP)',
        confidence: 'high',
        likelyFunction: decoded.signature || 'send((amount,dstWormholeChain,dstCircleDomain,mintRecipient,burnToken,destinationCaller,nativeGasDrop,relayerFee,refundPerByte,refundAddress,solanaPayload,cctpMetadata))',
        description: 'Burns USDC on Ethereum via Circle CCTP and instructs Portal/Wormhole to mint on the destination chain.',
        hint: 'Verify the USDC amount, destination chain/domain, Solana recipient bytes32, and relayer/gas settings before signing.',
        docUrl: 'https://portalbridge.com/',
        parameters: []
    };

    // Handle depositForBurn overloads
    if ((decoded.functionName || '').toLowerCase() === 'depositforburn') {
        // v2 signature: depositForBurn(uint256 amount, uint16 dstChain, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, ...)
        if (decoded.args.length >= 5 && !ethers.utils.isAddress(decoded.args[0]) && ethers.utils.isAddress(decoded.args[4])) {
            const amount = decoded.args[0];
            const destinationChain = decoded.args[1];
            const destinationDomain = decoded.args[2];
            const mintRecipient = decoded.args[3];
            const burnToken = decoded.args[4];
            const executorArgs = decoded.args[8]; // tuple: sender, solanaPayload, cctpMetadata
            const solanaPayloadV2 = executorArgs?.solanaPayload || (Array.isArray(executorArgs) ? executorArgs[1] : null);

            const domainNum = ethers.BigNumber.isBigNumber(destinationDomain) ? destinationDomain.toNumber() : Number(destinationDomain);
            const domainLabel = CIRCLE_DOMAIN_NAMES[domainNum] || String(domainNum);
            const wormholeChainNum = ethers.BigNumber.isBigNumber(destinationChain) ? destinationChain.toNumber() : Number(destinationChain);
            const wormholeLabel = formatWormholeChainName ? formatWormholeChainName(wormholeChainNum) : String(destinationChain);
            const formattedAmount = tryFormatTokenAmount ? tryFormatTokenAmount(amount, burnToken || CIRCLE_USDC) : null;
            const solanaRecipient = bytes32ToBase58(mintRecipient);

            summary.likelyFunction = decoded.signature || 'depositForBurn(uint256,uint16,uint32,bytes32,address,bytes32,uint256,uint32,(address,bytes,bytes),(uint16,address))';
            summary.description = `Burning ${formattedAmount || (amount?.toString?.() || '?')} via Circle CCTP to mint on destination domain ${domainLabel} (Wormhole chain ${wormholeLabel}).`;
            summary.parameters.push({
                name: 'amount',
                type: 'uint256',
                description: 'USDC burned on source chain',
                value: amount?.toString?.() || String(amount),
                formatted: formattedAmount
            });
            summary.parameters.push({
                name: 'destinationChain',
                type: 'uint16',
                description: 'Wormhole chain ID for executor',
                value: wormholeChainNum?.toString?.() || String(wormholeChainNum),
                formatted: wormholeLabel
            });
            summary.parameters.push({
                name: 'destinationDomain',
                type: 'uint32',
                description: 'Circle CCTP domain',
                value: domainNum?.toString?.() || String(domainNum),
                formatted: domainLabel
            });
            summary.parameters.push({
                name: 'mintRecipient',
                type: 'bytes32',
                description: 'Destination recipient (bytes32)',
                value: mintRecipient,
                formatted: solanaRecipient ? `Solana: ${solanaRecipient}` : null
            });
            summary.parameters.push({
                name: 'burnToken',
                type: 'address',
                description: 'Token burned (should be canonical USDC)',
                value: formatAddressWithTokenInfo ? formatAddressWithTokenInfo(burnToken) : burnToken
            });

            // Heuristic extraction of Solana pubkeys from payload (v2 executor args)
            const payloadPubkeysV2 = extractSolanaPubkeysFromBytes(solanaPayloadV2);
            if (payloadPubkeysV2.length) {
                summary.parameters.push({
                    name: 'solanaPubkeys',
                    type: 'string[]',
                    description: 'Pubkeys found in Solana payload (candidate accounts)',
                    value: payloadPubkeysV2.join(', '),
                    formatted: payloadPubkeysV2.join(', ')
                });
            }

            return summary;
        }

        // v1 signature: depositForBurn(address burnToken, uint256 amount, uint32 destinationDomain, bytes32 mintRecipient)
        const burnToken = decoded.args[0];
        const amount = decoded.args[1];
        const destinationDomain = decoded.args[2];
        const mintRecipient = decoded.args[3];
        const domainNum = ethers.BigNumber.isBigNumber(destinationDomain) ? destinationDomain.toNumber() : Number(destinationDomain);
        const domainLabel = CIRCLE_DOMAIN_NAMES[domainNum] || String(domainNum);
        const formattedAmount = tryFormatTokenAmount ? tryFormatTokenAmount(amount, burnToken || CIRCLE_USDC) : null;
        const solanaRecipient = bytes32ToBase58(mintRecipient);

        summary.likelyFunction = 'depositForBurn(address burnToken, uint256 amount, uint32 destinationDomain, bytes32 mintRecipient)';
        summary.description = `Burning ${formattedAmount || (amount?.toString?.() || '?')} via Circle CCTP to mint on destination domain ${domainLabel}.`;
        summary.parameters.push({
            name: 'amount',
            type: 'uint256',
            description: 'USDC burned on source chain',
            value: amount?.toString?.() || String(amount),
            formatted: formattedAmount
        });
        summary.parameters.push({
            name: 'destinationDomain',
            type: 'uint32',
            description: 'Circle CCTP domain',
            value: destinationDomain?.toString?.() || String(destinationDomain),
            formatted: domainLabel
        });
        summary.parameters.push({
            name: 'mintRecipient',
            type: 'bytes32',
            description: 'Destination recipient (bytes32)',
            value: mintRecipient,
            formatted: solanaRecipient ? `Solana: ${solanaRecipient}` : null
        });
        summary.parameters.push({
            name: 'burnToken',
            type: 'address',
            description: 'Token burned (should be canonical USDC)',
            value: formatAddressWithTokenInfo ? formatAddressWithTokenInfo(burnToken) : burnToken
        });
        return summary;
    }

    if (!arg || typeof arg !== 'object') return summary;

    const amount = arg.amount;
    const wormholeChain = arg.dstWormholeChain;
    const circleDomain = arg.dstCircleDomain;
    const recipient = arg.mintRecipient;
    const burnToken = arg.burnToken;
    const destinationCaller = arg.destinationCaller;
    const nativeGasDrop = arg.nativeGasDrop;
    const relayerFee = arg.relayerFee;
    const refundPerByte = arg.refundPerByte;
    const refundAddress = arg.refundAddress;
    const solanaPayload = arg.solanaPayload;
    const cctpMetadata = arg.cctpMetadata;

    const wormholeChainNum = ethers.BigNumber.isBigNumber(wormholeChain) ? wormholeChain.toNumber() : Number(wormholeChain);
    const circleDomainNum = ethers.BigNumber.isBigNumber(circleDomain) ? circleDomain.toNumber() : Number(circleDomain);
    const chainLabel = formatWormholeChainName ? formatWormholeChainName(wormholeChainNum) : String(wormholeChainNum);
    const domainLabel = CIRCLE_DOMAIN_NAMES[circleDomainNum] || String(circleDomainNum);
    const formattedAmount = tryFormatTokenAmount ? tryFormatTokenAmount(amount, burnToken || CIRCLE_USDC) : null;
    const solanaRecipient = bytes32ToBase58(recipient);

    summary.parameters.push({
        name: 'amount',
        type: 'uint256',
        description: 'USDC burned on source chain',
        value: amount?.toString?.() || String(amount),
        formatted: formattedAmount
    });
summary.parameters.push({
        name: 'dstWormholeChain',
        type: 'uint16',
        description: 'Portal/Wormhole destination chain',
        value: wormholeChainNum?.toString?.() || String(wormholeChainNum),
        formatted: chainLabel
    });
    summary.parameters.push({
        name: 'dstCircleDomain',
        type: 'uint32',
        description: 'Circle CCTP domain',
        value: circleDomainNum?.toString?.() || String(circleDomainNum),
        formatted: domainLabel
    });
    summary.parameters.push({
        name: 'mintRecipient',
        type: 'bytes32',
        description: 'Destination (Solana) recipient',
        value: recipient,
        formatted: solanaRecipient ? `Solana: ${solanaRecipient}` : null
    });
    summary.parameters.push({
        name: 'burnToken',
        type: 'address',
        description: 'Token burned (should be canonical USDC)',
        value: formatAddressWithTokenInfo ? formatAddressWithTokenInfo(burnToken) : burnToken
    });
    summary.parameters.push({
        name: 'destinationCaller',
        type: 'bytes32',
        description: 'Destination program or caller identifier',
        value: destinationCaller
    });
    summary.parameters.push({
        name: 'nativeGasDrop',
        type: 'uint256',
        description: 'Native gas dropped on destination',
        value: nativeGasDrop?.toString?.() || String(nativeGasDrop)
    });
    summary.parameters.push({
        name: 'relayerFee',
        type: 'uint256',
        description: 'Relayer fee charged on source',
        value: relayerFee?.toString?.() || String(relayerFee)
    });
    summary.parameters.push({
        name: 'refundPerByte',
        type: 'uint256',
        description: 'Refund rate per byte of metadata',
        value: refundPerByte?.toString?.() || String(refundPerByte)
    });
    summary.parameters.push({
        name: 'refundAddress',
        type: 'address',
        description: 'Address receiving any refunds',
        value: refundAddress || '0x0000000000000000000000000000000000000000'
    });
    summary.parameters.push({
        name: 'solanaPayload',
        type: 'bytes',
        description: 'Portal Solana instructions',
        value: solanaPayload ? `${solanaPayload.slice(0, 66)}...` : '0x'
    });
            summary.parameters.push({
                name: 'cctpMetadata',
                type: 'bytes',
                description: 'Circle attestation metadata',
                value: cctpMetadata ? `${cctpMetadata.slice(0, 66)}...` : '0x'
            });

            // Heuristic extraction of Solana pubkeys from payload
            const payloadPubkeys = extractSolanaPubkeysFromBytes(solanaPayload);
            if (payloadPubkeys.length) {
                summary.parameters.push({
                    name: 'solanaPubkeys',
                    type: 'string[]',
                    description: 'Pubkeys found in Solana payload (candidate accounts)',
                    value: payloadPubkeys.join(', '),
                    formatted: payloadPubkeys.join(', ')
                });
            }

    if (burnToken && burnToken.toLowerCase() !== CIRCLE_USDC) {
        summary.hint += ' Warning: burnToken is not canonical USDC.';
    }

    return summary;
}

function buildPortalForwarderSummary(decoded) {
    const args = decoded.args || [];
    const fnName = (decoded.functionName || '').toLowerCase();
    const isForwardEth = fnName === 'forwardeth';

    const forwarderData = args[0];
    const tokenAddress = isForwardEth ? null : args[1];
    const amount = isForwardEth ? null : args[2];
    const feeArgs = isForwardEth ? (args[1] || {}) : (args[3] || {});
    const feeValue = feeArgs.fee !== undefined ? feeArgs.fee : (Array.isArray(feeArgs) ? feeArgs[0] : null);
    const payeeValue = feeArgs.payee || (Array.isArray(feeArgs) ? feeArgs[1] : null);

    const formattedAmount = tryFormatTokenAmount(amount, tokenAddress);
    const formattedFee = feeValue ? tryFormatTokenAmount(feeValue, tokenAddress) : null;

    const dataLength = forwarderData ? (forwarderData.length - 2) / 2 : 0;

    const summary = {
        bridgeName: 'Mayan Portal Forwarder',
        confidence: 'high',
        likelyFunction: decoded.signature || decoded.functionName || 'forwardERC20(bytes,address,uint256,(uint256,address))',
        description: 'Mayan forwarders custody your ERC‑20 tokens, take the configured referrer fee, then forward the encoded payload to Portal (Wormhole).',
        hint: 'Verify the amount, fee, and encoded payload before signing. The bytes blob contains the Portal instructions that will be executed on your behalf.',
        docUrl: 'https://portalbridge.com/',
        parameters: []
    };

    if (tokenAddress) {
        summary.parameters.push({
            name: 'tokenIn',
            type: 'address',
            description: 'Asset the forwarder locks before calling Portal',
            value: formatAddressWithTokenInfo(tokenAddress)
        });
    }

    if (amount) {
        summary.parameters.push({
            name: 'amountIn',
            type: 'uint256',
            description: 'Raw token amount forwarded into the pipeline',
            value: amount?.toString?.() || String(amount),
            formatted: formattedAmount
        });
    } else if (decoded.value && !ethers.BigNumber.from(0).eq(decoded.value)) {
        summary.parameters.push({
            name: 'msg.value',
            type: 'uint256',
            description: 'Native value accompanying the forwarder call',
            value: decoded.value.toString()
        });
    }

    summary.parameters.push({
        name: 'forwarderData',
        type: 'bytes',
        description: `Encoded Mayan/Portal instructions (${dataLength} bytes)`,
        value: forwarderData ? `${forwarderData.slice(0, 66)}...` : '0x'
    });

    summary.parameters.push({
        name: 'fee',
        type: 'uint256',
        description: 'Referrer fee collected before bridging',
        value: feeValue?.toString?.() || (feeValue !== undefined && feeValue !== null ? String(feeValue) : '0'),
        formatted: formattedFee
    });

    summary.parameters.push({
        name: 'payee',
        type: 'address',
        description: 'Address that receives the referrer fee',
        value: payeeValue || '0x0000000000000000000000000000000000000000'
    });

    return summary;
}

function buildLayerZeroSummary(decoded) {
    const fn = (decoded.functionName || '').toLowerCase();
    const args = decoded.args || [];
    const summary = {
        bridgeName: 'LayerZero Endpoint',
        confidence: 'high',
        likelyFunction: decoded.signature || 'LayerZero call',
        description: 'LayerZero endpoints pass arbitrary payloads between chains. Gas and adapter parameters control how the message executes on the destination.',
        hint: 'Confirm the destination chain ID, destination address bytes, payload contents, and adapter parameters before signing. Incorrect parameters can route assets to the wrong chain.',
        docUrl: 'https://layerzero.network/',
        parameters: []
    };

    if (fn === 'send' && args.length >= 6) {
        const dstChain = args[0];
        const destination = args[1];
        const payload = args[2];
        const refundAddress = args[3];
        const zroPaymentAddress = args[4];
        const adapterParams = args[5];

        const dstId = ethers.BigNumber.isBigNumber(dstChain) ? dstChain.toNumber() : Number(dstChain);
        summary.likelyFunction = 'send(uint16 dstChainId, bytes destination, bytes payload, address refundAddress, address zroPaymentAddress, bytes adapterParams)';
        summary.description = `Dispatches a LayerZero packet to chain ID ${dstId || dstChain}.`;

        summary.parameters.push({
            name: 'dstChainId',
            type: 'uint16',
            description: 'LayerZero chain identifier for the target network',
            value: dstId ? dstId.toString() : dstChain?.toString?.() || String(dstChain)
        });
        summary.parameters.push({
            name: 'destination',
            type: 'bytes',
            description: 'Encoded destination contract on the remote chain',
            value: destination
        });
        summary.parameters.push({
            name: 'payload',
            type: 'bytes',
            description: `Application payload (length ${payload ? payload.length / 2 - 1 : 0} bytes)`,
            value: payload ? `${payload.slice(0, 66)}...` : '0x'
        });
        summary.parameters.push({
            name: 'refundAddress',
            type: 'address',
            description: 'Receives any unused message fees',
            value: refundAddress
        });
        summary.parameters.push({
            name: 'zroPaymentAddress',
            type: 'address',
            description: 'Optional ZRO payer (zero address = native payment)',
            value: zroPaymentAddress
        });
        summary.parameters.push({
            name: 'adapterParams',
            type: 'bytes',
            description: 'Adapter parameters (e.g., destination gas & airdrop)',
            value: adapterParams ? `${adapterParams.slice(0, 66)}...` : '0x'
        });
        return summary;
    }

    if (fn === 'receivepayload' && args.length >= 6) {
        summary.likelyFunction = 'receivePayload(uint16 srcChainId, bytes srcAddress, address dstAddress, uint64 nonce, uint gasLimit, bytes payload)';
        summary.description = 'Executes an incoming LayerZero message on this chain.';
        summary.parameters.push({
            name: 'srcChainId',
            type: 'uint16',
            description: 'Source LayerZero chain identifier',
            value: args[0]?.toString?.() || String(args[0])
        });
        summary.parameters.push({
            name: 'srcAddress',
            type: 'bytes',
            description: 'Source contract as bytes',
            value: args[1]
        });
        summary.parameters.push({
            name: 'dstAddress',
            type: 'address',
            description: 'Application contract receiving the payload',
            value: args[2]
        });
        summary.parameters.push({
            name: 'nonce',
            type: 'uint64',
            description: 'LayerZero message nonce',
            value: args[3]?.toString?.() || String(args[3])
        });
        summary.parameters.push({
            name: 'gasLimit',
            type: 'uint256',
            description: 'Gas forwarded to the application',
            value: args[4]?.toString?.() || String(args[4])
        });
        summary.parameters.push({
            name: 'payload',
            type: 'bytes',
            description: 'Verified payload executing on this chain',
            value: args[5] ? `${args[5].slice(0, 66)}...` : '0x'
        });
        return summary;
    }

    if (fn === 'retrypayload' && args.length >= 3) {
        summary.likelyFunction = 'retryPayload(uint16 srcChainId, bytes srcAddress, bytes payload)';
        summary.description = 'Retries delivery of a previously blocked LayerZero payload.';
        summary.parameters.push({
            name: 'srcChainId',
            type: 'uint16',
            description: 'Source LayerZero chain identifier',
            value: args[0]?.toString?.() || String(args[0])
        });
        summary.parameters.push({
            name: 'srcAddress',
            type: 'bytes',
            description: 'Source contract as bytes',
            value: args[1]
        });
        summary.parameters.push({
            name: 'payload',
            type: 'bytes',
            description: 'Payload being retried',
            value: args[2] ? `${args[2].slice(0, 66)}...` : '0x'
        });
        return summary;
    }

    return summary;
}

function describeSnowbridgeDestination(addrStruct) {
    if (!addrStruct) {
        return { type: 'unknown', value: 'Not provided' };
    }
    const kindValue = ethers.BigNumber.isBigNumber(addrStruct.kind)
        ? addrStruct.kind.toNumber()
        : Number(addrStruct.kind ?? 0);
    const rawData = addrStruct.data || '0x';

    if (kindValue === 0) {
        try {
            const decoded = ethers.utils.defaultAbiCoder.decode(['uint32'], rawData);
            return { type: 'Index', value: decoded[0].toString() };
        } catch (_) {
            return { type: 'Index', value: rawData };
        }
    } else if (kindValue === 1) {
        return { type: 'Address32', value: rawData };
    } else if (kindValue === 2) {
        return { type: 'Address20', value: rawData };
    }
    return { type: 'unknown', value: rawData };
}

function tryFormatTokenAmount(amount, tokenAddress) {
    if (!amount || !tokenAddress || !ethers.BigNumber.isBigNumber(amount)) return null;
    const info = getTokenInfo(tokenAddress);
    if (!info) return null;
    try {
        return `${formatWithCommas(ethers.utils.formatUnits(amount, info.decimals))} ${info.symbol}`;
    } catch (_) {
        return null;
    }
}

function formatWormholeChainName(chainId) {
    if (!Number.isFinite(chainId)) return `Chain ${chainId}`;
    return WORMHOLE_CHAIN_NAME_MAP[chainId] || `Chain ${chainId}`;
}

function extractAddressArg(decodedTx, index) {
    if (!decodedTx.args || !decodedTx.args[index]) return null;
    const value = decodedTx.args[index];
    if (typeof value === 'string') return value;
    try {
        return ethers.utils.getAddress(value);
    } catch (_) {
        return null;
    }
}

function extractBytes32Arg(decodedTx, index) {
    if (!decodedTx.args || decodedTx.args[index] === undefined) return null;
    const value = decodedTx.args[index];
    try {
        if (typeof value === 'string') return value;
        return ethers.utils.hexlify(value);
    } catch (_) {
        return null;
    }
}

function extractAmountArg(decodedTx, index) {
    if (!decodedTx.args || decodedTx.args[index] === undefined) return null;
    try {
        const raw = ethers.BigNumber.from(decodedTx.args[index]);
        const formatted = ethers.utils.formatUnits(raw, 18);
        return { raw: raw.toString(), formatted };
    } catch (_) {
        return null;
    }
}

function extractDeadlineArg(decodedTx, index) {
    if (!decodedTx.args || decodedTx.args[index] === undefined) return null;
    try {
        const raw = ethers.BigNumber.from(decodedTx.args[index]);
        const seconds = raw.toNumber();
        const humanReadable = new Date(seconds * 1000).toUTCString();
        return { raw: raw.toString(), humanReadable };
    } catch (_) {
        return null;
    }
}

function extractNumericArg(decodedTx, index) {
    if (!decodedTx.args || decodedTx.args[index] === undefined) return null;
    try {
        const raw = ethers.BigNumber.from(decodedTx.args[index]);
        return raw.toNumber();
    } catch (_) {
        return null;
    }
}

function findFirstBytes32(interpretations) {
    const bytesParam = interpretations?.find(p => p.possibleTypes.some(t => t.type === 'bytes32'));
    return bytesParam ? bytesParam.raw : null;
}

// Decode manual mode
async function decodeManual() {
    const txData = document.getElementById('manual-tx-data').value.trim();
    const abiJson = document.getElementById('manual-abi').value.trim();
    const txMeta = readOptionalTxMeta('manual');
    const senderAddress = document.getElementById('manual-wallet-address')?.value.trim() || null;
    const simulationOptions = {
        simulationRequested: isSimulationEnabled('manual'),
        txMeta,
        txData,
        contractAddress: txMeta?.to || null,
        senderAddress
    };

    if (!txData) {
        showError('Please provide transaction data');
        return;
    }

    const isJSON = isEIP712JSON(txData);
    console.log('Is EIP-712 JSON?', isJSON);

    if (isJSON) {
        console.log('Processing as EIP-712 JSON');
        try {
            const decoded = await encodeAndDecodeEIP712JSON(txData);
            displayEIP712Decoded(decoded);
            return;
        } catch (error) {
            console.error('EIP-712 JSON processing error:', error);
            showError('Failed to process EIP-712 JSON: ' + error.message);
            return;
        }
    }

    const isHex = isEIP712Data(txData);
    console.log('Is EIP-712 Hex?', isHex);

    if (isHex) {
        console.log('Processing as EIP-712 Hex');
        try {
            const decoded = await decodeEIP712(txData);
            displayEIP712Decoded(decoded);
            return;
        } catch (error) {
            console.error('EIP-712 hex decode failed:', error);
        }
    }

    console.log('Processing as regular transaction');

    if (!abiJson) {
        const decoded = manualDecode(txData);
        attachTransactionHash(decoded, txMeta, txData);
        displayManualDecoded(decoded);
        return;
    }

    try {
        const abi = JSON.parse(abiJson);
        console.log('Parsed ABI:', abi);

        const functions = abi.filter(item => item.type === 'function');
        const hasFallbackOrReceive = abi.some(item => item.type === 'fallback' || item.type === 'receive');

        console.log('Functions in ABI:', functions.length);
        console.log('Has fallback/receive:', hasFallbackOrReceive);
        console.log('Should show proxy warning:', functions.length === 0 && hasFallbackOrReceive);

        if (functions.length === 0 && hasFallbackOrReceive) {
            console.log('Showing proxy warning');
            const decoded = manualDecode(txData);
            decoded.proxyWarning = '⚠ Proxy Contract Detected: The ABI you provided appears to be for a proxy contract (only contains fallback/receive/events/constructor). To decode properly, you need the Implementation Contract ABI. Check the block explorer for "Read as Proxy" or "Implementation" to find the actual contract address, then use that ABI instead.';
            attachTransactionHash(decoded, txMeta, txData);
            displayManualDecoded(decoded);
            return;
        }

        console.log('Attempting to decode with provided ABI');
        const decoded = await decodeTxData(txData, abi);
        attachTransactionHash(decoded, txMeta, txData);
        await displayDecoded(decoded, simulationOptions);
    } catch (error) {
        console.log('Error in manual decode:', error);
        const commonResult = tryCommonAbis(txData);
        if (commonResult) {
            try {
                const decoded = await decodeTxData(txData, commonResult.abi, commonResult.protocol);
                attachTransactionHash(decoded, txMeta, txData);
                await displayDecoded(decoded, simulationOptions);
            } catch (e) {
                const decoded = manualDecode(txData);
                attachTransactionHash(decoded, txMeta, txData);
                displayManualDecoded(decoded);
            }
        } else {
            const decoded = manualDecode(txData);
            attachTransactionHash(decoded, txMeta, txData);
            displayManualDecoded(decoded);
        }
    }
} async function decodeAuto() {
    const apiKeyInput = document.getElementById('api-key').value.trim();
    const contractAddress = document.getElementById('contract-address').value.trim();
    const txData = document.getElementById('auto-tx-data').value.trim();
    const overrideTo = document.getElementById('auto-tx-to')?.value.trim() || null;
    const txMeta = readOptionalTxMeta('auto', overrideTo || contractAddress);
    const senderAddress = document.getElementById('auto-wallet-address')?.value.trim() || null;
    const simulationOptions = {
        simulationRequested: isSimulationEnabled('auto'),
        txMeta,
        txData,
        contractAddress: overrideTo || contractAddress,
        senderAddress
    };

    if (!txData) {
        showError('Please provide transaction data');
        return;
    }

    clearDecodeStatus();

    if (isEIP712JSON(txData)) {
        console.log('Auto mode: Processing as EIP-712 JSON');
        updateDecodeStatus('Detected EIP-712 JSON payload. Decoding typed data...', 'info');
        try {
            const decoded = await encodeAndDecodeEIP712JSON(txData);
            displayEIP712Decoded(decoded);
            return;
        } catch (error) {
            console.error('EIP-712 JSON processing error:', error);
            showError('Failed to process EIP-712 JSON: ' + error.message);
            return;
        }
    }

    if (isEIP712Data(txData)) {
        console.log('Auto mode: Processing as EIP-712 Hex');
        updateDecodeStatus('Detected EIP-712 encoded payload. Attempting decode...', 'info');
        try {
            const decoded = await decodeEIP712(txData);
            displayEIP712Decoded(decoded);
            return;
        } catch (error) {
            console.error('EIP-712 hex decode failed:', error);
        }
    }

    if (!contractAddress) {
        showError('Please provide contract address');
        return;
    }

    if (apiKeyInput) {
        saveApiKey(apiKeyInput);
    }

    let proxyInfo = null;
    const effectiveApiKey = apiKeyInput || getSavedApiKey();

    try {
        const commonResult = tryCommonAbis(txData);
        if (commonResult) {
            updateDecodeStatus('Decoded using built-in protocol ABI.', 'success');
            const decoded = await decodeTxData(txData, commonResult.abi, commonResult.protocol, contractAddress);
            attachTransactionHash(decoded, txMeta, txData);
            await displayDecoded(decoded, simulationOptions);
            return;
        }

        if (!effectiveApiKey) {
            updateDecodeStatus('No Etherscan API key available. Falling back to heuristic decode.', 'warning');
            displayHeuristicFallback(txData, contractAddress, proxyInfo, txMeta);
            return;
        }

        updateDecodeStatus('Fetching ABI for provided contract...', 'info');
        const baseAbi = await fetchAbiFromEtherscan(contractAddress, effectiveApiKey);

        // Try explorer implementation ABI first (common proxy case where proxy ABI is minimal)
        const explorerImplementation = await fetchImplementationFromExplorer(contractAddress, effectiveApiKey);
        if (explorerImplementation) {
            updateDecodeStatus(`Explorer reports implementation ${explorerImplementation}. Fetching ABI...`, 'info');
            const implAbi = await fetchAbiFromEtherscan(explorerImplementation, effectiveApiKey);
            try {
                const decodedExplorer = await decodeTxData(txData, implAbi, null, contractAddress);
                if (decodedExplorer) {
                    decodedExplorer.proxyWarning = `Detected proxy relationship via explorer metadata. Decoded via implementation ${explorerImplementation}.`;
                    attachTransactionHash(decodedExplorer, txMeta, txData);
                    updateDecodeStatus('Decoded via explorer-provided implementation ABI.', 'success');
                    await displayDecoded(decodedExplorer, simulationOptions);
                    return;
                }
            } catch (decodeError) {
                console.info('Decoding with explorer implementation ABI failed:', decodeError.message || decodeError);
            }
        }

        let decodedWithBaseAbi = null;
        try {
            decodedWithBaseAbi = await decodeTxData(txData, baseAbi, null, contractAddress);
        } catch (decodeError) {
            console.info('Decoding with provided ABI failed:', decodeError.message || decodeError);
        }

        if (decodedWithBaseAbi) {
            updateDecodeStatus('Decoded using contract ABI.', 'success');
            attachTransactionHash(decodedWithBaseAbi, txMeta, txData);
            await displayDecoded(decodedWithBaseAbi, simulationOptions);
            return;
        }

        updateDecodeStatus('ABI did not match the provided contract. Checking for proxy implementation...', 'warning');

        try {
            proxyInfo = await resolveProxyImplementation(contractAddress, updateDecodeStatus);
        } catch (proxyError) {
            console.warn('Proxy detection failed:', proxyError.message || proxyError);
        }

        if (proxyInfo?.implementation) {
            updateDecodeStatus(`Fetching ABI for implementation ${proxyInfo.implementation}...`, 'info');
            const implAbi = await fetchAbiFromEtherscan(proxyInfo.implementation, effectiveApiKey);
            let decodedProxy = null;
            try {
                decodedProxy = await decodeTxData(txData, implAbi, null, contractAddress);
            } catch (decodeError) {
                console.info('Decoding with proxy implementation ABI failed:', decodeError.message || decodeError);
            }
            if (decodedProxy) {
                decodedProxy.proxyWarning = `Detected ${proxyInfo.proxyType.toUpperCase()} proxy. Decoded via implementation ${proxyInfo.implementation}.`;
                decodedProxy.implementationAddress = proxyInfo.implementation;
                decodedProxy.proxyContractAddress = contractAddress;
                attachTransactionHash(decodedProxy, txMeta, txData);
                updateDecodeStatus('Decoded via proxy implementation ABI.', 'success');
                await displayDecoded(decodedProxy, simulationOptions);
                return;
            }
        }
    } catch (error) {
        const chain = getCurrentChain();
        updateDecodeStatus('Falling back to best-effort heuristic decode.', 'warning');
        if (error.message === 'CONTRACT_NOT_VERIFIED') {
            showError(`⚠ Contract Not Verified on Etherscan (${chain.name}) - Using best-effort Decoder`);
        } else if (error.message === 'CORS_BLOCKED') {
            showError('📶 Network Access Blocked - Using best-effort Decoder');
        } else {
            console.error('Automatic decode failed:', error);
            showError('Failed to decode with ABI - Using best-effort Decoder');
        }

        displayHeuristicFallback(txData, contractAddress, proxyInfo, txMeta);
        return;
    }

    updateDecodeStatus('Unable to decode via ABI path. Showing heuristic decode.', 'warning');
    displayHeuristicFallback(txData, contractAddress, proxyInfo, txMeta);
}// Display decoded transaction with ABI
async function displayDecoded(decoded, options = {}) {
    const chain = getCurrentChain();
    const riskLevel = assessRisk(decoded.functionName, decoded.args, decoded.protocol);

    let html = '';

    const riskLabels = {
        'low': 'Low Risk',
        'medium': 'Medium Risk',
        'high': 'High Risk'
    };

    const isApproval = decoded.functionName.toLowerCase().includes('approve');
    const isUnlimitedApproval = isApproval && riskLevel === 'high';
    const isLimitedApproval = isApproval && riskLevel === 'medium';

    const riskTooltips = {
        'low': `<strong>Low Risk Transaction</strong>
                <ul>
                    <li>Read-only operations</li>
                    <li>Standard deposits</li>
                    <li>Non-sensitive function calls</li>
                </ul>
                <em>Generally safe to proceed</em>`,
        'medium': isLimitedApproval
            ? `<strong>Medium Risk Transaction</strong>
               <ul>
                   <li>Grants LIMITED token approval</li>
                   <li>Spender can only use the approved amount</li>
                   <li>You can revoke this later</li>
               </ul>
               <em>Review the approved amount and spender address</em>`
            : `<strong>Medium Risk Transaction</strong>
               <ul>
                   <li>Transfers tokens from your wallet</li>
                   <li>Withdraws funds</li>
                   <li>Borrows against collateral</li>
               </ul>
               <em>Review amounts carefully</em>`,
        'high': isUnlimitedApproval
            ? `<strong>High Risk Transaction</strong>
               <ul>
                   <li>Grants UNLIMITED token approval</li>
                   <li>Spender can take all your tokens</li>
                   <li>Commonly used by DEXs for convenience</li>
                   <li>Can be revoked anytime</li>
               </ul>
               <em>Warning: Only approve highly trusted contracts!</em>`
            : `<strong>High Risk Transaction</strong>
               <ul>
                   <li>Transfers contract ownership</li>
                   <li>Executes delegatecalls</li>
                   <li>Sets operator permissions (NFTs)</li>
                </ul>
                <em>Warning: Only approve trusted contracts!</em>`
    };

    html += `<div class="risk-badge risk-${riskLevel}">
                ${riskLabels[riskLevel]}
                <span class="tooltip-container">
                    <span class="tooltip-icon">?</span>
                    <span class="tooltip-text">${riskTooltips[riskLevel]}</span>
                </span>
             </div>`;
    html += `<span class="chain-badge">${chain.name}</span>`;

    if (decoded.proxyWarning) {
        html += `<div class="error-message" style="margin: 20px 0;">
            ${decoded.proxyWarning}
        </div>`;
    }

    if (decoded.protocol) {
        html += `<div class="info-row">
            <div class="info-label">Protocol Detected</div>
            <div class="info-value">${decoded.protocol}</div>
        </div>`;
    }

    const labelReference = getAddressLabel(decoded.contractAddress);
    const generalSummary = generateTransactionSummary(decoded);
    const bridgeSummary = buildBridgeAssessment(decoded, decoded.interpretations || []);
    let finalSummary = bridgeSummary || generalSummary;

    // Fallback: ensure Circle CCTP burn calls get a summary even if bridge detection failed
    if (!finalSummary && decoded.functionName && decoded.functionName.toLowerCase() === 'depositforburn') {
        debugLog('summary', 'circle-fallback-summary triggered');
        let burnToken = decoded.args?.[0];
        let amount = decoded.args?.[1];
        if (decoded.args && decoded.args.length >= 5 && !ethers.utils.isAddress(decoded.args[0]) && ethers.utils.isAddress(decoded.args[4])) {
            amount = decoded.args[0];
            burnToken = decoded.args[4];
        }
        const tokenInfo = burnToken ? getTokenInfo(burnToken) : null;
        const symbol = tokenInfo ? tokenInfo.symbol : 'tokens';
        const decimals = tokenInfo ? tokenInfo.decimals : 18;
        let formattedAmount = amount ? amount.toString() : '?';
        try {
            formattedAmount = ethers.utils.formatUnits(amount, decimals);
            formattedAmount = formatWithCommas(formattedAmount);
        } catch (_) { }
        const targetLabel = formatAddressWithName(decoded.contractAddress || '');
        finalSummary = {
            description: `Calling <strong>depositForBurn</strong> on ${targetLabel} to burn <strong>${formattedAmount} ${symbol}</strong> for Circle CCTP mint on the destination chain.`,
            hint: 'Fallback summary: Circle CCTP burn detected.'
        };
    }

    // If this was decoded via proxy path and no summary matched, still show a proxy-aware summary.
    if (!finalSummary && decoded.functionName) {
        const targetLabel = formatAddressWithName(decoded.contractAddress || '');
        finalSummary = {
            description: `Calling <strong>${decoded.functionName}</strong> on ${targetLabel} (decoded via implementation${decoded.proxyWarning ? ' after proxy detection' : ''}).`,
            hint: decoded.proxyWarning ? decoded.proxyWarning : ''
        };
    }

    // If proxy detected, include proxy→implementation note in the hint
    if (decoded.proxyWarning) {
        const proxyLabel = formatAddressWithName(decoded.contractAddress || decoded.proxyContractAddress || '');
        const implLabel = decoded.implementationAddress ? decoded.implementationAddress : 'implementation contract';
        const proxyNote = `Proxy call: ${proxyLabel} forwarding to ${implLabel} (decoded on implementation ABI).`;
        finalSummary.hint = finalSummary.hint ? `${finalSummary.hint}<br>${proxyNote}` : proxyNote;
    }

    if (finalSummary) {
        html += `<div class="txn-summary">
            <h3><i class="fas fa-file-signature"></i> Transaction Summary</h3>
            <p>${finalSummary.description}</p>
            ${finalSummary.hint ? `<div style="margin-top:8px; font-size:0.9em; color:#555;"><i class="fas fa-info-circle"></i> ${finalSummary.hint}</div>` : ''}
        </div>`;
    }

    if (options.simulationRequested) {
        const simTo = options.contractAddress || decoded.contractAddress;
        const simData = options.txData || decoded.txData;
        const simValue = options.txMeta?.value || decoded.value || 0;
        if (simTo && simData) {
            const simulation = await runDeterministicSimulation({
                to: simTo,
                data: simData,
                value: simValue,
                from: options.txMeta?.from
            });
            html += renderSimulationBlock(simulation, simTo);
        } else {
            html += `<div class="info-row">
                <div class="info-label">Simulation (eth_call)</div>
                <div class="info-value">
                    <div class="simulation-box">
                        <div><span class="status-pill warning">Skipped</span>Missing contract address or transaction data for simulation.</div>
                    </div>
                </div>
            </div>`;
        }
    }

    if (options.senderAddress) {
        const impact = await buildAssetImpact(decoded, options);
        if (impact?.html) {
            html += impact.html;
        }
    }

    const selectorHint = decoded.selector || (decoded.txData ? decoded.txData.slice(0, 10) : null);
    html += `<div class="info-row">
        <div class="info-label">Function Name</div>
        <div class="info-value">
            ${escapeHtml(decoded.functionName)}
            ${selectorHint ? ` <span style="font-size: 0.9em; color: #666;">(${escapeHtml(selectorHint)})</span>` : ''}
            ${labelReference ? `<span class="trusted-label" title="From Address Book"><i class="fas fa-check-circle"></i> ${escapeHtml(labelReference.label)}</span>` : ''}
            ${isApproval ? '<div class="small-text">You are giving someone else permission to spend this amount from your account.</div>' : ''}
        </div>
    </div>`;

    html += `<div class="info-row">
        <div class="info-label">Function Signature</div>
        <div class="info-value">${escapeHtml(decoded.signature)}</div>
    </div>`;

    if (bridgeSummary) {
        html += `<div class="info-row">
            <div class="info-label">${escapeHtml(bridgeSummary.bridgeName || 'Bridge Details')}</div>
            <div class="info-value">
                <strong>${escapeHtml(bridgeSummary.likelyFunction || decoded.functionName)}</strong><br>
                ${escapeHtml(bridgeSummary.description)}
                ${bridgeSummary.hint ? `<div class="small-text" style="margin-top: 8px;">${escapeHtml(bridgeSummary.hint)}${bridgeSummary.docUrl ? ` (<a href="${escapeHtml(bridgeSummary.docUrl)}" target="_blank" rel="noopener noreferrer">docs</a>)` : ''}</div>` : ''}
            </div>
        </div>`;

        if (bridgeSummary.parameters && bridgeSummary.parameters.length > 0) {
            html += `<div class="info-row">
                <div class="info-label">Bridge Parameters</div>
                <div class="param-group">`;

            bridgeSummary.parameters.forEach(param => {
                const rawValue = param.value !== undefined && param.value !== null ? param.value : 'Not available';
                const formattedDiffers = param.formatted && String(param.formatted) !== String(rawValue);
                const primaryValue = formattedDiffers ? param.formatted : rawValue;
                html += `<div class="param-item">
                    <strong>${escapeHtml(param.name)}</strong> (${escapeHtml(param.type)})<br>
                    <span style="color: #666; font-size: 0.9em;">${escapeHtml(param.description)}</span><br>
                    <span style="color: #666;">${escapeHtml(primaryValue)}</span><br>
                    ${formattedDiffers ? `<span class="formatted-value">${escapeHtml(param.formatted)}</span><br>` : ''}
                    ${formattedDiffers ? `<span style="color: #999; font-size: 0.85em;">Raw: ${escapeHtml(rawValue)}</span>` : ''}
                </div>`;
            });

            html += `</div></div>`;
        }

        if (typeof validateBridgeCall === 'function') {
            const validation = validateBridgeCall(bridgeSummary, decoded);
            if (validation?.results?.length) {
                html += `<div class="info-row">
                    <div class="info-label">Bridge Validation</div>
                    <div class="info-value">
                        <div class="param-group" style="padding-left:0; border-left:none;">`;
                validation.results.forEach(res => {
                    const cls = res.status === 'success' ? 'success' : (res.status === 'fail' ? 'error' : 'warning');
                    html += `<div class="param-item">
                        <div><span class="status-pill ${cls}" style="margin-right:8px;">${escapeHtml(res.status.toUpperCase())}</span><strong>${escapeHtml(res.label)}</strong></div>
                        ${res.detail ? `<div style="color:#666; margin-top:4px;">${escapeHtml(res.detail)}</div>` : ''}
                    </div>`;
                });
                html += `</div></div></div>`;
            }
        }
    }

    if (decoded.fragment && decoded.args && decoded.fragment.inputs) {
        html += `<div class="info-row">
            <div class="info-label">Parameters</div>
            <div class="param-group">`;

        decoded.fragment.inputs.forEach((input, index) => {
            const value = decoded.args[index];
            let displayValue = value;
            let formattedAmount = null;

            if (input.type === 'uint256' || input.type === 'uint112' || input.type === 'uint128') {
                if (decoded.contractAddress) {
                    const tokenInfo = getTokenInfo(decoded.contractAddress);
                    if (tokenInfo) {
                        try {
                            formattedAmount = ethers.utils.formatUnits(value, tokenInfo.decimals);
                            formattedAmount = `${formatWithCommas(formattedAmount)} ${tokenInfo.symbol}`;
                        } catch (_) { }
                    }
                }
            } else if (input.type.includes('[]')) {
                displayValue = Array.isArray(value) ? value.join(', ') : value.toString();
            } else if (input.type === 'bytes' && typeof value === 'string') {
                displayValue = value.slice(0, 66) + (value.length > 66 ? '...' : '');
            }

            const rawHexValue = getHexValueForParam(input, value);
            const ledgerHint = rawHexValue ? formatValueForLedger(rawHexValue) : null;

            let paramLabel = null;
            if (input.type === 'address') {
                const entry = getAddressLabel(value);
                if (entry) paramLabel = entry.label;
            }

            html += `<div class="param-item">
                <strong>${escapeHtml(input.name || `param${index}`)}</strong> (${escapeHtml(input.type)})<br>
                <span style="color: #666;">${escapeHtml(displayValue)}</span>
                ${paramLabel ? `<span class="trusted-label"><i class="fas fa-check-circle"></i> ${escapeHtml(paramLabel)}</span>` : ''}<br>`;

            if (formattedAmount) {
                html += `<span class="formatted-value">�%^ ${escapeHtml(formattedAmount)}</span>`;
            }

            if (rawHexValue) {
                html += `<span style="color: #999; font-size: 0.85em;">Raw: ${escapeHtml(rawHexValue)}${ledgerHint ? ` <br>(Ledger: ${escapeHtml(ledgerHint)})` : ''}</span>`;
            }

            html += `</div>`;
        });

        html += `</div></div>`;
    }

    if (decoded.txData) {
        const txHash = ethers.utils.keccak256(decoded.txData);
        html += `<div class="info-row" >
            <div class="info-label">Transaction Data (payload) Hash</div>
            <div class="info-value" style="word-break: break-all;">${txHash}</div>
            <div class="small-text" style="margin-top: 10px;">This is the hash of the pure unsigned payload. Compare this hash with your wallet plugin (if supported by it)</div>
        </div>`;
    }
    if (decoded.transactionHash) {
        html += `<div class="info-row" >
            <div class="info-label">Transaction Hash</div>
            <div class="info-value" style="word-break: break-all;">${decoded.transactionHash}</div>
            <div class="small-text">This is the hash of the complete unsigned transaction, derived from the optional transaction envelope fields above. Compare this hash with your wallet plugin or HW wallet (if supported by it). Ledger devices only display the SIGNED transaction hash, which CANNOT be calculated without the private key.</div>
        </div>`;
    }

    const jsonOutput = {
        chain: chain.name,
        function: decoded.functionName,
        signature: decoded.signature,
        parameters: {}
    };

    decoded.fragment?.inputs?.forEach((input, index) => {
        jsonOutput.parameters[input.name || `param${index}`] = {
            type: input.type,
            value: decoded.args[index]?.toString?.() || String(decoded.args[index])
        };
    });

    html += `<div class="info-row" >
        <div class="info-label">JSON Output</div>
        <div class="info-value"><pre>${JSON.stringify(jsonOutput, null, 2)}</pre></div>
    </div>`;

    document.getElementById('output-content').innerHTML = html;
    showOutput();
}
// Display EIP-712 decoded message
function displayEIP712Decoded(decoded) {
    const chain = getCurrentChain();

    const eip712Tooltip = `<strong> EIP - 712 Typed Message</strong>
                           <ul>
                               <li>Structured data for signing</li>
                               <li>Used by dApps for off-chain signatures</li>
                               <li>Common in DEX orders, permits, meta-transactions</li>
                               <li>Shows ABI-encoded representation</li>
                           </ul>
                           <em>Verify all fields before signing</em>`;

    let html = `<div class="risk-badge risk-medium" >
                    📝 EIP - 712 Typed Message Detected
            <span class="tooltip-container" >
                        <span class="tooltip-icon">?</span>
                        <span class="tooltip-text">${eip712Tooltip}</span>
                    </span>
                </div> `;
    html += `<span class="chain-badge" > ${chain.name}</span> `;

    // Display domain and primary type if available (from JSON)
    if (decoded.isFromJSON && decoded.domain) {
        html += `<div class="info-row" >
            <div class="info-label">Message Type</div>
            <div class="info-value">
                <strong>Primary Type:</strong> ${escapeHtml(decoded.primaryType)}<br>
                <strong>Domain:</strong> ${escapeHtml(decoded.domain.name || 'N/A')}<br>
                <strong>Chain ID:</strong> ${escapeHtml(decoded.domain.chainId || 'N/A')}<br>
                <strong>Verifying Contract:</strong> ${escapeHtml(decoded.domain.verifyingContract || 'N/A')}
            </div>
        </div>`;
    }

    // Step 1: Type Hash
    if (decoded.typeHash || decoded.potentialTypeHash) {
        html += `<div class="info-row">
            <div class="info-label">
                <span class="step-badge">STEP 1</span> Type Hash
            </div>
            <div class="info-value" style="word-break: break-all;">${decoded.typeHash || decoded.potentialTypeHash}</div>
            <div class="small-text" style="margin-top: 10px;">keccak256 of the type definition string</div>
        </div>`;
    }

    // Step 2: ABI-Encoded Message Data (RAW HEX)
    html += `<div class="info-row">
        <div class="info-label">
            <span class="step-badge">STEP 2</span> ABI-Encoded Message Data (RAW HEX)
        </div>
        <div class="info-value" style="word-break: break-all;">${decoded.rawData}</div>
        <div class="small-text" style="margin-top: 10px;">This is the ABI-encoded representation of the typed message</div>
    </div>`;

    // Step 3: Message Hash (Struct Hash)
    if (decoded.structHash) {
        html += `<div class="info-row">
            <div class="info-label">
                <span class="step-badge">STEP 3</span> Message Hash (Struct Hash)
            </div>
            <div class="info-value" style="word-break: break-all;">${decoded.structHash}</div>
            <div class="small-text" style="margin-top: 10px;">keccak256(typeHash + encodedMessage)</div>
        </div>`;
    }

    // Step 4: Domain Separator (if available)
    if (decoded.domainSeparator) {
        html += `<div class="info-row">
            <div class="info-label">
                <span class="step-badge">STEP 4</span> Domain Separator
            </div>
            <div class="info-value" style="word-break: break-all;">${decoded.domainSeparator}</div>
            <div class="small-text" style="margin-top: 10px;">Hash of the domain (chain, contract, etc.)</div>
        </div>`;
    }

    // Final: EIP-712 Signature Hash (if available)
    if (decoded.finalHash) {
        html += `<div class="info-row" style="border: 2px solid #28a745;">
            <div class="info-label">
                <span class="step-badge" style="background: #28a745;">FINAL</span> EIP-712 Signature Hash
            </div>
            <div class="info-value" style="word-break: break-all;">${decoded.finalHash}</div>
            <div class="small-text" style="margin-top: 10px;">keccak256("\\x19\\x01" + domainSeparator + structHash) - This is what gets signed</div>
        </div>`;
    } else {
        // Note about missing information
        html += `<div class="info-row">
            <div class="info-label">⚠️ Missing Information</div>
            <div class="info-value" style="color: #856404;">
                ${escapeHtml(decoded.note || 'This is ABI-encoded typed message data.')}<br><br>
                <strong>To compute the complete EIP-712 signature hash, the following are needed:</strong><br>
                • Domain Separator (requires domain configuration: chain ID, verifying contract)<br>
                • EIP-712 Signature Hash (requires: keccak256("\\x19\\x01" + domainSeparator + structHash))<br><br>
                Paste the original typed data JSON structure to see the complete signature hash.
            </div>
        </div>`;
    }

    // Display interpreted parameters
    if (decoded.interpretations && decoded.interpretations.length > 0) {
        html += `<div class="info-row">
            <div class="info-label">Decoded Parameters</div>
            <div class="param-group">`;

        decoded.interpretations.forEach((param, index) => {
            html += `<div class="param-item">
                <strong>Parameter ${index}</strong><br>
                <span style="color: #666; font-size: 0.85em;">Raw: ${escapeHtml(param.raw)}</span><br><br>`;

            param.possibleTypes.forEach(type => {
                if (type.type === 'address') {
                    html += `<span style="color: #dc0d17;">📍 Address:</span> ${escapeHtml(type.value)}<br>`;
                } else if (type.type === 'uint256') {
                    html += `<span style="color: #666;">🔢 Uint256:</span> ${escapeHtml(type.value)}<br>`;
                } else if (type.type === 'bytes32') {
                    html += `<span style="color: #666;">📦 Bytes32/Hash:</span> ${escapeHtml(type.value.slice(0, 20))}...<br>`;
                }
            });

            html += `</div>`;
        });

        html += `</div></div> `;
    }

    // Add Transaction Data (payload) Hash
    if (decoded.rawData) {
        const txHash = ethers.utils.keccak256(decoded.rawData);
        html += `<div class="info-row" >
            <div class="info-label">Transaction Data (payload) Hash</div>
            <div class="info-value" style="word-break: break-all;">${txHash}</div>
            <div class="small-text" style="margin-top: 10px;">Compare this hash with your hardware wallet before signing</div>
        </div> `;
    }
    if (decoded.transactionHash) {
        html += `<div class="info-row" >
            <div class="info-label">Transaction Hash</div>
            <div class="info-value" style="word-break: break-all;">${decoded.transactionHash}</div>
            <div class="small-text">Reconstructed using the optional transaction envelope fields.</div>
        </div> `;
    }

    document.getElementById('output-content').innerHTML = html;
    showOutput();
}

// Display manual decoded transaction
function displayManualDecoded(decoded) {
    const chain = getCurrentChain();
    const assessment = assessTransaction(decoded);

    let html = '';

    // Show proxy warning if present
    if (decoded.proxyWarning) {
        html += `<div class="error-message" style = "margin-bottom: 20px;" >
            ${escapeHtml(decoded.proxyWarning)}
                 </div> `;
    }

    const aiTooltip = `<strong> Best - effort heuristic Decoding</strong>
                       <ul>
                           <li>No contract ABI available</li>
                           <li>Parameter names are educated guesses</li>
                           <li>Types inferred from data patterns</li>
                           <li>May not be 100% accurate</li>
                       </ul>
                       <em>For precise decoding, provide the ABI</em>`;

    html += `<div class="risk-badge risk-medium" >
                    ⚠ Best - effort heuristic Decode(No ABI)
            <span class="tooltip-container" >
                        <span class="tooltip-icon">?</span>
                        <span class="tooltip-text">${aiTooltip}</span>
                    </span>
                </div> `;
    html += `<span class="chain-badge" > ${chain.name}</span> `;

    html += `<div class="info-row" >
        <div class="info-label">Best-effort Assessment</div>
        <div class="info-value">
            <strong style="color: #dc0d17;">Likely Function:</strong> ${escapeHtml(assessment.likelyFunction)}<br>
            <strong>Confidence:</strong> ${escapeHtml(assessment.confidence)}<br><br>
            <strong>Description:</strong><br>
            ${escapeHtml(assessment.description)}
            ${assessment.hint ? `<div class="small-text" style="margin-top: 8px;">${escapeHtml(assessment.hint)}</div>` : ''}
        </div>
    </div>`;

    html += `<div class="info-row">
        <div class="info-label">Function Selector</div>
        <div class="info-value">${escapeHtml(decoded.selector)}</div>
    </div>`;

    if (assessment.parameters.length > 0) {
        html += `<div class="info-row">
            <div class="info-label">Interpreted Parameters</div>
            <div class="param-group">`;

        assessment.parameters.forEach((param) => {
            html += `<div class="param-item">
                <strong>${escapeHtml(param.name)}</strong> (${escapeHtml(param.type)})<br>
                <span style="color: #666; font-size: 0.9em;">${escapeHtml(param.description)}</span><br>`;

            if (param.formatted) {
                html += `<span class="formatted-value">${escapeHtml(param.formatted)}</span><br>`;
            }

            const ledgerHint = formatValueForLedger(param.value);
            html += `<br><span style="color: #999; font-size: 0.85em;">Raw: ${escapeHtml(param.value)}${ledgerHint ? ` <br>(Ledger: ${escapeHtml(ledgerHint)})` : ''}</span>
            </div>`;
        });

        html += `</div></div>`;
    }

    // Add Transaction Data (payload) Hash for manual decode too
    if (decoded.txData) {
        const txHash = ethers.utils.keccak256(decoded.txData);
        html += `<div class="info-row">
            <div class="info-label">Transaction Data (payload) Hash</div>
            <div class="info-value" style="word-break: break-all;">${txHash}</div>
            <div class="small-text" style="margin-top: 10px;">Compare this hash with your hardware wallet before signing</div>
        </div>`;
    }
    if (decoded.transactionHash) {
        html += `<div class="info-row">
            <div class="info-label">Transaction Hash</div>
            <div class="info-value" style="word-break: break-all;">${decoded.transactionHash}</div>
        </div>`;
    }

    html += `<div class="info-row">
        <div class="info-label">All Possible Interpretations</div>
        <div class="param-group">`;

    if (decoded.interpretations) {
        decoded.interpretations.forEach((param, index) => {
            html += `<div class="param-item">
                <strong>Option ${index + 1}</strong>
            </div>`;
        });
    }

    html += `</div></div>`;

    html += `<div class="info-row">
        <div class="info-label">⚠️ Important Note</div>
        <div class="info-value" style="color: #856404;">
            This is a best-effort interpretation without the contract ABI.
            Parameter names and exact types may be incorrect.
            For accurate decoding, provide the contract ABI in Manual Mode or verify the contract on Etherscan.
        </div>
    </div>`;

    document.getElementById('output-content').innerHTML = html;
    showOutput();
}

// Generate a human-readable summary of the transaction
function generateTransactionSummary(decoded) {
    if (!decoded) return null;

    let description = '';
    let hint = '';
    debugLog('summary', 'generateTransactionSummary', {
        functionName: decoded.functionName,
        signature: decoded.signature,
        args: decoded.args
    });

    if (decoded.functionName === 'transfer' && decoded.args.length === 2) {
        // ERC20 Transfer
        const to = decoded.args[0];
        const amount = decoded.args[1];
        const tokenInfo = getTokenInfo(decoded.contractAddress);
        const symbol = tokenInfo ? tokenInfo.symbol : 'tokens';
        const decimals = tokenInfo ? tokenInfo.decimals : 18;

        let formattedAmount = amount.toString();
        try {
            formattedAmount = ethers.utils.formatUnits(amount, decimals);
            formattedAmount = formatWithCommas(formattedAmount);
        } catch (e) { }

        description = `Sending <strong>${formattedAmount} ${symbol}</strong> to ${to}`;
    } else if (decoded.functionName === 'approve' && decoded.args.length === 2) {
        // ERC20 Approve
        const spender = decoded.args[0];
        const amount = decoded.args[1];
        const tokenInfo = getTokenInfo(decoded.contractAddress);
        const symbol = tokenInfo ? tokenInfo.symbol : 'tokens';
        const decimals = tokenInfo ? tokenInfo.decimals : 18;

        let formattedAmount = amount.toString();
        try {
            formattedAmount = ethers.utils.formatUnits(amount, decimals);
            formattedAmount = formatWithCommas(formattedAmount);
        } catch (e) { }

        const spenderDisplay = formatAddressWithName(spender);
        description = `Approving <strong>${spenderDisplay}</strong> to spend <strong>${formattedAmount} ${symbol}</strong>`;
        hint = 'Check if the spender is a trusted contract.';
    } else if (decoded.functionName && decoded.functionName.toLowerCase() === 'depositforburn' && decoded.args.length >= 2) {
        let burnToken = decoded.args[0];
        let amount = decoded.args[1];
        if (!ethers.utils.isAddress(decoded.args[0]) && decoded.args.length >= 5 && ethers.utils.isAddress(decoded.args[4])) {
            amount = decoded.args[0];
            burnToken = decoded.args[4];
        }
        const tokenInfo = getTokenInfo(burnToken);
        const symbol = tokenInfo ? tokenInfo.symbol : 'tokens';
        const decimals = tokenInfo ? tokenInfo.decimals : 18;
        let formattedAmount = amount.toString();
        try {
            formattedAmount = ethers.utils.formatUnits(amount, decimals);
            formattedAmount = formatWithCommas(formattedAmount);
        } catch (e) { }
        const targetLabel = formatAddressWithName(decoded.contractAddress || '');
        description = `Calling <strong>depositForBurn</strong> on ${targetLabel} to burn <strong>${formattedAmount} ${symbol}</strong> for Circle CCTP mint on the destination chain.`;
        hint = 'Confirm the burn amount, destination domain/recipient, and burn token before signing.';
    } else if (decoded.functionName === 'transformERC20') {
        description = `Swapping tokens via 0x API (transformERC20)`;
    } else {
        // Generic Fallback
        return null;
    }

    return { description, hint };
}

// Initialize on page load
window.onload = function () {
    loadApiKey();
    updateExplorerHint();
    if (typeof initOptionalSections === 'function') {
        initOptionalSections();
    }
};




