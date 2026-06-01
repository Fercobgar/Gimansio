const Storage = {
  // All keys are prefixed with currentUserId (set by auth.js) so each user
  // has completely separate sessions, routines, and settings.
  _key(base) {
    return `${base}_${currentUserId}`;
  },

  // ── Sessions ──────────────────────────────────────────────────────────────
  getSessions() {
    try { return JSON.parse(localStorage.getItem(this._key("gym_sessions"))) || []; }
    catch { return []; }
  },

  saveSession(session) {
    const sessions = this.getSessions();
    const idx = sessions.findIndex((s) => s.id === session.id);
    idx !== -1 ? (sessions[idx] = session) : sessions.push(session);
    localStorage.setItem(this._key("gym_sessions"), JSON.stringify(sessions));
  },

  getSessionById(id) {
    return this.getSessions().find((s) => s.id === id) || null;
  },

  getSessionsByDay(dayId) {
    return this.getSessions()
      .filter((s) => s.dayId === dayId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getLastSession(dayId) {
    const sessions = this.getSessionsByDay(dayId);
    return sessions.length ? sessions[0] : null;
  },

  getAllSorted() {
    return this.getSessions().sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getExerciseHistory(exerciseId, limit = 8) {
    return this.getSessions()
      .filter((s) => s.exercises && s.exercises.some((e) => e.exerciseId === exerciseId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .reverse()
      .map((s) => {
        const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
        const maxWeight = ex ? Math.max(...ex.sets.map((set) => set.weight || 0)) : 0;
        const totalReps = ex ? ex.sets.reduce((acc, set) => acc + (set.reps || 0), 0) : 0;
        return { date: s.date, maxWeight, totalReps, sets: ex ? ex.sets : [] };
      });
  },

  // ── Custom Routines ───────────────────────────────────────────────────────
  getRoutines() {
    try { return JSON.parse(localStorage.getItem(this._key("gym_routines"))) || []; }
    catch { return []; }
  },

  saveRoutine(routine) {
    const routines = this.getRoutines();
    const idx = routines.findIndex((r) => r.id === routine.id);
    idx !== -1 ? (routines[idx] = routine) : routines.push(routine);
    localStorage.setItem(this._key("gym_routines"), JSON.stringify(routines));
  },

  deleteRoutine(id) {
    const routines = this.getRoutines().filter((r) => r.id !== id);
    localStorage.setItem(this._key("gym_routines"), JSON.stringify(routines));
    if (this.getActiveRoutineId() === id) this.setActiveRoutineId(null);
  },

  getActiveRoutineId() {
    return localStorage.getItem(this._key("gym_active_routine"));
  },

  setActiveRoutineId(id) {
    if (id) localStorage.setItem(this._key("gym_active_routine"), id);
    else    localStorage.removeItem(this._key("gym_active_routine"));
  },
};
