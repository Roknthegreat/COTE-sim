// ============================================================
// APEX OF THE ELITE — Configuration & Constants
// ============================================================

const CONFIG = {
  // ── Time ──────────────────────────────────────────────────
  AP_PER_WEEK: 7,
  WEEKS_PER_MONTH: 4,
  MONTHS_PER_YEAR: 12,
  TOTAL_YEARS: 3,

  // ── Economy ───────────────────────────────────────────────
  STIPEND: {
    A: 100000,
    B: 80000,
    C: 50000,
    D: 20000,
  },

  // ── Academic Thresholds ───────────────────────────────────
  GRADE_THRESHOLDS: {
    HONOR: 80,
    PASS: 60,
    WARNING: 40,
    EXPULSION_RISK: 39,
  },

  // ── Relationship Tiers ────────────────────────────────────
  REL_TIERS: {
    DEVOTED: 86,
    TRUSTED: 61,
    ALLY: 31,
    ACQUAINTANCE: 1,
    NEUTRAL: 0,
    HOSTILE: -1,
    ENEMY: -50,
  },

  // ── Combat ────────────────────────────────────────────────
  COMBAT_RNG_VARIANCE: 0.15,

  // ── Reputation Bands ─────────────────────────────────────
  COMBAT_REP: {
    LEGENDARY: 81,
    FEARED: 51,
    NOTICED: 21,
    UNKNOWN: 0,
  },

  // ── Stat Caps ─────────────────────────────────────────────
  PLAYER_STAT_CAP: 100,
  NPC_STAT_CAP: 85,

  // ── Action Costs ─────────────────────────────────────────
  ACTIONS: {
    study:      { ap: 1, gains: ["INT", "academicRep"],  label: "Study" },
    train:      { ap: 1, gains: ["PHY"],                  label: "Physical Training" },
    martial:    { ap: 1, gains: ["CMB"],                  label: "Martial Arts" },
    socialize:  { ap: 1, gains: ["CHA", "relationship"],  label: "Socialize" },
    scheme:     { ap: 2, gains: ["STL", "PER"],           label: "Scheme / Intel" },
    work:       { ap: 1, gains: ["spoints"],              label: "Part-Time Work" },
    gamble:     { ap: 1, gains: ["spoints"],              label: "Gamble" },
    rest:       { ap: 1, gains: ["statRecovery"],         label: "Rest" },
    investigate:{ ap: 1, gains: ["PER", "events"],        label: "Investigate" },
    boardgames: { ap: 1, gains: ["INT", "PER"],           label: "Board Games" },
  },

  // ── Bloodlines ────────────────────────────────────────────
  BLOODLINES: {
    white_room:       { rarity: 0.01, label: "White Room",       color: "#e8edf5" },
    political_elite:  { rarity: 0.08, label: "Political Elite",  color: "#c9a84c" },
    military_lineage: { rarity: 0.12, label: "Military Lineage", color: "#7a9dbf" },
    scholar_clan:     { rarity: 0.15, label: "Scholar Clan",     color: "#8fba8f" },
    underground:      { rarity: 0.10, label: "Underground",      color: "#a87fc9" },
    noble_decline:    { rarity: 0.10, label: "Noble Decline",    color: "#c9845a" },
    commoner:         { rarity: 0.44, label: "Commoner",         color: "#94a3b8" },
  },

  // ── Class Colors ──────────────────────────────────────────
  CLASS_COLORS: {
    A: "#c9a84c",   // Gold
    B: "#8fa4b8",   // Silver
    C: "#4a7ab5",   // Steel Blue
    D: "#5a6475",   // Ash Grey
  },

  CLASS_LABELS: {
    A: "Class A — Elite",
    B: "Class B — Advanced",
    C: "Class C — Standard",
    D: "Class D — Foundation",
  },

  // ── Subjects ──────────────────────────────────────────────
  SUBJECTS: [
    "Mathematics",
    "Science",
    "Literature",
    "History",
    "Physical Education",
    "Logic & Reasoning",
  ],

  // ── Martial Arts Styles ───────────────────────────────────
  MARTIAL_ARTS: {
    boxing:    { label: "Boxing",     bonus: "strike",    synergy: "CMB",      learnRate: 1.4 },
    judo:      { label: "Judo",       bonus: "grapple",   synergy: "PHY",      learnRate: 1.2 },
    krav_maga: { label: "Krav Maga",  bonus: "dirty",     synergy: "CMB",      learnRate: 0.9 },
    capoeira:  { label: "Capoeira",   bonus: "evasion",   synergy: "PER",      learnRate: 1.1 },
    wrestling: { label: "Wrestling",  bonus: "control",   synergy: "PHY",      learnRate: 1.1 },
    muay_thai: { label: "Muay Thai",  bonus: "aggressive",synergy: "CMB",      learnRate: 1.0 },
  },
};
