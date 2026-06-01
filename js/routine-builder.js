const REST_OPTIONS = ["60s", "60-90s", "90-120s", "2-3 min"];

// Internal navigation state for the routine builder
const RB = {
  view: "list",         // "list" | "routine" | "day"
  routine: null,        // deep-copy of the routine being edited
  dayIdx: null,         // index of the day being edited within RB.routine
  editingExIdx: null,   // index of the exercise with the edit form open
  pickerSearch: "",
  pickerMuscle: "Todos",
  pickerExpandedId: null,
};

const RoutineBuilder = {
  render() {
    const app = document.getElementById("app");
    if      (RB.view === "list")    { app.innerHTML = this._list();    this._onList();    }
    else if (RB.view === "routine") { app.innerHTML = this._routine(); this._onRoutine(); }
    else if (RB.view === "day")     { app.innerHTML = this._day();     this._onDay();     }
  },

  // ── List ──────────────────────────────────────────────────────────────────
  _list() {
    const routines  = Storage.getRoutines();
    const activeId  = Storage.getActiveRoutineId();
    const isDefault = !activeId;

    const customCards = routines.length
      ? routines.map((r) => {
          const on = r.id === activeId;
          return `
            <div class="rb-card ${on ? "rb-active" : ""}">
              <div class="rb-card-info">
                <span class="rb-card-name">${r.name}</span>
                <span class="rb-card-meta">${r.days.length} día${r.days.length !== 1 ? "s" : ""}</span>
              </div>
              <div class="rb-card-actions">
                ${on
                  ? `<span class="rb-badge-on">✓ Activa</span>`
                  : `<button class="btn-xs btn-xs-primary rb-activate" data-id="${r.id}">Usar</button>`}
                <button class="btn-xs rb-edit" data-id="${r.id}" title="Editar">✏️</button>
                <button class="btn-xs rb-delete" data-id="${r.id}" title="Eliminar">🗑️</button>
              </div>
            </div>`;
        }).join("")
      : `<p class="empty-history" style="padding:12px 0 4px">Sin rutinas personalizadas aún.</p>`;

    return `
      <div class="rb-view">
        <h2 class="section-title">📋 Rutinas</h2>

        <p class="rb-section-label">Rutina predefinida</p>
        <div class="rb-card ${isDefault ? "rb-active" : ""}">
          <div class="rb-card-info">
            <span class="rb-card-name">Push · Pull · Legs (por defecto)</span>
            <span class="rb-card-meta">3 tipos de día · diseñada para ti</span>
          </div>
          <div class="rb-card-actions">
            ${isDefault
              ? `<span class="rb-badge-on">✓ Activa</span>`
              : `<button class="btn-xs btn-xs-primary" id="useDefaultBtn">Usar</button>`}
          </div>
        </div>

        <p class="rb-section-label" style="margin-top:20px">Mis rutinas</p>
        ${customCards}

        <button class="btn-save" id="newRoutineBtn" style="margin-top:16px">+ Crear nueva rutina</button>
      </div>`;
  },

  _onList() {
    document.getElementById("newRoutineBtn").addEventListener("click", () => {
      RB.routine = { id: "r_" + Date.now(), name: "Mi Rutina", days: [] };
      RB.view = "routine";
      this.render();
    });

    document.getElementById("useDefaultBtn")?.addEventListener("click", () => {
      Storage.setActiveRoutineId(null);
      State.activeDayId = null;
      showToast("✅ Rutina predefinida activada.");
      this.render();
    });

    document.querySelectorAll(".rb-activate").forEach((btn) => {
      btn.addEventListener("click", () => {
        Storage.setActiveRoutineId(btn.dataset.id);
        State.activeDayId = null;
        showToast("✅ Rutina activada.");
        this.render();
      });
    });

    document.querySelectorAll(".rb-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = Storage.getRoutines().find((r) => r.id === btn.dataset.id);
        if (r) { RB.routine = JSON.parse(JSON.stringify(r)); RB.view = "routine"; this.render(); }
      });
    });

    document.querySelectorAll(".rb-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("¿Eliminar esta rutina?")) return;
        Storage.deleteRoutine(btn.dataset.id);
        this.render();
      });
    });
  },

  // ── Routine editor ────────────────────────────────────────────────────────
  _routine() {
    const r = RB.routine;
    const daysHTML = r.days.length
      ? r.days.map((d, i) => `
          <div class="rb-day-row">
            <div class="rb-day-info">
              <span class="rb-day-name">${d.label || "Día " + (i + 1)}</span>
              <span class="rb-day-meta">${d.exercises.length} ejercicio${d.exercises.length !== 1 ? "s" : ""}</span>
            </div>
            <div class="rb-card-actions">
              <button class="btn-xs rb-edit-day" data-idx="${i}">✏️ Editar</button>
              <button class="btn-xs rb-remove-day" data-idx="${i}">✕</button>
            </div>
          </div>`).join("")
      : `<p style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Añade al menos un día.</p>`;

    return `
      <div class="rb-view">
        <button class="rb-back" id="backToList">← Rutinas</button>

        <label class="input-group" style="margin-bottom:16px">
          <span>Nombre de la rutina</span>
          <input class="set-input" style="text-align:left;padding:12px" type="text"
            id="routineName" value="${r.name}" placeholder="Ej: Mi Rutina de Fuerza" />
        </label>

        <p class="rb-section-label">Días de entrenamiento</p>
        <div id="daysList">${daysHTML}</div>
        <button class="btn-outline" id="addDayBtn" style="width:100%;margin-top:10px">+ Añadir día</button>

        <button class="btn-save" id="saveRoutineBtn" style="margin-top:20px">💾 Guardar rutina</button>
      </div>`;
  },

  _onRoutine() {
    document.getElementById("backToList").addEventListener("click", () => {
      RB.view = "list"; this.render();
    });

    document.getElementById("addDayBtn").addEventListener("click", () => {
      this._snapRoutineName();
      RB.routine.days.push({
        id: "d_" + Date.now(),
        label: "Día " + (RB.routine.days.length + 1),
        focus: "",
        weekDays: [],
        exercises: [],
      });
      RB.dayIdx = RB.routine.days.length - 1;
      RB.view = "day";
      this.render();
    });

    document.querySelectorAll(".rb-edit-day").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._snapRoutineName();
        RB.dayIdx = parseInt(btn.dataset.idx, 10);
        RB.view = "day";
        this.render();
      });
    });

    document.querySelectorAll(".rb-remove-day").forEach((btn) => {
      btn.addEventListener("click", () => {
        RB.routine.days.splice(parseInt(btn.dataset.idx, 10), 1);
        this._snapRoutineName();
        this.render();
      });
    });

    document.getElementById("saveRoutineBtn").addEventListener("click", () => {
      const name = document.getElementById("routineName").value.trim();
      if (!name) { document.getElementById("routineName").focus(); return; }
      RB.routine.name = name;
      Storage.saveRoutine(RB.routine);
      showToast("✅ Rutina guardada.");
      RB.view = "list";
      this.render();
    });
  },

  _snapRoutineName() {
    const el = document.getElementById("routineName");
    if (el) RB.routine.name = el.value.trim() || RB.routine.name;
  },

  // ── Day editor ────────────────────────────────────────────────────────────
  _day() {
    const day = RB.routine.days[RB.dayIdx];
    if (!day) { RB.view = "routine"; return this._routine(); }

    const total = day.exercises.length;
    const exHTML = total
      ? day.exercises.map((ex, i) => {
          const editing    = RB.editingExIdx === i;
          const repsLabel  = ex.repsLabel || `${ex.repsMin || ""}${ex.repsMax ? "-" + ex.repsMax : ""} reps`;
          const editForm   = editing ? `
            <div class="ex-edit-form">
              <div class="picker-config-row">
                <label class="input-group">
                  <span>Series</span>
                  <input class="set-input" type="number" inputmode="numeric"
                    id="edit_sets" value="${ex.sets}" min="1" max="10" />
                </label>
                <label class="input-group">
                  <span>Rep mín</span>
                  <input class="set-input" type="number" inputmode="numeric"
                    id="edit_rmin" value="${ex.repsMin || ""}" min="1" />
                </label>
                <label class="input-group">
                  <span>Rep máx</span>
                  <input class="set-input" type="number" inputmode="numeric"
                    id="edit_rmax" value="${ex.repsMax || ""}" min="1" />
                </label>
              </div>
              <label class="input-group" style="margin-top:8px">
                <span>Descanso</span>
                <select class="set-input" id="edit_rest" style="text-align:left">
                  ${REST_OPTIONS.map((r) => `<option${r === ex.rest ? " selected" : ""}>${r}</option>`).join("")}
                </select>
              </label>
              <button class="btn-primary-full" id="saveExEdit" data-idx="${i}"
                style="width:100%;margin-top:10px">✓ Guardar cambios</button>
            </div>` : "";

          return `
            <div class="rb-ex-row${editing ? " editing" : ""}">
              <div class="rb-ex-row-header">
                <div class="rb-ex-reorder">
                  <button class="btn-xs rb-move-up" data-idx="${i}"${i === 0 ? " disabled" : ""}>↑</button>
                  <button class="btn-xs rb-move-dn" data-idx="${i}"${i === total - 1 ? " disabled" : ""}>↓</button>
                </div>
                <div class="rb-ex-info">
                  <span class="rb-ex-name">${ex.name}</span>
                  <span class="rb-ex-meta">${ex.sets} series · ${repsLabel} · ${ex.rest}</span>
                </div>
                <div class="rb-ex-actions">
                  <button class="btn-xs${editing ? " btn-xs-primary" : ""} rb-edit-ex" data-idx="${i}">✏️</button>
                  <button class="btn-xs rb-remove-ex" data-idx="${i}">✕</button>
                </div>
              </div>
              ${editForm}
            </div>`;
        }).join("")
      : `<p style="color:var(--text-muted);font-size:.85rem;padding:8px 0">Añade ejercicios desde la librería.</p>`;

    return `
      <div class="rb-view">
        <button class="rb-back" id="backToRoutine">← ${RB.routine.name}</button>

        <label class="input-group" style="margin-bottom:8px">
          <span>Nombre del día</span>
          <input class="set-input" style="text-align:left;padding:12px" type="text"
            id="dayLabel" value="${day.label}" placeholder="Ej: Empuje, Tirón, Piernas..." />
        </label>
        <label class="input-group" style="margin-bottom:16px">
          <span>Músculos (opcional)</span>
          <input class="set-input" style="text-align:left;padding:12px" type="text"
            id="dayFocus" value="${day.focus || ""}" placeholder="Ej: Pecho, Hombros, Tríceps" />
        </label>

        <p class="rb-section-label">Ejercicios del día</p>
        <div id="exercisesList">${exHTML}</div>
        <button class="btn-outline" id="addExBtn" style="width:100%;margin-top:10px">+ Añadir ejercicio</button>
      </div>`;
  },

  _onDay() {
    document.getElementById("backToRoutine").addEventListener("click", () => {
      this._snapDayMeta();
      RB.editingExIdx = null;
      RB.view = "routine";
      this.render();
    });

    document.getElementById("addExBtn").addEventListener("click", () => {
      this._snapDayMeta();
      RB.editingExIdx = null;
      RB.pickerSearch = "";
      RB.pickerMuscle = "Todos";
      RB.pickerExpandedId = null;
      this._openPicker();
    });

    // ── Reorder ──────────────────────────────────────────────────────────
    document.querySelectorAll(".rb-move-up").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i   = parseInt(btn.dataset.idx, 10);
        const exs = RB.routine.days[RB.dayIdx].exercises;
        [exs[i - 1], exs[i]] = [exs[i], exs[i - 1]];
        if      (RB.editingExIdx === i)     RB.editingExIdx = i - 1;
        else if (RB.editingExIdx === i - 1) RB.editingExIdx = i;
        this.render();
      });
    });

    document.querySelectorAll(".rb-move-dn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i   = parseInt(btn.dataset.idx, 10);
        const exs = RB.routine.days[RB.dayIdx].exercises;
        [exs[i], exs[i + 1]] = [exs[i + 1], exs[i]];
        if      (RB.editingExIdx === i)     RB.editingExIdx = i + 1;
        else if (RB.editingExIdx === i + 1) RB.editingExIdx = i;
        this.render();
      });
    });

    // ── Toggle edit form ──────────────────────────────────────────────────
    document.querySelectorAll(".rb-edit-ex").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.idx, 10);
        RB.editingExIdx = RB.editingExIdx === i ? null : i;
        this.render();
      });
    });

    // ── Save exercise edits ───────────────────────────────────────────────
    document.getElementById("saveExEdit")?.addEventListener("click", (e) => {
      const i  = parseInt(e.currentTarget.dataset.idx, 10);
      const ex = RB.routine.days[RB.dayIdx].exercises[i];
      const sets    = parseInt(document.getElementById("edit_sets").value, 10);
      const repsMin = parseInt(document.getElementById("edit_rmin").value, 10);
      const repsMax = parseInt(document.getElementById("edit_rmax").value, 10);
      if (sets)    ex.sets    = sets;
      if (repsMin) ex.repsMin = repsMin;
      if (repsMax) ex.repsMax = repsMax;
      ex.rest      = document.getElementById("edit_rest").value;
      ex.repsLabel = null; // clear timed label, use numeric from now on
      RB.editingExIdx = null;
      this.render();
    });

    // ── Remove ────────────────────────────────────────────────────────────
    document.querySelectorAll(".rb-remove-ex").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.idx, 10);
        RB.routine.days[RB.dayIdx].exercises.splice(i, 1);
        if (RB.editingExIdx === i)      RB.editingExIdx = null;
        else if (RB.editingExIdx > i)   RB.editingExIdx--;
        this.render();
      });
    });
  },

  _snapDayMeta() {
    const day = RB.routine.days[RB.dayIdx];
    if (!day) return;
    day.label = document.getElementById("dayLabel")?.value.trim() || day.label;
    day.focus = document.getElementById("dayFocus")?.value.trim() || "";
  },

  // ── Exercise picker modal ─────────────────────────────────────────────────
  _openPicker() {
    const overlay = document.getElementById("modalOverlay");
    const modal   = document.getElementById("modal");

    const filtered = EXERCISES_LIBRARY.filter((ex) => {
      const okMuscle = RB.pickerMuscle === "Todos" || ex.muscle === RB.pickerMuscle;
      const okSearch = !RB.pickerSearch || ex.name.toLowerCase().includes(RB.pickerSearch.toLowerCase());
      return okMuscle && okSearch;
    });

    const chips = MUSCLE_GROUPS.map((m) => `
      <button class="muscle-chip ${m === RB.pickerMuscle ? "active" : ""}" data-muscle="${m}">${m}</button>
    `).join("");

    const items = filtered.map((ex) => {
      const expanded = RB.pickerExpandedId === ex.id;
      const def = ex.compound
        ? { sets: 4, repsMin: 8,  repsMax: 12, rest: "90-120s" }
        : { sets: 3, repsMin: 10, repsMax: 15, rest: "60-90s"  };

      return `
        <div class="picker-item${expanded ? " expanded" : ""}">
          <div class="picker-item-header">
            <div class="picker-item-info">
              <span class="picker-item-name">${ex.name}</span>
              <span class="picker-item-meta">${ex.muscle} · ${ex.equipment}</span>
            </div>
            <button class="btn-xs btn-xs-primary picker-expand" data-exid="${ex.id}">+</button>
          </div>
          ${expanded ? `
          <div class="picker-config">
            <div class="picker-config-row">
              <label class="input-group">
                <span>Series</span>
                <input class="set-input" type="number" inputmode="numeric"
                  id="cfg_sets" value="${def.sets}" min="1" max="10" />
              </label>
              <label class="input-group">
                <span>Rep mín</span>
                <input class="set-input" type="number" inputmode="numeric"
                  id="cfg_rmin" value="${def.repsMin}" min="1" />
              </label>
              <label class="input-group">
                <span>Rep máx</span>
                <input class="set-input" type="number" inputmode="numeric"
                  id="cfg_rmax" value="${def.repsMax}" min="1" />
              </label>
            </div>
            <label class="input-group" style="margin-top:6px">
              <span>Descanso</span>
              <select class="set-input" id="cfg_rest" style="text-align:left">
                ${REST_OPTIONS.map((r) => `<option${r === def.rest ? " selected" : ""}>${r}</option>`).join("")}
              </select>
            </label>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn-outline" style="flex:1" id="cancelExpand">Cancelar</button>
              <button class="btn-primary-full" style="flex:1" id="confirmAdd" data-exid="${ex.id}">✓ Añadir</button>
            </div>
          </div>` : ""}
        </div>`;
    }).join("") || `<p class="empty-history">Sin resultados.</p>`;

    modal.innerHTML = `
      <div class="modal-header">
        <h3>Añadir ejercicio</h3>
        <button class="modal-close" id="pickerClose">✕</button>
      </div>
      <div class="modal-body" style="padding-bottom:32px">
        <input class="set-input" type="search" id="pickerSearch"
          placeholder="Buscar ejercicio..."
          value="${RB.pickerSearch}"
          style="text-align:left;width:100%;margin-bottom:12px" />
        <div class="picker-muscles">${chips}</div>
        <div class="picker-list">${items}</div>
      </div>`;

    overlay.classList.add("open");
    overlay.onclick = (e) => { if (e.target === overlay) this._closePicker(); };

    document.getElementById("pickerClose").addEventListener("click", () => this._closePicker());

    document.getElementById("pickerSearch").addEventListener("input", (e) => {
      RB.pickerSearch = e.target.value;
      RB.pickerExpandedId = null;
      this._openPicker();
    });

    document.querySelectorAll(".muscle-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        RB.pickerMuscle = btn.dataset.muscle;
        RB.pickerExpandedId = null;
        this._openPicker();
      });
    });

    document.querySelectorAll(".picker-expand").forEach((btn) => {
      btn.addEventListener("click", () => {
        RB.pickerExpandedId = RB.pickerExpandedId === btn.dataset.exid ? null : btn.dataset.exid;
        this._openPicker();
      });
    });

    document.getElementById("cancelExpand")?.addEventListener("click", () => {
      RB.pickerExpandedId = null;
      this._openPicker();
    });

    document.getElementById("confirmAdd")?.addEventListener("click", (e) => {
      const exId = e.currentTarget.dataset.exid;
      const lib  = EXERCISES_LIBRARY.find((ex) => ex.id === exId);
      if (!lib) return;

      RB.routine.days[RB.dayIdx].exercises.push({
        id:        "rex_" + Date.now(),
        name:      lib.name,
        libraryId: lib.id,
        sets:      parseInt(document.getElementById("cfg_sets").value, 10)  || 3,
        repsMin:   parseInt(document.getElementById("cfg_rmin").value, 10)  || 8,
        repsMax:   parseInt(document.getElementById("cfg_rmax").value, 10)  || 12,
        rest:      document.getElementById("cfg_rest").value,
        compound:  lib.compound,
        repsLabel: null,
      });

      this._closePicker();
      this.render();
    });
  },

  _closePicker() {
    document.getElementById("modalOverlay").classList.remove("open");
    RB.pickerExpandedId = null;
  },
};
