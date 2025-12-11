// Core decoding pipeline (skeleton) — focuses on input normalization, hashing hook, and dispatch to protocol decoders

(function() {
  const B64_RE = /^(?:[A-Za-z0-9+/]|[-_])+={0,2}$/;
  const HEX_RE = /^0x?[0-9a-fA-F]+$/;

  const settings = loadSettings();
  const utf8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

  function loadSettings() {
    try {
      const raw = localStorage.getItem('tonDecoderSettings');
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(next) {
    const merged = { ...settings, ...next };
    localStorage.setItem('tonDecoderSettings', JSON.stringify(merged));
    return merged;
  }

  function isLikelyBase64(str) {
    const s = str.replace(/\s+/g, '').replace(/^data:.*;base64,/, '');
    return B64_RE.test(s) && s.length > 8;
  }

  function base64UrlToBase64(s) {
    let t = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = t.length % 4;
    if (pad === 2) t += '==';
    else if (pad === 3) t += '=';
    else if (pad === 1) throw new Error('Invalid base64 length');
    return t;
  }

  function isLikelyHex(str) {
    return HEX_RE.test(str) && str.replace(/^0x/, '').length % 2 === 0;
  }

  function parseTonUrl(url) {
    try {
      const u = new URL(url);
      // common: ton://transfer?address=...&amount=...&boc=...
      const boc = u.searchParams.get('boc') || u.searchParams.get('payload');
      const address = u.searchParams.get('address') || u.searchParams.get('to');
      const amount = u.searchParams.get('amount'); // nanotons (1e9) typical
      const text = u.searchParams.get('text') || u.searchParams.get('comment');
      return { ok: true, boc, url: url, address, amount, text };
    } catch (e) {
      return { ok: false, error: 'Invalid ton:// URL' };
    }
  }

  function detectInputFormat(inputRaw) {
    const input = (inputRaw || '').trim();
    if (!input) return { kind: 'empty' };
    if (input.startsWith('ton://')) return { kind: 'ton-url' };
    if (input.startsWith('http') && input.includes('tonconnect')) return { kind: 'tonconnect-url' };

    // If it looks like a BOC base64 (te6cc... typical)
    if (isLikelyBase64(input)) return { kind: 'boc-base64' };
    // Hex BOC or hex body
    if (isLikelyHex(input)) return { kind: 'hex' };
    return { kind: 'unknown' };
  }

  function hexToBase64(hex) {
    const clean = hex.replace(/^0x/, '');
    if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    let bin = '';
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin);
  }

  function normalizeToBocBase64(inputRaw) {
    const input = (inputRaw || '').trim();
    const dt = detectInputFormat(input);
    if (dt.kind === 'empty') return { error: 'No input provided' };

    if (dt.kind === 'ton-url' || dt.kind === 'tonconnect-url') {
      const parsed = parseTonUrl(input);
      if (!parsed.ok) return { error: 'Invalid ton:// URL' };
      if (!parsed.boc) {
        return { bocBase64: null, source: dt.kind, urlDetails: parsed };
      }
      return { bocBase64: parsed.boc, source: dt.kind, urlDetails: parsed };
    }

    if (dt.kind === 'boc-base64') return { bocBase64: base64UrlToBase64(input), source: 'base64' };
    if (dt.kind === 'hex') return { bocBase64: hexToBase64(input), source: 'hex' };

    return { error: 'Unsupported input format. Provide BOC base64/hex or ton:// URL.' };
  }

  function tonLibAvailable() {
    return typeof TonWeb !== 'undefined' && TonWeb?.boc?.Cell && TonWeb?.utils;
  }

  function tonCoreAvailable() {
    // Try a few likely globals for ton-core UMD
    const g = window;
    return !!(g.toncore || g.ton || g.TonCore);
  }

  function getTonCore() {
    const g = window;
    return g.toncore || g.ton || g.TonCore || null;
  }

  async function computeExternalMessageHash(bocBase64) {
    if (!tonLibAvailable()) {
      return { hashHex: null, hashBase64: null, note: 'TON library not loaded – cannot compute external message hash yet.' };
    }
    try {
      const cells = TonWeb.boc.Cell.fromBoc(bocBase64);
      if (!cells || !cells.length) return { hashHex: null, hashBase64: null, note: 'Invalid BOC: no cells' };
      const root = cells[0];
      const hashBytes = root.hash();
      const hashHex = '0x' + TonWeb.utils.bytesToHex(hashBytes);
      let hashBase64;
      if (typeof Buffer !== 'undefined') {
        hashBase64 = Buffer.from(hashBytes).toString('base64');
      } else {
        const bin = Array.from(hashBytes).map(b => String.fromCharCode(b)).join('');
        hashBase64 = btoa(bin);
      }
      return { hashHex, hashBase64, note: 'Hash of external message root cell' };
    } catch (e) {
      return { hashHex: null, hashBase64: null, note: 'Failed to compute hash: ' + (e?.message || String(e)) };
    }
  }

  function extractOpCodeFromBodySlice(bodyCell) {
    const cell = bodyCell;
    if (!cell) return null;
    try {
      if (typeof cell.beginParse === 'function') {
        const slice = cell.beginParse();
        if (slice) {
          if (typeof slice.loadUint === 'function') {
            const op = slice.loadUint(32);
            return typeof op === 'bigint' ? Number(op) : op;
          }
          if (typeof slice.readUint === 'function') {
            const op = slice.readUint(32);
            if (op != null) return typeof op === 'bigint' ? Number(op) : parseInt(op.toString(), 10);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to extract op code', e);
    }
    return null;
  }

  function extractCommentAfterOpcode(slice, op) {
    try {
      const opValue = typeof op === 'bigint' ? op : BigInt(op ?? 0);
      if (opValue !== 0n) return null;
      if (!slice || typeof slice.remaining !== 'number' || slice.remaining <= 0) return null;
      if (typeof slice.loadBuffer !== 'function') return null;
      const byteLength = Math.ceil(slice.remaining / 8);
      if (!byteLength) return null;
      const buf = slice.loadBuffer(byteLength);
      if (!buf || !buf.length) return null;
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buf).replace(/\0+$/, '').trim();
      return text.length ? text : null;
    } catch (e) {
      return null;
    }
  }

  function parseBocWithoutTonLib(bocBase64) {
    const bytes = base64ToBytes(bocBase64);
    let offset = 0;

    function readUint8() {
      return bytes[offset++];
    }

    function readUint32() {
      const value = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 4;
      return value >>> 0;
    }

    function readUint(size) {
      let value = 0n;
      for (let i = 0; i < size; i++) {
        value = (value << 8n) | BigInt(bytes[offset++]);
      }
      return Number(value);
    }

    const magic = readUint32();
    const BOC_MAGIC_PREFIX = 0xb5ee9c72;
    const BOC_MAGIC_PREFIX_CRC32C = 0x68ff65f3;
    if (magic !== BOC_MAGIC_PREFIX && magic !== BOC_MAGIC_PREFIX_CRC32C) {
      throw new Error('Unsupported BOC magic');
    }

    const flags = readUint8();
    const hasIdx = (flags & 0x80) !== 0;
    const hasCrc32 = (flags & 0x40) !== 0;
    const hasCacheBits = (flags & 0x20) !== 0;
    if (hasCacheBits) {
      throw new Error('BOC with cache bits not supported in fallback parser');
    }
    const sizeBytes = flags & 0x07;
    if (sizeBytes === 0) throw new Error('Invalid BOC size bytes');

    const offsetBytes = readUint8();
    const cellsCount = readUint(sizeBytes);
    const rootsCount = readUint(sizeBytes);
    const absentCount = readUint(sizeBytes);
    if (absentCount !== 0) {
      throw new Error('BOC with absent cells not supported in fallback parser');
    }
    const totCellsSize = readUint(offsetBytes);
    const rootIndices = [];
    for (let i = 0; i < rootsCount; i++) {
      rootIndices.push(readUint(sizeBytes));
    }

    let index = null;
    if (hasIdx) {
      index = [];
      for (let i = 0; i < cellsCount; i++) {
        index.push(readUint(offsetBytes));
      }
    }

    const cellsData = bytes.slice(offset, offset + totCellsSize);
    offset += totCellsSize;

    if (hasCrc32) {
      offset += 4; // skip checksum
    }

    const cells = [];
    let cursor = 0;
    const refSize = sizeBytes;

    for (let i = 0; i < cellsCount; i++) {
      const d1 = cellsData[cursor++];
      const d2 = cellsData[cursor++];
      const refsCount = d1 & 0x7;
      const isExotic = (d1 & 0x8) !== 0;
      if (isExotic) {
        // skip exotic cells gracefully
      }
      const dataBytes = d2 >> 1;
      const hasTail = (d2 & 1) !== 0;
      const data = cellsData.slice(cursor, cursor + dataBytes);
      cursor += dataBytes;
      let tail = 0;
      if (hasTail) {
        tail = cellsData[cursor++];
      }
      const bits = dataBytes * 8 - tail;
      const refs = [];
      for (let r = 0; r < refsCount; r++) {
        let ref = 0;
        for (let b = 0; b < refSize; b++) {
          ref = (ref << 8) | cellsData[cursor++];
        }
        refs.push(ref);
      }
      cells.push({ data, bits, refs });
    }

    // Link references
    class Cell {
      constructor(data, bits, refs) {
        this.bytes = data;
        this.bits = bits;
        this.refs = refs;
      }
      beginParse() {
        return new Slice(this.bytes, this.bits);
      }
    }

    class Slice {
      constructor(bytes, bits) {
        this.bytes = bytes;
        this.bits = bits;
        this.pos = 0;
      }
      get remaining() {
        return this.bits - this.pos;
      }
      loadBit() {
        if (this.pos >= this.bits) throw new Error('Slice overrun');
        const byteIndex = this.pos >> 3;
        const bitIndex = 7 - (this.pos & 7);
        const value = (this.bytes[byteIndex] >> bitIndex) & 1;
        this.pos += 1;
        return value;
      }
      loadUint(n) {
        let value = 0n;
        for (let i = 0; i < n; i++) {
          value = (value << 1n) | BigInt(this.loadBit());
        }
        return value;
      }
      loadInt(n) {
        const unsigned = this.loadUint(n);
        const signBit = 1n << BigInt(n - 1);
        if (unsigned & signBit) {
          const mask = (1n << BigInt(n)) - 1n;
          return -((~unsigned & mask) + 1n);
        }
        return unsigned;
      }
      loadBuffer(bytesCount) {
        if (this.remaining < bytesCount * 8) throw new Error('Slice buffer overrun');
        if ((this.pos & 7) !== 0) throw new Error('Slice not aligned for buffer load');
        const start = this.pos >> 3;
        const buf = this.bytes.slice(start, start + bytesCount);
        this.pos += bytesCount * 8;
        return buf;
      }
      skipBits(n) {
        if (this.pos + n > this.bits) throw new Error('Slice skip overrun');
        this.pos += n;
      }
    }

    const cellObjects = cells.map(cellData => new Cell(cellData.data, cellData.bits, []));
    for (let i = 0; i < cells.length; i++) {
      const cellData = cells[i];
      cellObjects[i].refs = cellData.refs.map(idx => cellObjects[idx]).filter(Boolean);
    }
    const roots = rootIndices.map(idx => cellObjects[idx]).filter(Boolean);
    return { roots, cells: cellObjects };
  }

  function extractInternalMessagesFromCell(cell) {
    const results = [];
    const visited = new Set();

    function visit(current) {
      if (!current || visited.has(current)) return;
      visited.add(current);
      try {
        const slice = current.beginParse();
        const first = slice.loadBit();
        if (first === 0) {
          // Internal message
          const parsed = parseInternalMessageSlice(slice, current.refs);
          if (parsed) results.push(parsed);
        } else {
          const second = slice.loadBit();
          // tag value currently unused
        }
      } catch (e) {
        // ignore parse errors for this cell
      }
      for (const ref of current.refs || []) {
        visit(ref);
      }
    }

    visit(cell);
    return results;
  }

  function parseInternalMessageSlice(slice, refs) {
    try {
      const ihrDisabled = slice.loadBit();
      const bounce = slice.loadBit();
      const bounced = slice.loadBit();
      const src = parseMsgAddressInt(slice);
      const dest = parseMsgAddressInt(slice);
      const value = parseCurrencyCollection(slice);
      const ihrFee = parseGrams(slice);
      const fwdFee = parseGrams(slice);
      const createdLt = slice.loadUint(64);
      const createdAt = slice.loadUint(32);

      // skip init (Maybe Either)
      const hasInit = slice.loadBit();
      let bodyRefIndexOffset = 0;
      if (hasInit) {
        const initIsRef = slice.loadBit(); // Either
        if (!initIsRef) {
          // inline init not supported in fallback parser
          return null;
        }
        bodyRefIndexOffset = 1;
      }

      let bodyComment = null;
      let opCode = null;
      const bodyIsRef = slice.loadBit();
      if (bodyIsRef) {
        const ref = refs && refs.length > bodyRefIndexOffset ? refs[bodyRefIndexOffset] : null;
        if (ref) {
          const refSlice = ref.beginParse();
          bodyComment = parseBodyComment(refSlice);
          if (bodyComment != null) {
            opCode = 0;
          }
        }
      } else {
        const comment = parseBodyComment(slice);
        if (comment != null) {
          bodyComment = comment;
          opCode = 0;
        }
      }

      return {
        toAddress: dest ? dest.friendly : null,
        fromAddress: src ? src.friendly : null,
        valueTon: value != null ? value : null,
        opCode,
        bodyCell: null,
        comment: bodyComment
      };
    } catch (e) {
      return null;
    }
  }

  function parseBodyComment(slice) {
    try {
      if (!slice || typeof slice.remaining !== 'number') return null;
      if (slice.remaining === 0) return null;
      if (slice.remaining < 32) return null;
      const originalPos = slice.pos;
      const maybeOp = slice.loadUint(32);
      if (maybeOp !== 0n) {
        slice.pos = originalPos;
        return null;
      }
      const remainingBits = slice.remaining;
      if (remainingBits <= 0) return null;
      const byteLength = Math.floor(remainingBits / 8);
      if ((slice.remaining % 8) !== 0) {
        return null;
      }
      if (byteLength <= 0) return null;
      if (!utf8Decoder) return null;
      const buf = slice.loadBuffer(byteLength);
      const text = utf8Decoder.decode(buf).replace(/\0+$/, '').trim();
      return text || null;
    } catch (e) {
      return null;
    }
  }

  function parseMsgAddressInt(slice) {
    try {
      const prefix = Number(slice.loadUint(2));
      if (prefix === 0) {
        return null; // addr_none
      }
      if (prefix !== 2) {
        return null;
      }
      const anycastPresent = slice.loadBit();
      if (anycastPresent) {
        // Unsupported anycast configuration
        throw new Error('Anycast addresses not supported');
      }
      const workchain = Number(slice.loadInt(8));
      const addrBits = slice.loadUint(256);
      const addrHex = addrBits.toString(16).padStart(64, '0');
      const addressBytes = hexToBytes(addrHex);
      return {
        workchain,
        raw: addressBytes,
        friendly: formatFriendlyAddress(workchain, addressBytes)
      };
    } catch (e) {
      return null;
    }
  }

  function parseCurrencyCollection(slice) {
    try {
      const grams = parseGrams(slice);
      if (slice.remaining > 0) {
        const hasExtra = slice.loadBit();
        if (hasExtra) {
          // extra currencies present – skip reference flag
          const isRef = slice.loadBit();
          if (!isRef) {
            return grams;
          }
        }
      }
      return grams != null ? grams : null;
    } catch (e) {
      return null;
    }
  }

  function parseGrams(slice) {
    try {
      const len = Number(slice.loadUint(4));
      if (len === 0) return '0';
      const value = slice.loadUint(len * 8);
      return bigintToTonString(value);
    } catch (e) {
      return null;
    }
  }

  function formatFriendlyAddress(workchain, addrBytes) {
    const tag = 0x11; // bounceable, checksum include
    const buf = new Uint8Array(34);
    buf[0] = tag;
    buf[1] = (workchain & 0xff);
    buf.set(addrBytes, 2);
    const checksum = crc16(buf.slice(0, 34));
    const extended = new Uint8Array(36);
    extended.set(buf, 0);
    extended[34] = (checksum >> 8) & 0xff;
    extended[35] = checksum & 0xff;
    let binary = '';
    for (let i = 0; i < extended.length; i++) {
      binary += String.fromCharCode(extended[i]);
    }
    let base64 = btoa(binary);
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return base64;
  }

  function crc16(bytes) {
    let crc = 0xffff;
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc &= 0xffff;
      }
    }
    return crc;
  }

  function hexToBytes(hex) {
    const clean = hex.length % 2 === 0 ? hex : '0' + hex;
    const length = clean.length / 2;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function bytesToHex(u8) {
    return Array.from(u8 || []).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function bigintToTonString(nano) {
    try {
      const bi = typeof nano === 'bigint' ? nano : BigInt(nano.toString());
      const whole = bi / 1000000000n;
      const frac = (bi % 1000000000n).toString().padStart(9, '0').replace(/0+$/, '');
      return frac ? `${whole}.${frac}` : `${whole}`;
    } catch (_) { return String(nano); }
  }

  function parseInternalMessagesWithTonCore(bocBase64) {
    try {
      const tc = getTonCore();
      const roots = tc.Cell.fromBoc(base64ToBytes(bocBase64));
      if (!roots || !roots.length) return [];
      const visited = new Set();
      const acc = [];

      function hexHash(cell) {
        try { return bytesToHex(cell.hash()); } catch (_) { return null; }
      }

      function readCoins(slice) {
        if (typeof slice.loadCoins === 'function') return slice.loadCoins();
        // Fallback: coins are var-uint; try loadUint with 16 bits length then read that many bits
        const len = slice.loadUint(4); // heuristic, may fail
        return slice.loadUint(len * 8);
      }

      function tryParseMessage(cell) {
        try {
          const s = cell.beginParse();
          const first = s.loadBit() ? 1 : 0;
          let infoKind = null;
          if (first === 0) infoKind = 'int'; else {
            const b2 = s.loadBit() ? 1 : 0;
            if (first === 1 && b2 === 0) infoKind = 'ext-in';
            else if (first === 1 && b2 === 1) infoKind = 'ext-out';
          }
          if (infoKind !== 'int') return null;

          // int_msg_info
          const ihrDisabled = s.loadBit();
          const bounce = s.loadBit();
          const bounced = s.loadBit();
          const src = s.loadAddress?.();
          const dest = s.loadAddress?.();
          const val = s.loadCoins?.() ?? readCoins(s);
          const ihrFee = s.loadCoins?.() ?? readCoins(s);
          const fwdFee = s.loadCoins?.() ?? readCoins(s);
          const createdLt = s.loadUint(64);
          const createdAt = s.loadUint(32);

          // init:(Maybe (Either StateInit ^StateInit))
          const hasInit = s.loadBit();
          if (hasInit) {
            const initIsRef = s.loadBit();
            if (initIsRef && typeof s.loadRef === 'function') {
              s.loadRef(); // skip
            } else {
              // inline StateInit unknown size — best effort: ignore errors
            }
          }

          // body:(Either X ^X)
          const bodyIsRef = s.loadBit();
          let bodyCell = null;
          let op = null;
          let comment = null;
          if (bodyIsRef && typeof s.loadRef === 'function') {
            bodyCell = s.loadRef();
            try {
              const bs = bodyCell.beginParse();
              if (bs.remaining >= 32) {
                op = bs.loadUint(32);
                comment = extractCommentAfterOpcode(bs, op);
              }
            } catch (_) { /* ignore */ }
          } else {
            try {
              op = s.loadUint(32);
              comment = extractCommentAfterOpcode(s, op);
            } catch (_) { /* ignore */ }
          }

          return {
            toAddress: dest?.toString ? dest.toString({ bounceable: true }) : null,
            fromAddress: src?.toString ? src.toString({ bounceable: true }) : null,
            valueTon: val != null ? bigintToTonString(val) : null,
            bodyCell,
            opCode: op != null ? Number(op) : null,
            comment: comment || null,
            meta: { ihrDisabled, bounce, bounced, createdLt: createdLt?.toString?.() ?? createdLt, createdAt }
          };
        } catch (e) {
          return null;
        }
      }

      function walk(cell) {
        const key = hexHash(cell) || Math.random().toString(36).slice(2);
        if (visited.has(key)) return;
        visited.add(key);

        const parsed = tryParseMessage(cell);
        if (parsed && parsed.toAddress) acc.push(parsed);

        const refs = cell.refs || cell.getRefs?.() || [];
        for (let i = 0; i < (refs.length || cell.refs.length); i++) {
          const ref = refs[i] || cell.refs[i];
          if (ref) walk(ref);
        }
      }

      walk(roots[0]);
      return acc;
    } catch (e) {
      return [];
    }
  }

  function fallbackParseMessages(bocBase64) {
    try {
      const { roots } = parseBocWithoutTonLib(bocBase64);
      if (!roots.length) return [];
      const messages = [];
      for (const root of roots) {
        const found = extractInternalMessagesFromCell(root);
        messages.push(...found);
      }
      const cleaned = [];
      const seen = new Set();
      for (const msg of messages) {
        const key = `${msg.fromAddress || ''}|${msg.toAddress || ''}|${msg.valueTon || ''}|${msg.comment || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!msg.toAddress && !msg.fromAddress && !msg.comment) continue;
        if (msg.valueTon) {
          const numeric = Number(msg.valueTon);
          if (!Number.isNaN(numeric) && numeric > 1000000) continue;
        }
        cleaned.push(msg);
      }
      return cleaned;
    } catch (e) {
      console.warn('[TON Decoder] fallback parser error', e.message);
      return [];
    }
  }

  async function decodeMessages(bocBase64, urlDetails) {
    // If URL includes address/amount, provide a best-effort parse even without BOC
    if (!bocBase64 && urlDetails && (urlDetails.address || urlDetails.amount)) {
      let valueTon = null;
      if (urlDetails.amount) {
        const n = Number(urlDetails.amount);
        if (!Number.isNaN(n)) valueTon = (n / 1e9).toString(); // nanotons -> TON
      }
      return {
        parsed: true,
        reason: 'Parsed from ton:// URL parameters',
        messages: [{
          toAddress: urlDetails.address || null,
          fromAddress: null,
          valueTon,
          bodyCell: null,
          sliceInfo: null,
          comment: urlDetails.text || null,
          opCode: null
        }]
      };
    }

    if (!tonLibAvailable() && !tonCoreAvailable()) {
      const fallback = bocBase64 ? fallbackParseMessages(bocBase64) : [];
      return {
        parsed: fallback.length > 0,
        reason: fallback.length ? 'Parsed with internal fallback' : 'TON library not loaded',
        messages: fallback.length ? fallback : (bocBase64 ? [{ toAddress: null, valueTon: null, bodyCell: null, sliceInfo: { note: 'BOC present but libs unavailable' } }] : [])
      };
    }

    try {
      // Prefer ton-core for robust TL-B parsing
      if (tonCoreAvailable()) {
        const msgs = parseInternalMessagesWithTonCore(bocBase64);
        return { parsed: true, reason: 'Parsed with ton-core', messages: msgs.length ? msgs : [{ toAddress: null, valueTon: null, bodyCell: null, sliceInfo: { note: 'Parsed but no internal messages found' } }] };
      }

      // Fallback: TonWeb only — limited info
      const cells = TonWeb.boc.Cell.fromBoc(bocBase64);
      if (!cells || !cells.length) return { parsed: false, reason: 'Invalid BOC', messages: [] };
      const root = cells[0];
      const info = { bits: root.bits?.length || null, refs: root.refs?.length || 0 };
      return { parsed: true, reason: 'TonWeb fallback (no deep TL-B parsing)', messages: [{ toAddress: null, valueTon: null, bodyCell: root, sliceInfo: info }] };
    } catch (e) {
      return { parsed: false, reason: e?.message || String(e), messages: [] };
    }
  }

  function dispatchProtocol(ctx) {
    try {
      const isSimpleTransfer = (ctx.opCode === null || ctx.opCode === 0) && ctx.valueTon != null;
      if (isSimpleTransfer) {
        const summaryParts = [];
        if (ctx.fromAddress) summaryParts.push(`From ${ctx.fromAddress}`);
        if (ctx.toAddress) summaryParts.push(`To ${ctx.toAddress}`);
        summaryParts.push(`Amount ${ctx.valueTon} TON`);
        return {
          protocol: PROTOCOLS.TRANSFER,
          action: 'Simple Transfer',
          fields: {
            fromAddress: ctx.fromAddress,
            toAddress: ctx.toAddress,
            valueTon: ctx.valueTon,
            comment: ctx.comment
          },
          summary: summaryParts.join(' • '),
          notes: ctx.comment ? `Comment: ${ctx.comment}` : undefined
        };
      }

      if (window.NominatorPoolDecoder?.identify(ctx)) return window.NominatorPoolDecoder.decode(ctx);
      if (window.TonstakersDecoder?.identify(ctx)) return window.TonstakersDecoder.decode(ctx);
      if (window.TONWhalesDecoder?.identify(ctx)) return window.TONWhalesDecoder.decode(ctx);
    } catch (e) {
      // ignore and fall back
    }
    const summary = [];
    if (ctx.valueTon != null) summary.push(`Value: ${ctx.valueTon} TON`);
    if (ctx.opCode != null) summary.push(`Op Code: 0x${ctx.opCode.toString(16)}`);
    if (ctx.comment) summary.push(`Comment: ${ctx.comment}`);
    return {
      protocol: PROTOCOLS.UNKNOWN,
      action: 'Unknown action',
      fields: {
        fromAddress: ctx.fromAddress,
        toAddress: ctx.toAddress,
        valueTon: ctx.valueTon,
        opCode: ctx.opCode,
        comment: ctx.comment
      },
      summary: summary.join(' | ')
    };
  }

  async function decodeTonPayload(inputRaw) {
    const norm = normalizeToBocBase64(inputRaw);
    if (norm.error) return { ok: false, error: norm.error };

    const hashInfo = norm.bocBase64 ? await computeExternalMessageHash(norm.bocBase64) : { hashHex: null, hashBase64: null, note: 'No BOC provided' };
    const decoded = await decodeMessages(norm.bocBase64, norm.urlDetails);

    const results = [];
    for (const m of decoded.messages) {
      const ctx = {
        toAddress: m.toAddress,
        fromAddress: m.fromAddress,
        valueTon: m.valueTon,
        opCode: m.opCode != null ? m.opCode : extractOpCodeFromBodySlice(m.bodyCell),
        bodyCell: m.bodyCell,
        sliceInfo: m.sliceInfo,
        comment: m.comment || null
      };
      results.push(dispatchProtocol(ctx));
    }

    if (!results.length) {
      results.push({
        protocol: PROTOCOLS.UNKNOWN,
        action: 'No actionable message',
        fields: { toAddress: null, valueTon: null, opCode: null },
        summary: decoded.reason || 'No internal messages parsed',
        notes: 'Ensure TON libraries load or verify this payload manually.'
      });
    }

    return {
      ok: true,
      source: norm.source,
      hash: hashInfo.hashHex,
      hashHex: hashInfo.hashHex,
      hashBase64: hashInfo.hashBase64,
      hashNote: hashInfo.note,
      messages: results,
      advanced: settings.showAdvanced,
      libLoaded: tonLibAvailable() || tonCoreAvailable(),
      raw: decoded
    };
  }

  // Expose to UI
  window.decodeTonPayload = decodeTonPayload;
  window.detectInputFormat = detectInputFormat;
  window.getSettings = () => ({ ...settings });
  window.setSettings = (next) => Object.assign(settings, saveSettings(next));
})();
