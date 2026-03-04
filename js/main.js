// ============================================================
// APEX OF THE ELITE — Main Entry Point & Game Loop
// ============================================================

const Game = (() => {

  let _pendingEvent = null;

  function init() {
    UI.renderTitleScreen();
  }

  function newGame() {
    UI.renderCharacterCreation();
  }

  function startGame(creationData) {
    const state = GameState.init();
    Character.applyCreation(state, creationData);

    // Bloodline reveal
    const scene = Character.getBloodlineIntroScene(state.player.bloodline);
    UI.renderBloodlineReveal(scene, state.player.bloodline, () => {
      GameState.addToNarrativeLog({
        type: "intro",
        title: "Year 1 — Week 1 — Monday",
        narrative: "The train from Tokyo arrives at Advanced Nurturing High School at 8:17 AM. You look at the building from the platform. Nobody speaks to you yet. That won't last.",
      });
      UI.renderMainGame(state);
      // Show Week 1 context board
      const pressures = Events.generateWeeklyPressures(state);
      setTimeout(() => UI.renderWeekContextBoard(pressures, state), 400);
    });
  }

  // ── Layer 2: Action → Scene Modal ─────────────────────────
  // Player clicks an action button → show scene modal with choices

  function doAction(actionKey, options = {}) {
    const state = GameState.get();
    const action = CONFIG.ACTIONS[actionKey];

    if (!action) return;
    if (state.apRemaining < action.ap) {
      UI.showToast("Not enough Action Points remaining.", "warn");
      return;
    }

    // Sub-selections needed before scene
    if (actionKey === "socialize" && !options.npcId) {
      UI.openNPCPicker("socialize");
      return;
    }
    if (actionKey === "martial" && !options.style) {
      UI.openMartialArtSelector();
      return;
    }

    // Show action scene modal (Layer 2 micro-interaction)
    const scenes = CONFIG.ACTION_SCENES[actionKey];
    if (scenes && scenes.length > 0) {
      const scene = scenes[Math.floor(Math.random() * scenes.length)];
      UI.renderActionSceneModal(scene, actionKey, options);
    } else {
      // No scene defined — execute directly with neutral modifier
      executeActionWithModifier(actionKey, options, { mult: 1.0 });
    }
  }

  // ── Execute action after scene choice is made ─────────────

  function executeActionWithModifier(actionKey, options, modifier) {
    const state = GameState.get();
    const action = CONFIG.ACTIONS[actionKey];

    if (!GameState.spendAP(action.ap)) {
      UI.showToast("Not enough Action Points remaining.", "warn");
      return;
    }

    // Track daily action
    const day = state.currentDay;
    if (!state.weekDayActions[day]) state.weekDayActions[day] = [];
    state.weekDayActions[day].push(actionKey);

    let result = null;
    const opts = options || {};

    switch (actionKey) {
      case "study":
        result = _doStudy(state, opts.subject || "Mathematics", modifier);
        break;
      case "train":
        result = _doTrain(state, modifier);
        break;
      case "martial":
        result = _doMartial(state, opts.style, modifier);
        break;
      case "socialize":
        result = Relationships.socialize(state, opts.npcId);
        if (result && modifier.narrative) result.sceneOutcome = modifier.narrative;
        break;
      case "scheme":
        result = _doScheme(state, opts, modifier);
        break;
      case "work":
        result = Economy.doPartTimeWork(state);
        if (result && modifier.narrative) result.sceneOutcome = modifier.narrative;
        break;
      case "gamble":
        result = Economy.doGamble(state, opts.game || "cards");
        if (result && modifier.narrative) result.sceneOutcome = modifier.narrative;
        break;
      case "rest":
        result = _doRest(state, modifier);
        break;
      case "investigate":
        result = _doInvestigate(state, modifier);
        break;
      case "boardgames":
        result = _doBoardGames(state, modifier);
        break;
    }

    if (result) {
      // Attach scene choice outcome as sub-narrative if present
      if (modifier.narrative && !result.sceneOutcome) {
        result.sceneOutcome = modifier.narrative;
      }
      GameState.addToNarrativeLog(result);
      UI.renderActionResult(result);
    }

    UI.updateHUD(state);
    UI.renderDayCalendar(state);
    UI.renderStatPanel(state); // refresh threats panel

    // Show investigate-found events immediately
    if (result && result.event && _pendingEvent) {
      setTimeout(() => UI.renderEventModal(_pendingEvent), 700);
      return; // skip interruption if event is queued
    }

    // Layer 3: Check for NPC interruption after action
    if (state.apRemaining >= 0) {
      setTimeout(() => _checkInterruption(state), 600);
    }
  }

  // ── Layer 3: Mid-week NPC Interruptions ───────────────────

  function _checkInterruption(state) {
    if (Math.random() > 0.28) return; // 28% chance per action
    const interrupt = Events.generateInterruption(state);
    if (!interrupt) return;
    state.pendingInterrupt = interrupt;
    UI.renderInterruptModal(interrupt);
  }

  function resolveInterrupt(choiceIndex) {
    const state = GameState.get();
    const interrupt = state.pendingInterrupt;
    if (!interrupt) return;

    const choice = interrupt.choices[choiceIndex];
    if (!choice) return;

    const effect = choice.effect || {};
    const results = [];

    // Relationship change
    if (effect.rel !== undefined && interrupt.npcId) {
      GameState.adjustNPCRelationship(interrupt.npcId, effect.rel);
    }

    // NPC threat escalation
    if (effect.npcThreat && interrupt.npcId) {
      const npc = GameState.getNPC(interrupt.npcId);
      if (npc) npc.agendaStage = Math.min(5, (npc.agendaStage || 0) + 1);
    }

    // Reputation
    if (effect.infamy)    state.player.reputation.infamy    = Math.min(100, state.player.reputation.infamy    + effect.infamy);
    if (effect.socialRep) state.player.reputation.social    = Math.min(100, state.player.reputation.social    + effect.socialRep);
    if (effect.combatRep) state.player.reputation.combat    = Math.min(100, state.player.reputation.combat    + effect.combatRep);

    // Stat gains
    const statGains = { perGain: "PER", stlGain: "STL", chaGain: "CHA", wilGain: "WIL", intGain: "INT" };
    Object.entries(statGains).forEach(([key, stat]) => {
      if (effect[key]) {
        const gain = effect[key] * getTalentGrowthMultiplier(stat, state.player.stats.TAL);
        state.player.stats[stat] = Math.min(CONFIG.PLAYER_STAT_CAP, state.player.stats[stat] + gain);
      }
    });

    if (choice.outcome) {
      results.push({ type: "interrupt_resolved", title: interrupt.title, narrative: choice.outcome });
    }

    results.forEach(r => GameState.addToNarrativeLog(r));
    state.pendingInterrupt = null;

    UI.closeModal();
    UI.updateHUD(state);
    UI.renderStatPanel(state);

    if (results.length > 0) {
      UI.renderActionResult(results[0]);
    }
  }

  // ── Layer 4: Day-by-day advancement ───────────────────────

  function advanceDay() {
    const state = GameState.get();

    if (state.currentDay >= 7) {
      _endWeek();
    } else {
      state.currentDay++;
      const dayName = CONFIG.DAY_NAMES[state.currentDay - 1];
      const isWeekend = state.currentDay >= 6;

      UI.renderMainGame(state);
      UI.showToast(`${dayName}${isWeekend ? " — Free Day" : ""} · ${state.apRemaining} AP remaining`, "info");

      // Weekend events
      if (isWeekend) {
        setTimeout(() => _checkWeekendEvent(state), 400);
      }
    }
  }

  function _checkWeekendEvent(state) {
    if (Math.random() > 0.45) return;
    const found = Events.getRandomSideEvent(state);
    if (found.length > 0) {
      _pendingEvent = found[0];
      UI.renderEventModal(_pendingEvent);
    }
  }

  function _endWeek() {
    const state = GameState.get();
    const events = Time.weeklyTick(state);

    // Update active threats based on new week state
    _updateActiveThreats(state, events);

    events.forEach(evt => {
      GameState.addToNarrativeLog(evt);
      if (evt.requiresChoice) {
        _pendingEvent = evt;
      }
    });

    UI.renderMainGame(state);
    // Show consequences summary (not a recap — just what changed)
    UI.renderWeekConsequences(events);

    if (_pendingEvent) {
      setTimeout(() => UI.renderEventModal(_pendingEvent), 500);
    }
  }

  function _updateActiveThreats(state, events) {
    // Countdown existing threats
    state.activeThreats = (state.activeThreats || [])
      .map(t => ({ ...t, countdown: t.countdown - 1 }))
      .filter(t => t.countdown > 0);

    // Add/refresh NPC threats from hostile actors
    const hostileNPCs = GameState.getAllNPCs().filter(n =>
      n.relationshipWithPlayer < -25 && n.agendaStage >= 2 && !n.isExpelled
    );
    hostileNPCs.slice(0, 2).forEach(npc => {
      const id = `npc_threat_${npc.id}`;
      if (!state.activeThreats.find(t => t.id === id)) {
        GameState.addThreat({ id, type: "npc", description: `${npc.displayName} gathering intel on you`, countdown: 4, severity: "high" });
      }
    });

    // Academic threat
    if (state.player.atExpulsionRisk) {
      GameState.addThreat({ id: "expulsion_risk", type: "academic", description: "Academic standing critical — expulsion risk", countdown: 5, severity: "critical" });
    }

    // Low grades upcoming exam
    if (state.player.currentGrades && state.player.currentGrades.average < 55 && state.week === 3) {
      GameState.addThreat({ id: "grade_warning", type: "academic", description: `Grade average at ${state.player.currentGrades.average}% — exam next week`, countdown: 2, severity: "warning" });
    }
  }

  // ── Action Implementations ─────────────────────────────────

  function _doStudy(state, subject, modifier = {}) {
    const mult = modifier.mult || 1.0;
    Academics.processStudyAction(state.player, subject, mult);
    return {
      type: "study",
      title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — Study: ${subject}`,
      narrative: modifier.narrative || `You work through ${subject}. The material advances.`,
    };
  }

  function _doTrain(state, modifier = {}) {
    const mult = modifier.mult || 1.0;
    const gain = (1.2 + Math.random() * 0.8) * mult;
    state.player.stats.PHY = Math.min(CONFIG.PLAYER_STAT_CAP, state.player.stats.PHY + gain);
    if (modifier.bonus) {
      const bg = modifier.bonus.gain * getTalentGrowthMultiplier(modifier.bonus.stat, state.player.stats.TAL);
      state.player.stats[modifier.bonus.stat] = Math.min(CONFIG.PLAYER_STAT_CAP, state.player.stats[modifier.bonus.stat] + bg);
    }
    return {
      type: "train",
      title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — Physical Training`,
      narrative: modifier.narrative || "The gym, the track, the resistance equipment. Your body adapts slowly. It always does.",
    };
  }

  function _doMartial(state, style, modifier = {}) {
    const player = state.player;
    if (!style || !CONFIG.MARTIAL_ARTS[style]) {
      UI.openMartialArtSelector();
      return null;
    }
    if (!player.martialStyles.includes(style)) player.martialStyles.push(style);
    player.activeMartialStyle = style;

    const mult = modifier.mult || 1.0;
    const gain = 1.5 * mult * getTalentGrowthMultiplier("CMB", player.stats.TAL);
    player.stats.CMB = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.CMB + gain);
    if (modifier.bonus) {
      const bg = modifier.bonus.gain * getTalentGrowthMultiplier(modifier.bonus.stat, player.stats.TAL);
      player.stats[modifier.bonus.stat] = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats[modifier.bonus.stat] + bg);
    }
    return {
      type: "martial",
      title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — ${CONFIG.MARTIAL_ARTS[style].label} Practice`,
      narrative: modifier.narrative || `You drill ${CONFIG.MARTIAL_ARTS[style].label} technique. Repetition carves the body.`,
    };
  }

  function _doScheme(state, options, modifier = {}) {
    const player = state.player;
    const mult = modifier.mult || 1.0;
    player.stats.STL = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.STL + 0.8 * mult * getTalentGrowthMultiplier("STL", player.stats.TAL));
    player.stats.PER = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.PER + 0.6 * mult * getTalentGrowthMultiplier("PER", player.stats.TAL));
    if (modifier.bonus) {
      const bg = modifier.bonus.gain * getTalentGrowthMultiplier(modifier.bonus.stat, player.stats.TAL);
      player.stats[modifier.bonus.stat] = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats[modifier.bonus.stat] + bg);
    }
    return {
      type: "scheme",
      title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — Intel Gathering`,
      narrative: modifier.narrative || "You move carefully through the school's social corridors. Listening. Filing.",
    };
  }

  function _doRest(state, modifier = {}) {
    const player = state.player;
    const mult = modifier.mult || 1.0;
    ["CMB", "WIL", "INT", "CHA", "PER"].forEach(s => {
      if (player.stats[s] < 40) player.stats[s] = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats[s] + 2 * mult);
    });
    if (modifier.bonus) {
      const bg = modifier.bonus.gain * getTalentGrowthMultiplier(modifier.bonus.stat, player.stats.TAL);
      player.stats[modifier.bonus.stat] = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats[modifier.bonus.stat] + bg);
    }
    return {
      type: "rest",
      title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — Rest`,
      narrative: modifier.narrative || "You let the day go. Tomorrow will come regardless.",
    };
  }

  function _doInvestigate(state, modifier = {}) {
    const player = state.player;
    const mult = modifier.mult || 1.0;
    player.stats.PER = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.PER + 1.0 * mult * getTalentGrowthMultiplier("PER", player.stats.TAL));
    if (modifier.bonus) {
      const bg = modifier.bonus.gain * getTalentGrowthMultiplier(modifier.bonus.stat, player.stats.TAL);
      player.stats[modifier.bonus.stat] = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats[modifier.bonus.stat] + bg);
    }
    const found = Events.getRandomSideEvent(state);
    if (found.length > 0) {
      _pendingEvent = found[0];
      return {
        type: "investigate_find",
        title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — Investigation`,
        narrative: modifier.narrative || (found[0].narrative || "Your investigation turns up something."),
        event: found[0],
      };
    }
    return {
      type: "investigate_nothing",
      title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — Investigate`,
      narrative: modifier.narrative || "You move through the school's quieter spaces. The texture of this place becomes more legible.",
    };
  }

  function _doBoardGames(state, modifier = {}) {
    const player = state.player;
    const mult = modifier.mult || 1.0;
    player.stats.INT = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.INT + 0.8 * mult * getTalentGrowthMultiplier("INT", player.stats.TAL));
    player.stats.PER = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.PER + 0.5 * mult * getTalentGrowthMultiplier("PER", player.stats.TAL));
    if (modifier.bonus) {
      const bg = modifier.bonus.gain * getTalentGrowthMultiplier(modifier.bonus.stat, player.stats.TAL);
      player.stats[modifier.bonus.stat] = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats[modifier.bonus.stat] + bg);
    }
    return {
      type: "boardgames",
      title: `${CONFIG.DAY_NAMES[state.currentDay - 1]} — Board Game Practice`,
      narrative: modifier.narrative || "Chess. Go. Shogi. The board doesn't lie. Your pattern recognition sharpens.",
    };
  }

  // ── Event Resolution ───────────────────────────────────────

  function resolveEvent(choiceIndex) {
    if (!_pendingEvent) return;
    const state = GameState.get();
    const results = Events.resolveEventChoice(state, _pendingEvent, choiceIndex);
    _pendingEvent = null;

    if (results) {
      results.forEach(r => GameState.addToNarrativeLog(r));
      UI.renderEventResults(results);
    }
    UI.updateHUD(state);
  }

  // Kept as an alias for backward compatibility (also called by End Week button)
  function advanceWeek() {
    _endWeek();
  }

  // ── Save/Load ─────────────────────────────────────────────

  function saveGame(slot = 0) {
    try {
      localStorage.setItem(`apex_save_${slot}`, GameState.serialize());
      UI.showToast("Game saved.", "success");
    } catch (e) {
      UI.showToast("Save failed.", "error");
    }
  }

  function loadGame(slot = 0) {
    const data = localStorage.getItem(`apex_save_${slot}`);
    if (!data) { UI.showToast("No save data found.", "warn"); return false; }
    GameState.deserialize(data);
    UI.renderMainGame(GameState.get());
    return true;
  }

  function hasSave(slot = 0) {
    return !!localStorage.getItem(`apex_save_${slot}`);
  }

  return {
    init,
    newGame,
    startGame,
    doAction,
    executeActionWithModifier,
    resolveInterrupt,
    advanceDay,
    advanceWeek,
    resolveEvent,
    saveGame,
    loadGame,
    hasSave,
  };
})();

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => Game.init());
