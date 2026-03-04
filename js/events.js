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

  // ── NPC Interruption Templates (Layer 3) ─────────────────
  const INTERRUPT_EVENTS = [
    {
      id: "hallway_confrontation",
      weight: 1,
      generate: (state) => {
        const hostile = GameState.getAllNPCs().filter(n =>
          n.relationshipWithPlayer < -15 && !n.isExpelled && n.agendaStage >= 1
        );
        if (hostile.length === 0) return null;
        const npc = hostile[Math.floor(Math.random() * hostile.length)];
        return {
          type: "interrupt",
          id: "hallway_confrontation",
          npcId: npc.id,
          title: `⚡ INTERRUPTED — ${npc.displayName}`,
          setting: "SCHOOL CORRIDOR",
          narrative: `You're heading to your next destination when ${npc.displayName} steps directly into your path.\n\n"I've been meaning to talk to you." The tone isn't friendly. Their eyes say they've been waiting for this.`,
          choices: [
            { label: "Hold your ground — don't show anything",       effect: { wilGain: 0.3 }, outcome: "You don't flinch. They recalibrate what they thought they knew about you." },
            { label: "De-escalate — choose your words carefully",    effect: { rel: 8, chaGain: 0.2 }, outcome: "You talk them down. Temporarily. The tension doesn't disappear." },
            { label: "Turn it back on them — play offense",          effect: { rel: -5, infamy: 3 }, outcome: "You put them on the back foot. They remember this exchange differently." },
            { label: "Walk past without engaging",                   effect: { rel: -10, npcThreat: true }, outcome: "They let you pass. Their attention on you intensifies." },
          ],
        };
      },
    },
    {
      id: "curious_observer",
      weight: 2,
      generate: (state) => {
        const neutral = GameState.getAllNPCs().filter(n =>
          Math.abs(n.relationshipWithPlayer) < 20 && !n.isExpelled && n.knownToPlayer
        );
        if (neutral.length === 0) return null;
        const npc = neutral[Math.floor(Math.random() * neutral.length)];
        return {
          type: "interrupt",
          id: "curious_observer",
          npcId: npc.id,
          title: `⚡ INTERRUPTED — ${npc.displayName}`,
          setting: "BETWEEN CLASSES",
          narrative: `${npc.displayName} falls into step beside you without asking.\n\n"I've seen you around. I've been asking about you. You're not what I expected."`,
          choices: [
            { label: '"What did you expect?"',             effect: { rel: 8, perGain: 0.3 }, outcome: "Their answer is more honest than you anticipated. You file it." },
            { label: "Give them nothing — stay unreadable", effect: { stlGain: 0.4 }, outcome: "They're uncertain what to make of you. Good." },
            { label: "Flip it — ask what they want",        effect: { rel: 5, chaGain: 0.3 }, outcome: "Direct. They appreciate it or they don't. Either way you have data." },
          ],
        };
      },
    },
    {
      id: "ally_warning",
      weight: 2,
      generate: (state) => {
        const allies = GameState.getAllNPCs().filter(n =>
          n.relationshipWithPlayer >= 25 && !n.isExpelled
        );
        if (allies.length === 0) return null;
        const npc = allies[Math.floor(Math.random() * allies.length)];
        const threats = GameState.getAllNPCs().filter(n =>
          n.relationshipWithPlayer < -20 && !n.isExpelled
        );
        const threatNPC = threats.length > 0 ? threats[0] : null;
        return {
          type: "interrupt",
          id: "ally_warning",
          npcId: npc.id,
          title: `⚡ ${npc.displayName} — PRIVATE`,
          setting: "QUIET MOMENT",
          narrative: `${npc.displayName} finds you when no one is watching. Their expression isn't casual.\n\n"I heard something. ${threatNPC ? `${threatNPC.displayName} is moving against you —` : "Someone is making moves against you —"} I thought you'd want to know before it reaches you."`,
          choices: [
            { label: "Get everything they know — press for details",  effect: { rel: 8, perGain: 0.5 }, outcome: "They tell you more than they planned to. Trust deepens." },
            { label: "Thank them and file it",                        effect: { rel: 5 }, outcome: "Clean. Efficient. They understand." },
            { label: "Ask why they're telling you this",              effect: { rel: 3, perGain: 0.3 }, outcome: "The answer matters. You'll remember it." },
          ],
        };
      },
    },
    {
      id: "witnessed_conflict",
      weight: 2,
      generate: (state) => {
        const npcs = GameState.getAllNPCs().filter(n => !n.isExpelled);
        if (npcs.length < 2) return null;
        const idx1 = Math.floor(Math.random() * npcs.length);
        let idx2 = Math.floor(Math.random() * npcs.length);
        while (idx2 === idx1) idx2 = Math.floor(Math.random() * npcs.length);
        const a = npcs[idx1], b = npcs[idx2];
        return {
          type: "interrupt",
          id: "witnessed_conflict",
          title: "⚡ WITNESSED — CONFRONTATION",
          setting: "COMMON AREA",
          narrative: `${a.displayName} and ${b.displayName} — the middle of something that was clearly not meant to be public. You've walked into it before either noticed you.`,
          choices: [
            { label: "Back away unseen — they don't know you saw", effect: { stlGain: 0.4, perGain: 0.3 }, outcome: "You file what you observed. Neither of them knows." },
            { label: "Make your presence known — defuse it",       effect: { socialRep: 3 }, outcome: "They reset. Grateful, or at least they pretend to be." },
            { label: "Watch — let it fully play out",              effect: { perGain: 0.6, infamy: 2 }, outcome: "You learn more than expected. They notice you eventually." },
          ],
        };
      },
    },
    {
      id: "challenge_issued",
      weight: 1,
      generate: (state) => {
        if (state.player.reputation.combat < 20) return null;
        const fighters = GameState.getAllNPCs().filter(n =>
          n.currentStats.CMB >= 40 && !n.isExpelled
        );
        if (fighters.length === 0) return null;
        const npc = fighters[Math.floor(Math.random() * fighters.length)];
        return {
          type: "interrupt",
          id: "challenge_issued",
          npcId: npc.id,
          title: `⚡ CHALLENGE — ${npc.displayName}`,
          setting: "TRAINING AREA",
          narrative: `${npc.displayName} is waiting where you pass every day. Today they step forward.\n\n"I want to see what the rumors are about. Here. Now." It isn't a question.`,
          choices: [
            { label: "Accept — go all out",           effect: { combatRep: 5 }, outcome: "The fight happens. The result enters the school's informal record." },
            { label: "Accept — set your own terms",   effect: { wilGain: 0.3 }, outcome: "You name conditions they didn't expect. They accept." },
            { label: "Decline — not on their schedule", effect: { rel: -8, wilGain: 0.4 }, outcome: "They're surprised. The challenge remains open between you." },
          ],
        };
      },
    },
    {
      id: "anonymous_tip",
      weight: 1,
      generate: (state) => {
        return {
          type: "interrupt",
          id: "anonymous_tip",
          title: "⚡ ANONYMOUS CONTACT",
          setting: "UNEXPECTED MOMENT",
          narrative: `A student you don't recognize passes close and says, without slowing:\n\n"Room 3C, Thursday after seven. If you want to know what's actually happening in this school."`,
          choices: [
            { label: "Note it — follow up when ready",      effect: { perGain: 0.4 }, outcome: "You commit it to memory. The room number. The time. Thursday." },
            { label: "Call after them — get more",         effect: { chaGain: 0.2 }, outcome: "They don't slow. But they heard you. The door opens slightly." },
            { label: "Dismiss it — too vague",             effect: {}, outcome: "You move on. The information expires unused." },
          ],
        };
      },
    },
    {
      id: "overheard_conversation",
      weight: 2,
      generate: (state) => {
        if (state.player.stats.PER < 45) return null;
        const npcs = GameState.getAllNPCs().filter(n => !n.isExpelled && n.agendaStage >= 1);
        if (npcs.length === 0) return null;
        const npc = npcs[Math.floor(Math.random() * npcs.length)];
        return {
          type: "interrupt",
          id: "overheard_conversation",
          npcId: npc.id,
          title: "⚡ OVERHEARD",
          setting: "NEAR THE STAIRWELL",
          narrative: `You catch your name spoken in a low voice. ${npc.displayName}, on the landing above, talking to someone out of view.\n\nThey don't know your hearing is better than they assumed.`,
          choices: [
            { label: "Stop and listen — take the risk",     effect: { perGain: 0.6, stlGain: 0.3 }, outcome: "The risk pays. You catch enough to act on." },
            { label: "Make a sound — let them know you're there", effect: { rel: 5 }, outcome: "The conversation stops. The dynamic shifts when they realize." },
            { label: "Walk on — pretend you heard nothing", effect: { wilGain: 0.2 }, outcome: "You play it perfectly. They don't know what you caught." },
          ],
        };
      },
    },
  ];

  // ── Weekly Pressure Generator (Layer 1) ──────────────────
  function generateWeeklyPressures(state) {
    const pressures = [];
    const player = state.player;

    // Academic danger
    if (player.currentGrades && player.currentGrades.average !== undefined) {
      const avg = player.currentGrades.average;
      if (avg < 42) {
        pressures.push({ type: "academic", severity: "critical", text: `Academic average at ${avg}% — expulsion threshold is near` });
      } else if (avg < 62) {
        pressures.push({ type: "academic", severity: "warning", text: `Academic performance below standard (${avg}%) — exam approaches` });
      }
    }
    if (player.atExpulsionRisk) {
      pressures.push({ type: "academic", severity: "critical", text: "FORMAL REVIEW PENDING — academic standing critical" });
    }

    // Hostile NPC activity
    const hostileActive = GameState.getAllNPCs().filter(n =>
      n.relationshipWithPlayer < -20 && n.agendaStage >= 2 && !n.isExpelled
    );
    hostileActive.slice(0, 2).forEach(npc => {
      pressures.push({
        type: "npc", severity: "high",
        text: `${npc.displayName} (Class ${npc.class}) has been actively gathering intel on you`,
        npcId: npc.id,
      });
    });

    // Low class points
    const playerClassPts = state.classPoints[player.class] || 1000;
    if (playerClassPts < 600) {
      pressures.push({ type: "resource", severity: "warning", text: `Class ${player.class} at ${playerClassPts} class points — demotion risk elevated` });
    }

    // High-agenda neutrals
    const activeNPCs = GameState.getAllNPCs().filter(n =>
      n.agendaStage >= 3 && !n.isExpelled && Math.abs(n.relationshipWithPlayer) < 20
    );
    if (activeNPCs.length > 0) {
      const npc = activeNPCs[Math.floor(Math.random() * activeNPCs.length)];
      pressures.push({ type: "unknown", severity: "medium", text: `${npc.displayName} is making unusual moves — motive still unknown`, npcId: npc.id });
    }

    // Month-end exam warning
    if (state.week === 4) {
      pressures.push({ type: "academic", severity: "reminder", text: "Monthly academic examination at end of this week" });
    }

    // Low S-points
    if (player.spoints < 5000) {
      pressures.push({ type: "resource", severity: "warning", text: `S-Point balance critically low (¥${player.spoints.toLocaleString()})` });
    }

    return pressures;
  }

  // ── Interruption Generator ────────────────────────────────
  function generateInterruption(state) {
    // Weight-based random selection from eligible templates
    const eligible = INTERRUPT_EVENTS.filter(e => {
      try { return e.generate(state) !== null; } catch { return false; }
    });
    if (eligible.length === 0) return null;

    const totalWeight = eligible.reduce((sum, e) => sum + (e.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    for (const template of eligible) {
      roll -= (template.weight || 1);
      if (roll <= 0) return template.generate(state);
    }
    return eligible[eligible.length - 1].generate(state);
  }

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
    generateInterruption,
    generateWeeklyPressures,
    SIDE_EVENTS,
  };
})();
