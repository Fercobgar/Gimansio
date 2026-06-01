// ─── Global state ─────────────────────────────────────────────────────────────
const State = {
  activeDayId: null,
  currentSessionId: null,
  activeView: "workout", // "workout" | "history" | "routines"
};

// ─── Routine helpers ──────────────────────────────────────────────────────────

function getActiveRoutineDays() {
  const id = Storage.getActiveRoutineId();
  if (!id) return ROUTINE.days;
  const r = Storage.getRoutines().find((r) => r.id === id);
  return r ? r.days : ROUTINE.days;
}

function getTodayDayId() {
  // Custom routines don't map to weekdays — just start at their first day
  if (Storage.getActiveRoutineId()) {
    const days = getActiveRoutineDays();
    return days.length ? days[0].id : null;
  }
  const dow = new Date().getDay(); // 0=Sun … 6=Sat
  const found = ROUTINE.days.find((d) => d.weekDays.includes(dow));
  return found ? found.id : "rest";
}

function buildSessionId(dayId, date) { return `${dayId}_${date}`; }
function getTodayISO() { return new Date().toISOString().split("T")[0]; }

// ─── Header ───────────────────────────────────────────────────────────────────

function updateHeaderUser() {
  const user = Auth.currentUser();
  const el   = document.getElementById("headerUser");
  if (!el) return;
  if (user) {
    el.textContent = `${user.emoji} ${user.name}`;
    el.style.display = "";
  } else {
    el.style.display = "none";
  }
}

// ─── View router ──────────────────────────────────────────────────────────────

function renderCurrentView() {
  if      (State.activeView === "workout")  renderWorkoutView();
  else if (State.activeView === "history")  renderHistoryView();
  else if (State.activeView === "routines") renderRoutinesView();
}

// ─── Workout view ─────────────────────────────────────────────────────────────

function collectFormData(dayId) {
  const days = getActiveRoutineDays();
  const day  = days.find((d) => d.id === dayId);
  if (!day) return [];

  return day.exercises.map((ex) => {
    const sets = Array.from({ length: ex.sets }, (_, i) => {
      const w = document.querySelector(`input[data-exercise="${ex.id}"][data-set="${i}"][data-field="weight"]`);
      const r = document.querySelector(`input[data-exercise="${ex.id}"][data-set="${i}"][data-field="reps"]`);
      return {
        weight: w ? parseFloat(w.value) || 0 : 0,
        reps:   r ? parseInt(r.value, 10) || 0 : 0,
      };
    });
    return { exerciseId: ex.id, sets };
  });
}

function renderWorkoutView() {
  const app  = document.getElementById("app");
  const days = getActiveRoutineDays();

  // Reset activeDayId if it no longer belongs to the current routine
  if (!State.activeDayId || !days.find((d) => d.id === State.activeDayId)) {
    State.activeDayId = getTodayDayId();
  }

  const today = getTodayISO();
  State.currentSessionId = buildSessionId(State.activeDayId, today);

  const existing    = Storage.getSessionById(State.currentSessionId);
  const lastSession = existing || Storage.getLastSession(State.activeDayId);
  const day         = days.find((d) => d.id === State.activeDayId);

  let content = UI.renderTabs(State.activeDayId, days);
  content    += UI.renderWarmup();

  if (day) {
    content += `<div class="day-content">${UI.renderDayView(day, lastSession)}</div>`;
    content += `
      <div class="save-bar">
        ${existing ? `<span class="saved-badge">✅ Guardado hoy</span>` : ""}
        <button class="btn-save" id="saveBtn">💾 Guardar entrenamiento</button>
      </div>`;
  } else {
    // Default routine + rest day
    content += `<div class="day-content">${UI.renderRestDay()}</div>`;
  }

  app.innerHTML = content;
  _attachWorkoutListeners();
}

function _attachWorkoutListeners() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      State.activeDayId = btn.dataset.day;
      renderWorkoutView();
    });
  });

  const toggle = document.getElementById("warmupToggle");
  const list   = document.getElementById("warmupList");
  if (toggle && list) {
    toggle.addEventListener("click", () => {
      const open = list.classList.toggle("open");
      toggle.querySelector(".chevron").classList.toggle("open", open);
    });
  }

  document.getElementById("saveBtn")?.addEventListener("click", _handleSave);

  document.querySelectorAll(".history-btn").forEach((btn) => {
    btn.addEventListener("click", () => openHistoryModal(btn.dataset.exercise, btn.dataset.exname));
  });
}

function _handleSave() {
  const exercises = collectFormData(State.activeDayId);
  const hasData   = exercises.some((e) => e.sets.some((s) => s.weight > 0 || s.reps > 0));
  if (!hasData) { showToast("Registra al menos un peso o rep.", "warning"); return; }

  Storage.saveSession({
    id:        State.currentSessionId,
    date:      getTodayISO(),
    dayId:     State.activeDayId,
    exercises,
  });
  showToast("✅ Entrenamiento guardado.");
  renderWorkoutView();
}

// ─── History view ─────────────────────────────────────────────────────────────

function renderHistoryView() {
  document.getElementById("app").innerHTML = `
    <div class="history-view">
      <h2 class="section-title">📊 Historial de entrenamientos</h2>
      ${UI.renderSessionHistory(Storage.getAllSorted())}
    </div>`;
}

// ─── Routines view ────────────────────────────────────────────────────────────

function renderRoutinesView() {
  RB.view = "list";
  RoutineBuilder.render();
}

// ─── History modal ────────────────────────────────────────────────────────────

function openHistoryModal(exerciseId, exerciseName) {
  const history = Storage.getExerciseHistory(exerciseId);
  const overlay = document.getElementById("modalOverlay");
  const modal   = document.getElementById("modal");

  modal.innerHTML = `
    <div class="modal-header">
      <h3>${exerciseName}</h3>
      <button class="modal-close" id="modalClose">✕</button>
    </div>
    ${UI.renderHistoryModal(exerciseName, history)}`;

  overlay.classList.add("open");
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  document.getElementById("modalClose").addEventListener("click", closeModal);
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

function _attachNavListeners() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      State.activeView = btn.dataset.view;
      renderCurrentView();
    });
  });

  // Tapping the user chip in the header reopens the login/switch screen
  document.getElementById("headerUser")?.addEventListener("click", showLoginScreen);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Set header date
  document.getElementById("headerDate").textContent = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  _attachNavListeners();

  if (Auth.init()) {
    updateHeaderUser();
    renderWorkoutView();
  } else {
    showLoginScreen();
  }
});
