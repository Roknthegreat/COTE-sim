// ============================================================
// APEX OF THE ELITE — Combat Auto-Sim Engine
// ============================================================

const Combat = (() => {

  const STANCE_MODIFIERS = {
    aggressive: { attackMod: 1.25, defenseMod: 0.8  },
    defensive:  { attackMod: 0.8,  defenseMod: 1.25 },
    dirty:      { attackMod: 1.1,  defenseMod: 0.9, dirtyBonus: 12 },
  };

  const TERRAIN_BONUSES = {
    tight_alley:   { grappleBonus: 10, strikeBonus: -5 },
    open_space:    { strikeBonus: 10,  grappleBonus: -5 },
    classroom:     { neutral: true },
    gym:           { neutral: true },
    rooftop:       { strikeBonus: 5 },
    cafeteria:     { dirtyBonus: 8 },
    corridor:      { neutral: true },
  };

  function getStyleBonus(combatStyle, stance) {
    const styles = CONFIG.MARTIAL_ARTS;
    if (!combatStyle || !styles[combatStyle]) return 0;
    const style = styles[combatStyle];
    let bonus = 0;
    if (style.bonus === "aggressive" && stance === "aggressive") bonus += 15;
    if (style.bonus === "evasion"    && stance === "defensive")  bonus += 12;
    if (style.bonus === "grapple"    && stance === "aggressive") bonus += 10;
    if (style.bonus === "dirty"      && stance === "dirty")      bonus += 14;
    if (style.bonus === "control")                               bonus += 8;
    return bonus;
  }

  function calcFightScore(combatant, stance, terrain, ally = null) {
    const stanceMod = STANCE_MODIFIERS[stance] || STANCE_MODIFIERS.aggressive;
    const terrainData = TERRAIN_BONUSES[terrain] || { neutral: true };

    let score = combatant.stats.CMB * stanceMod.attackMod
              + combatant.stats.PHY * 0.3;

    score += getStyleBonus(combatant.activeMartialStyle || combatant.combatStyle, stance);

    // Terrain modifiers
    if (terrainData.strikeBonus)  score += terrainData.strikeBonus;
    if (terrainData.grappleBonus) score += terrainData.grappleBonus;
    if (terrainData.dirtyBonus && stance === "dirty") score += terrainData.dirtyBonus;

    // Dirty fighting bonus
    if (stance === "dirty" && stanceMod.dirtyBonus) score += stanceMod.dirtyBonus;

    // Ally bonus
    if (ally) score += 20;

    // RNG variance
    const variance = CONFIG.COMBAT_RNG_VARIANCE;
    score *= (1 + (Math.random() * 2 - 1) * variance);

    return Math.round(score);
  }

  function resolveFight(attacker, defender, options = {}) {
    const {
      attackerStance = "aggressive",
      defenderStance = "defensive",
      terrain = "corridor",
      attackerAlly = null,
      defenderAlly = null,
      isPublic = false,
    } = options;

    const attackerScore = calcFightScore(attacker, attackerStance, terrain, attackerAlly);
    const defenderScore = calcFightScore(defender, defenderStance, terrain, defenderAlly);

    const attackerWins = attackerScore > defenderScore;
    const margin = Math.abs(attackerScore - defenderScore);

    const result = {
      winner: attackerWins ? attacker.id : defender.id,
      loser:  attackerWins ? defender.id : attacker.id,
      attackerScore,
      defenderScore,
      margin,
      dominant: margin > 20,
      close: margin < 8,
      isPublic,
      terrain,
      narrative: generateFightNarrative(attacker, defender, attackerWins, margin, terrain, attackerStance),
    };

    return result;
  }

  function applyFightConsequences(state, result) {
    const player = state.player;
    const isPlayerAttacker = result.winner === "player" || result.loser === "player";
    const playerWon = result.winner === "player";

    if (!isPlayerAttacker) return;

    if (playerWon) {
      // Combat rep gain
      const repGain = result.dominant ? 12 : result.close ? 4 : 8;
      player.reputation.combat = Math.min(100, player.reputation.combat + repGain);

      // Teacher rep damage if public
      if (result.isPublic) {
        player.reputation.teacher = Math.max(0, player.reputation.teacher - 6);
      }

      // Social rep damage if dirty fighting
      if (result.terrain === "dirty") {
        if (result.isPublic) {
          player.reputation.social = Math.max(0, player.reputation.social - 5);
        }
      }
    } else {
      // Loss — opponent's combat rep grows
      const repLoss = result.dominant ? -8 : result.close ? -2 : -5;
      player.reputation.combat = Math.max(0, player.reputation.combat + repLoss);
    }

    // Small CMB growth from fighting — NOT boosted by TAL (physical contest)
    // Wait — CMB IS boosted by TAL (it's a skill). PHY would not be.
    // But in a real fight, CMB grows from experience, not talent.
    // We'll apply a small growth with TAL multiplier.
    const cmbGain = 1 * getTalentGrowthMultiplier("CMB", player.stats.TAL);
    player.stats.CMB = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.CMB + cmbGain);
  }

  function generateFightNarrative(attacker, defender, attackerWins, margin, terrain, stance) {
    const winner = attackerWins ? attacker : defender;
    const loser  = attackerWins ? defender : attacker;
    const winName = winner.displayName || "You";
    const loseName = loser.displayName || "Your opponent";

    const terrainDesc = {
      tight_alley: "the narrow alley",
      open_space:  "the open courtyard",
      classroom:   "the empty classroom",
      gym:         "the gymnasium",
      rooftop:     "the rooftop",
      cafeteria:   "the cafeteria",
      corridor:    "the corridor",
    }[terrain] || "the area";

    let lines = [];

    if (margin > 25) {
      lines.push(`${winName} ends it before it truly begins — ${loseName} barely gets a stance set before it's over.`);
    } else if (margin > 15) {
      lines.push(`In ${terrainDesc}, ${winName} pushes through ${loseName}'s defenses with clear technical superiority.`);
    } else if (margin > 8) {
      lines.push(`A real exchange — both land hits — but ${winName} reads the rhythm better and closes it out.`);
    } else {
      lines.push(`Neither pulls away cleanly. By the end, ${winName} is standing, but only just.`);
    }

    if (stance === "dirty") {
      lines.push("The method wasn't clean. Anyone watching will remember that.");
    }

    return lines.join(" ");
  }

  function getPreFightAssessment(player, opponent) {
    const pScore = player.stats.CMB * 1.0 + player.stats.PHY * 0.3;
    const oScore = opponent.currentStats.CMB * 1.0 + opponent.currentStats.PHY * 0.3;
    const ratio = pScore / (oScore || 1);

    if (ratio > 1.4) return { label: "Decisive Advantage", color: "#4ac984" };
    if (ratio > 1.1) return { label: "Slight Advantage",   color: "#8fba8f" };
    if (ratio > 0.9) return { label: "Even Match",         color: "#c9a84c" };
    if (ratio > 0.7) return { label: "Slight Disadvantage",color: "#c9845a" };
    return             { label: "Heavy Disadvantage",      color: "#c94a4a" };
  }

  return {
    resolveFight,
    applyFightConsequences,
    getPreFightAssessment,
    generateFightNarrative,
  };
})();
