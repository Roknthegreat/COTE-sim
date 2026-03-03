// ============================================================
// APEX OF THE ELITE — Central Game State Manager
// ============================================================

const GameState = (() => {
  let _state = null;

  const defaults = {
    // ── Meta ─────────────────────────────────────────────
    version: "1.0.0",
    initialized: false,
    currentScreen: "title",   // title | prologue | creation | main | map | roster | faction | save

    // ── Time ─────────────────────────────────────────────
    year: 1,
    month: 1,
    week: 1,
    day: 1,
    apRemaining: CONFIG.AP_PER_WEEK,

    // ── Player ───────────────────────────────────────────
    player: {
      firstName: "",
      lastName: "",
      displayName: "",
      gender: "unspecified",
      appearance: "Unremarkable",
      archetype: "cold_strategist",
      backstory: "scholarship_student",
      bloodline: "commoner",
      class: "D",

      stats: {
        INT: 50, PHY: 50, CMB: 30, CHA: 50,
        PER: 50, STL: 40, WIL: 50, TAL: 50,
      },

      // Subject skill levels (1–100)
      subjects: {
        Mathematics:      50,
        Science:          50,
        Literature:       50,
        History:          50,
        "Physical Education": 50,
        "Logic & Reasoning":  50,
      },

      martialStyles: [],       // Unlocked styles
      activeMartialStyle: null,

      spoints: 0,
      classPoints: 0,

      reputation: {
        combat:   0,
        academic: 50,
        social:   30,
        infamy:   0,
        teacher:  50,
      },

      monthlyGrades: [],        // Array of grade objects
      currentGrades: {},
      atExpulsionRisk: false,

      factions: [],             // Joined faction ids
      activeSchemes: [],
      completedSchemes: [],

      knownSecrets: [],         // { npcId, secret }
      discoveredBloodlines: [], // NPC ids whose bloodline was revealed
    },

    // ── NPCs ─────────────────────────────────────────────
    npcs: {},    // keyed by id; merged from STUDENT_ROSTER + runtime state

    // ── World ─────────────────────────────────────────────
    classPoints: { A: 1000, B: 1000, C: 1000, D: 1000 },
    activeEvents: [],
    completedEvents: [],
    worldLog: [],       // Autonomous NPC actions log

    // ── Narrative ─────────────────────────────────────────
    narrativeLog: [],   // Player-facing story log
    currentDialogue: null,
    pendingChoices: [],

    // ── Flags ─────────────────────────────────────────────
    flags: {},           // Story flags, e.g. { "met_inoue": true }
    endingFlags: [],     // Narrative ending conditions accumulated

    // ── Save ──────────────────────────────────────────────
    lastSaved: null,
    ironmanMode: false,
  };

  function init(overrides = {}) {
    _state = JSON.parse(JSON.stringify(defaults));
    Object.assign(_state, overrides);

    // Seed NPC runtime state from roster
    STUDENT_ROSTER.forEach(npc => {
      _state.npcs[npc.id] = {
        ...JSON.parse(JSON.stringify(npc)),
        currentStats: { ...npc.stats },
        relationshipWithPlayer: 0,
        agendaStage: 0,
        isExpelled: false,
        knownToPlayer: false,
        bloodlineRevealedToPlayer: false,
      };
    });

    _state.initialized = true;
    return _state;
  }

  function get() {
    if (!_state) throw new Error("GameState not initialized.");
    return _state;
  }

  function set(path, value) {
    const keys = path.split(".");
    let obj = _state;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }

  function getPlayer() { return _state.player; }
  function getNPC(id)   { return _state.npcs[id]; }
  function getAllNPCs()  { return Object.values(_state.npcs); }
  function getNPCsByClass(cls) {
    return Object.values(_state.npcs).filter(n => n.class === cls && !n.isExpelled);
  }

  function addToNarrativeLog(entry) {
    _state.narrativeLog.unshift({
      ...entry,
      timestamp: { year: _state.year, month: _state.month, week: _state.week },
    });
    if (_state.narrativeLog.length > 200) _state.narrativeLog.pop();
  }

  function addToWorldLog(entry) {
    _state.worldLog.unshift({
      ...entry,
      timestamp: { year: _state.year, month: _state.month, week: _state.week },
    });
    if (_state.worldLog.length > 500) _state.worldLog.pop();
  }

  function setFlag(key, value = true) {
    _state.flags[key] = value;
  }
  function hasFlag(key) {
    return !!_state.flags[key];
  }

  function adjustPlayerStat(stat, delta) {
    const p = _state.player;
    const cap = CONFIG.PLAYER_STAT_CAP;
    p.stats[stat] = Math.max(0, Math.min(cap, (p.stats[stat] || 0) + delta));
  }

  function adjustPlayerSPoints(delta) {
    _state.player.spoints = Math.max(0, _state.player.spoints + delta);
  }

  function adjustNPCRelationship(npcId, delta) {
    const npc = _state.npcs[npcId];
    if (!npc) return;
    npc.relationshipWithPlayer = Math.max(-100, Math.min(100,
      (npc.relationshipWithPlayer || 0) + delta));
  }

  function getRelationshipTier(value) {
    const T = CONFIG.REL_TIERS;
    if (value >= T.DEVOTED)      return "devoted";
    if (value >= T.TRUSTED)      return "trusted";
    if (value >= T.ALLY)         return "ally";
    if (value >= T.ACQUAINTANCE) return "acquaintance";
    if (value > T.HOSTILE)       return "neutral";
    if (value >= T.ENEMY)        return "hostile";
    return "enemy";
  }

  function spendAP(amount) {
    if (_state.apRemaining < amount) return false;
    _state.apRemaining -= amount;
    return true;
  }

  function resetWeeklyAP() {
    _state.apRemaining = CONFIG.AP_PER_WEEK;
  }

  function serialize() {
    return JSON.stringify(_state);
  }

  function deserialize(json) {
    _state = JSON.parse(json);
    return _state;
  }

  return {
    init,
    get,
    set,
    getPlayer,
    getNPC,
    getAllNPCs,
    getNPCsByClass,
    addToNarrativeLog,
    addToWorldLog,
    setFlag,
    hasFlag,
    adjustPlayerStat,
    adjustPlayerSPoints,
    adjustNPCRelationship,
    getRelationshipTier,
    spendAP,
    resetWeeklyAP,
    serialize,
    deserialize,
  };
})();
