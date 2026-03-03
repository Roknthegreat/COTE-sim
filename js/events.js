// ============================================================
// APEX OF THE ELITE — Side Events System
// ============================================================

const Events = (() => {

  // All possible side event templates
  const SIDE_EVENTS = [

    {
      id: "the_confession",
      title: "The Confession",
      trigger: () => true,
      generate: (state) => {
        const classmates = GameState.getNPCsByClass(state.player.class)
          .filter(n => n.relationshipWithPlayer >= 20);
        if (classmates.length === 0) return null;
        const npc = classmates[Math.floor(Math.random() * classmates.length)];
        return {
          type: "side_event",
          id: "the_confession",
          npcId: npc.id,
          title: "The Confession",
          narrative: `${npc.displayName} finds you alone in the corridor after class ends. They look like they've been working up to this for days.\n\n"There's something I need to tell you," they begin. "I haven't said this to anyone here."`,
          choices: [
            { label: "Listen without judgment",    effect: { rel: 15, stat: "WIL", gain: 1 } },
            { label: "Redirect the conversation",  effect: { rel: -5 } },
            { label: "Ask what they want in return", effect: { rel: 5, infamy: 2 } },
          ],
        };
      },
    },

    {
      id: "the_bet",
      title: "The Bet",
      trigger: () => true,
      generate: (state) => {
        const allNPCs = GameState.getAllNPCs().filter(n => !n.isExpelled);
        if (allNPCs.length < 2) return null;
        const a = allNPCs[Math.floor(Math.random() * allNPCs.length)];
        const b = allNPCs.filter(n => n.id !== a.id)[Math.floor(Math.random() * (allNPCs.length - 1))];
        return {
          type: "side_event",
          id: "the_bet",
          title: "The Bet",
          narrative: `You come around the corner to find ${a.displayName} and ${b.displayName} squaring off. It's heading somewhere physical. A small crowd is already gathering.`,
          choices: [
            { label: "Step in and stop it",  effect: { rel_a: 10, rel_b: 10, socialRep: 5 } },
            { label: `Bet on ${a.displayName}`, effect: { spoints: 4000, gamble: true, target: a.id } },
            { label: `Bet on ${b.displayName}`, effect: { spoints: 4000, gamble: true, target: b.id } },
            { label: "Walk past — not your business", effect: { } },
          ],
        };
      },
    },

    {
      id: "the_leak",
      title: "The Rumor",
      trigger: (state) => state.player.reputation.social >= 20,
      generate: (state) => {
        return {
          type: "side_event",
          id: "the_leak",
          title: "The Rumor",
          narrative: `Word reaches you through a second-hand source: someone is spreading a rumor about you. You don't know who, or what exactly they're saying. But you've heard your name twice in conversations that stopped when you approached.`,
          choices: [
            { label: "Investigate the source (costs 1 AP)", effect: { ap: -1, stlGain: 1, narrative: "You spend the afternoon tracing threads. You find a name." } },
            { label: "Ignore it and let your behavior speak", effect: { socialRep: -3, wilGain: 2 } },
            { label: "Spread a counter-narrative", effect: { infamy: 3, socialRep: 2 } },
          ],
        };
      },
    },

    {
      id: "the_tutor",
      title: "The Request",
      trigger: (state) => state.player.reputation.academic >= 60,
      generate: (state) => {
        const struggling = GameState.getAllNPCs()
          .filter(n => n.currentStats.INT < 55 && !n.isExpelled);
        if (struggling.length === 0) return null;
        const npc = struggling[Math.floor(Math.random() * struggling.length)];
        return {
          type: "side_event",
          id: "the_tutor",
          title: "The Request",
          narrative: `${npc.displayName} approaches you quietly, away from anyone who might overhear. "You know this material. I don't. I'm not asking for charity — I know what I'm asking."`,
          choices: [
            { label: "Help them freely (costs 1 AP)", effect: { ap: -1, rel: 20, npcId: npc.id } },
            { label: "Help in exchange for a favor", effect: { rel: 10, npcId: npc.id, flag: `owes_tutor_${npc.id}` } },
            { label: "Decline politely", effect: { rel: -5, npcId: npc.id } },
          ],
        };
      },
    },

    {
      id: "the_offer",
      title: "Recruitment",
      trigger: (state) => state.player.factions.length === 0,
      generate: (state) => {
        const factions = ["student_council", "academic_guild", "iron_circle", "syndicate"];
        const faction = factions[Math.floor(Math.random() * factions.length)];
        const factionLabels = {
          student_council: "The Student Council",
          academic_guild:  "The Academic Guild",
          iron_circle:     "The Iron Circle",
          syndicate:       "The Syndicate",
        };
        return {
          type: "side_event",
          id: "the_offer",
          title: "Recruitment",
          faction,
          narrative: `A student you've seen but not spoken to leaves a folded note on your desk at the end of class. It reads:\n\n"${factionLabels[faction]} is watching you. If you're interested in knowing what that means — room 214, after 6pm."`,
          choices: [
            { label: "Go to room 214", effect: { screen: "faction_join", faction } },
            { label: "Ignore the note", effect: { } },
            { label: "Show it to someone (depends on who)", effect: { requiresTarget: true } },
          ],
        };
      },
    },

    {
      id: "the_test",
      title: "The Probe",
      trigger: (state) => state.player.reputation.combat >= 30,
      generate: (state) => {
        const fighters = GameState.getAllNPCs()
          .filter(n => n.currentStats.CMB >= 50 && !n.isExpelled);
        if (fighters.length === 0) return null;
        const npc = fighters[Math.floor(Math.random() * fighters.length)];
        return {
          type: "side_event",
          id: "the_test",
          title: "The Probe",
          npcId: npc.id,
          narrative: `${npc.displayName} finds you alone in the gym. They don't look hostile — or at least, not only hostile.\n\n"I'm not looking for a fight. I want to spar. I want to see what I've been hearing about."`,
          choices: [
            { label: "Accept — go all out",     effect: { combat: true, stance: "aggressive", npcId: npc.id } },
            { label: "Accept — hold back",      effect: { combat: true, stance: "defensive",  npcId: npc.id } },
            { label: "Decline without comment", effect: { rel: -5, npcId: npc.id } },
          ],
        };
      },
    },

    {
      id: "the_incident",
      title: "The Incident",
      trigger: (state) => state.player.stats.PER >= 50,
      generate: (state) => {
        const npcs = GameState.getAllNPCs().filter(n => !n.isExpelled);
        if (npcs.length === 0) return null;
        const npc = npcs[Math.floor(Math.random() * npcs.length)];
        return {
          type: "side_event",
          id: "the_incident",
          title: "The Incident",
          npcId: npc.id,
          narrative: `You weren't supposed to see that.\n\n${npc.displayName}, alone in a corridor section that should be empty at this hour. They're doing something — something that would answer a question you didn't know you had until now. They haven't noticed you yet.`,
          choices: [
            { label: "Observe quietly — gather intel",      effect: { stlCheck: true, intelGain: npc.id } },
            { label: "Make your presence known",            effect: { rel: 5, npcId: npc.id } },
            { label: "Back away without being seen",        effect: { } },
          ],
        };
      },
    },

    {
      id: "the_letter",
      title: "Anonymous Note",
      trigger: () => Math.random() < 0.3,
      generate: (state) => {
        const msgs = [
          "Someone knows more about you than they should. Be careful what you show.",
          "Class A isn't what it looks like from Class D. Someone in Class A is working against your class.",
          "There's something in the library's restricted section. It was placed there recently.",
          "Trust the person least likely to approach you first.",
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        return {
          type: "side_event",
          id: "the_letter",
          title: "Anonymous Note",
          narrative: `A plain envelope is on your desk when you return to your room. Inside, one line:\n\n"${msg}"`,
          choices: [
            { label: "File it away — note the information",  effect: { perGain: 1 } },
            { label: "Investigate the origin (costs 1 AP)", effect: { ap: -1, stlCheck: true } },
            { label: "Discard it",                           effect: { } },
          ],
        };
      },
    },

    {
      id: "inoue_extortion_witness",
      title: "The Price",
      trigger: (state) =>
        state.year === 1 && state.month >= 2 && !GameState.hasFlag("witnessed_extortion"),
      generate: (state) => {
        GameState.setFlag("witnessed_extortion");
        return {
          type: "side_event",
          id: "inoue_extortion_witness",
          title: "The Price",
          priority: true,
          narrative: `You turn down the wrong corridor at the wrong time.\n\nInoue Takuma has a younger student pinned against the wall — Class D, you think. Tanaka Yuki stands beside him, arms folded, watching the smaller student's expression with clinical interest.\n\n"Your answer?" Inoue says. Quiet. No performance. That makes it worse.`,
          choices: [
            { label: "Step in and intervene",         effect: { combat: true, npcId: "C-001", public: true } },
            { label: "Watch from the shadows — learn", effect: { stlCheck: true, intelGain: "C-001" } },
            { label: "Walk past — you saw nothing",    effect: { flag: "ignored_extortion" } },
          ],
        };
      },
    },

  ];

  function getRandomSideEvent(state) {
    // Priority events first
    const priority = SIDE_EVENTS.filter(e =>
      e.trigger(state) && e.generate(state)?.priority
    );
    if (priority.length > 0) {
      const evt = priority[0].generate(state);
      return evt ? [evt] : [];
    }

    // Regular events
    const eligible = SIDE_EVENTS.filter(e => e.trigger(state));
    if (eligible.length === 0) return [];

    const template = eligible[Math.floor(Math.random() * eligible.length)];
    const event = template.generate(state);
    return event ? [event] : [];
  }

  function resolveEventChoice(state, event, choiceIndex) {
    const choice = event.choices[choiceIndex];
    if (!choice) return null;
    const effect = choice.effect || {};

    const results = [];

    // AP cost
    if (effect.ap && !GameState.spendAP(-effect.ap)) {
      return [{ type: "fail", narrative: "Not enough AP for that." }];
    }

    // Relationship change
    if (effect.rel !== undefined && event.npcId) {
      GameState.adjustNPCRelationship(event.npcId, effect.rel);
    }

    // Stat gains (boosted by TAL except PHY)
    const statMap = {
      stlGain: "STL", perGain: "PER", wilGain: "WIL",
      intGain: "INT", chaGain: "CHA",
    };
    Object.entries(statMap).forEach(([key, stat]) => {
      if (effect[key]) {
        const gain = effect[key] * getTalentGrowthMultiplier(stat, state.player.stats.TAL);
        state.player.stats[stat] = Math.min(CONFIG.PLAYER_STAT_CAP,
          state.player.stats[stat] + gain);
      }
    });

    // Reputation effects
    if (effect.infamy)    state.player.reputation.infamy    = Math.min(100, state.player.reputation.infamy    + effect.infamy);
    if (effect.socialRep) state.player.reputation.social    = Math.min(100, state.player.reputation.social    + effect.socialRep);
    if (effect.teacherRep)state.player.reputation.teacher   = Math.min(100, state.player.reputation.teacher   + effect.teacherRep);

    // Intel gain
    if (effect.intelGain) {
      const npc = GameState.getNPC(effect.intelGain);
      if (npc) {
        const alreadyKnown = state.player.knownSecrets.some(k => k.npcId === npc.id);
        if (!alreadyKnown) {
          state.player.knownSecrets.push({ npcId: npc.id, secret: npc.secret });
          results.push({
            type: "secret_discovered",
            npcId: npc.id,
            narrative: `You now know something about ${npc.displayName} that they haven't told anyone.`,
          });
        }
      }
    }

    // Flags
    if (effect.flag) GameState.setFlag(effect.flag);

    // Narrative
    if (effect.narrative) results.push({ type: "choice_result", narrative: effect.narrative });

    if (choice.label) {
      results.push({ type: "choice_made", label: choice.label });
    }

    return results;
  }

  return {
    getRandomSideEvent,
    resolveEventChoice,
    SIDE_EVENTS,
  };
})();
