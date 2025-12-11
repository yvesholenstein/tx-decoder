(function() {
  const outputEl = () => document.getElementById('output-content');
  const payloadEl = () => document.getElementById('payload-input');

  function renderKV(key, value, mono=false, canCopy=false) {
    const v = value == null ? '' : String(value);
    const copyBtn = canCopy ? `<button class="copy-btn" data-copy="${v}">Copy</button>` : '';
    return `<div class="k">${key}</div><div class="v ${mono ? 'mono' : ''}">${v} ${copyBtn}</div>`;
  }

  function renderResult(res) {
    const out = outputEl();
    document.getElementById('output').classList.add('active');
    if (!res.ok) {
      console.warn('Decoder error', res);
      out.innerHTML = `<div class="output-title">Error</div><div class="kv">${renderKV('Message', res.error || 'Unknown error')}</div>`;
      return;
    }

    const ver = document.getElementById('version');
    if (ver) ver.textContent = APP_VERSION;

    const parts = [];
    parts.push(`<div class="output-title">Summary</div>`);
    parts.push(`<div class="kv">`);
    parts.push(renderKV('Input Source', res.source || 'unknown'));
    parts.push(renderKV('Hash (hex)', res.hashHex ? String(res.hashHex) : (res.hash ? String(res.hash) : '—'), true, !!res.hashHex));
    if (res.hashBase64) parts.push(renderKV('Hash (base64)', res.hashBase64, true, true));
    parts.push(renderKV('Hash Note', res.hashNote || ''));
    parts.push(renderKV('TON Lib Loaded', res.libLoaded ? 'Yes' : 'No'));
    if (!res.messages || !res.messages.length) parts.push(renderKV('Status', 'No messages parsed', false));
    if (res.raw && res.raw.reason) parts.push(renderKV('Parse Reason', res.raw.reason));
    parts.push(`</div>`);

    if (res.messages && res.messages.length) {
      res.messages.forEach((m, i) => {
        parts.push(`<hr style="border: 1px solid var(--border); border-bottom: 0; margin: 10px 0;"/>`);
        parts.push(`<div class="output-title">Message ${i+1}</div>`);
        parts.push(`<div class="kv">`);
        parts.push(renderKV('Protocol', m.protocol || 'Unknown'));
        parts.push(renderKV('Action', m.action || 'Unknown'));
        parts.push(renderKV('Summary', m.summary || ''));
        if (m.fields) {
          if (m.fields.fromAddress) parts.push(renderKV('From', m.fields.fromAddress, true, true));
          if (m.fields.toAddress) parts.push(renderKV('To', m.fields.toAddress, true, true));
          if (m.fields.valueTon != null) parts.push(renderKV('Value (TON)', m.fields.valueTon));
          if (m.fields.opCode != null) parts.push(renderKV('Op Code', `0x${m.fields.opCode.toString(16)}`, true));
          if (m.fields.comment) parts.push(renderKV('Comment', m.fields.comment));
        }
        if (m.notes) parts.push(renderKV('Notes', m.notes));
        parts.push(`</div>`);
      });
    } else {
      parts.push(`<div class="small-text">No internal messages parsed yet. If this is not a staking transaction, it will be shown as Unknown. Ensure TON libraries load to parse message bodies.</div>`);
    }

    if (res.advanced) {
      parts.push(`<hr style="border: 1px solid var(--border); border-bottom: 0; margin: 10px 0;"/>`);
      parts.push(`<div class="output-title">Advanced</div>`);
      parts.push(`<pre class="mono" style="white-space: pre-wrap; background:#0e1217; border:1px solid var(--border); padding:10px; border-radius:10px;">${escapeHtml(JSON.stringify(res.raw, null, 2))}</pre>`);
    }

    out.innerHTML = parts.join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function onDecode() {
    const input = payloadEl().value;
    try {
      console.log('[TON Decoder] Decode button clicked');
      const res = await window.decodeTonPayload(input);
      console.log('[TON Decoder] Result', res);
      renderResult(res);
    } catch (e) {
      console.error('[TON Decoder] Fatal error', e);
      renderResult({ ok: false, error: e?.message || String(e) });
    }
  }

  function onClear() {
    payloadEl().value = '';
    outputEl().innerHTML = '';
    document.getElementById('output').classList.remove('active');
  }

  function copyFromClick(e) {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const val = btn.getAttribute('data-copy') || '';
    navigator.clipboard?.writeText(val);
  }

  // Settings & Dark Mode
  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
  }

  function openSettings() {
    document.getElementById('settings-modal').classList.add('active');
    document.getElementById('show-advanced').checked = !!window.getSettings().showAdvanced;
  }

  function closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
  }

  function saveSettings() {
    const showAdvanced = document.getElementById('show-advanced').checked;
    window.setSettings({ showAdvanced });
  }

  // Wire up
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[TON Decoder] UI init');
    // Match Multi EVM: default light; user can toggle to dark-mode
    document.getElementById('decode-btn').addEventListener('click', onDecode);
    document.getElementById('clear-btn').addEventListener('click', onClear);
    document.getElementById('output-content').addEventListener('click', copyFromClick);
    window.toggleDarkMode = toggleDarkMode;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.saveSettings = saveSettings;
    const ver = document.getElementById('version');
    if (ver) ver.textContent = APP_VERSION;
  });
})();
