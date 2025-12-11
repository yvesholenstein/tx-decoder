// Load saved settings and API key
function loadApiKey() {
    const savedKey = localStorage.getItem('etherscanApiKey');

    if (savedKey) {
        document.getElementById('api-key').value = savedKey;
        document.getElementById('api-key-status').textContent = '✓ Etherscan API key loaded (works for all chains)';
        document.getElementById('api-key-status').style.color = '#28a745';
    } else {
        document.getElementById('api-key-status').textContent = '';
    }

    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
    }

    const savedSettings = localStorage.getItem('decoderSettings');
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            settings = Object.assign({ formatAmounts: true, showUSD: false, customRpcUrls: {} }, parsed);
        } catch (e) {
            console.warn('Failed to parse saved settings, using defaults');
            settings = { formatAmounts: true, showUSD: false, customRpcUrls: {} };
        }
    } else {
        settings = Object.assign({ formatAmounts: true, showUSD: false, customRpcUrls: {} }, settings || {});
    }

    document.getElementById('format-amounts').checked = settings.formatAmounts;
    document.getElementById('show-usd').checked = settings.showUSD;
    updateCustomRpcInput();
    updateApiKeyWarning();
}

// Save settings
function saveSettings() {
    settings.formatAmounts = document.getElementById('format-amounts').checked;
    settings.showUSD = document.getElementById('show-usd').checked;
    const rpcInput = document.getElementById('custom-rpc-url');
    if (rpcInput) {
        const value = rpcInput.value.trim();
        if (!settings.customRpcUrls) settings.customRpcUrls = {};
        if (value) {
            settings.customRpcUrls[currentChain] = value;
        } else {
            delete settings.customRpcUrls[currentChain];
        }
    }
    localStorage.setItem('decoderSettings', JSON.stringify(settings));
}

// Save API key
function saveApiKey(apiKey) {
    localStorage.setItem('etherscanApiKey', apiKey);
    document.getElementById('api-key-status').textContent = '✓ Etherscan API key saved (works for all chains)';
    document.getElementById('api-key-status').style.color = '#28a745';
    updateApiKeyWarning();
}

// Open settings modal
function openSettings() {
    document.getElementById('settings-modal').classList.add('active');
    updateCustomRpcInput();
}

// Close settings modal
function closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// Switch between manual and auto modes
function switchMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.input-section').forEach(section => section.classList.remove('active'));

    if (mode === 'manual') {
        document.querySelector('.mode-btn:first-child').classList.add('active');
        document.getElementById('manual-mode').classList.add('active');
    } else {
        document.querySelector('.mode-btn:last-child').classList.add('active');
        document.getElementById('auto-mode').classList.add('active');
    }

    hideOutput();
}

// Handle chain selection change
function onChainChange() {
    currentChain = document.getElementById('chain-select').value;
    updateExplorerHint();
    loadApiKey();
    updateCustomRpcInput();
    hideOutput();

    // Clear previous results
    document.getElementById('output-content').innerHTML = '';
}

// Update explorer hint text
function updateExplorerHint() {
    document.getElementById('explorer-hint').textContent = 'Etherscan API key - works for all supported chains - saved locally';
}

function updateApiKeyWarning() {
    const bannerAuto = document.getElementById('api-key-warning-auto');
    const bannerManual = document.getElementById('api-key-warning-manual');
    const hasKey = !!(localStorage.getItem('etherscanApiKey') || '').trim();
    if (bannerAuto) bannerAuto.style.display = hasKey ? 'none' : 'block';
    if (bannerManual) bannerManual.style.display = hasKey ? 'none' : 'block';
}

// Show error message
function showError(message) {
    const html = `<div class="error-message">${message}</div>`;
    document.getElementById('output-content').innerHTML = html;
    showOutput();
}

// Show output section
function showOutput() {
    document.getElementById('output').classList.add('active');
}

// Hide output section
function hideOutput() {
    document.getElementById('output').classList.remove('active');
}

function updateCustomRpcInput() {
    const input = document.getElementById('custom-rpc-url');
    const chainLabel = document.getElementById('custom-rpc-chain');
    if (!input) return;
    if (!settings.customRpcUrls) settings.customRpcUrls = {};
    input.value = settings.customRpcUrls[currentChain] || '';
    if (chainLabel) {
        const chain = CHAIN_CONFIG[currentChain];
        chainLabel.textContent = chain ? chain.name : currentChain;
    }
}

function initOptionalSections() {
    setupTxTypeToggle('manual');
    setupTxTypeToggle('auto');
}

function setupTxTypeToggle(prefix) {
    const select = document.getElementById(`${prefix}-tx-type`);
    if (!select) return;

    const updateVisibility = () => {
        const isLegacy = select.value === 'legacy';
        document.querySelectorAll(`.${prefix}-legacy-field`).forEach(el => {
            el.style.display = isLegacy ? 'block' : 'none';
        });
        document.querySelectorAll(`.${prefix}-eip1559-field`).forEach(el => {
            el.style.display = isLegacy ? 'none' : 'block';
        });
    };

    select.addEventListener('change', updateVisibility);
    updateVisibility();
}

// Address Book UI Handlers
function renderAddressBook() {
    const list = document.getElementById('address-book-list');
    const book = getAddressBook(); // From config.js
    const entries = Object.entries(book);

    if (entries.length === 0) {
        list.innerHTML = '<div class="empty-state">No saved addresses</div>';
        return;
    }

    list.innerHTML = entries.map(([addr, data]) => `
    <div class="address-book-entry">
        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:10px;">
            <strong>${data.label}</strong><br>
            <span style="font-size:0.8em; color:#888;">${addr}</span>
        </div>
        <button class="remove-btn" onclick="handleRemoveAddress('${addr}')">Ç-</button>
    </div>
`).join('');
}

function handleAddAddress() {
    const addrInput = document.getElementById('new-addr-address');
    const labelInput = document.getElementById('new-addr-label');
    const address = addrInput.value.trim();
    const label = labelInput.value.trim();

    if (!ethers.utils.isAddress(address)) {
        alert('Invalid address');
        return;
    }
    if (!label) {
        alert('Please enter a label');
        return;
    }

    addToAddressBook(address, label); // From config.js
    renderAddressBook();
    addrInput.value = '';
    labelInput.value = '';
}

function handleRemoveAddress(address) {
    if (confirm('Remove this address?')) {
        removeFromAddressBook(address);
        renderAddressBook();
    }
}

function convertToWei(prefix) {
    const input = document.getElementById(`${prefix}-native-amount`);
    const target = document.getElementById(`${prefix}-tx-value`);
    if (!input || !target) return;
    const raw = (input.value || '').trim();
    if (!raw) return;

    try {
        const chain = getCurrentChain();
        const decimals = chain?.nativeCurrency?.decimals ?? 18;
        const weiValue = ethers.utils.parseUnits(raw, decimals);
        target.value = weiValue.toString();
    } catch (e) {
        alert('Could not convert amount. Please enter a valid number (e.g., 0.01).');
    }
}

// Hook into openSettings to render the list
// We do this check to prevent double wrapping if the script re-runs
if (!window.hasInitializedAddressBookHook) {
    const originalOpenSettings = openSettings;
    openSettings = function () {
        originalOpenSettings();
        renderAddressBook();
    };
    window.hasInitializedAddressBookHook = true;
}
