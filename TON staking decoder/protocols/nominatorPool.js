// Nominator Pool protocol-specific decoding (skeleton)
(function() {
  function identify(ctx) {
    // Identify by known address or op codes
    const to = (ctx.toAddress || '').toString();
    if (KNOWN_ADDRESSES.nominatorPools.includes(to)) return true;
    if (ctx.opCode != null && OPCODES.nominatorPool && Object.values(OPCODES.nominatorPool).includes(ctx.opCode)) return true;
    return false;
  }

  function decode(ctx) {
    // ctx: { toAddress, valueTon, bodyCell?, opCode?, sliceInfo? }
    const summary = [];
    if (ctx.valueTon != null) summary.push(`Value: ${ctx.valueTon} TON`);
    if (ctx.opCode != null) summary.push(`Op Code: 0x${ctx.opCode.toString(16)}`);

    const map = OPCODES.nominatorPool || {};
    let action = 'Unknown Nominator Pool action';
    for (const [k, v] of Object.entries(map)) {
      if (v === ctx.opCode) { action = k.charAt(0).toUpperCase() + k.slice(1); break; }
    }

    return {
      protocol: PROTOCOLS.NOMINATOR_POOL,
      action,
      fields: { toAddress: ctx.toAddress, valueTon: ctx.valueTon, opCode: ctx.opCode },
      summary: summary.join(' | '),
      notes: 'TODO: decode fields (owner, query_id, etc.) once opcodes/layouts are set'
    };
  }

  window.NominatorPoolDecoder = { identify, decode };
})();
