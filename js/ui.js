const UI = {
  // ─── Warmup ────────────────────────────────────────────────────────────────
  renderWarmup() {
    const { warmup } = ROUTINE;
    return `
      <section class="warmup-card card">
        <div class="warmup-header" id="warmupToggle">
          <span class="section-label">🔥 ${warmup.name}</span>
          <span class="warmup-meta">${warmup.duration}</span>
          <svg class="chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <ul class="warmup-list" id="warmupList">
          ${warmup.exercises
            .map(
              (ex) => `
            <li class="warmup-item">
              <span class="warmup-icon">${ex.icon}</span>
              <span class="warmup-name">${ex.name}</span>
              <span class="warmup-target">${ex.target}</span>
            </li>`
            )
            .join("")}
        </ul>
      </section>`;
  },

  // ─── Day Tabs ───────────────────────────────────────────────────────────────
  // `days` can be the default ROUTINE.days or a custom routine's days array
  renderTabs(activeDayId, days) {
    const tabs = days.map(
      (d) => `
      <button class="tab-btn ${d.id === activeDayId ? "active" : ""}" data-day="${d.id}">
        <span class="tab-label">${d.label}</span>
        ${d.subtitle ? `<span class="tab-sub">${d.subtitle}</span>` : ""}
      </button>`
    );
    return `<div class="tabs" role="tablist">${tabs.join("")}</div>`;
  },

  // ─── Exercise Card ──────────────────────────────────────────────────────────
  renderExerciseCard(ex, dayId, lastSets) {
    const repsLabel =
      ex.repsLabel || (ex.repsMin === ex.repsMax ? `${ex.repsMin}` : `${ex.repsMin}-${ex.repsMax}`);

    const setsHTML = Array.from({ length: ex.sets }, (_, i) => {
      const last = lastSets && lastSets[i];
      return `
        <div class="set-row">
          <span class="set-number">Serie ${i + 1}</span>
          <div class="set-inputs">
            <label class="input-group">
              <span>kg</span>
              <input
                type="number"
                inputmode="decimal"
                min="0"
                step="0.5"
                placeholder="${last ? last.weight : "—"}"
                data-exercise="${ex.id}"
                data-set="${i}"
                data-field="weight"
                class="set-input weight-input"
                ${last ? `value="${last.weight}"` : ""}
              />
            </label>
            <label class="input-group">
              <span>reps</span>
              <input
                type="number"
                inputmode="numeric"
                min="0"
                placeholder="${last ? last.reps : "—"}"
                data-exercise="${ex.id}"
                data-set="${i}"
                data-field="reps"
                class="set-input reps-input"
                ${last ? `value="${last.reps}"` : ""}
              />
            </label>
          </div>
        </div>`;
    }).join("");

    return `
      <article class="exercise-card ${ex.compound ? "compound" : "isolation"}" id="ex-${ex.id}">
        <div class="ex-header">
          <div>
            <h3 class="ex-name">${ex.name}</h3>
            <p class="ex-meta">
              <span class="badge">${ex.sets} series</span>
              <span class="badge">${repsLabel} reps</span>
              <span class="badge rest-badge">⏱ ${ex.rest}</span>
            </p>
          </div>
          <button class="history-btn" data-exercise="${ex.id}" data-exname="${ex.name}" title="Ver historial">
            📈
          </button>
        </div>
        <div class="sets-container">${setsHTML}</div>
      </article>`;
  },

  // ─── Day View ───────────────────────────────────────────────────────────────
  renderDayView(day, lastSession) {
    const lastExMap = {};
    if (lastSession) {
      lastSession.exercises.forEach((e) => {
        lastExMap[e.exerciseId] = e.sets;
      });
    }

    const cards = day.exercises
      .map((ex) => this.renderExerciseCard(ex, day.id, lastExMap[ex.id] || null))
      .join("");

    return `
      <div class="day-header">
        <h2 class="day-title">${day.label}</h2>
        <p class="day-focus">${day.focus}</p>
      </div>
      <div class="exercises-list">${cards}</div>`;
  },

  // ─── Rest Day ───────────────────────────────────────────────────────────────
  renderRestDay() {
    return `
      <div class="rest-view">
        <span class="rest-emoji">😴</span>
        <h2>Día de Descanso</h2>
        <p>${ROUTINE.rest.note}</p>
      </div>`;
  },

  // ─── History Modal ──────────────────────────────────────────────────────────
  renderHistoryModal(exerciseName, history) {
    if (!history.length) {
      return `
        <div class="modal-body">
          <p class="empty-history">Aún no hay registros para este ejercicio.</p>
        </div>`;
    }

    const maxWeight = Math.max(...history.map((h) => h.maxWeight));

    const bars = history
      .map((h) => {
        const pct = maxWeight > 0 ? Math.round((h.maxWeight / maxWeight) * 100) : 0;
        const dateStr = new Date(h.date + "T12:00:00").toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        });
        return `
          <div class="bar-group">
            <span class="bar-weight">${h.maxWeight}kg</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="bar-date">${dateStr}</span>
          </div>`;
      })
      .join("");

    const lastSets = history[history.length - 1]?.sets || [];
    const setsDetail = lastSets
      .map(
        (s, i) =>
          `<span class="set-chip">S${i + 1}: ${s.weight || "—"}kg × ${s.reps || "—"}</span>`
      )
      .join("");

    return `
      <div class="modal-body">
        <h4 class="modal-section-title">Peso máximo por sesión</h4>
        <div class="bars-chart">${bars}</div>
        ${
          setsDetail
            ? `<h4 class="modal-section-title">Última sesión detalle</h4>
               <div class="sets-chips">${setsDetail}</div>`
            : ""
        }
      </div>`;
  },

  // ─── Sessions History ───────────────────────────────────────────────────────
  renderSessionHistory(sessions) {
    if (!sessions.length) {
      return `<p class="empty-history">Todavía no has guardado ningún entrenamiento. ¡A por ello!</p>`;
    }

    const dayMap = Object.fromEntries(ROUTINE.days.map((d) => [d.id, d]));

    return sessions
      .slice(0, 20)
      .map((s) => {
        const day = dayMap[s.dayId];
        const dateStr = new Date(s.date + "T12:00:00").toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "short",
        });
        const totalVolume = s.exercises.reduce((acc, ex) => {
          return acc + ex.sets.reduce((a, set) => a + (set.weight || 0) * (set.reps || 0), 0);
        }, 0);
        return `
          <div class="history-session-card card">
            <div class="hs-header">
              <span class="hs-day">${day ? day.label : s.dayId}</span>
              <span class="hs-date">${dateStr}</span>
            </div>
            <div class="hs-stats">
              <span>💪 ${s.exercises.length} ejercicios</span>
              <span>🏋️ ${Math.round(totalVolume).toLocaleString("es-ES")} kg vol.</span>
            </div>
          </div>`;
      })
      .join("");
  },
};
