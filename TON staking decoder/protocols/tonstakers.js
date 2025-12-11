// Tonstakers protocol-specific decoding (skeleton)
(function() {
  function identify(ctx) {
    const to = (ctx.toAddress || '').toString();
    if (KNOWN_ADDRESSES.tonstakers.includes(to)) return true;
    if (ctx.opCode != null && OPCODES.tonstakers && Object.values(OPCODES.tonstakers).includes(ctx.opCode)) return true;
    return false;
  }

  function decode(ctx) {
    // TODO: parse exact op codes and fields (deposit/mint, redeem, claim)
    const summary = [];
    if (ctx.valueTon != null) summary.push(`Value: ${ctx.valueTon} TON`);
    if (ctx.opCode != null) summary.push(`Op Code: 0x${ctx.opCode.toString(16)}`);

    const map = OPCODES.tonstakers || {};
    let action = 'Unknown Tonstakers action';
    for (const [k, v] of Object.entries(map)) {
      if (v === ctx.opCode) { action = k.charAt(0).toUpperCase() + k.slice(1); break; }
    }

    return {
      protocol: PROTOCOLS.TONSTAKERS,
      action,
      fields: { toAddress: ctx.toAddress, valueTon: ctx.valueTon, opCode: ctx.opCode },
      summary: summary.join(' | '),
      notes: 'TODO: decode fields (minOut, ref, etc.) once opcodes/layouts are set'
    };
  }

  window.TonstakersDecoder = { identify, decode };
})();
