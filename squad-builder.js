window.SquadBuilder = (function () {
  const BUDGET = 100;

  function totalPrice(starters) {
    return Math.round(starters.reduce((s, p) => s + (p.price || 0), 0) * 10) / 10;
  }

  function totalMetric(starters, metricKey) {
    return Math.round(starters.reduce((s, p) => s + (p[metricKey] || 0), 0) * 10) / 10;
  }

  function selectByMetric(players, metricKey, formation, posOrder, maxPerSquad) {
    const byPos = {};
    for (const pos of posOrder) {
      byPos[pos] = players.filter((p) => p.position === pos).sort((a, b) => b[metricKey] - a[metricKey]);
    }
    const starters = [];
    const bench = [];
    const squadCount = {};
    for (const pos of posOrder) {
      const need = formation[pos];
      let picked = 0;
      for (const p of byPos[pos]) {
        if (picked >= need) { bench.push(p); continue; }
        const count = squadCount[p.squadId] || 0;
        if (count >= maxPerSquad) { bench.push(p); continue; }
        starters.push(p);
        squadCount[p.squadId] = count + 1;
        picked += 1;
      }
    }
    return { starters, bench };
  }

  // Greedily swap a starter for a cheaper same-position bench player (respecting squad cap)
  // picking the swap that loses the least metric per unit of price freed, until total price <= budget.
  function fitToBudget(starters, bench, metricKey, maxPerSquad, budget) {
    let curStarters = starters.slice();
    let curBench = bench.slice();
    let price = totalPrice(curStarters);
    let guard = 0;

    while (price > budget && guard < 300) {
      guard += 1;
      let best = null;
      let bestRatio = Infinity;

      for (let i = 0; i < curStarters.length; i++) {
        const s = curStarters[i];
        const squadCountWithoutS = {};
        for (const x of curStarters) {
          if (x === s) continue;
          squadCountWithoutS[x.squadId] = (squadCountWithoutS[x.squadId] || 0) + 1;
        }
        for (const b of curBench) {
          if (b.position !== s.position) continue;
          if (b.price >= s.price) continue;
          const cnt = squadCountWithoutS[b.squadId] || 0;
          if (cnt >= maxPerSquad) continue;
          const priceSaved = s.price - b.price;
          const metricLoss = (s[metricKey] || 0) - (b[metricKey] || 0);
          const ratio = metricLoss / priceSaved;
          if (ratio < bestRatio) {
            bestRatio = ratio;
            best = { i, s, b };
          }
        }
      }

      if (!best) break;
      curStarters[best.i] = best.b;
      curBench = curBench.filter((x) => x !== best.b);
      curBench.push(best.s);
      price = totalPrice(curStarters);
    }

    return { starters: curStarters, bench: curBench, fitted: price <= budget };
  }

  function buildVariants(players, metricKey, formation, posOrder, maxPerSquad, budget = BUDGET) {
    const premium = selectByMetric(players, metricKey, formation, posOrder, maxPerSquad);
    const budgetFit = fitToBudget(premium.starters, premium.bench, metricKey, maxPerSquad, budget);

    const valuePlayers = players.map((p) => ({
      ...p,
      _value: p.price > 0 ? (p[metricKey] || 0) / p.price : (p[metricKey] || 0),
    }));
    const value = selectByMetric(valuePlayers, '_value', formation, posOrder, maxPerSquad);

    const tt = (key, fallback) => (window.I18N ? window.I18N.t(key, fallback) : fallback);
    return [
      { key: 'premium', label: tt('common.variantPremium', 'Skor Tertinggi'), starters: premium.starters, bench: premium.bench },
      { key: 'budget', label: tt('common.variantBudget', 'Dalam Budget'), starters: budgetFit.starters, bench: budgetFit.bench, fitted: budgetFit.fitted },
      { key: 'value', label: tt('common.variantValue', 'Hemat (Value)'), starters: value.starters, bench: value.bench },
    ];
  }

  return { BUDGET, totalPrice, totalMetric, buildVariants };
})();
