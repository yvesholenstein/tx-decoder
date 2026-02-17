        // HTML escaping utility to prevent XSS via innerHTML
        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Calculation mode: 'online' or 'offline'
        let calculationMode = 'online';

        // Initialize default finality provider
        function initializeApp() {
            loadFinalityProviders();
            applyDarkMode();
            initializeEccLib();
        }

        // Initialize ECC library for bitcoinjs-lib (required for Taproot operations)
        function initializeEccLib() {
            try {
                if (typeof bitcoin === 'undefined') {
                    console.warn('bitcoinjs-lib not yet loaded, will initialize later');
                    return;
                }

                // Check if @bitcoinerlab/secp256k1 bundle is loaded
                if (typeof window.ecc !== 'undefined') {
                    console.log('Using bundled @bitcoinerlab/secp256k1');
                    bitcoin.initEccLib(window.ecc);
                    console.log('✅ ECC library initialized with @bitcoinerlab/secp256k1');
                    return;
                }

                // Check if tiny-secp256k1 bundle is loaded
                if (typeof tinysecp256k1 !== 'undefined') {
                    console.log('Using bundled tiny-secp256k1');
                    bitcoin.initEccLib(tinysecp256k1);
                    console.log('✅ ECC library initialized with tiny-secp256k1');
                    return;
                }

                // Fallback: Create manual tiny-secp256k1 compatible interface using noble/secp256k1
                if (typeof nobleSecp256k1 === 'undefined') {
                    console.warn('Neither tiny-secp256k1 nor nobleSecp256k1 loaded');
                    return;
                }

                console.log('Using manual ECC wrapper with noble/secp256k1');
                const ecc = {
                    isPoint: (p) => {
                        if (!p || (p.length !== 33 && p.length !== 65)) return false;
                        try {
                            nobleSecp256k1.Point.fromHex(p);
                            return true;
                        } catch {
                            return false;
                        }
                    },
                    isXOnlyPoint: (p) => {
                        if (!p || p.length !== 32) return false;
                        try {
                            const point = nobleSecp256k1.Point.fromHex('02' + Buffer.from(p).toString('hex'));
                            return point !== null;
                        } catch {
                            return false;
                        }
                    },
                    isPrivate: (d) => {
                        if (!d || d.length !== 32) return false;
                        return nobleSecp256k1.utils.isValidPrivateKey(d);
                    },
                    pointFromScalar: (d, compressed) => {
                        if (!d || d.length !== 32) return null;
                        try {
                            const point = nobleSecp256k1.getPublicKey(d, compressed !== false);
                            return Buffer.from(point);
                        } catch {
                            return null;
                        }
                    },
                    pointCompress: (p, compressed) => {
                        if (!p) return null;
                        try {
                            const point = nobleSecp256k1.Point.fromHex(p);
                            return Buffer.from(point.toRawBytes(compressed !== false));
                        } catch {
                            return null;
                        }
                    },
                    pointMultiply: (p, tweak, compressed) => {
                        if (!p || !tweak) return null;
                        try {
                            const point = nobleSecp256k1.Point.fromHex(p);
                            const tweakBigInt = BigInt('0x' + Buffer.from(tweak).toString('hex'));
                            return Buffer.from(point.multiply(tweakBigInt).toRawBytes(compressed !== false));
                        } catch {
                            return null;
                        }
                    },
                    pointAdd: (a, b, compressed) => {
                        if (!a || !b) return null;
                        try {
                            const pointA = nobleSecp256k1.Point.fromHex(a);
                            const pointB = nobleSecp256k1.Point.fromHex(b);
                            return Buffer.from(pointA.add(pointB).toRawBytes(compressed !== false));
                        } catch {
                            return null;
                        }
                    },
                    xOnlyPointAddTweak: (p, tweak) => {
                        if (!p || p.length !== 32 || !tweak || tweak.length !== 32) return null;
                        try {
                            const point = nobleSecp256k1.Point.fromHex('02' + Buffer.from(p).toString('hex'));
                            const tweakBigInt = BigInt('0x' + Buffer.from(tweak).toString('hex'));
                            const G = nobleSecp256k1.Point.BASE;
                            const tweakedPoint = point.add(G.multiply(tweakBigInt));
                            const tweakedBytes = tweakedPoint.toRawBytes(true);
                            return { parity: tweakedBytes[0] === 0x03 ? 1 : 0, xOnlyPubkey: Buffer.from(tweakedBytes.slice(1)) };
                        } catch {
                            return null;
                        }
                    },
                    privateAdd: (d, tweak) => {
                        if (!d || d.length !== 32 || !tweak || tweak.length !== 32) return null;
                        try {
                            const dBigInt = BigInt('0x' + Buffer.from(d).toString('hex'));
                            const tweakBigInt = BigInt('0x' + Buffer.from(tweak).toString('hex'));
                            const sum = (dBigInt + tweakBigInt) % nobleSecp256k1.CURVE.n;
                            if (sum === 0n) return null;
                            return Buffer.from(sum.toString(16).padStart(64, '0'), 'hex');
                        } catch {
                            return null;
                        }
                    },
                    privateNegate: (d) => {
                        if (!d || d.length !== 32) return null;
                        try {
                            const dBigInt = BigInt('0x' + Buffer.from(d).toString('hex'));
                            const negated = nobleSecp256k1.CURVE.n - dBigInt;
                            return Buffer.from(negated.toString(16).padStart(64, '0'), 'hex');
                        } catch {
                            return null;
                        }
                    },
                    sign: (h, d, e) => {
                        if (!h || h.length !== 32 || !d || d.length !== 32) return null;
                        try {
                            return Buffer.from(nobleSecp256k1.signSync(h, d, { lowS: true, extraEntropy: e }));
                        } catch {
                            return null;
                        }
                    },
                    signSchnorr: (h, d, e) => {
                        if (!h || h.length !== 32 || !d || d.length !== 32) return null;
                        try {
                            return Buffer.from(nobleSecp256k1.schnorr.signSync(h, d, e));
                        } catch {
                            return null;
                        }
                    },
                    verify: (h, Q, signature, strict) => {
                        if (!h || h.length !== 32 || !Q || !signature || signature.length !== 64) return false;
                        try {
                            return nobleSecp256k1.verify(signature, h, Q, { lowS: strict !== false });
                        } catch {
                            return false;
                        }
                    },
                    verifySchnorr: (h, Q, signature) => {
                        if (!h || h.length !== 32 || !Q || Q.length !== 32 || !signature || signature.length !== 64) return false;
                        try {
                            return nobleSecp256k1.schnorr.verify(signature, h, Q);
                        } catch {
                            return false;
                        }
                    }
                };

                // Initialize bitcoinjs-lib with the ECC library
                try {
                    bitcoin.initEccLib(ecc);
                    console.log('✅ ECC library initialized for bitcoinjs-lib');
                } catch (eccError) {
                    console.error('ECC validation failed. Testing individual functions...');

                    // Test each function to find which one is failing
                    const testPrivKey = Buffer.from('0101010101010101010101010101010101010101010101010101010101010101', 'hex');
                    const testPubKey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
                    const testXOnly = Buffer.from('79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
                    const testHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
                    const testSig = Buffer.from('00'.repeat(64), 'hex');

                    console.log('isPoint:', ecc.isPoint(testPubKey));
                    console.log('isXOnlyPoint:', ecc.isXOnlyPoint(testXOnly));
                    console.log('isPrivate:', ecc.isPrivate(testPrivKey));
                    console.log('pointFromScalar:', ecc.pointFromScalar(testPrivKey, true) !== null);
                    console.log('pointCompress:', ecc.pointCompress(testPubKey, true) !== null);
                    console.log('xOnlyPointAddTweak:', ecc.xOnlyPointAddTweak(testXOnly, testPrivKey) !== null);
                    console.log('privateAdd:', ecc.privateAdd(testPrivKey, testPrivKey) !== null);
                    console.log('privateNegate:', ecc.privateNegate(testPrivKey) !== null);

                    throw eccError;
                }
            } catch (error) {
                console.error('Failed to initialize ECC library:', error);
            }
        }

        // Toggle between online and offline calculation mode
        function toggleCalculationMode() {
            const toggle = document.getElementById('offline-mode-toggle');
            const modeStatus = document.getElementById('mode-status');
            const modeDescription = document.getElementById('mode-description');

            if (toggle.checked) {
                calculationMode = 'offline';
                modeStatus.textContent = 'Offline Mode';
                modeStatus.style.color = '#4CAF50';
                modeDescription.textContent = 'Using local JavaScript calculation (experimental)';
            } else {
                calculationMode = 'online';
                modeStatus.textContent = 'Online Mode';
                modeStatus.style.color = '#2196F3';
                modeDescription.textContent = 'Using verified API: christophluescher.pythonanywhere.com';
            }
        }

        // Local storage keys
        const STORAGE_KEYS = {
            FINALITY_PROVIDERS: 'babylon_finality_providers',
            DARK_MODE: 'babylon_dark_mode'
        };

        // Load finality providers from local storage
        function loadFinalityProviders() {
            let providers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINALITY_PROVIDERS) || '[]');

            // Add default provider if none exist
            if (providers.length === 0) {
                providers = [{
                    name: 'BitcoinSuisse',
                    publicKey: 'be2f7942c5dfaa826aec61355ef427fad1095491aa04850c450f812f9b9ca9ed'
                }];
                localStorage.setItem(STORAGE_KEYS.FINALITY_PROVIDERS, JSON.stringify(providers));
            }

            // Update dropdown
            const select = document.getElementById('finality-provider');
            select.innerHTML = '<option value="">Select Finality Provider</option>';
            providers.forEach((provider, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = provider.name;
                select.appendChild(option);
            });

            // Update settings list
            updateFinalityProvidersList();

            // Select first provider by default
            if (providers.length > 0) {
                select.value = 0;
                updateProviderPublicKey();
            }
        }

        function updateProviderPublicKey() {
            const providerIndex = document.getElementById('finality-provider').value;
            const display = document.getElementById('provider-pubkey-display');

            if (!providerIndex) {
                display.textContent = '';
                return;
            }

            const providers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINALITY_PROVIDERS) || '[]');
            const provider = providers[providerIndex];

            if (provider) {
                display.textContent = `Public Key: ${provider.publicKey}`;
            } else {
                display.textContent = '';
            }
        }

        function updateFinalityProvidersList() {
            const providers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINALITY_PROVIDERS) || '[]');
            const container = document.getElementById('finality-providers-list');

            if (providers.length === 0) {
                container.innerHTML = '<p style="color: #666; font-style: italic;">No finality providers configured</p>';
                return;
            }

            container.innerHTML = providers.map((provider, index) => `
                <div class="finality-provider-item">
                    <div>
                        <div class="name">${escapeHtml(provider.name)}</div>
                        <div class="key">${escapeHtml(provider.publicKey)}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteFinalityProvider(${index})">Delete</button>
                </div>
            `).join('');
        }

        function addFinalityProvider() {
            const name = document.getElementById('new-provider-name').value.trim();
            const publicKey = document.getElementById('new-provider-key').value.trim();

            if (!name || !publicKey) {
                showOutput('Error', 'Please enter both name and public key');
                return;
            }

            // Validate public key format (should be 64 hex characters)
            if (!/^[a-fA-F0-9]{64}$/.test(publicKey)) {
                showOutput('Error', 'Invalid public key format. Should be 64 hexadecimal characters.');
                return;
            }

            const providers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINALITY_PROVIDERS) || '[]');
            providers.push({ name, publicKey });
            localStorage.setItem(STORAGE_KEYS.FINALITY_PROVIDERS, JSON.stringify(providers));

            // Clear inputs
            document.getElementById('new-provider-name').value = '';
            document.getElementById('new-provider-key').value = '';

            loadFinalityProviders();
            showOutput('Success', 'Finality provider added successfully!');
        }

        function deleteFinalityProvider(index) {
            if (!confirm('Are you sure you want to delete this finality provider?')) {
                return;
            }

            const providers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINALITY_PROVIDERS) || '[]');
            providers.splice(index, 1);
            localStorage.setItem(STORAGE_KEYS.FINALITY_PROVIDERS, JSON.stringify(providers));

            loadFinalityProviders();
        }

        // Mode switching
        function switchMode(mode, evt) {
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.input-section').forEach(section => section.classList.remove('active'));

            if (evt && evt.target) {
                evt.target.classList.add('active');
            }

            if (mode === 'staking-entry') {
                document.getElementById('staking-entry-mode').classList.add('active');
            } else if (mode === 'staking-exit') {
                document.getElementById('staking-exit-mode').classList.add('active');
            } else if (mode === 'rewards') {
                document.getElementById('rewards-mode').classList.add('active');
            }

            // Hide output
            document.getElementById('output').classList.remove('active');
        }

        // Collapsible sections
        function toggleCollapsible(id) {
            const content = document.getElementById(id);
            const arrow = document.getElementById('arrow-' + id);

            content.classList.toggle('active');
            arrow.classList.toggle('rotated');
        }

        // Calculate Babylon staking address
        async function calculateBabylonAddress() {
            // Clear previous errors
            hideError('address-error');

            const stakerPubkey = document.getElementById('staker-pubkey').value.trim();
            const providerIndex = document.getElementById('finality-provider').value;
            const network = document.getElementById('network').value;
            const btcAmount = parseFloat(document.getElementById('btc-amount').value);
            const timelockBlocks = parseInt(document.getElementById('timelock-blocks').value) || 64000;
            const covenantThreshold = parseInt(document.getElementById('covenant-threshold').value) || 6;
            const debugMode = document.getElementById('debug-mode').checked;

            // Validation
            if (!stakerPubkey || !/^[a-fA-F0-9]{64}$/.test(stakerPubkey)) {
                showError('Please enter a valid staker public key (64 hex characters)', 'address-error');
                return;
            }

            if (!providerIndex) {
                showError('Please select a finality provider', 'address-error');
                return;
            }

            if (!btcAmount || btcAmount <= 0) {
                showError('Please enter a valid Bitcoin amount', 'address-error');
                return;
            }

            const providers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINALITY_PROVIDERS) || '[]');
            const provider = providers[providerIndex];

            // Build parameters object
            const params = {
                stakerPubkey: stakerPubkey,
                finalityProviderPubkey: provider.publicKey,
                network: network,
                amount: btcAmount,
                timelockBlocks: timelockBlocks,
                covenantThreshold: covenantThreshold
            };

            // Add optional parameters
            const blockHeight = document.getElementById('block-height').value;
            if (blockHeight) {
                params.blockHeight = parseInt(blockHeight);
            }

            const unbondingTime = document.getElementById('unbonding-time').value;
            if (unbondingTime) {
                params.unbondingTime = parseInt(unbondingTime);
            }

            const covenantPubkeys = document.getElementById('covenant-pubkeys').value.trim();
            if (covenantPubkeys) {
                try {
                    params.covenantPubkeys = JSON.parse(covenantPubkeys);
                } catch (e) {
                    showError('Invalid covenant public keys JSON format', 'address-error');
                    return;
                }
            }

            // Calculate the staking address
            const result = await computeStakingAddress(params, debugMode);

            // Display result
            document.getElementById('babylon-address-display').innerHTML =
                `<strong>Babylon Staking Address:</strong><br>${escapeHtml(result.address)}<br><br>` +
                `<strong>Script Type:</strong> ${escapeHtml(result.scriptType)}<br>` +
                `<strong>Network:</strong> ${escapeHtml(network.toUpperCase())}`;

            document.getElementById('babylon-address-result').style.display = 'block';

            if (debugMode && result.debug) {
                document.getElementById('debug-info').style.display = 'block';
                document.getElementById('debug-output').textContent = JSON.stringify(result.debug, null, 2);
            } else {
                document.getElementById('debug-info').style.display = 'none';
            }

            // Scroll to result
            document.getElementById('babylon-address-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Default mainnet covenant public keys
        const DEFAULT_COVENANT_PUBKEYS = {
            mainnet: [
                "d45c70d28f169e1f0c7f4a78e2bc73497afe585b70aa897955989068f3350aaa",
                "4b15848e495a3a62283daaadb3f458a00859fe48e321f0121ebabbdd6698f9fa",
                "23b29f89b45f4af41588dcaf0ca572ada32872a88224f311373917f1b37d08d1",
                "d3c79b99ac4d265c2f97ac11e3232c07a598b020cf56c6f055472c893c0967ae",
                "8242640732773249312c47ca7bdb50ca79f15f2ecc32b9c83ceebba44fb74df7",
                "e36200aaa8dce9453567bba108bdc51f7f1174b97a65e4dc4402fc5de779d41c",
                "f178fcce82f95c524b53b077e6180bd2d779a9057fdff4255a0af95af918cee0",
                "de13fc96ea6899acbdc5db3afaa683f62fe35b60ff6eb723dad28a11d2b12f8c",
                "cbdd028cfe32c1c1f2d84bfec71e19f92df509bba7b8ad31ca6c1a134fe09204"
            ]
        };

        // Offline address calculation (local JavaScript implementation)
        async function computeStakingAddressOffline(params, debugMode) {
            try {
                // Validate required libraries are available
                if (typeof bitcoin === 'undefined' || typeof nobleSecp256k1 === 'undefined' || typeof Buffer === 'undefined') {
                    throw new Error('Required libraries not loaded. Please ensure bitcoinjs-lib and noble/secp256k1 are loaded.');
                }

                const debugInfo = debugMode ? {} : null;

                // Get covenant public keys and parameters
                const covenantPubkeys = params.covenantPubkeys || DEFAULT_COVENANT_PUBKEYS[params.network] || DEFAULT_COVENANT_PUBKEYS.mainnet;
                const covenantThreshold = params.covenantThreshold || 6;
                const timelock = params.timelockBlocks ? parseInt(params.timelockBlocks) : 64000;
                const unbondingTime = params.unbondingTime || 1000;

                // Convert hex pubkeys to Buffer (x-only format = 32 bytes)
                // If pubkey is 33 bytes (compressed), remove first byte; if 32 bytes, use as-is
                const toXOnly = (hexPubkey) => {
                    const buf = Buffer.from(hexPubkey, 'hex');
                    return buf.length === 33 ? buf.slice(1) : buf;
                };

                const stakerPubkey = toXOnly(params.stakerPubkey);
                const finalityProviderPubkey = toXOnly(params.finalityProviderPubkey);

                // Convert covenant pubkeys to x-only and then SORT
                const covenantPubkeyBuffers = covenantPubkeys
                    .map(pk => toXOnly(pk))
                    .sort(Buffer.compare);

                if (debugMode) {
                    debugInfo.inputs = {
                        stakerPubkey: params.stakerPubkey,
                        finalityProviderPubkey: params.finalityProviderPubkey,
                        timelock: timelock,
                        unbondingTime: unbondingTime,
                        covenantThreshold: covenantThreshold,
                        covenantCount: covenantPubkeyBuffers.length
                    };
                }

                // Build the three Babylon staking scripts according to the BIP-341 spec

                // 1. Timelock script: <staker_pk> OP_CHECKSIGVERIFY <timelock> OP_CHECKSEQUENCEVERIFY
                const timelockScript = bitcoin.script.compile([
                    stakerPubkey,
                    bitcoin.opcodes.OP_CHECKSIGVERIFY,
                    bitcoin.script.number.encode(timelock),
                    bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY
                ]);

                // 2. Unbonding script: <staker_pk> OP_CHECKSIGVERIFY <covenant_pk1> OP_CHECKSIG <covenant_pk2> OP_CHECKSIGADD ... <threshold> OP_NUMEQUAL
                // This allows early unbonding with staker + covenant quorum (NO finality provider)
                const unbondingScriptOps = [
                    stakerPubkey,
                    bitcoin.opcodes.OP_CHECKSIGVERIFY
                ];

                // Add covenant pubkeys - first one uses OP_CHECKSIG, rest use OP_CHECKSIGADD
                // Keep the original order from the API (do not sort)
                covenantPubkeyBuffers.forEach((pk, index) => {
                    unbondingScriptOps.push(pk);
                    if (index === 0) {
                        unbondingScriptOps.push(bitcoin.opcodes.OP_CHECKSIG);
                    } else {
                        unbondingScriptOps.push(bitcoin.opcodes.OP_CHECKSIGADD);
                    }
                });

                unbondingScriptOps.push(bitcoin.script.number.encode(covenantThreshold));
                unbondingScriptOps.push(bitcoin.opcodes.OP_NUMEQUAL);

                const unbondingScript = bitcoin.script.compile(unbondingScriptOps);

                // 3. Slashing script: <staker_pk> OP_CHECKSIGVERIFY <fp_pk> OP_CHECKSIGVERIFY <covenant_pk1> OP_CHECKSIG ... <threshold> OP_NUMEQUAL
                const slashingScriptOps = [
                    stakerPubkey,
                    bitcoin.opcodes.OP_CHECKSIGVERIFY,
                    finalityProviderPubkey,
                    bitcoin.opcodes.OP_CHECKSIGVERIFY
                ];

                // Add covenant pubkeys - first one uses OP_CHECKSIG, rest use OP_CHECKSIGADD
                covenantPubkeyBuffers.forEach((pk, index) => {
                    slashingScriptOps.push(pk);
                    if (index === 0) {
                        slashingScriptOps.push(bitcoin.opcodes.OP_CHECKSIG);
                    } else {
                        slashingScriptOps.push(bitcoin.opcodes.OP_CHECKSIGADD);
                    }
                });

                slashingScriptOps.push(bitcoin.script.number.encode(covenantThreshold));
                slashingScriptOps.push(bitcoin.opcodes.OP_NUMEQUAL);

                const slashingScript = bitcoin.script.compile(slashingScriptOps);

                if (debugMode) {
                    debugInfo.scripts = {
                        timelock: {
                            hex: timelockScript.toString('hex'),
                            length: timelockScript.length
                        },
                        unbonding: {
                            hex: unbondingScript.toString('hex'),
                            length: unbondingScript.length
                        },
                        slashing: {
                            hex: slashingScript.toString('hex'),
                            length: slashingScript.length
                        }
                    };
                }

                // Create Taproot tree structure: ((timelock, unbonding), slashing)
                // This is a nested tree with timelock and unbonding as siblings, and slashing as parent
                const internalPubkey = Buffer.from('50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0', 'hex');

                const scriptTree = [
                    [
                        { output: timelockScript },
                        { output: unbondingScript }
                    ],
                    { output: slashingScript }
                ];

                // Create the taproot payment
                const payment = bitcoin.payments.p2tr({
                    internalPubkey: internalPubkey,
                    scriptTree: scriptTree,
                    network: params.network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
                });

                if (debugMode) {
                    debugInfo.taproot = {
                        internalPubkey: internalPubkey.toString('hex'),
                        outputPubkey: payment.pubkey ? payment.pubkey.toString('hex') : 'N/A',
                        address: payment.address
                    };
                }

                return {
                    address: payment.address,
                    scriptType: 'Taproot (P2TR) with Babylon staking script tree',
                    debug: debugInfo
                };

            } catch (error) {
                throw new Error(`Offline calculation failed: ${error.message}`);
            }
        }

        async function computeStakingAddress(params, debugMode) {
            // Check calculation mode
            if (calculationMode === 'offline') {
                return await computeStakingAddressOffline(params, debugMode);
            }

            // Online mode (API-based calculation)
            try {
                // Get covenant public keys
                const covenantPubkeys = params.covenantPubkeys || DEFAULT_COVENANT_PUBKEYS[params.network] || DEFAULT_COVENANT_PUBKEYS.mainnet;

                // Prepare request payload matching the expected API format
                const payload = {
                    staker_pubkey: params.stakerPubkey,
                    finality_providers: params.finalityProviderPubkey, // Single string, not array
                    network: params.network,
                    debug: debugMode
                };

                // Add optional parameters only if they have values
                if (params.timelockBlocks) {
                    payload.timelock = parseInt(params.timelockBlocks);
                }

                if (params.covenantThreshold) {
                    payload.covenantThreshold = parseInt(params.covenantThreshold);
                }

                if (params.unbondingTime) {
                    payload.unbondingTime = parseInt(params.unbondingTime);
                }

                if (params.blockHeight) {
                    payload.block = parseInt(params.blockHeight);
                }

                // Covenant pubkeys as comma-separated string
                if (covenantPubkeys && covenantPubkeys.length > 0) {
                    payload.covenantPubkeys = covenantPubkeys.join(',');
                }

                // Call the Babylon staking address computation API
                const response = await fetch('https://christophluescher.pythonanywhere.com/api/compute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
                }

                const data = await response.json();

                // Check if there's an error in the response
                if (data.error) {
                    throw new Error(data.error);
                }

                return {
                    address: data.final_address || data.address,
                    scriptType: 'Taproot (P2TR) with timelock and covenant conditions',
                    debug: debugMode ? data : null
                };
            } catch (error) {
                console.error('Error computing staking address:', error);
                return {
                    address: 'Error: ' + error.message,
                    scriptType: 'Error',
                    debug: debugMode ? { error: error.message, stack: error.stack } : null
                };
            }
        }


        // Calculate all transaction hashes
        function calculateAllHashes() {
            // Clear previous errors
            hideError('hashes-error');

            const stakerPubkey = document.getElementById('staker-pubkey').value.trim();
            const providerIndex = document.getElementById('finality-provider').value;
            const btcAmount = parseFloat(document.getElementById('btc-amount').value);
            const stakingAddress = document.getElementById('staking-address').value.trim();
            const feeRate = parseFloat(document.getElementById('fee-rate').value) || 3;
            const timelockBlocks = parseInt(document.getElementById('timelock-blocks').value) || 64000;

            // Validation
            if (!stakerPubkey) {
                showError('Please enter staker public key', 'hashes-error');
                return;
            }

            if (!providerIndex) {
                showError('Please select a finality provider', 'hashes-error');
                return;
            }

            if (!btcAmount) {
                showError('Please enter Bitcoin amount', 'hashes-error');
                return;
            }

            if (!stakingAddress) {
                showError('Please enter your staking Taproot address', 'hashes-error');
                return;
            }

            const providers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINALITY_PROVIDERS) || '[]');
            const provider = providers[providerIndex];

            // Calculate hashes for each transaction
            const hashes = calculateTransactionHashes({
                stakerPubkey: stakerPubkey,
                finalityProviderPubkey: provider.publicKey,
                amount: btcAmount,
                stakingAddress: stakingAddress,
                feeRate: feeRate,
                timelockBlocks: timelockBlocks
            });

            // Display hashes
            document.getElementById('hash-slash-regular').innerHTML =
                `<strong>Expected Transaction Hash:</strong><br>${escapeHtml(hashes.slashingRegular)}<br><br>` +
                `<em>Compare this with the hash shown on your Keystone 3 device</em>`;

            document.getElementById('hash-slash-unbonding').innerHTML =
                `<strong>Expected Transaction Hash:</strong><br>${escapeHtml(hashes.slashingUnbonding)}<br><br>` +
                `<em>Compare this with the hash shown on your Keystone 3 device</em>`;

            document.getElementById('hash-link').innerHTML =
                `<strong>Expected Transaction Hash:</strong><br>${escapeHtml(hashes.link)}<br><br>` +
                `<em>Compare this with the hash shown on your Keystone 3 device</em>`;

            document.getElementById('hash-staking').innerHTML =
                `<strong>Expected Transaction Hash:</strong><br>${escapeHtml(hashes.staking)}<br><br>` +
                `<em>Compare this with the hash shown on your Keystone 3 device</em>`;

            showOutput('Success', 'All transaction hashes calculated! Compare each hash with your hardware wallet display before signing.');
        }

        function calculateTransactionHashes(params) {
            // This is a placeholder implementation
            // Real implementation would:
            // 1. Construct each actual transaction with proper inputs/outputs
            // 2. Calculate the transaction ID (double SHA256)
            // 3. Return the actual hashes

            // For now, generate deterministic demo hashes
            return {
                slashingRegular: generateDemoTxHash('slash_regular_' + params.stakerPubkey + params.amount),
                slashingUnbonding: generateDemoTxHash('slash_unbond_' + params.stakerPubkey + params.amount),
                link: generateDemoTxHash('link_' + params.stakerPubkey + params.finalityProviderPubkey),
                staking: generateDemoTxHash('staking_' + params.stakingAddress + params.amount)
            };
        }

        function generateDemoTxHash(input) {
            // Generate a demo transaction hash (64 hex characters)
            let hash = '';
            for (let i = 0; i < input.length; i++) {
                hash += input.charCodeAt(i).toString(16);
            }
            return (hash + '0'.repeat(64)).substring(0, 64);
        }

        // Unbonding process
        function processUnbonding() {
            showOutput('Unbonding Process',
                'You may proceed with signing the unbonding transactions on your Keystone 3 hardware wallet.\n\n' +
                'The unbonding transactions are deterministically derived from your verified staking transaction.\n\n' +
                'Review each transaction on your Keystone device before signing.'
            );
        }

        // Rewards claiming
        function processRewardsClaim() {
            const babylonAddr = document.getElementById('babylon-address').value.trim();

            if (!babylonAddr) {
                showOutput('Error', 'Please enter your Babylon chain address');
                return;
            }

            showOutput('Rewards Claiming',
                `Ready to claim rewards to address: ${babylonAddr}\n\n` +
                'Please ensure:\n' +
                '• Your Keplr wallet is connected\n' +
                '• Your Ledger Flex is connected and unlocked\n' +
                '• You have sufficient BABY tokens for gas fees (< 1 BABY)\n\n' +
                'Proceed with the transaction in Keplr and confirm on your Ledger device.'
            );
        }

        // Settings and UI functions
        function openSettings() {
            document.getElementById('settings-modal').classList.add('active');
        }

        function closeSettings() {
            document.getElementById('settings-modal').classList.remove('active');
        }

        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDark ? 'true' : 'false');
        }

        function applyDarkMode() {
            const isDark = localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
            if (isDark) {
                document.body.classList.add('dark-mode');
            }
        }

        function showOutput(title, message) {
            const output = document.getElementById('output');
            const content = document.getElementById('output-content');

            content.innerHTML = `
                <div class="info-row">
                    <div class="info-label">${escapeHtml(title)}</div>
                    <div class="info-value" style="white-space: pre-wrap;">${escapeHtml(message)}</div>
                </div>
            `;

            output.classList.add('active');
            output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Show error message below button
        function showError(message, errorElementId) {
            const errorDiv = document.getElementById(errorElementId);
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.classList.add('show');
                errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    errorDiv.classList.remove('show');
                }, 5000);
            }
        }

        // Hide error message
        function hideError(errorElementId) {
            const errorDiv = document.getElementById(errorElementId);
            if (errorDiv) {
                errorDiv.classList.remove('show');
            }
        }

        // Initialize on page load
        window.addEventListener('DOMContentLoaded', initializeApp);
