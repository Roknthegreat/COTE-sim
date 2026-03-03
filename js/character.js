// ============================================================
// APEX OF THE ELITE — Character Creation
// ============================================================

const Character = (() => {

  const ARCHETYPES = {
    cold_strategist:    { label: "Cold Strategist",    desc: "Detached, analytical, observational. Natural at scheming, costly at emotional appeals." },
    charismatic_leader: { label: "Charismatic Leader", desc: "Warm but calculating. Natural at alliances, costly at working alone." },
    hot_headed_fighter: { label: "Hot-Headed Fighter", desc: "Aggressive, instinct-driven. Natural at combat, costly at patience." },
    silent_observer:    { label: "Silent Observer",    desc: "Minimal, precise, unsettling. Natural at perception, costly at leadership." },
    idealist:           { label: "Idealist",           desc: "Principled, emotionally rich. Natural at loyalty, costly at ruthless schemes." },
    opportunist:        { label: "Opportunist",        desc: "Cynical, adaptable, self-aware. Natural at deal-making, costly at principled stands." },
  };

  const APPEARANCES = {
    imposing:          { label: "Imposing",         desc: "+5 Intimidation modifier in early confrontations", bonus: { CMB: 3 } },
    unremarkable:      { label: "Unremarkable",     desc: "+5 Stealth bonus early game — people don't notice you", bonus: { STL: 3 } },
    sharp_featured:    { label: "Sharp-featured",   desc: "+3 PER — you read people easily", bonus: { PER: 3 } },
    gentle_looking:    { label: "Gentle-looking",   desc: "+3 CHA — disarming first impression", bonus: { CHA: 3 } },
  };

  const BACKSTORIES = {
    former_delinquent:      { label: "Former Delinquent",       bonus: { CMB: 8, combat_rep: 10 }, penalty: { teacher_rep: -20 } },
    burned_out_prodigy:     { label: "Burned-Out Prodigy",       bonus: { INT: 8, knownSecrets: 1 }, penalty: { TAL: -15 } },
    former_student_council: { label: "Former Student Council",   bonus: { CHA: 8, political_trust: 10 }, penalty: {} },
    self_taught_martial:    { label: "Self-Taught Martial Artist",bonus: { CMB: 8, freeMartialArt: true }, penalty: { INT: -5 } },
    underground_gambler:    { label: "Underground Gambler",      bonus: { spoints: 30000, STL: 5 }, penalty: {} },
    scholarship_student:    { label: "Scholarship Student",      bonus: { TAL: 12, teacher_rep: 10 }, penalty: {} },
    estranged_noble:        { label: "Estranged Noble",          bonus: { CHA: 6, PER: 5 }, penalty: {} },
  };

  const BLOODLINE_BASE_STATS = {
    white_room:       { INT: 75, PHY: 65, CMB: 65, CHA: 40, PER: 70, STL: 65, WIL: 75, TAL: 70 },
    political_elite:  { INT: 60, PHY: 50, CMB: 40, CHA: 70, PER: 55, STL: 45, WIL: 55, TAL: 55 },
    military_lineage: { INT: 50, PHY: 70, CMB: 65, CHA: 50, PER: 50, STL: 45, WIL: 65, TAL: 55 },
    scholar_clan:     { INT: 70, PHY: 45, CMB: 35, CHA: 55, PER: 55, STL: 50, WIL: 60, TAL: 70 },
    underground:      { INT: 50, PHY: 50, CMB: 50, CHA: 55, PER: 65, STL: 70, WIL: 55, TAL: 60 },
    noble_decline:    { INT: 55, PHY: 45, CMB: 40, CHA: 65, PER: 60, STL: 55, WIL: 55, TAL: 60 },
    commoner:         { INT: 50, PHY: 50, CMB: 45, CHA: 50, PER: 50, STL: 50, WIL: 50, TAL: 65 },
  };

  function rollBloodline() {
    const r = Math.random();
    let cumulative = 0;
    for (const [key, config] of Object.entries(CONFIG.BLOODLINES)) {
      cumulative += config.rarity;
      if (r < cumulative) return key;
    }
    return "commoner";
  }

  function buildPlayerStats(bloodline, archetype, appearance, backstory) {
    const base = { ...BLOODLINE_BASE_STATS[bloodline] };

    // Archetype adjustments
    const archetypeMods = {
      cold_strategist:    { INT: 5, STL: 5, PER: 3, CHA: -3 },
      charismatic_leader: { CHA: 8, WIL: 3, STL: -3 },
      hot_headed_fighter: { CMB: 8, PHY: 5, INT: -5, STL: -3 },
      silent_observer:    { PER: 8, STL: 5, CHA: -5 },
      idealist:           { WIL: 8, CHA: 5, STL: -5 },
      opportunist:        { PER: 5, STL: 5, CHA: 5, WIL: -3 },
    };
    const aMods = archetypeMods[archetype] || {};
    Object.entries(aMods).forEach(([s, v]) => base[s] = Math.max(1, (base[s] || 50) + v));

    // Appearance bonus
    const appBonus = (APPEARANCES[appearance] || {}).bonus || {};
    Object.entries(appBonus).forEach(([s, v]) => base[s] = (base[s] || 50) + v);

    // Backstory bonus
    const bStory = BACKSTORIES[backstory] || {};
    const bBonus = bStory.bonus || {};
    const bPenalty = bStory.penalty || {};
    Object.entries(bBonus).forEach(([s, v]) => {
      if (typeof v === "number") base[s] = (base[s] || 50) + v;
    });
    Object.entries(bPenalty).forEach(([s, v]) => {
      if (typeof v === "number") base[s] = Math.max(1, (base[s] || 50) + v);
    });

    // Clamp all to valid range
    Object.keys(base).forEach(s => {
      base[s] = Math.max(10, Math.min(CONFIG.PLAYER_STAT_CAP, base[s]));
    });

    return base;
  }

  function buildStartingReputation(backstory) {
    const rep = { combat: 0, academic: 50, social: 30, infamy: 0, teacher: 50 };
    if (backstory === "former_delinquent")       { rep.combat = 10; rep.teacher = 30; }
    if (backstory === "former_student_council")  { rep.social = 45; rep.teacher = 60; }
    if (backstory === "scholarship_student")     { rep.teacher = 65; rep.academic = 55; }
    return rep;
  }

  function buildStartingSPoints(backstory, bloodline) {
    let base = 10000;
    if (backstory === "underground_gambler") base += 30000;
    if (bloodline  === "political_elite")    base += 15000;
    if (bloodline  === "noble_decline")      base += 10000;
    return base;
  }

  function applyCreation(state, creationData) {
    const {
      firstName, lastName, gender, appearance,
      archetype, backstory,
    } = creationData;

    const bloodline = rollBloodline();
    const stats = buildPlayerStats(bloodline, archetype, appearance, backstory);
    const reputation = buildStartingReputation(backstory);
    const spoints = buildStartingSPoints(backstory, bloodline);

    const player = state.player;
    player.firstName   = firstName;
    player.lastName    = lastName;
    player.displayName = `${lastName} ${firstName}`;
    player.gender      = gender;
    player.appearance  = appearance;
    player.archetype   = archetype;
    player.backstory   = backstory;
    player.bloodline   = bloodline;
    player.stats       = stats;
    player.reputation  = reputation;
    player.spoints     = spoints;
    player.class       = "D";

    // Free martial art from backstory
    if (backstory === "self_taught_martial") {
      const arts = Object.keys(CONFIG.MARTIAL_ARTS);
      player.martialStyles = [arts[Math.floor(Math.random() * arts.length)]];
      player.activeMartialStyle = player.martialStyles[0];
    }

    // Known secret from Burned-Out Prodigy
    if (backstory === "burned_out_prodigy") {
      const randomNPC = STUDENT_ROSTER[Math.floor(Math.random() * STUDENT_ROSTER.length)];
      player.knownSecrets = [{ npcId: randomNPC.id, secret: randomNPC.secret }];
    }

    return { bloodline, stats };
  }

  function getBloodlineIntroScene(bloodline) {
    const scenes = {
      white_room: {
        title: "Field Deployment",
        text: "You wake up in a sterile white room. A man in a suit stands at the door. You don't remember how you got here. You aren't sure you remember anything before this. He says: 'Your enrollment has been processed. Remember — your performance in the field is what matters.' The door opens onto a train platform. The train is already moving.",
      },
      political_elite: {
        title: "The Driver",
        text: "Your father's driver drops you at the gate without ceremony. He says nothing except: 'Don't embarrass the family.' You already know three teachers' names before stepping inside. You already know which students you should watch. Your father has been preparing you for this for years. You're not entirely sure that's a good thing.",
      },
      military_lineage: {
        title: "The Order",
        text: "A spartan apartment. Your father checks your posture before he checks your face. Your acceptance letter is pinned to the wall like a field order. He gives you nothing sentimental. He gives you a principle: 'You won't be the strongest here. Be the last one standing.' You believe him.",
      },
      scholar_clan: {
        title: "The Inheritance",
        text: "Books stacked ceiling-high. Your mother quizzes you over breakfast on the school's published curriculum, which you've already read twice. Your family doesn't celebrate this. It was expected. 'Knowledge is the one inheritance they can't take from you,' she says. You've been told this since you could read.",
      },
      underground: {
        title: "The Lesson",
        text: "A back-alley apartment. Your guardian — not your parent — slides the acceptance letter across a scratched table. He doesn't look proud. He looks calculating. 'Don't get caught doing what I taught you,' he says. 'But don't forget what I taught you either.' You aren't sure which rule to break first.",
      },
      noble_decline: {
        title: "The Performance",
        text: "A crumbling estate that still smells like money that left years ago. Your clothes are two seasons out of date but cut precisely right. You rehearse your introduction in the mirror until it sounds effortless. The family name still opens doors. You intend to use every single one while they're still ajar.",
      },
      commoner: {
        title: "Nobody Waiting",
        text: "A small apartment. Your mother cries a little when you leave, then pretends she didn't. Nobody is waiting for you at the school gates. You have no connections, no family name anyone would recognize, no edge handed to you by blood. What you have is what you built. That will have to be enough.",
      },
    };
    return scenes[bloodline] || scenes.commoner;
  }

  return {
    ARCHETYPES,
    APPEARANCES,
    BACKSTORIES,
    rollBloodline,
    buildPlayerStats,
    applyCreation,
    getBloodlineIntroScene,
  };
})();
