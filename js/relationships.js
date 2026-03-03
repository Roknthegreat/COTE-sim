// ============================================================
// APEX OF THE ELITE — Relationship System
// ============================================================

const Relationships = (() => {

  function socialize(state, npcId) {
    const player = state.player;
    const npc = GameState.getNPC(npcId);
    if (!npc || npc.isExpelled) {
      return { type: "fail", narrative: "That person isn't available." };
    }

    // Base gain — modified by CHA and the NPC's personality alignment
    const baseGain = 5 + Math.floor(player.stats.CHA / 20);
    const archetypeBonus = getArchetypeBonus(player.archetype, npc.archetype);
    const gain = Math.round(baseGain + archetypeBonus + (Math.random() * 4 - 2));

    GameState.adjustNPCRelationship(npcId, gain);

    // CHA growth — boosted by TAL
    const chaGain = 0.8 * getTalentGrowthMultiplier("CHA", player.stats.TAL);
    player.stats.CHA = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.CHA + chaGain);

    npc.knownToPlayer = true;

    const tier = GameState.getRelationshipTier(npc.relationshipWithPlayer);
    const narrative = generateSocialNarrative(player, npc, gain, tier);

    // Chance of learning something about the NPC at higher relationship tiers
    const intel = tryLearnIntel(state, npc, tier);

    return {
      type: "socialize",
      npcId,
      gain,
      tier,
      narrative,
      intel,
    };
  }

  function getArchetypeBonus(playerArchetype, npcArchetype) {
    // Certain archetypes naturally click better
    const compatibilityMap = {
      cold_strategist:   { charismatic_leader: 2, silent_observer: 3, idealist: -2 },
      charismatic_leader:{ opportunist: 2, idealist: 3, silent_observer: -2 },
      hot_headed_fighter:{ idealist: 3, hot_headed_fighter: 1, cold_strategist: -3 },
      silent_observer:   { cold_strategist: 3, silent_observer: 2 },
      idealist:          { charismatic_leader: 3, hot_headed_fighter: 2, opportunist: -2 },
      opportunist:       { opportunist: 2, charismatic_leader: 2, idealist: -2 },
    };
    return (compatibilityMap[playerArchetype] || {})[npcArchetype] || 0;
  }

  function generateSocialNarrative(player, npc, gain, tier) {
    const name = npc.displayName;

    if (gain <= 3) {
      return `${name} acknowledges you politely. Not much ground gained.`;
    }
    if (gain <= 7) {
      return `You and ${name} share a conversation. They seem receptive.`;
    }
    if (tier === "ally") {
      return `${name} opens up slightly. You sense the beginning of something real.`;
    }
    if (tier === "trusted") {
      return `${name} says something they probably don't say to many people. You file it away.`;
    }
    if (tier === "devoted") {
      return `The conversation with ${name} crosses a line from social to personal. They're not hiding much from you anymore.`;
    }
    return `${name} engages warmly. +${gain} relationship.`;
  }

  function tryLearnIntel(state, npc, tier) {
    const player = state.player;
    // Higher relationship + higher PER = chance to learn NPC secrets
    const perRoll = player.stats.PER / 100;
    const tierBonus = { ally: 0.05, trusted: 0.2, devoted: 0.4 }[tier] || 0;

    if (Math.random() < perRoll * 0.2 + tierBonus) {
      const alreadyKnown = state.player.knownSecrets.some(k => k.npcId === npc.id);
      if (!alreadyKnown) {
        state.player.knownSecrets.push({ npcId: npc.id, secret: npc.secret });
        return {
          discovered: true,
          secret: npc.secret,
          narrative: `Something ${npc.displayName} lets slip tells you more than they intended.`,
        };
      }
    }
    return null;
  }

  function checkRomanceAvailable(npcId, state) {
    const npc = GameState.getNPC(npcId);
    if (!npc) return false;
    return npc.relationshipWithPlayer >= CONFIG.REL_TIERS.DEVOTED;
  }

  function getRomanceBonus(npcId) {
    const npc = GameState.getNPC(npcId);
    if (!npc) return null;
    // Passive bonus based on their primary strength
    const primaryStat = getPrimaryStatOfNPC(npc);
    return {
      stat: primaryStat,
      bonus: 3,
      label: `Romance bond with ${npc.displayName} provides passive +3 ${primaryStat} growth rate.`,
    };
  }

  function getPrimaryStatOfNPC(npc) {
    const stats = npc.currentStats;
    return Object.entries(stats)
      .filter(([s]) => s !== "TAL")
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  function getRelationshipColor(value) {
    if (value >= 86) return "#c9a84c";   // Gold — devoted
    if (value >= 61) return "#4ac984";   // Green — trusted
    if (value >= 31) return "#4a7ab5";   // Blue — ally
    if (value >= 1)  return "#8fa4b8";   // Silver — acquaintance
    if (value >= -49) return "#5a6475";  // Grey — hostile
    return "#c94a4a";                    // Red — enemy
  }

  function getRelationshipLabel(value) {
    const tier = GameState.getRelationshipTier(value);
    return {
      devoted: "Devoted",
      trusted: "Trusted",
      ally: "Ally",
      acquaintance: "Acquaintance",
      neutral: "Neutral",
      hostile: "Hostile",
      enemy: "Enemy",
    }[tier] || "Unknown";
  }

  return {
    socialize,
    checkRomanceAvailable,
    getRomanceBonus,
    getRelationshipColor,
    getRelationshipLabel,
  };
})();
