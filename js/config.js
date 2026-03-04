// ============================================================
// APEX OF THE ELITE — Configuration & Constants
// ============================================================

const CONFIG = {
  // ── Time ──────────────────────────────────────────────────
  AP_PER_WEEK: 7,
  DAY_NAMES: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
  DAY_SHORT:  ["MON","TUE","WED","THU","FRI","SAT","SUN"],
  WEEKEND_DAYS: [6, 7],
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

  // ── Action Scene Templates (Layer 2 micro-interactions) ───
  ACTION_SCENES: {
    study: [
      {
        setting: "EVENING — STUDY ROOM",
        narrative: "You spread your materials across the desk. The hallway outside is quiet for once. Two hours before lights-out. The problem sets stare back.",
        choices: [
          { label: "Deep focus — work through every problem", modifier: { mult: 1.4, narrative: "You don't look up until the end. The material solidifies into something you can actually use." } },
          { label: "Efficient pass — key concepts only",       modifier: { mult: 1.0, bonus: { stat: "INT", gain: 0.3 }, narrative: "You prioritize ruthlessly. Less depth, wider coverage." } },
          { label: "Study while monitoring the corridor",      modifier: { mult: 0.75, bonus: { stat: "PER", gain: 0.5 }, narrative: "Half your mind is on the pages, half on the sounds outside. You catch something." } },
        ],
      },
      {
        setting: "AFTERNOON — SCHOOL LIBRARY",
        narrative: "A table near the window. The library is half-empty. Two students two tables over are speaking very quietly — body language tight. Something is being arranged.",
        choices: [
          { label: "Focus — block out everything else",     modifier: { mult: 1.3, narrative: "You build a wall between yourself and the room. The material absorbs you." } },
          { label: "Eavesdrop while appearing to read",     modifier: { mult: 0.6, bonus: { stat: "PER", gain: 0.8 }, narrative: "You catch fragments. A name. A time. Not enough — but something." } },
          { label: "Approach and make it a study group",   modifier: { mult: 0.4, bonus: { stat: "CHA", gain: 0.5 }, narrative: "You abandon the solitude. The conversation is more interesting than expected." } },
        ],
      },
      {
        setting: "MORNING — EMPTY CLASSROOM",
        narrative: "You have the classroom before anyone arrives. Cleanest hour of the day — no social performance required. Just the material and whatever you can make of it.",
        choices: [
          { label: "Attack the hardest problems first", modifier: { mult: 1.5, narrative: "By the time others arrive, you've cracked the section that was blocking you." } },
          { label: "Close gaps in previous material",   modifier: { mult: 1.0, bonus: { stat: "INT", gain: 0.2 }, narrative: "The gaps are real. Closing them takes longer than expected. You're glad you found them." } },
          { label: "Map what you still don't know",     modifier: { mult: 0.8, bonus: { stat: "WIL", gain: 0.3 }, narrative: "You chart the territory of your ignorance. That's half the work." } },
        ],
      },
    ],
    train: [
      {
        setting: "AFTER SCHOOL — TRAINING FACILITY",
        narrative: "The gym is mostly empty. Someone from another class is using the equipment across the room. They notice you but say nothing.",
        choices: [
          { label: "Push your limits — max effort",               modifier: { mult: 1.4, narrative: "You leave barely able to lift your arms. It will matter later." } },
          { label: "Controlled session — technique over intensity", modifier: { mult: 1.1, bonus: { stat: "CMB", gain: 0.2 }, narrative: "Form first. The gains are slower but the foundation is cleaner." } },
          { label: "Challenge the other student to a spar",        modifier: { mult: 0.5, bonus: { stat: "CHA", gain: 0.4 }, narrative: "They agree. Brief. You learn something about each other." } },
        ],
      },
      {
        setting: "EARLY MORNING — TRACK",
        narrative: "5:43 AM. Nobody else is out here. The sky is the color of old metal. You start running.",
        choices: [
          { label: "Sprint intervals — short, brutal",    modifier: { mult: 1.5, narrative: "Your lungs are fire by the third interval. You push through it." } },
          { label: "Steady long-distance run",            modifier: { mult: 1.1, bonus: { stat: "WIL", gain: 0.3 }, narrative: "Three kilometers. Then four. Your mind clears while your body works." } },
          { label: "Run and observe the grounds",         modifier: { mult: 0.8, bonus: { stat: "PER", gain: 0.4 }, narrative: "You note who is out at this hour. More than you expected." } },
        ],
      },
    ],
    martial: [
      {
        setting: "EVENING — EMPTY DOJO",
        narrative: "The dojo is yours for the next hour. You run through the forms. Halfway through a sequence, the door opens behind you.",
        choices: [
          { label: "Continue — let them watch or leave", modifier: { mult: 1.2, narrative: "They stay. You don't acknowledge them. The session is clean." } },
          { label: "Invite them to spar",                modifier: { mult: 1.0, bonus: { stat: "CHA", gain: 0.3 }, narrative: "They hesitate, then agree. You learn more from a live target." } },
          { label: "Ask why they're here",               modifier: { mult: 0.8, bonus: { stat: "PER", gain: 0.4 }, narrative: "Their answer tells you something worth filing." } },
        ],
      },
      {
        setting: "AFTERNOON — TRAINING HALL",
        narrative: "Drilling the same combination until it stops being a sequence and starts being instinct. A student is watching from the doorway — you recognize the class badge.",
        choices: [
          { label: "Ignore them — the work is what matters", modifier: { mult: 1.3, narrative: "You don't give them the acknowledgment they came for." } },
          { label: "Perform cleanly — demonstrate your level", modifier: { mult: 1.1, bonus: { stat: "CMB", gain: 0.3 }, narrative: "You know they're watching. You make it count." } },
          { label: "Stop and confront why they're watching",   modifier: { mult: 0.7, bonus: { stat: "WIL", gain: 0.4 }, narrative: "The conversation is uncomfortable. Worth it." } },
        ],
      },
    ],
    socialize: [
      {
        setting: "LUNCH — CAFETERIA",
        narrative: "The noise of the cafeteria at full volume. You scan for the right angle of approach — sitting uninvited reads differently than asking first.",
        choices: [
          { label: "Sit down first, engage naturally",        modifier: { mult: 1.2, bonus: { stat: "CHA", gain: 0.2 }, narrative: "You commit to the space. The conversation follows from that." } },
          { label: "Ask before sitting — polite, not weak",   modifier: { mult: 1.0, narrative: "Clean. Respectful. They appreciate the signal." } },
          { label: "Read them before engaging",               modifier: { mult: 0.8, bonus: { stat: "PER", gain: 0.3 }, narrative: "You observe first. When you do speak, it lands better." } },
        ],
      },
      {
        setting: "AFTER CLASS — SCHOOL CORRIDOR",
        narrative: "A natural moment where a connection can happen. They haven't noticed you approaching yet.",
        choices: [
          { label: "Direct greeting — make the connection",     modifier: { mult: 1.1, narrative: "Simple. Direct. They respond in kind." } },
          { label: "Find a pretext — ask something useful",     modifier: { mult: 1.2, bonus: { stat: "INT", gain: 0.1 }, narrative: "You open with a question that shows you're paying attention." } },
          { label: "Wait for them to initiate — you're patient", modifier: { mult: 0.7, bonus: { stat: "WIL", gain: 0.2 }, narrative: "It takes longer. When they approach, the dynamic shifts in your favor." } },
        ],
      },
    ],
    scheme: [
      {
        setting: "FREE PERIOD — ARCHIVE ROOM",
        narrative: "The records room. Most students don't know it exists. You've pieced together the access window. The files here go back years — but patterns don't change.",
        choices: [
          { label: "Systematic review — cross-reference everything", modifier: { mult: 1.3, bonus: { stat: "INT", gain: 0.2 }, narrative: "Three hours. Your hands are dusty. Your mental map of this school just sharpened." } },
          { label: "Target one person — go deep",                     modifier: { mult: 1.1, bonus: { stat: "STL", gain: 0.3 }, narrative: "One thread pulled reveals more threads." } },
          { label: "Leave something behind — plant misinformation",   modifier: { mult: 0.8, bonus: { stat: "PER", gain: 0.4 }, narrative: "Information flows in both directions. Sometimes you feed it." } },
        ],
      },
      {
        setting: "EVENING — SCHOOL PERIMETER",
        narrative: "Two students ahead of you on the path. You slow your pace without thinking. They don't know you're there. The conversation carries on the still air.",
        choices: [
          { label: "Listen — don't risk being seen",        modifier: { mult: 1.2, bonus: { stat: "PER", gain: 0.5 }, narrative: "You catch enough. Names. A time. A location." } },
          { label: "Move closer — higher risk, more detail", modifier: { mult: 1.4, bonus: { stat: "STL", gain: 0.4 }, narrative: "The stealth check succeeds. You hear everything they said." } },
          { label: "Note what you can and withdraw cleanly", modifier: { mult: 0.9, narrative: "Safe extraction. Partial intel is still intel." } },
        ],
      },
    ],
    work: [
      {
        setting: "EVENING — PART-TIME SHIFT",
        narrative: "The shift drags. Then a customer walks in who looks out of place — too composed, paying in cash, buying something that doesn't fit them at all.",
        choices: [
          { label: "Focus on the work — not your business", modifier: { mult: 1.2, narrative: "Clean shift. Good pay. You leave without complications." } },
          { label: "Observe the unusual customer carefully", modifier: { mult: 1.0, bonus: { stat: "PER", gain: 0.4 }, narrative: "You can't follow up tonight. But you remember their face exactly." } },
          { label: "Engage them — make it a conversation",  modifier: { mult: 0.9, bonus: { stat: "CHA", gain: 0.3 }, narrative: "They're guarded. But they leave you with something to think about." } },
        ],
      },
    ],
    gamble: [
      {
        setting: "EVENING — PRIVATE CARD GAME",
        narrative: "A card game in one of the empty classrooms. Stakes are modest. The players aren't — someone at this table you've never seen before is watching everyone.",
        choices: [
          { label: "Play conservatively — minimize risk",        modifier: { mult: 0.9, narrative: "Safe decisions. Low variance. You leave with more than you risked." } },
          { label: "Read the table — play the players, not the cards", modifier: { mult: 1.2, bonus: { stat: "PER", gain: 0.3 }, narrative: "You watch faces more than your hand. That pays off tonight." } },
          { label: "Aggressive play — force the issue",           modifier: { mult: 1.4, narrative: "High risk. Either it works or it doesn't. Tonight, it works." } },
        ],
      },
    ],
    rest: [
      {
        setting: "EVENING — DORMITORY",
        narrative: "You shut the door. The day releases. There's a knock at the wall from next door — someone's still awake.",
        choices: [
          { label: "Ignore it — you need the sleep",             modifier: { mult: 1.2, narrative: "Full rest. You wake up sharper." } },
          { label: "Knock back — a quiet exchange through the wall", modifier: { mult: 0.9, bonus: { stat: "CHA", gain: 0.2 }, narrative: "A strange kind of contact. Both of you wake up tired but something shifted." } },
          { label: "Use the quiet to think through the week",    modifier: { mult: 0.8, bonus: { stat: "WIL", gain: 0.4 }, narrative: "You don't sleep much. But you arrive at clarity." } },
        ],
      },
    ],
    investigate: [
      {
        setting: "LATE AFTERNOON — RESTRICTED CORRIDOR",
        narrative: "You've mapped enough of the school to know where the gaps in visibility are. This corridor shouldn't be empty at this hour. Today it is.",
        choices: [
          { label: "Move through quickly — gather surface intel", modifier: { mult: 1.0, narrative: "Fast. Clean. You learn the layout better." } },
          { label: "Take your time — look for irregularities",   modifier: { mult: 1.3, bonus: { stat: "PER", gain: 0.4 }, narrative: "You find something that doesn't belong here." } },
          { label: "Document everything systematically",         modifier: { mult: 1.1, bonus: { stat: "INT", gain: 0.2 }, narrative: "You note everything. The pattern will emerge later." } },
        ],
      },
      {
        setting: "MORNING — ADMINISTRATIVE AREA",
        narrative: "The administration building has an access window between 7:15 and 7:40. You've confirmed this three times. Today you use it.",
        choices: [
          { label: "Target student records",              modifier: { mult: 1.2, bonus: { stat: "STL", gain: 0.3 }, narrative: "What you find shifts your understanding of someone." } },
          { label: "Target faculty communications",       modifier: { mult: 1.0, bonus: { stat: "PER", gain: 0.5 }, narrative: "Fragments of larger conversations. One piece stands out." } },
          { label: "Take what's visible and leave fast",  modifier: { mult: 0.8, narrative: "Speed prioritized. You leave with less, but cleanly." } },
        ],
      },
    ],
    boardgames: [
      {
        setting: "AFTERNOON — GAME CLUB ROOM",
        narrative: "The board game club. You've been here before. Today there's a player you haven't faced — they set up the board without making eye contact.",
        choices: [
          { label: "Accept the challenge — play to win",          modifier: { mult: 1.3, narrative: "The game takes an hour. You win. They nod once." } },
          { label: "Practice your own patterns — ignore the dynamic", modifier: { mult: 1.0, bonus: { stat: "WIL", gain: 0.3 }, narrative: "You practice while they're distracted by your indifference." } },
          { label: "Analyze their play style without playing",    modifier: { mult: 0.9, bonus: { stat: "PER", gain: 0.4 }, narrative: "You watch. By the end you understand how they think." } },
        ],
      },
    ],
  },
};
