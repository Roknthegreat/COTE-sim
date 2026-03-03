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
        title: "Year 1 — Week 1",
        narrative: "The train from Tokyo arrives at Advanced Nurturing High School at 8:17 AM. You look at the building from the platform. Nobody speaks to you yet. That won't last.",
      });
      UI.renderMainGame(state);
    });
  }

  // ── Week Action Resolution ────────────────────────────────

  function doAction(actionKey, options = {}) {
    const state = GameState.get();
    const action = CONFIG.ACTIONS[actionKey];

    if (!action) return;
    if (!GameState.spendAP(action.ap)) {
      UI.showToast("Not enough Action Points remaining.", "warn");
      return;
    }

    let result = null;

    switch (actionKey) {
      case "study":
        result = doStudy(state, options.subject || "Mathematics");
        break;
      case "train":
        result = doTrain(state);
        break;
      case "martial":
        result = doMartial(state, options.style);
        break;
      case "socialize":
        if (!options.npcId) { UI.openNPCPicker("socialize"); return; }
        result = Relationships.socialize(state, options.npcId);
        break;
      case "scheme":
        result = doScheme(state, options);
        break;
      case "work":
        result = Economy.doPartTimeWork(state);
        break;
      case "gamble":
        result = Economy.doGamble(state, options.game || "cards");
        break;
      case "rest":
        result = doRest(state);
        break;
      case "investigate":
        result = doInvestigate(state);
        break;
      case "boardgames":
        result = doBoardGames(state);
        break;
    }

    if (result) {
      GameState.addToNarrativeLog(result);
      UI.renderActionResult(result);
    }

    UI.updateHUD(state);

    // Auto-advance week when AP runs out
    if (state.apRemaining === 0) {
      setTimeout(() => advanceWeek(), 400);
    }
  }

  function doStudy(state, subject) {
    Academics.processStudyAction(state.player, subject);
    return {
      type: "study",
      title: `Studied: ${subject}`,
      narrative: `You spend the block on ${subject}. Your focus isn't perfect, but the material moves forward.`,
    };
  }

  function doTrain(state) {
    // PHY growth — NOT boosted by TAL (raw physical conditioning)
    const gain = 1.2 + (Math.random() * 0.8);
    state.player.stats.PHY = Math.min(CONFIG.PLAYER_STAT_CAP, state.player.stats.PHY + gain);
    return {
      type: "train",
      title: "Physical Training",
      narrative: "The gym, the track, the resistance equipment. Your body adapts slowly. It always does.",
    };
  }

  function doMartial(state, style) {
    const player = state.player;
    if (!style || !CONFIG.MARTIAL_ARTS[style]) {
      UI.openMartialArtSelector();
      return null;
    }

    if (!player.martialStyles.includes(style)) {
      player.martialStyles.push(style);
    }
    player.activeMartialStyle = style;

    // CMB growth — boosted by TAL (martial arts is a learned skill)
    const gain = 1.5 * getTalentGrowthMultiplier("CMB", player.stats.TAL);
    player.stats.CMB = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.CMB + gain);

    return {
      type: "martial",
      title: `${CONFIG.MARTIAL_ARTS[style].label} Practice`,
      narrative: `You drill ${CONFIG.MARTIAL_ARTS[style].label} technique. Repetition carves the body.`,
    };
  }

  function doScheme(state, options) {
    const player = state.player;

    // STL growth — boosted by TAL
    const stlGain = 0.8 * getTalentGrowthMultiplier("STL", player.stats.TAL);
    player.stats.STL = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.STL + stlGain);

    // PER growth — boosted by TAL
    const perGain = 0.6 * getTalentGrowthMultiplier("PER", player.stats.TAL);
    player.stats.PER = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.PER + perGain);

    return {
      type: "scheme",
      title: "Intel Gathering",
      narrative: "You move carefully through the school's social corridors. Listening. Filing.",
    };
  }

  function doRest(state) {
    const player = state.player;
    // Partial stat recovery
    const stats = ["CMB", "WIL", "INT", "CHA", "PER"];
    stats.forEach(s => {
      if (player.stats[s] < 30) {
        player.stats[s] = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats[s] + 2);
      }
    });
    return {
      type: "rest",
      title: "Rest",
      narrative: "You let the day go. Tomorrow will come regardless.",
    };
  }

  function doInvestigate(state) {
    const player = state.player;

    // PER growth — boosted by TAL
    const perGain = 1.0 * getTalentGrowthMultiplier("PER", player.stats.TAL);
    player.stats.PER = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.PER + perGain);

    // Check for discoverable events
    const found = Events.getRandomSideEvent(state);
    if (found.length > 0) {
      _pendingEvent = found[0];
      return {
        type: "investigate_find",
        title: "Something Found",
        narrative: found[0].narrative || "Your investigation turns up something.",
        event: found[0],
      };
    }

    return {
      type: "investigate_nothing",
      title: "Investigate",
      narrative: "You move through the school's quieter spaces. Nothing surfaces today. But you learn the texture of the place better.",
    };
  }

  function doBoardGames(state) {
    const player = state.player;
    const intGain = 0.8 * getTalentGrowthMultiplier("INT", player.stats.TAL);
    const perGain = 0.5 * getTalentGrowthMultiplier("PER", player.stats.TAL);
    player.stats.INT = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.INT + intGain);
    player.stats.PER = Math.min(CONFIG.PLAYER_STAT_CAP, player.stats.PER + perGain);
    return {
      type: "boardgames",
      title: "Board Game Practice",
      narrative: "Chess. Go. Shogi. The board doesn't lie. Your pattern recognition sharpens.",
    };
  }

  // ── Week Advance ──────────────────────────────────────────

  function advanceWeek() {
    const state = GameState.get();
    const events = Time.weeklyTick(state);

    events.forEach(evt => {
      GameState.addToNarrativeLog(evt);
      if (evt.requiresChoice) {
        _pendingEvent = evt;
      }
    });

    UI.renderMainGame(state);
    UI.renderWeeklySummary(events);

    if (_pendingEvent) {
      UI.renderEventModal(_pendingEvent);
    }
  }

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
    advanceWeek,
    resolveEvent,
    saveGame,
    loadGame,
    hasSave,
  };
})();

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => Game.init());
