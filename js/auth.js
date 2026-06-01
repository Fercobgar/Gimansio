// currentUserId is read by Storage._key() to namespace all data per user
var currentUserId = "default";

const EMOJIS = ["😤", "👩", "👨", "🧑", "💪", "🏃", "🧘", "🏋️", "🦁", "🔥", "⚡", "🎯"];

const Auth = {
  USERS_KEY: "gym_users",
  LAST_KEY:  "gym_last_user",

  getUsers() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; }
    catch { return []; }
  },

  saveUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    idx !== -1 ? (users[idx] = user) : users.push(user);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  login(userId) {
    currentUserId = userId;
    localStorage.setItem(this.LAST_KEY, userId);
    document.getElementById("loginOverlay").classList.remove("open");
    updateHeaderUser();
    renderCurrentView();
  },

  logout() {
    currentUserId = "default";
    localStorage.removeItem(this.LAST_KEY);
    showLoginScreen();
  },

  getLastUserId() { return localStorage.getItem(this.LAST_KEY); },
  currentUser()   { return this.getUsers().find((u) => u.id === currentUserId) || null; },

  // Returns true if a previous user was restored (auto-login)
  init() {
    const lastId = this.getLastUserId();
    const users  = this.getUsers();
    if (lastId && users.some((u) => u.id === lastId)) {
      currentUserId = lastId;
      return true;
    }
    return false;
  },
};

// ─── Login screen ─────────────────────────────────────────────────────────────

function showLoginScreen() {
  const overlay = document.getElementById("loginOverlay");
  _renderLoginContent(overlay);
  overlay.classList.add("open");
}

function _renderLoginContent(overlay) {
  const users = Auth.getUsers();

  const usersHTML = users.length
    ? users
        .map(
          (u) => `
          <button class="user-card" data-userid="${u.id}">
            <span class="user-avatar">${u.emoji}</span>
            <span class="user-name">${u.name}</span>
          </button>`
        )
        .join("")
    : `<p class="login-empty">Aún no hay usuarios. ¡Añade uno!</p>`;

  overlay.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">GymTracker 💪</div>
      <p class="login-subtitle">¿Quién entrena hoy?</p>
      <div class="user-list">${usersHTML}</div>
      <button class="btn-outline login-add-btn" id="addUserBtn">+ Añadir usuario</button>
    </div>`;

  overlay.querySelectorAll(".user-card").forEach((btn) => {
    btn.addEventListener("click", () => Auth.login(btn.dataset.userid));
  });

  document.getElementById("addUserBtn").addEventListener("click", () => {
    _renderAddUserForm(overlay);
  });
}

function _renderAddUserForm(overlay) {
  let selectedEmoji = EMOJIS[0];

  const emojiButtons = EMOJIS.map(
    (e) => `<button class="emoji-opt${e === selectedEmoji ? " selected" : ""}" data-emoji="${e}">${e}</button>`
  ).join("");

  overlay.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">GymTracker 💪</div>
      <p class="login-subtitle">Nuevo usuario</p>
      <div class="emoji-picker" id="emojiPicker">${emojiButtons}</div>
      <input class="login-input" type="text" id="newUserName"
        placeholder="Tu nombre" maxlength="20" autocomplete="off" />
      <div class="login-actions">
        <button class="btn-outline" id="cancelAddUser" style="flex:1">Cancelar</button>
        <button class="btn-primary-full" id="saveNewUser" style="flex:1">Guardar</button>
      </div>
    </div>`;

  overlay.querySelectorAll(".emoji-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedEmoji = btn.dataset.emoji;
      overlay.querySelectorAll(".emoji-opt").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  document.getElementById("cancelAddUser").addEventListener("click", () => {
    _renderLoginContent(overlay);
  });

  document.getElementById("saveNewUser").addEventListener("click", () => {
    const name = document.getElementById("newUserName").value.trim();
    if (!name) { document.getElementById("newUserName").focus(); return; }
    const user = { id: "u_" + Date.now(), name, emoji: selectedEmoji };
    Auth.saveUser(user);
    Auth.login(user.id);
  });

  document.getElementById("newUserName").focus();
}
