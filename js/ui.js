// ============================================================
// APEX OF THE ELITE — UI Rendering Engine
// ============================================================

const UI = (() => {

  // ── Internal state for pending scene/interrupt data ────────
  let _pendingSceneData  = null;  // { scene, actionKey, options }
  let _pendingInterrupt  = null;  // current interrupt being displayed
  let _networkFilter     = "ALL"; // current network screen filter

  // ── Screen Router ─────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll(".game-screen").forEach(s => s.classList.add("hidden"));
    const screen = document.getElementById(id);
    if (screen) {
      screen.classList.remove("hidden");
      screen.classList.add("screen-enter");
    }
  }

  // ── Toast Notifications ───────────────────────────────────
  function showToast(msg, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast-visible"));
    setTimeout(() => {
      toast.classList.remove("toast-visible");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Title Screen ──────────────────────────────────────────
  function renderTitleScreen() {
    showScreen("screen-title");
    const hasSave = Game.hasSave(0);
    document.getElementById("btn-continue").style.display = hasSave ? "block" : "none";
  }

  // ── Character Creation ────────────────────────────────────
  let _creationStep = 0;
  let _creationData = {};

  function renderCharacterCreation() {
    _creationStep = 0;
    _creationData = {};
    showScreen("screen-creation");
    renderCreationStep(0);
  }

  function renderCreationStep(step) {
    const container = document.getElementById("creation-content");
    if (!container) return;

    const steps = [
      renderCreationIdentity,
      renderCreationArchetype,
      renderCreationBackstory,
      renderCreationReview,
    ];

    document.querySelectorAll(".creation-step-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i <= step);
    });

    container.innerHTML = "";
    steps[step](container);
  }

  function renderCreationIdentity(container) {
    container.innerHTML = `
      <div class="creation-section">
        <p class="creation-label">FAMILY NAME</p>
        <input id="inp-lastname"  class="creation-input" placeholder="姓 / Last Name" maxlength="20" />
        <p class="creation-label">GIVEN NAME</p>
        <input id="inp-firstname" class="creation-input" placeholder="名 / First Name" maxlength="20" />
        <p class="creation-label">GENDER</p>
        <div class="option-row" id="gender-options">
          ${["Male","Female","Unspecified"].map(g =>
            `<button class="option-btn" data-val="${g.toLowerCase()}" onclick="UI.selectOption('gender', this)">${g}</button>`
          ).join("")}
        </div>
        <p class="creation-label">APPEARANCE</p>
        <div class="option-grid" id="appearance-options">
          ${Object.entries(Character.APPEARANCES).map(([key, val]) =>
            `<button class="option-card" data-val="${key}" onclick="UI.selectOption('appearance', this)">
               <span class="opt-title">${val.label}</span>
               <span class="opt-desc">${val.desc}</span>
             </button>`
          ).join("")}
        </div>
      </div>
    `;
    renderCreationNav(container, null, () => {
      const ln = document.getElementById("inp-lastname").value.trim();
      const fn = document.getElementById("inp-firstname").value.trim();
      if (!ln || !fn) { showToast("Enter your full name.", "warn"); return false; }
      if (!_creationData.gender) { showToast("Select a gender.", "warn"); return false; }
      if (!_creationData.appearance) { showToast("Select an appearance.", "warn"); return false; }
      _creationData.lastName = ln;
      _creationData.firstName = fn;
      return true;
    });
  }

  function renderCreationArchetype(container) {
    container.innerHTML = `
      <div class="creation-section">
        <p class="creation-intro-text">Who are you, at your core? This shapes how you think, speak, and what comes naturally to you.</p>
        <div class="archetype-grid">
          ${Object.entries(Character.ARCHETYPES).map(([key, val]) =>
            `<button class="archetype-card" data-val="${key}" onclick="UI.selectOption('archetype', this)">
               <span class="arch-title">${val.label}</span>
               <span class="arch-desc">${val.desc}</span>
             </button>`
          ).join("")}
        </div>
      </div>
    `;
    renderCreationNav(container,
      () => { _creationStep--; renderCreationStep(_creationStep); },
      () => {
        if (!_creationData.archetype) { showToast("Select an archetype.", "warn"); return false; }
        return true;
      }
    );
  }

  function renderCreationBackstory(container) {
    container.innerHTML = `
      <div class="creation-section">
        <p class="creation-intro-text">What happened before the gates? Your history precedes you.</p>
        <div class="backstory-list">
          ${Object.entries(Character.BACKSTORIES).map(([key, val]) => {
            const bonusStr = Object.entries(val.bonus || {})
              .filter(([k,v]) => typeof v === "number")
              .map(([k,v]) => `+${v} ${k}`).join(", ");
            const penStr = Object.entries(val.penalty || {})
              .filter(([k,v]) => typeof v === "number")
              .map(([k,v]) => `${v} ${k}`).join(", ");
            return `
              <button class="backstory-card" data-val="${key}" onclick="UI.selectOption('backstory', this)">
                <span class="bs-title">${val.label}</span>
                <span class="bs-bonus">${bonusStr || "—"}</span>
                ${penStr ? `<span class="bs-penalty">${penStr}</span>` : ""}
              </button>`;
          }).join("")}
        </div>
      </div>
    `;
    renderCreationNav(container,
      () => { _creationStep--; renderCreationStep(_creationStep); },
      () => {
        if (!_creationData.backstory) { showToast("Select a backstory.", "warn"); return false; }
        return true;
      }
    );
  }

  function renderCreationReview(container) {
    const d = _creationData;
    const archLabel = (Character.ARCHETYPES[d.archetype] || {}).label || d.archetype;
    const bsLabel   = (Character.BACKSTORIES[d.backstory] || {}).label || d.backstory;
    const appLabel  = (Character.APPEARANCES[d.appearance] || {}).label || d.appearance;

    container.innerHTML = `
      <div class="creation-section">
        <p class="creation-intro-text">Review your dossier before the school receives it.</p>
        <div class="review-card">
          <div class="review-row"><span>NAME</span><strong>${d.lastName} ${d.firstName}</strong></div>
          <div class="review-row"><span>GENDER</span><strong>${d.gender}</strong></div>
          <div class="review-row"><span>APPEARANCE</span><strong>${appLabel}</strong></div>
          <div class="review-row"><span>ARCHETYPE</span><strong>${archLabel}</strong></div>
          <div class="review-row"><span>BACKSTORY</span><strong>${bsLabel}</strong></div>
          <div class="review-row bloodline-row"><span>BLOODLINE</span><strong class="bloodline-unknown">??? — Determined at enrollment</strong></div>
        </div>
        <button class="btn-primary btn-enroll" onclick="UI._submitCreation()">
          SUBMIT ENROLLMENT APPLICATION
        </button>
      </div>
    `;
    const nav = document.createElement("div");
    nav.className = "creation-nav";
    nav.innerHTML = `<button class="btn-ghost" onclick="UI._creationBack()">← Back</button>`;
    container.appendChild(nav);
  }

  function renderCreationNav(container, backFn, validateNext) {
    const nav = document.createElement("div");
    nav.className = "creation-nav";
    if (backFn) {
      const backBtn = document.createElement("button");
      backBtn.className = "btn-ghost";
      backBtn.textContent = "← Back";
      backBtn.onclick = backFn;
      nav.appendChild(backBtn);
    }
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn-primary";
    nextBtn.textContent = "Continue →";
    nextBtn.onclick = () => {
      if (!validateNext || validateNext()) {
        _creationStep++;
        renderCreationStep(_creationStep);
      }
    };
    nav.appendChild(nextBtn);
    container.appendChild(nav);
  }

  function selectOption(key, btn) {
    const group = btn.closest("[id$='-options'], .archetype-grid, .backstory-list, .option-grid, .option-row");
    if (group) {
      group.querySelectorAll(".option-btn, .option-card, .archetype-card, .backstory-card")
        .forEach(b => b.classList.remove("selected"));
    }
    btn.classList.add("selected");
    _creationData[key] = btn.dataset.val;
  }

  function _creationBack() {
    if (_creationStep > 0) { _creationStep--; renderCreationStep(_creationStep); }
  }

  function _submitCreation() {
    Game.startGame(_creationData);
  }

  // ── Bloodline Reveal ──────────────────────────────────────
  function renderBloodlineReveal(scene, bloodline, callback) {
    showScreen("screen-bloodline");
    const bConfig = CONFIG.BLOODLINES[bloodline] || {};
    document.getElementById("bloodline-title").textContent = scene.title;
    document.getElementById("bloodline-text").innerHTML =
      scene.text.replace(/\n/g, "<br><br>");
    document.getElementById("bloodline-name").textContent =
      (bConfig.label || "Unknown").toUpperCase();
    document.getElementById("bloodline-name").style.color =
      bConfig.color || "#e8edf5";

    document.getElementById("btn-bloodline-continue").onclick = callback;
  }

  // ── Main Game ─────────────────────────────────────────────
  function renderMainGame(state) {
    showScreen("screen-main");
    updateHUD(state);
    renderStatPanel(state);
    renderNarrativeLog(state);
    renderDayCalendar(state);
    renderActionBar(state);
  }

  function updateHUD(state) {
    const p = state.player;
    document.getElementById("hud-date").textContent = Time.getDateLabel(state);
    document.getElementById("hud-class").textContent = `Class ${p.class}`;
    document.getElementById("hud-class").style.color = CONFIG.CLASS_COLORS[p.class];
    document.getElementById("hud-spoints").textContent = Economy.formatPoints(p.spoints);
    document.getElementById("hud-ap").textContent = `${state.apRemaining} AP`;
    // Update day label in HUD
    const dayEl = document.getElementById("hud-day");
    if (dayEl) dayEl.textContent = CONFIG.DAY_NAMES[state.currentDay - 1] || "";
  }

  // ── Layer 1: Week Context Board ───────────────────────────
  function renderWeekContextBoard(pressures, state) {
    const modal = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    const weekLabel = Time.getDateLabel(state);
    const icons = { critical: "⚠", high: "⚠", warning: "⚡", medium: "◈", reminder: "◎", unknown: "?" };

    const pressureItems = pressures.length > 0
      ? pressures.map(p => `
          <div class="context-pressure-item ${p.severity || "medium"}">
            <span class="context-pressure-icon">${icons[p.severity] || "◈"}</span>
            <span>${p.text}</span>
          </div>`).join("")
      : `<div class="context-pressure-item medium"><span class="context-pressure-icon">◎</span><span>No active pressures detected this week. A quiet week is an opportunity.</span></div>`;

    content.innerHTML = `
      <div class="modal-header" style="border-color:var(--border-gold)">
        <span class="modal-title" style="color:var(--gold)">${weekLabel} — MONDAY MORNING</span>
      </div>
      <div class="modal-body context-board">
        <p class="context-week-title">⚠ PRESSURES THIS WEEK</p>
        <div class="context-pressure-list">${pressureItems}</div>
        <div class="context-ap-note">
          You have <strong style="color:var(--gold)">${state.apRemaining} AP</strong> this week.
          Spend them with intention — you cannot do everything.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" onclick="UI.closeModal()" style="min-width:180px">
          BEGIN THE WEEK →
        </button>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  // ── Layer 4: Day Calendar Strip ───────────────────────────
  function renderDayCalendar(state) {
    const strip = document.getElementById("day-strip");
    if (!strip) return;

    const days   = CONFIG.DAY_SHORT;
    const current = state.currentDay;
    const actions = state.weekDayActions || {};

    const dayCells = days.map((abbr, i) => {
      const dayNum = i + 1;
      const isDone    = dayNum < current;
      const isCurrent = dayNum === current;
      const isWeekend = dayNum >= 6;
      const actionCount = (actions[dayNum] || []).length;

      let cls = "day-cell";
      if (isDone)    cls += " done";
      if (isCurrent) cls += " current";
      if (isWeekend) cls += " weekend";

      const actionTypes = (actions[dayNum] || [])
        .map(a => ACTION_ICONS[a] || "◈")
        .slice(0, 3)
        .join("");

      return `
        <div class="${cls}" title="${CONFIG.DAY_NAMES[i]}${actionCount > 0 ? ` (${actionCount} actions)` : ""}">
          <span class="day-abbr">${abbr}</span>
          <div class="day-dot"></div>
          ${actionCount > 0 ? `<span class="day-actions-icons">${actionTypes}</span>` : ""}
        </div>`;
    }).join("");

    const advanceLabel = current >= 7
      ? `⟫ END WEEK`
      : `→ ${CONFIG.DAY_SHORT[current] || "END"}`;

    strip.innerHTML = `
      <div class="day-cells">${dayCells}</div>
      <div class="day-strip-right">
        <span class="day-ap-remaining">${state.apRemaining} AP</span>
        <button class="day-advance-btn" onclick="Game.advanceDay()">${advanceLabel}</button>
      </div>`;
  }

  function renderStatPanel(state) {
    const p = state.player;
    const panel = document.getElementById("stat-panel");
    if (!panel) return;

    const statRows = Object.entries(p.stats).map(([stat, val]) => {
      const isTalentExempt = TALENT_EXEMPT_STATS.includes(stat);
      const barColor = stat === "PHY" ? "#7a9dbf"
                     : stat === "TAL" ? "#c9a84c"
                     : stat === "CMB" ? "#c94a4a"
                     : "#4a7ab5";
      return `
        <div class="stat-row">
          <span class="stat-abbr ${isTalentExempt ? "stat-exempt" : ""}">${stat}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${val}%;background:${barColor}"></div>
          </div>
          <span class="stat-val">${Math.floor(val)}</span>
        </div>`;
    }).join("");

    const repRows = Object.entries(p.reputation).map(([key, val]) => {
      const labels = { combat:"CMB REP", academic:"ACAD", social:"SOCIAL", infamy:"INFAMY", teacher:"TEACH" };
      const color = key === "infamy" ? "#c94a4a" : "#4a7ab5";
      return `
        <div class="rep-row">
          <span class="rep-label">${labels[key] || key}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${val}%;background:${color}"></div>
          </div>
          <span class="stat-val">${Math.floor(val)}</span>
        </div>`;
    }).join("");

    const gradeAvg = p.currentGrades?.average ?? "—";
    const gradeStatus = p.currentGrades?.status ?? "—";

    // Threats dashboard
    const threats = state.activeThreats || [];
    const threatsHtml = threats.length > 0
      ? threats.map(t => {
          const cls = t.severity === "critical" ? "" : t.severity === "warning" ? "warning" : "medium";
          return `
            <div class="threat-item ${cls}">
              <span class="threat-desc">${t.description}</span>
              ${t.countdown ? `<span class="threat-countdown">[${t.countdown}w]</span>` : ""}
            </div>`;
        }).join("")
      : `<p class="no-threats-msg">No active threats</p>`;

    panel.innerHTML = `
      <div class="panel-header">PROFILE</div>
      <div class="panel-name">${p.displayName || "Unknown"}</div>
      <div class="panel-bloodline" style="color:${CONFIG.BLOODLINES[p.bloodline]?.color || '#94a3b8'}">
        ${CONFIG.BLOODLINES[p.bloodline]?.label || "Unknown"}
      </div>
      <div class="panel-section-title">ATTRIBUTES</div>
      <div class="stat-list">${statRows}</div>
      <div class="panel-section-title">REPUTATION</div>
      <div class="stat-list">${repRows}</div>
      <div class="panel-section-title">ACADEMICS</div>
      <div class="grade-display">
        <span class="grade-avg">${gradeAvg === "—" ? "—" : gradeAvg + "%"}</span>
        <span class="grade-status">${gradeStatus}</span>
      </div>
      <div class="panel-section-title">POINTS</div>
      <div class="points-display">
        <div class="points-row"><span>S-Points</span><strong>${Economy.formatPoints(p.spoints)}</strong></div>
        <div class="points-row"><span>AP Left</span><strong style="color:var(--gold)">${GameState.get().apRemaining} / ${CONFIG.AP_PER_WEEK}</strong></div>
      </div>
      <div class="panel-section-title threats-header">⚠ ACTIVE THREATS</div>
      <div class="threat-list">${threatsHtml}</div>
    `;
  }

  function renderNarrativeLog(state) {
    const log = document.getElementById("narrative-log");
    if (!log) return;

    const entries = state.narrativeLog.slice(0, 20);
    log.innerHTML = entries.map(entry => {
      const typeClass = `log-${entry.type || "info"}`;
      const title = entry.title ? `<strong class="log-title">${entry.title}</strong>` : "";
      const sceneOutcome = entry.sceneOutcome ? `<p class="log-scene-outcome">${entry.sceneOutcome}</p>` : "";
      return `
        <div class="log-entry ${typeClass}">
          ${title}
          <p>${entry.narrative || ""}</p>
          ${sceneOutcome}
        </div>`;
    }).join("") || `<div class="log-entry log-intro">
      <p>The train from Tokyo arrives at <strong>Advanced Nurturing High School</strong>.<br>
      Everything begins here.</p></div>`;
  }

  function renderActionBar(state) {
    const bar = document.getElementById("action-bar");
    if (!bar) return;
    const ap = state.apRemaining;

    const actions = Object.entries(CONFIG.ACTIONS);
    bar.innerHTML = actions.map(([key, action]) => {
      const disabled = ap < action.ap ? "disabled" : "";
      const icon = ACTION_ICONS[key] || "◈";
      return `
        <button class="action-btn ${disabled}" ${disabled ? "" : `onclick="Game.doAction('${key}')"`}
                title="${action.label} (${action.ap} AP)">
          <span class="action-icon">${icon}</span>
          <span class="action-label">${action.label}</span>
          <span class="action-cost">${action.ap} AP</span>
        </button>`;
    }).join("");
  }

  const ACTION_ICONS = {
    study: "◎", train: "▲", martial: "◆", socialize: "◉",
    scheme: "◈", work: "¥", gamble: "◇", rest: "○",
    investigate: "⊕", boardgames: "⊞",
  };

  // ── Layer 2: Action Scene Modal ───────────────────────────
  function renderActionSceneModal(scene, actionKey, options) {
    _pendingSceneData = { scene, actionKey, options };

    const modal   = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    const action = CONFIG.ACTIONS[actionKey];
    const icon   = ACTION_ICONS[actionKey] || "◈";

    const choicesHtml = scene.choices.map((c, i) => {
      const mod  = c.modifier || {};
      const hints = [];
      if (mod.mult && mod.mult !== 1.0) hints.push(mod.mult > 1.0 ? `+${Math.round((mod.mult - 1) * 100)}% effect` : `${Math.round((mod.mult - 1) * 100)}% effect`);
      if (mod.bonus) hints.push(`+${mod.bonus.stat}`);
      const hintHtml = hints.length > 0 ? `<span class="choice-hint">${hints.join(" · ")}</span>` : "";
      return `
        <button class="choice-btn" onclick="UI.selectSceneChoice(${i})">
          <span class="choice-label-text">${c.label}</span>
          ${hintHtml}
        </button>`;
    }).join("");

    content.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">${icon} ${action.label}</span>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p class="scene-setting">${scene.setting}</p>
        <div class="scene-narrative">${scene.narrative}</div>
      </div>
      <div class="modal-choices">
        ${choicesHtml}
      </div>
    `;
    modal.classList.remove("hidden");
  }

  function selectSceneChoice(index) {
    if (!_pendingSceneData) return;
    const { scene, actionKey, options } = _pendingSceneData;
    const choice = scene.choices[index];
    if (!choice) return;
    _pendingSceneData = null;
    closeModal();
    Game.executeActionWithModifier(actionKey, options, choice.modifier || {});
  }

  // ── Layer 3: NPC Interrupt Modal ──────────────────────────
  function renderInterruptModal(interrupt) {
    _pendingInterrupt = interrupt;

    const modal   = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    const choicesHtml = (interrupt.choices || []).map((c, i) =>
      `<button class="choice-btn interrupt-choice" onclick="UI.selectInterruptChoice(${i})">
         <span class="choice-label-text">${c.label}</span>
       </button>`
    ).join("");

    content.innerHTML = `
      <div class="modal-header interrupt-header">
        <span class="modal-title" style="color:var(--danger)">${interrupt.title || "INTERRUPTED"}</span>
      </div>
      <div class="modal-body">
        <p class="interrupt-setting">${interrupt.setting || ""}</p>
        <div class="interrupt-narrative">${(interrupt.narrative || "").replace(/\n/g, "<br>")}</div>
      </div>
      <div class="modal-choices">
        ${choicesHtml}
      </div>
    `;
    modal.classList.remove("hidden");
  }

  function selectInterruptChoice(index) {
    if (!_pendingInterrupt) return;
    _pendingInterrupt = null;
    closeModal();
    Game.resolveInterrupt(index);
  }

  // ── Week Consequences Summary (replaces old Weekly Summary) ──
  function renderWeekConsequences(events) {
    const modal   = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    // Show only consequences: NPC actions, grade changes, threats, surprises
    const consequences = events.filter(e =>
      e.narrative && !e.worldLogOnly
    ).slice(0, 8);

    if (consequences.length === 0) {
      // Skip directly to next week context
      const state = GameState.get();
      const pressures = Events.generateWeeklyPressures(state);
      setTimeout(() => renderWeekContextBoard(pressures, state), 200);
      return;
    }

    content.innerHTML = `
      <div class="modal-header" style="border-color:var(--border-gold)">
        <span class="modal-title">WEEK ENDS — CONSEQUENCES</span>
      </div>
      <div class="modal-body">
        <p class="consequence-label">WHAT CHANGED WHILE YOU ACTED</p>
        ${consequences.map(e => `
          <div class="summary-entry">
            ${e.title ? `<strong>${e.title}</strong><br>` : ""}
            <p>${e.narrative}</p>
          </div>`).join("")}
      </div>
      <div class="modal-footer">
        <button class="btn-primary" onclick="UI._advanceToNextWeek()">NEXT WEEK →</button>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  function _advanceToNextWeek() {
    closeModal();
    const state = GameState.get();
    const pressures = Events.generateWeeklyPressures(state);
    setTimeout(() => renderWeekContextBoard(pressures, state), 200);
  }

  // ── Old Weekly Summary (kept for backward compat) ─────────
  function renderWeeklySummary(events) {
    renderWeekConsequences(events);
  }

  // ── Event Modal ───────────────────────────────────────────
  function renderEventModal(event) {
    const modal   = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    const choicesHtml = (event.choices || []).map((c, i) =>
      `<button class="choice-btn" onclick="Game.resolveEvent(${i}); UI.closeModal();">
         ${c.label}
       </button>`
    ).join("");

    content.innerHTML = `
      <div class="modal-header">
        <span class="modal-title event-title">${event.title || "Event"}</span>
      </div>
      <div class="modal-body">
        <div class="event-narrative">${(event.narrative || "").replace(/\n/g, "<br>")}</div>
      </div>
      <div class="modal-choices">
        ${choicesHtml}
      </div>
    `;
    modal.classList.remove("hidden");
  }

  function renderEventResults(results) {
    const meaningful = results.filter(r => r.narrative);
    if (meaningful.length === 0) return;
    const modal   = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">OUTCOME</span>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        ${meaningful.map(e => `
          <div class="summary-entry">
            ${e.title ? `<strong>${e.title}</strong><br>` : ""}
            <p>${e.narrative}</p>
          </div>`).join("")}
      </div>
      <div class="modal-footer">
        <button class="btn-primary" onclick="UI.closeModal()">CONTINUE</button>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  function renderActionResult(result) {
    if (!result || !result.narrative) return;
    const log = document.getElementById("narrative-log");
    if (!log) return;
    const entry = document.createElement("div");
    entry.className = `log-entry log-${result.type || "action"} log-new`;
    entry.innerHTML = `
      ${result.title ? `<strong class="log-title">${result.title}</strong>` : ""}
      <p>${result.narrative}</p>
      ${result.sceneOutcome ? `<p class="log-scene-outcome">${result.sceneOutcome}</p>` : ""}
    `;
    log.prepend(entry);
    setTimeout(() => entry.classList.remove("log-new"), 100);
  }

  function closeModal() {
    const modal = document.getElementById("modal-overlay");
    if (modal) modal.classList.add("hidden");
    _pendingSceneData = null;
  }

  // ── Martial Art Selector Modal ────────────────────────────
  function openMartialArtSelector() {
    const modal   = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    const styles = Object.entries(CONFIG.MARTIAL_ARTS).map(([key, val]) =>
      `<button class="choice-btn" onclick="Game.doAction('martial',{style:'${key}'}); UI.closeModal();">
         <span class="choice-label-text">${val.label}</span>
         <span class="choice-hint">${val.bonus} focus · ${val.synergy} synergy</span>
       </button>`
    ).join("");

    content.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">◆ MARTIAL ARTS — Select Style</span>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-choices">${styles}</div>
    `;
    modal.classList.remove("hidden");
  }

  // ── Student Roster Screen ─────────────────────────────────
  function renderRosterScreen() {
    showScreen("screen-roster");
    const state = GameState.get();
    const container = document.getElementById("roster-content");
    if (!container) return;

    const classes = ["A", "B", "C", "D"];
    container.innerHTML = classes.map(cls => {
      const students = GameState.getNPCsByClass(cls);
      const color = CONFIG.CLASS_COLORS[cls];
      return `
        <div class="roster-class-section">
          <div class="roster-class-header" style="border-color:${color};color:${color}">
            CLASS ${cls} <span class="roster-count">${students.length} Students</span>
          </div>
          <div class="roster-grid">
            ${students.map(s => renderStudentCard(s, state)).join("")}
          </div>
        </div>`;
    }).join("");
  }

  function renderStudentCard(npc, state) {
    const rel        = npc.relationshipWithPlayer || 0;
    const relColor   = Relationships.getRelationshipColor(rel);
    const relLabel   = Relationships.getRelationshipLabel(rel);
    const classColor = CONFIG.CLASS_COLORS[npc.class] || "#5a6475";
    const bloodlineLabel = npc.bloodlineRevealedToPlayer
      ? (CONFIG.BLOODLINES[npc.bloodline]?.label || "Unknown") : "???";
    const bloodlineColor = npc.bloodlineRevealedToPlayer
      ? (CONFIG.BLOODLINES[npc.bloodline]?.color || "#94a3b8") : "#5a6475";

    const secretKnown = state.player.knownSecrets.some(k => k.npcId === npc.id);
    const secretHtml  = secretKnown
      ? `<div class="card-secret">⟨ ${npc.secret} ⟩</div>`
      : `<div class="card-secret card-secret-hidden">⟨ Secret unknown ⟩</div>`;

    const perCheck = state.player.stats.PER >= 60;
    const statsHtml = perCheck ? `
      <div class="card-stats-mini">
        ${Object.entries(npc.currentStats).slice(0,4).map(([s,v]) =>
          `<span>${s}:<strong>${Math.floor(v)}</strong></span>`
        ).join("")}
      </div>` : "";

    return `
      <div class="student-card" onclick="UI.openStudentDetail('${npc.id}')">
        <div class="card-class-badge" style="background:${classColor}">Class ${npc.class}</div>
        <div class="card-name">${npc.displayName}</div>
        <div class="card-nationality">${npc.nationality}</div>
        <div class="card-archetype">${npc.archetype.replace(/_/g, " ")}</div>
        <div class="card-bloodline" style="color:${bloodlineColor}">${bloodlineLabel}</div>
        <div class="card-rel" style="color:${relColor}">${relLabel} (${rel > 0 ? "+" : ""}${rel})</div>
        ${secretHtml}
        ${statsHtml}
      </div>`;
  }

  // ── Student Detail Modal ──────────────────────────────────
  function openStudentDetail(npcId) {
    const state      = GameState.get();
    const npc        = GameState.getNPC(npcId);
    if (!npc) return;

    const modal      = document.getElementById("modal-overlay");
    const content    = document.getElementById("modal-content");
    const classColor = CONFIG.CLASS_COLORS[npc.class] || "#5a6475";
    const rel        = npc.relationshipWithPlayer || 0;
    const relColor   = Relationships.getRelationshipColor(rel);
    const secretKnown = state.player.knownSecrets.some(k => k.npcId === npcId);
    const bloodlineLabel = npc.bloodlineRevealedToPlayer
      ? (CONFIG.BLOODLINES[npc.bloodline]?.label || "Unknown") : "???";
    const canSocialize = state.apRemaining >= 1;
    const isAntagonist = npc.isAntagonist ? "⚠ Known threat" : "";

    const statBars = Object.entries(npc.currentStats).map(([s, v]) => {
      const shown = state.player.stats.PER >= 60 ? Math.floor(v) : "?";
      const barW  = state.player.stats.PER >= 60 ? v : 20;
      return `
        <div class="stat-row">
          <span class="stat-abbr">${s}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${barW}%;background:#4a7ab5;opacity:0.8"></div>
          </div>
          <span class="stat-val">${shown}</span>
        </div>`;
    }).join("");

    const agendaHint = state.player.stats.PER >= 55 && npc.agendaStage >= 2
      ? `<div class="detail-agenda">⚠ Pursuing an active agenda (stage ${npc.agendaStage}/5)</div>` : "";

    content.innerHTML = `
      <div class="modal-header" style="border-color:${classColor}">
        <span class="modal-title" style="color:${classColor}">CLASS ${npc.class} — ${npc.displayName}</span>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body detail-body">
        <div class="detail-left">
          <div class="detail-avatar" style="border-color:${classColor}">
            <span>${npc.displayName.charAt(0)}</span>
          </div>
          <div class="detail-meta">
            <p>${npc.nationality} · ${npc.gender === "M" ? "Male" : npc.gender === "F" ? "Female" : "N/A"}</p>
            <p style="color:${CONFIG.BLOODLINES[npc.bloodline]?.color || '#94a3b8'}">${bloodlineLabel}</p>
            <p>${npc.archetype.replace(/_/g, " ")}</p>
            ${isAntagonist ? `<p class="antagonist-label">${isAntagonist}</p>` : ""}
          </div>
        </div>
        <div class="detail-right">
          <p class="detail-desc">${npc.description}</p>
          <div class="detail-stats">${statBars}</div>
          ${agendaHint}
          <div class="detail-secret">
            ${secretKnown
              ? `<div class="secret-known">⟨ ${npc.secret} ⟩</div>`
              : `<div class="secret-unknown">Secret: Not yet discovered</div>`}
          </div>
          <div class="detail-rel" style="color:${relColor}">
            Relationship: ${Relationships.getRelationshipLabel(rel)} (${rel > 0 ? "+" : ""}${rel})
          </div>
          <div class="detail-actions">
            ${canSocialize
              ? `<button class="btn-primary btn-sm" onclick="Game.doAction('socialize',{npcId:'${npcId}'}); UI.closeModal();">
                   Socialize (1 AP)
                 </button>`
              : `<button class="btn-primary btn-sm" disabled>No AP left</button>`}
            ${canSocialize
              ? `<button class="btn-ghost btn-sm" onclick="Game.doAction('investigate'); UI.closeModal(); UI.showToast('Investigating ${npc.displayName}...','info')">
                   Investigate
                 </button>`
              : ""}
          </div>
        </div>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  // ── NPC Picker ────────────────────────────────────────────
  function openNPCPicker(actionType) {
    const modal      = document.getElementById("modal-overlay");
    const content    = document.getElementById("modal-content");
    const knownNPCs  = GameState.getAllNPCs().filter(n => n.knownToPlayer && !n.isExpelled);

    content.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">Choose a student to ${actionType}</span>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="npc-picker-list">
          ${knownNPCs.length > 0
            ? knownNPCs.map(n => {
                const rel = n.relationshipWithPlayer || 0;
                const relColor = Relationships.getRelationshipColor(rel);
                return `
                  <button class="npc-pick-btn" onclick="Game.doAction('${actionType}',{npcId:'${n.id}'}); UI.closeModal();">
                    <span style="color:${CONFIG.CLASS_COLORS[n.class]}">[${n.class}]</span>
                    ${n.displayName}
                    <span style="color:${relColor};font-size:10px;margin-left:auto">${rel > 0 ? "+" : ""}${rel}</span>
                  </button>`;
              }).join("")
            : `<p style="color:var(--text-muted);font-size:13px">No known students yet. Investigate and explore to meet people.</p>`
          }
        </div>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  // ── Layer 5: Network Map Screen ───────────────────────────
  function renderNetworkScreen() {
    showScreen("screen-network");
    const state     = GameState.get();
    const container = document.getElementById("network-content");
    if (!container) return;

    const allNPCs    = GameState.getAllNPCs().filter(n => !n.isExpelled);
    const knownNPCs  = allNPCs.filter(n => n.knownToPlayer);
    const unknownCnt = allNPCs.length - knownNPCs.length;

    if (knownNPCs.length === 0) {
      container.innerHTML = `
        <div class="network-empty">
          <p>No contacts established yet.</p>
          <p>${unknownCnt} students remain unknown in this school.</p>
          <p>Invest AP in <strong>Investigate</strong> and <strong>Socialize</strong> to build your network.</p>
        </div>`;
      return;
    }

    const filterTabs = ["ALL", "A", "B", "C", "D"].map(f =>
      `<button class="network-tab ${_networkFilter === f ? "active" : ""}"
              onclick="UI._setNetworkFilter('${f}')">${f === "ALL" ? "ALL KNOWN" : "CLASS " + f}</button>`
    ).join("");

    const filtered = _networkFilter === "ALL" ? knownNPCs : knownNPCs.filter(n => n.class === _networkFilter);

    const classes = ["A", "B", "C", "D"];
    let rowsHtml = "";
    if (_networkFilter === "ALL") {
      classes.forEach(cls => {
        const classNPCs = filtered.filter(n => n.class === cls);
        if (classNPCs.length === 0) return;
        const color = CONFIG.CLASS_COLORS[cls];
        rowsHtml += `<div class="network-class-header" style="color:${color}">CLASS ${cls} — ${classNPCs.length} KNOWN</div>`;
        rowsHtml += classNPCs.map(npc => renderNetworkNPCRow(npc, state)).join("");
      });
    } else {
      rowsHtml = filtered.map(npc => renderNetworkNPCRow(npc, state)).join("");
    }

    container.innerHTML = `
      <div class="network-filter-bar">${filterTabs}</div>
      <div class="network-rows">${rowsHtml}</div>
      ${unknownCnt > 0 ? `<div class="network-unknown-count">+ ${unknownCnt} unknown students in the school</div>` : ""}
    `;
  }

  function _setNetworkFilter(filter) {
    _networkFilter = filter;
    renderNetworkScreen();
  }

  function renderNetworkNPCRow(npc, state) {
    const rel        = npc.relationshipWithPlayer || 0;
    const relColor   = Relationships.getRelationshipColor(rel);
    const relLabel   = Relationships.getRelationshipLabel(rel);
    const classColor = CONFIG.CLASS_COLORS[npc.class] || "#5a6475";
    const ap         = state.apRemaining;
    const secretKnown = state.player.knownSecrets.some(k => k.npcId === npc.id);

    // Relationship bar: center = 0, left = negative, right = positive
    const barFillPct  = Math.abs(rel) / 2; // max 50%
    const barLeft     = rel >= 0 ? "50%" : `${50 - barFillPct}%`;
    const barW        = `${barFillPct}%`;

    const agendaHint  = state.player.stats.PER >= 55 && npc.agendaStage >= 2
      ? `<div class="network-npc-agenda">⚠ Agenda active (stage ${npc.agendaStage}/5)</div>` : "";
    const threatBadge = rel < -30
      ? `<span class="network-hostile-badge">HOSTILE</span>` : "";

    return `
      <div class="network-npc-row">
        <div class="network-npc-left">
          <div class="network-npc-name">
            <span class="network-class-badge" style="color:${classColor}">[${npc.class}]</span>
            ${npc.displayName}
            ${npc.isAntagonist ? `<span class="network-antagonist">⚠</span>` : ""}
            ${threatBadge}
          </div>
          <div class="network-npc-meta">
            <span>${npc.nationality}</span>
            <span>·</span>
            <span>${npc.archetype.replace(/_/g, " ")}</span>
          </div>
          <div class="network-npc-rel">
            <div class="network-rel-bar">
              <div class="network-rel-center"></div>
              <div class="network-rel-fill" style="left:${barLeft};width:${barW};background:${relColor}"></div>
            </div>
            <span class="network-rel-label" style="color:${relColor}">${relLabel} (${rel > 0 ? "+" : ""}${rel})</span>
          </div>
          ${secretKnown
            ? `<div class="network-npc-secret">⟨ ${npc.secret} ⟩</div>`
            : `<div class="network-npc-secret hidden">Secret: undiscovered</div>`}
          ${agendaHint}
        </div>
        <div class="network-npc-actions">
          <button class="network-action-btn" ${ap < 1 ? "disabled" : ""}
                  onclick="Game.doAction('socialize',{npcId:'${npc.id}'})">
            SOCIALIZE
          </button>
          <button class="network-action-btn" ${ap < 1 ? "disabled" : ""}
                  onclick="Game.doAction('investigate')">
            INVESTIGATE
          </button>
          <button class="network-action-btn"
                  onclick="UI.openStudentDetail('${npc.id}')">
            DOSSIER
          </button>
        </div>
      </div>`;
  }

  return {
    showScreen,
    showToast,
    renderTitleScreen,
    renderCharacterCreation,
    renderCreationStep,
    selectOption,
    _creationBack,
    _submitCreation,
    renderBloodlineReveal,
    renderMainGame,
    updateHUD,
    renderStatPanel,
    renderNarrativeLog,
    renderActionBar,
    renderDayCalendar,
    renderWeekContextBoard,
    renderActionSceneModal,
    selectSceneChoice,
    renderInterruptModal,
    selectInterruptChoice,
    renderWeekConsequences,
    renderWeeklySummary,
    _advanceToNextWeek,
    renderEventModal,
    renderEventResults,
    renderActionResult,
    closeModal,
    openMartialArtSelector,
    renderRosterScreen,
    renderStudentCard,
    openStudentDetail,
    openNPCPicker,
    renderNetworkScreen,
    _setNetworkFilter,
    renderNetworkNPCRow,
  };
})();
