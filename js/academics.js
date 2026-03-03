// ============================================================
// APEX OF THE ELITE — Academic System
// ============================================================

const Academics = (() => {

  // Base score for a subject exam
  function calculateSubjectScore(player, subject, apStudied = 0) {
    const base = player.stats.INT * 0.6;
    const skillBonus = (player.subjects[subject] || 50) * 0.3;
    const studyBonus = apStudied * 4;
    const noise = (Math.random() - 0.5) * 10;
    return Math.round(Math.min(100, base + skillBonus + studyBonus + noise));
  }

  // Run all six subjects for the monthly exam
  function runMonthlyExam(state) {
    const player = state.player;
    const scores = {};
    let total = 0;

    CONFIG.SUBJECTS.forEach(sub => {
      const studied = player._weeklyStudyAP ? (player._weeklyStudyAP[sub] || 0) : 0;
      const score = calculateSubjectScore(player, sub, studied);
      scores[sub] = score;
      total += score;
    });

    const average = Math.round(total / CONFIG.SUBJECTS.length);
    const status = getGradeStatus(average);

    const gradeRecord = {
      year: state.year,
      month: state.month,
      scores,
      average,
      status,
    };

    player.monthlyGrades.push(gradeRecord);
    player.currentGrades = gradeRecord;

    // Adjust academic reputation
    adjustAcademicRep(player, average);

    // Handle expulsion risk
    if (status === "expulsion_risk") {
      if (player.atExpulsionRisk) {
        return { ...gradeRecord, formalReview: true };
      }
      player.atExpulsionRisk = true;
    } else {
      player.atExpulsionRisk = false;
    }

    // Grow subject skills based on studying
    CONFIG.SUBJECTS.forEach(sub => {
      const studied = player._weeklyStudyAP ? (player._weeklyStudyAP[sub] || 0) : 0;
      if (studied > 0) growSubjectSkill(player, sub, studied);
    });

    // Reset weekly study tracking
    player._weeklyStudyAP = {};

    return gradeRecord;
  }

  function getGradeStatus(avg) {
    if (avg >= CONFIG.GRADE_THRESHOLDS.HONOR)   return "honor";
    if (avg >= CONFIG.GRADE_THRESHOLDS.PASS)     return "passing";
    if (avg >= CONFIG.GRADE_THRESHOLDS.WARNING)  return "warning";
    return "expulsion_risk";
  }

  function getGradeLabel(status) {
    const labels = {
      honor:          "Honor Standing",
      passing:        "Passing",
      warning:        "Academic Warning",
      expulsion_risk: "Expulsion Risk",
    };
    return labels[status] || status;
  }

  function adjustAcademicRep(player, avg) {
    const current = player.reputation.academic;
    const delta = avg >= 80 ? 3 : avg >= 60 ? 0 : avg >= 40 ? -3 : -8;
    player.reputation.academic = Math.max(0, Math.min(100, current + delta));
  }

  // Track studying AP investment for a subject
  function logStudyAP(player, subject, ap) {
    if (!player._weeklyStudyAP) player._weeklyStudyAP = {};
    player._weeklyStudyAP[subject] = (player._weeklyStudyAP[subject] || 0) + ap;
  }

  // Grow subject skill after studying — TAL boosts this
  function growSubjectSkill(player, subject, apInvested) {
    const talMultiplier = getTalentGrowthMultiplier("INT", player.stats.TAL);
    const growth = apInvested * 2 * talMultiplier;
    player.subjects[subject] = Math.min(100,
      (player.subjects[subject] || 50) + growth);
  }

  // Called after each week's study action
  function processStudyAction(player, subject, ap = 1) {
    logStudyAP(player, subject, ap);
    // Small immediate INT growth via talent multiplier
    const intGain = ap * 1.5 * getTalentGrowthMultiplier("INT", player.stats.TAL);
    player.stats.INT = Math.min(CONFIG.PLAYER_STAT_CAP,
      player.stats.INT + intGain);
  }

  // NPC monthly grades (simulated, not tracked individually)
  function simulateNPCGrade(npc) {
    const base = npc.currentStats.INT * 0.7 + (Math.random() - 0.5) * 15;
    return Math.round(Math.min(100, Math.max(10, base)));
  }

  // Helper: describe academic standing in narrative
  function describeStanding(avg) {
    if (avg >= 90) return "exceptional — you sit comfortably above the class.";
    if (avg >= 80) return "strong. You are on the honor list.";
    if (avg >= 70) return "solid. No concerns from faculty.";
    if (avg >= 60) return "adequate. You are passing, but without distinction.";
    if (avg >= 40) return "concerning. A teacher has already noted your name.";
    return "critical. One more failing month triggers a formal review.";
  }

  return {
    runMonthlyExam,
    processStudyAction,
    simulateNPCGrade,
    getGradeStatus,
    getGradeLabel,
    describeStanding,
    growSubjectSkill,
  };
})();
