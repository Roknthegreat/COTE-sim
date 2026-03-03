// ============================================================
// APEX OF THE ELITE — Economy System (S-Points, Gambling, Loans)
// ============================================================

const Economy = (() => {

  // ── Part-Time Work ────────────────────────────────────────
  function doPartTimeWork(state) {
    const earnings = 5000 + Math.floor(Math.random() * 10000);
    GameState.adjustPlayerSPoints(earnings);
    return {
      type: "work",
      earnings,
      narrative: `You spend the afternoon working. ¥${earnings.toLocaleString()} S-Points added to your account.`,
    };
  }

  // ── Gambling ──────────────────────────────────────────────
  function doGamble(state, game = "cards") {
    const player = state.player;
    const skill = game === "shogi" || game === "chess"
      ? player.stats.INT
      : (player.stats.INT + player.stats.PER) / 2;

    const skillFactor = skill / 100;
    const houseEdge = 0.08;
    const roll = Math.random();

    // Win probability scales with skill — house always has a slight edge
    const winChance = 0.35 + skillFactor * 0.35 - houseEdge;
    const won = roll < winChance;

    const bet = 2000 + Math.floor(Math.random() * 8000);
    const change = won ? Math.floor(bet * (1 + Math.random() * 0.6)) : -bet;

    GameState.adjustPlayerSPoints(change);

    const smallGain = won ? 0.3 * getTalentGrowthMultiplier("PER", player.stats.TAL) : 0;
    player.stats.PER = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.PER + smallGain);

    return {
      type: "gamble",
      won,
      amount: Math.abs(change),
      narrative: won
        ? `The game turns in your favor. ¥${Math.abs(change).toLocaleString()} won.`
        : `Not today. ¥${Math.abs(change).toLocaleString()} lost.`,
    };
  }

  // ── Intel Sales ───────────────────────────────────────────
  function sellIntelToBroker(state, npcId) {
    const npc = GameState.getNPC(npcId);
    if (!npc) return null;

    const secretKnown = state.player.knownSecrets.some(k => k.npcId === npcId);
    if (!secretKnown) {
      return {
        type: "intel_sale_fail",
        narrative: "The broker isn't interested in speculation. Bring something concrete.",
      };
    }

    const value = 10000 + Math.floor(Math.random() * 40000);
    GameState.adjustPlayerSPoints(value);

    // Infamy risk — selling secrets increases infamy slightly
    state.player.reputation.infamy = Math.min(100,
      state.player.reputation.infamy + 3);

    // Remove from known secrets (sold it)
    state.player.knownSecrets = state.player.knownSecrets.filter(k => k.npcId !== npcId);

    return {
      type: "intel_sale",
      npcId,
      amount: value,
      narrative: `The broker receives your information without expression. ¥${value.toLocaleString()} arrives in your account shortly after.`,
    };
  }

  // ── Loans ─────────────────────────────────────────────────
  function lendPoints(state, npcId, amount, interestRate = 0.2) {
    if (state.player.spoints < amount) {
      return { type: "loan_fail", narrative: "Insufficient S-Points to lend." };
    }

    GameState.adjustPlayerSPoints(-amount);

    const loan = {
      id: `loan_${Date.now()}`,
      npcId,
      principal: amount,
      interestRate,
      totalOwed: Math.floor(amount * (1 + interestRate)),
      dueMonth: state.month + 2,
      status: "active",
    };

    if (!state.player.activeLoans) state.player.activeLoans = [];
    state.player.activeLoans.push(loan);

    const npc = GameState.getNPC(npcId);
    return {
      type: "loan_issued",
      loan,
      narrative: `¥${amount.toLocaleString()} lent to ${npc ? npc.displayName : "unknown"}. Expected return with interest: ¥${loan.totalOwed.toLocaleString()}.`,
    };
  }

  function collectLoan(state, loanId) {
    if (!state.player.activeLoans) return null;
    const loan = state.player.activeLoans.find(l => l.id === loanId);
    if (!loan || loan.status !== "active") return null;

    const npc = GameState.getNPC(loan.npcId);
    const npcRel = npc ? npc.relationshipWithPlayer : -20;

    // NPC repays if relationship is decent enough or they're well off
    const willRepay = npcRel >= -10 && Math.random() < 0.75;

    if (willRepay) {
      GameState.adjustPlayerSPoints(loan.totalOwed);
      loan.status = "repaid";
      return {
        type: "loan_repaid",
        loan,
        narrative: `${npc ? npc.displayName : "Your debtor"} repays ¥${loan.totalOwed.toLocaleString()} as agreed.`,
      };
    } else {
      loan.status = "defaulted";
      // Relationship damage if forced
      if (npc) GameState.adjustNPCRelationship(loan.npcId, -20);
      return {
        type: "loan_default",
        loan,
        narrative: `${npc ? npc.displayName : "Your debtor"} cannot — or will not — repay. How you handle this is up to you.`,
        requiresChoice: true,
      };
    }
  }

  // ── Class Point Trade (Political negotiation) ─────────────
  function offerClassPointTrade(state, targetClass, ourPoints, theirPoints) {
    // Simplified — in full game this would be a negotiation event
    return {
      type: "class_point_offer",
      narrative: `You've proposed a class point exchange with Class ${targetClass}. They'll respond next week.`,
    };
  }

  // ── Format helpers ────────────────────────────────────────
  function formatPoints(n) {
    if (n >= 1000000) return `¥${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)    return `¥${(n / 1000).toFixed(1)}K`;
    return `¥${n}`;
  }

  return {
    doPartTimeWork,
    doGamble,
    sellIntelToBroker,
    lendPoints,
    collectLoan,
    offerClassPointTrade,
    formatPoints,
  };
})();
