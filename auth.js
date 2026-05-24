/* ================================================================
   auth.js — Authentification sans email : pseudo + mot de passe
   ================================================================ */

const AUTH = {
  currentUser: null,
  currentRole: null,

  async register(username, password, name, role, classCode) {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (clean.length < 3) throw new Error("Identifiant trop court (min. 3 caractères, lettres/chiffres).");
    if (password.length < 6) throw new Error("Mot de passe trop court (min. 6 caractères).");

    const users = JSON.parse(localStorage.getItem("ef_auth_users") || "{}");
    if (users[clean]) throw new Error("Cet identifiant est déjà pris. Choisissez-en un autre.");

    const uid = "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    users[clean] = { uid, password, name, role };
    localStorage.setItem("ef_auth_users", JSON.stringify(users));

    const userData = { uid, username: clean, name, role, createdAt: new Date().toISOString() };

    if (role === "student") {
      if (!classCode) throw new Error("Code de classe requis.");
      const cls = await DB.getClassByCode(classCode.trim().toUpperCase());
      if (!cls) throw new Error("Code de classe invalide. Demandez-le à votre professeur.");
      userData.classId = cls.id;
      userData.className = cls.name;
      userData.teacherId = cls.teacherId;
      await DB.createUser(uid, userData);
      await DB.addStudentToClass(cls.id, uid);
    } else {
      await DB.createUser(uid, userData);
    }

    this.currentUser = userData;
    this.currentRole = role;
    this._persist(uid, clean, role);
    return userData;
  },

  async login(username, password, role) {
    const clean = username.trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem("ef_auth_users") || "{}");
    const u = users[clean];
    if (!u) throw new Error("Identifiant introuvable.");
    if (u.password !== password) throw new Error("Mot de passe incorrect.");
    if (u.role !== role) throw new Error(`Ce compte est un compte ${u.role === "teacher" ? "enseignant" : "élève"}.`);

    const userData = await DB.getUser(u.uid);
    if (!userData) throw new Error("Données du compte introuvables.");

    this.currentUser = userData;
    this.currentRole = role;
    this._persist(u.uid, clean, role);
    return userData;
  },

  async logout() {
    localStorage.removeItem("ef_session");
    this.currentUser = null;
    this.currentRole = null;
  },

  async restoreSession() {
    const session = JSON.parse(localStorage.getItem("ef_session") || "null");
    if (!session) return null;
    const user = await DB.getUser(session.uid);
    if (!user) return null;
    this.currentUser = user;
    this.currentRole = user.role;
    return user;
  },

  _persist(uid, username, role) {
    localStorage.setItem("ef_session", JSON.stringify({ uid, username, role }));
  },
};
