// ============================================================
// APEX OF THE ELITE — UI Rendering Engine
// ============================================================

const UI = (() => {

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

    // Progress bar
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
    renderActionBar(state);
  }

  function updateHUD(state) {
    const p = state.player;
    document.getElementById("hud-date").textContent = Time.getDateLabel(state);
    document.getElementById("hud-class").textContent = `Class ${p.class}`;
    document.getElementById("hud-class").style.color = CONFIG.CLASS_COLORS[p.class];
    document.getElementById("hud-spoints").textContent = Economy.formatPoints(p.spoints);
    document.getElementById("hud-ap").textContent = `${state.apRemaining} AP`;
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
        <div class="points-row"><span>AP Left</span><strong style="color:#c9a84c">${GameState.get().apRemaining} / ${CONFIG.AP_PER_WEEK}</strong></div>
      </div>
    `;
  }

  function renderNarrativeLog(state) {
    const log = document.getElementById("narrative-log");
    if (!log) return;

    const entries = state.narrativeLog.slice(0, 20);
    log.innerHTML = entries.map(entry => {
      const typeClass = `log-${entry.type || "info"}`;
      const title = entry.title ? `<strong class="log-title">${entry.title}</strong>` : "";
      return `
        <div class="log-entry ${typeClass}">
          ${title}
          <p>${entry.narrative || ""}</p>
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
    }).join("") + `
      <button class="action-btn advance-week-btn" onclick="Game.advanceWeek()">
        <span class="action-icon">⟫</span>
        <span class="action-label">End Week</span>
        <span class="action-cost">→</span>
      </button>`;
  }

  const ACTION_ICONS = {
    study: "◎", train: "▲", martial: "◆", socialize: "◉",
    scheme: "◈", work: "¥", gamble: "◇", rest: "○",
    investigate: "◈", boardgames: "⊞",
  };

  // ── Weekly Summary Modal ──────────────────────────────────
  function renderWeeklySummary(events) {
    if (!events || events.length === 0) return;
    const modal = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    if (!modal || !content) return;

    const meaningful = events.filter(e => e.narrative && !e.worldLogOnly);
    if (meaningful.length === 0) return;

    content.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">WEEK SUMMARY</span>
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

  // ── Event Modal ───────────────────────────────────────────
  function renderEventModal(event) {
    const modal = document.getElementById("modal-overlay");
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
    renderWeeklySummary(meaningful);
  }

  function renderActionResult(result) {
    if (!result || !result.narrative) return;
    // Append to narrative log display
    const log = document.getElementById("narrative-log");
    if (!log) return;
    const entry = document.createElement("div");
    entry.className = `log-entry log-${result.type || "action"} log-new`;
    entry.innerHTML = `
      ${result.title ? `<strong class="log-title">${result.title}</strong>` : ""}
      <p>${result.narrative}</p>
    `;
    log.prepend(entry);
    setTimeout(() => entry.classList.remove("log-new"), 100);
  }

  function closeModal() {
    const modal = document.getElementById("modal-overlay");
    if (modal) modal.classList.add("hidden");
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
    const rel = npc.relationshipWithPlayer || 0;
    const relColor = Relationships.getRelationshipColor(rel);
    const relLabel = Relationships.getRelationshipLabel(rel);
    const classColor = CONFIG.CLASS_COLORS[npc.class] || "#5a6475";
    const bloodlineLabel = npc.bloodlineRevealedToPlayer
      ? (CONFIG.BLOODLINES[npc.bloodline]?.label || "Unknown")
      : "???";
    const bloodlineColor = npc.bloodlineRevealedToPlayer
      ? (CONFIG.BLOODLINES[npc.bloodline]?.color || "#94a3b8")
      : "#5a6475";

    const secretKnown = state.player.knownSecrets.some(k => k.npcId === npc.id);
    const secretHtml = secretKnown
      ? `<div class="card-secret">⟨ ${npc.secret} ⟩</div>`
      : `<div class="card-secret card-secret-hidden">⟨ Secret unknown ⟩</div>`;

    // Show approximate stats (requires PER >= 60 to reveal)
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
    const state = GameState.get();
    const npc = GameState.getNPC(npcId);
    if (!npc) return;

    const modal = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    const classColor = CONFIG.CLASS_COLORS[npc.class] || "#5a6475";
    const rel = npc.relationshipWithPlayer || 0;
    const relColor = Relationships.getRelationshipColor(rel);
    const secretKnown = state.player.knownSecrets.some(k => k.npcId === npcId);
    const bloodlineLabel = npc.bloodlineRevealedToPlayer
      ? (CONFIG.BLOODLINES[npc.bloodline]?.label || "Unknown")
      : "???";
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
          </div>
        </div>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  // ── NPC Picker ────────────────────────────────────────────
  function openNPCPicker(actionType) {
    const state = GameState.get();
    const modal = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    const knownNPCs = GameState.getAllNPCs().filter(n => n.knownToPlayer && !n.isExpelled);

    content.innerHTML = `
      <div class="modal-header">
        <span class="modal-title">Choose a student to ${actionType}</span>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="npc-picker-list">
          ${knownNPCs.length > 0
            ? knownNPCs.map(n => `
                <button class="npc-pick-btn" onclick="Game.doAction('${actionType}',{npcId:'${n.id}'}); UI.closeModal();">
                  <span style="color:${CONFIG.CLASS_COLORS[n.class]}">[${n.class}]</span>
                  ${n.displayName}
                </button>`).join("")
            : "<p>No known students yet. Explore and investigate to meet people.</p>"
          }
        </div>
      </div>
    `;
    modal.classList.remove("hidden");
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
    renderWeeklySummary,
    renderEventModal,
    renderEventResults,
    renderActionResult,
    closeModal,
    renderRosterScreen,
    openStudentDetail,
    openNPCPicker,
  };
})();
