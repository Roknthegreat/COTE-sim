// ============================================================
// APEX OF THE ELITE — Time & Week Progression
// ============================================================

const Time = (() => {

  // Advance one week — the core game loop tick
  function weeklyTick(state) {
    const events = [];

    // 1. Process queued player actions (AP already spent via UI)
    events.push(...processPlayerActions(state));

    // 2. NPCs autonomously advance their agendas
    events.push(...tickNPCAgendas(state));

    // 3. Relationship natural decay toward neutral
    checkRelationshipDecay(state);

    // 4. Passive perception checks
    events.push(...runPassiveRepChecks(state));

    // 5. Advance active schemes
    events.push(...checkSchemeProgress(state));

    // 6. Trigger contextual side events (1–2 per week)
    events.push(...triggerSideEvents(state));

    // 7. Update weekly academic contribution
    updateWeeklyAcademics(state);

    // 8. Advance time
    state.week++;
    if (state.week > CONFIG.WEEKS_PER_MONTH) {
      state.week = 1;
      events.push(...monthlyTick(state));
    }

    // 9. Reset AP
    GameState.resetWeeklyAP();

    return events.filter(Boolean);
  }

  function monthlyTick(state) {
    const events = [];

    // Run academic exam
    const gradeResult = Academics.runMonthlyExam(state);
    events.push({
      type: "monthly_grades",
      data: gradeResult,
      narrative: `Monthly academic review complete. Your average: ${gradeResult.average}. Status: ${Academics.getGradeLabel(gradeResult.status)}.`,
    });

    // Formal review check
    if (gradeResult.formalReview) {
      events.push({
        type: "expulsion_hearing",
        data: gradeResult,
        narrative: "A formal academic review has been triggered. You must appear before the faculty board.",
        requiresChoice: true,
      });
    }

    // Monthly stipend
    const stipend = CONFIG.STIPEND[state.player.class] || CONFIG.STIPEND.D;
    GameState.adjustPlayerSPoints(stipend);
    events.push({
      type: "stipend",
      data: { amount: stipend },
      narrative: `Monthly stipend deposited: ¥${stipend.toLocaleString()} S-Points.`,
    });

    // NPC grade simulation and agenda advancement
    simulateNPCMonthlyActivity(state);

    // Check class point events
    events.push(...checkClassPointEvents(state));

    state.month++;
    if (state.month > CONFIG.MONTHS_PER_YEAR) {
      state.month = 1;
      events.push(...yearlyTick(state));
    }

    return events.filter(Boolean);
  }

  function yearlyTick(state) {
    const events = [];

    events.push({
      type: "year_end",
      narrative: `Year ${state.year} ends. Class rankings are recalculated...`,
    });

    // Class ranking recalculation
    const recalc = recalculateClassRankings(state);
    events.push(recalc);

    state.year++;

    if (state.year > CONFIG.TOTAL_YEARS) {
      events.push({ type: "game_end", narrative: "Three years have passed. The school is behind you." });
    } else {
      events.push({
        type: "new_year",
        narrative: `Year ${state.year} begins. New students arrive. The stakes shift.`,
      });
    }

    return events.filter(Boolean);
  }

  function processPlayerActions(state) {
    // Actions are handled immediately when player clicks them via UI.
    // This function handles any residual effects.
    return [];
  }

  function tickNPCAgendas(state) {
    const events = [];
    const npcs = GameState.getAllNPCs();

    npcs.forEach(npc => {
      if (npc.isExpelled) return;

      // Randomly advance agenda stage (weighted by how active they are)
      const roll = Math.random();
      if (roll < 0.15) {
        npc.agendaStage = Math.min(5, npc.agendaStage + 1);

        // At certain stages, visible events occur
        if (npc.agendaStage === 2) {
          events.push(generateNPCAgendaEvent(npc, state));
        }
      }

      // NPC vs NPC relationship shifts (autonomous social dynamics)
      evolveNPCRelationships(npc, state);
    });

    return events.filter(Boolean);
  }

  function generateNPCAgendaEvent(npc, state) {
    // General agenda events — not all visible to player
    const isVisible = Math.random() < 0.3;
    if (!isVisible) return null;

    return {
      type: "npc_agenda",
      npcId: npc.id,
      narrative: `[World Event] ${npc.displayName} (${npc.class}) has made a notable move this week.`,
      worldLogOnly: true,
    };
  }

  function evolveNPCRelationships(npc, state) {
    // Slight random drift in NPC internal relationships (not player-facing)
    // This creates dynamic NPC social world
  }

  function checkRelationshipDecay(state) {
    const npcs = GameState.getAllNPCs();
    npcs.forEach(npc => {
      const rel = npc.relationshipWithPlayer;
      if (rel === 0) return;
      // Slow decay toward 0 if no recent interaction
      if (Math.abs(rel) > 5) {
        npc.relationshipWithPlayer += rel > 0 ? -0.5 : 0.5;
      }
    });
  }

  function runPassiveRepChecks(state) {
    const events = [];
    const player = state.player;

    // High PER = chance to notice something happening
    if (player.stats.PER >= 60 && Math.random() < 0.2) {
      const visibleNPCs = GameState.getAllNPCs().filter(n =>
        n.agendaStage >= 2 && !n.isExpelled && n.class !== "A"
      );
      if (visibleNPCs.length > 0) {
        const npc = visibleNPCs[Math.floor(Math.random() * visibleNPCs.length)];
        events.push({
          type: "perception_catch",
          npcId: npc.id,
          narrative: `Your perception catches something — ${npc.displayName} has been unusually active lately.`,
        });
      }
    }

    return events.filter(Boolean);
  }

  function checkSchemeProgress(state) {
    const events = [];
    state.player.activeSchemes.forEach(scheme => {
      scheme.progress = (scheme.progress || 0) + 1;
      if (scheme.progress >= scheme.totalSteps) {
        events.push({
          type: "scheme_complete",
          scheme,
          narrative: `Your scheme — "${scheme.name}" — has reached its final stage.`,
          requiresChoice: true,
        });
      }
    });
    return events.filter(Boolean);
  }

  function triggerSideEvents(state) {
    // ~30% chance per week of a side event
    if (Math.random() > 0.30) return [];
    return Events.getRandomSideEvent(state);
  }

  function updateWeeklyAcademics(state) {
    // INT very slowly degrades without study (0.05 per week)
    if (!state.player._weeklyStudyAP || Object.keys(state.player._weeklyStudyAP).length === 0) {
      state.player.stats.INT = Math.max(1, state.player.stats.INT - 0.05);
    }
  }

  function simulateNPCMonthlyActivity(state) {
    const npcs = GameState.getAllNPCs();
    npcs.forEach(npc => {
      if (npc.isExpelled) return;

      // Simulate NPC academic performance
      const grade = Academics.simulateNPCGrade(npc);
      if (grade < CONFIG.GRADE_THRESHOLDS.WARNING && Math.random() < 0.1) {
        // Small chance low-performing NPC gets expelled
        npc.isExpelled = true;
        GameState.addToWorldLog({
          type: "npc_expelled_academic",
          npcId: npc.id,
          narrative: `${npc.displayName} failed to meet academic standards.`,
        });
      }

      // Simulate NPC stat growth (PHY NOT boosted by TAL)
      simulateNPCStatGrowth(npc);
    });
  }

  function simulateNPCStatGrowth(npc) {
    const growableStats = ["INT", "CMB", "CHA", "PER", "STL", "WIL"];
    growableStats.forEach(stat => {
      if (npc.currentStats[stat] < CONFIG.NPC_STAT_CAP) {
        const growth = 0.1 * getTalentGrowthMultiplier(stat, npc.currentStats.TAL);
        npc.currentStats[stat] = Math.min(CONFIG.NPC_STAT_CAP,
          npc.currentStats[stat] + growth);
      }
    });

    // PHY grows without TAL boost — just raw training
    if (npc.currentStats.PHY < CONFIG.NPC_STAT_CAP) {
      npc.currentStats.PHY = Math.min(CONFIG.NPC_STAT_CAP,
        npc.currentStats.PHY + 0.08);
    }
  }

  function checkClassPointEvents(state) {
    const events = [];
    // Check if any class is at risk of demotion
    Object.entries(state.classPoints).forEach(([cls, pts]) => {
      if (pts < 500) {
        events.push({
          type: "class_point_warning",
          class: cls,
          points: pts,
          narrative: `Class ${cls} has critically low class points. Demotion risk is rising.`,
        });
      }
    });
    return events;
  }

  function recalculateClassRankings(state) {
    // Compare class points and determine promotions/demotions
    const ranking = Object.entries(state.classPoints)
      .sort(([, a], [, b]) => b - a)
      .map(([cls]) => cls);

    return {
      type: "class_ranking",
      ranking,
      narrative: `Year-end rankings: ${ranking.join(" > ")} — in class point order.`,
    };
  }

  function getDateLabel(state) {
    const months = [
      "April", "May", "June", "July", "August", "September",
      "October", "November", "December", "January", "February", "March"
    ];
    const monthIndex = ((state.month - 1) % 12);
    return `Year ${state.year} — ${months[monthIndex]}, Week ${state.week}`;
  }

  return {
    weeklyTick,
    monthlyTick,
    yearlyTick,
    getDateLabel,
  };
})();
