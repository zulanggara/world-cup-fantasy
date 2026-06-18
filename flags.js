// Country flags as Unicode emoji — no image assets to host/license, renders
// natively on every platform that supports emoji flags (all modern browsers/OS).
window.FLAGS = (function () {
  const MAP = {
    ALG: '🇩🇿', ARG: '🇦🇷', AUS: '🇦🇺', AUT: '🇦🇹', BEL: '🇧🇪', BIH: '🇧🇦',
    BRA: '🇧🇷', CPV: '🇨🇻', CAN: '🇨🇦', COL: '🇨🇴', COD: '🇨🇩', CIV: '🇨🇮',
    CRO: '🇭🇷', CUW: '🇨🇼', CZE: '🇨🇿', ECU: '🇪🇨', EGY: '🇪🇬',
    ENG: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    FRA: '🇫🇷', GER: '🇩🇪', GHA: '🇬🇭', HAI: '🇭🇹', IRN: '🇮🇷', IRQ: '🇮🇶',
    JPN: '🇯🇵', JOR: '🇯🇴', KOR: '🇰🇷', MEX: '🇲🇽', MAR: '🇲🇦', NED: '🇳🇱',
    NZL: '🇳🇿', NOR: '🇳🇴', PAN: '🇵🇦', PAR: '🇵🇾', POR: '🇵🇹', QAT: '🇶🇦',
    KSA: '🇸🇦',
    SCO: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
    SEN: '🇸🇳', RSA: '🇿🇦', ESP: '🇪🇸', SWE: '🇸🇪',
    SUI: '🇨🇭', TUN: '🇹🇳', TUR: '🇹🇷', URU: '🇺🇾', USA: '🇺🇸', UZB: '🇺🇿',
  };
  function flagFor(abbr) {
    return MAP[abbr] || '⚽';
  }
  return { flagFor };
})();
