// TON Whales protocol-specific decoding (skeleton)
(function() {
  function identify(ctx) {
    const to = (ctx.toAddress || '').toString();
    if (KNOWN_ADDRESSES.tonWhales.includes(to)) return true;
    if (ctx.opCode != null && OPCODES.tonwhales && Object.values(OPCODES.tonwhales).includes(ctx.opCode)) return true;
    return false;
  }

  function decode(ctx) {
    const summary = [];
    if (ctx.valueTon != null) summary.push(`Value: ${ctx.valueTon} TON`);
    if (ctx.opCode != null) summary.push(`Op Code: 0x${ctx.opCode.toString(16)}`);

    const map = OPCODES.tonwhales || {};
    let action = 'Unknown TON Whales action';
    for (const [k, v] of Object.entries(map)) {
      if (v === ctx.opCode) { action = k.charAt(0).toUpperCase() + k.slice(1); break; }
    }

    return {
      protocol: PROTOCOLS.TON_WHALES,
      action,
      fields: { toAddress: ctx.toAddress, valueTon: ctx.valueTon, opCode: ctx.opCode },
      summary: summary.join(' | '),
      notes: 'TODO: decode fields once opcodes/layouts are set'
    };
  }

  window.TONWhalesDecoder = { identify, decode };
})();
