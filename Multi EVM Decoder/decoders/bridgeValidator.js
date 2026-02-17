// Simple bridge validation helpers (static, no backend)
// Expects bridgeSummary (from buildBridgeAssessment) and decoded tx.

(function () {
    function toNumberSafe(val) {
        if (val === undefined || val === null) return null;
        try {
            if (typeof val === 'string' && val.startsWith('0x')) {
                return parseInt(val, 16);
            }
            const n = Number(val.toString());
            return Number.isFinite(n) ? n : null;
        } catch (_) {
            return null;
        }
    }

    function isHexLike(v) {
        return typeof v === 'string' && v.startsWith('0x') && v.length % 2 === 0;
    }

    function addResult(results, status, label, detail) {
        results.push({ status, label, detail });
    }

    // Lightweight LayerZero chain list from chain config
    function getKnownChainIds() {
        if (typeof CHAIN_CONFIG !== 'object') return new Set();
        return new Set(Object.values(CHAIN_CONFIG).map(c => c.chainId).filter(Boolean));
    }

    function findParam(summary, predicate) {
        if (!summary?.parameters) return null;
        return summary.parameters.find(p => predicate(p.name || ''));
    }

    function validateBridgeCall(bridgeSummary, decoded) {
        const results = [];
        const knownChains = getKnownChainIds();
        const params = bridgeSummary?.parameters || [];
        const isCircle = (bridgeSummary?.bridgeName || '').toLowerCase().includes('circle');

        // Circle CCTP-specific validation
        if (isCircle) {
            const domainParam = findParam(bridgeSummary, n => n.toLowerCase().includes('domain'));
            if (domainParam) {
                const numeric = toNumberSafe(domainParam.value);
                if (numeric === null) {
                    addResult(results, 'warn', 'CCTP Domain', 'Could not parse Circle destination domain.');
                } else if (numeric <= 0) {
                    addResult(results, 'fail', 'CCTP Domain', 'Domain must be > 0.');
                } else {
                    addResult(results, 'success', 'CCTP Domain', `Domain ${numeric} looks valid.`);
                }
            }

            const chainParam = findParam(bridgeSummary, n => n.toLowerCase().includes('chain'));
            if (chainParam) {
                const numeric = toNumberSafe(chainParam.value);
                if (numeric === null) {
                    addResult(results, 'warn', 'Wormhole Chain', 'Could not parse destination chain ID.');
                } else if (numeric <= 0) {
                    addResult(results, 'fail', 'Wormhole Chain', 'Destination chain ID must be > 0.');
                } else {
                    addResult(results, 'success', 'Wormhole Chain', `Destination chain ${numeric} looks valid.`);
                }
            }

            const recipientParam = findParam(bridgeSummary, n => n.toLowerCase().includes('recipient'));
            if (recipientParam && typeof recipientParam.value === 'string') {
                const v = recipientParam.value;
                if (isHexLike(v) && v.length === 66) {
                    addResult(results, 'success', 'Destination encoding', 'Recipient bytes32 looks well-formed.');
                } else {
                    addResult(results, 'warn', 'Destination encoding', 'Recipient is not bytes32 hex.');
                }
            }

            // Check amount/fee as usual
            params.forEach(p => {
                const name = (p.name || '').toLowerCase();
                if (name.includes('amount') || name.includes('fee')) {
                    try {
                        const bn = ethers.BigNumber.from(p.value);
                        if (bn.lt(0)) {
                            addResult(results, 'fail', `${p.name}`, 'Negative amount/fee is invalid.');
                        } else if (bn.isZero()) {
                            addResult(results, 'warn', `${p.name}`, 'Zero amount/fee; ensure this is intended.');
                        } else {
                            addResult(results, 'success', `${p.name}`, 'Value is non-zero.');
                        }
                    } catch (_) {
                        addResult(results, 'warn', `${p.name}`, 'Amount/fee not parseable.');
                    }
                }
            });

            return { results };
        }

        // Generic chainId check (LayerZero, Wormhole, etc.)
        const chainParam = findParam(bridgeSummary, n => /chain/i.test(n));
        if (chainParam) {
            const chainVal = chainParam.value ?? chainParam.formatted;
            const numeric = toNumberSafe(chainVal);
            if (numeric === null) {
                addResult(results, 'warn', 'Chain ID', 'Could not parse destination chain ID.');
            } else if (numeric <= 0) {
                addResult(results, 'fail', 'Chain ID', 'Destination chain ID is invalid (<=0).');
            } else if (knownChains.size && !knownChains.has(numeric)) {
                addResult(results, 'warn', 'Chain ID', `Chain ${numeric} is not in the configured chain list.`);
            } else {
                addResult(results, 'success', 'Chain ID', `Destination chain ${numeric} looks valid.`);
            }
        }

        // Recipient / destination bytes validation
        const recipientParam = findParam(bridgeSummary, n => /dest|recip|address|account/i.test(n));
        if (recipientParam && typeof recipientParam.value === 'string') {
            const v = recipientParam.value;
            if (isHexLike(v)) {
                if (v.length % 2 === 0 && v.length >= 42) {
                    addResult(results, 'success', 'Destination encoding', 'Destination bytes look well-formed.');
                } else {
                    addResult(results, 'warn', 'Destination encoding', 'Destination bytes have unusual length.');
                }
            } else {
                addResult(results, 'warn', 'Destination encoding', 'Destination is not hex-encoded bytes.');
            }
        }

        // Amount / fee sanity
        params.forEach(p => {
            const name = (p.name || '').toLowerCase();
            if (name.includes('amount') || name.includes('fee')) {
                try {
                    const bn = ethers.BigNumber.from(p.value);
                    if (bn.lt(0)) {
                        addResult(results, 'fail', `${p.name}`, 'Negative amount/fee is invalid.');
                    } else if (bn.isZero()) {
                        addResult(results, 'warn', `${p.name}`, 'Zero amount/fee; ensure this is intended.');
                    } else {
                        addResult(results, 'success', `${p.name}`, 'Value is non-zero.');
                    }
                } catch (_) {
                    addResult(results, 'warn', `${p.name}`, 'Amount/fee not parseable.');
                }
            }
        });

        // Energy Web specific: ensure t2PubKey bytes32
        if ((bridgeSummary?.bridgeName || '').toLowerCase().includes('energy web')) {
            const pk = findParam(bridgeSummary, n => n.toLowerCase().includes('t2') || n.toLowerCase().includes('pub'));
            if (pk && typeof pk.value === 'string') {
                if (pk.value.startsWith('0x') && pk.value.length === 66) {
                    addResult(results, 'success', 'Recipient key', 'Bytes32 recipient key length OK.');
                } else {
                    addResult(results, 'fail', 'Recipient key', 'Recipient key is not bytes32 length.');
                }
            }
        }

        return { results };
    }

    // Expose globally
    window.validateBridgeCall = validateBridgeCall;
})();
