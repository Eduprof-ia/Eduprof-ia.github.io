/* ================================================================
   app.js — Contrôleur principal EduFlow
   ================================================================ */

"use strict";

// ── GLOBALS ─────────────────────────────────────────────────────
let _currentClassDetail = null;

// ── BOOT ────────────────────────────────────────────────────────
window.addEventListener("firebase-ready", async () => {
  if (window.__firebaseReady === "mock") {
    document.getElementById("firebaseNotice").style.display = "block";
  }
  APP.init();
});

// Fallback if Firebase script blocked
setTimeout(() => {
  if (!window.__firebaseReady) {
    window.__firebaseReady = "mock";
    window.dispatchEvent(new Event("firebase-ready"));
  }
}, 3000);

// ── APP OBJECT ───────────────────────────────────────────────────
const APP = {

  async init() {
    this.bindAuth();
    this.bindTeacher();
    this.bindModals();
    this.bindChat();

    // Try restore session
    const user = await AUTH.restoreSession();
    if (user) {
      this.enterApp(user);
    }
  },

  // ── AUTH ──────────────────────────────────────────────────────
  bindAuth() {
    // Role picker
    document.querySelectorAll(".role-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".role-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const role = btn.dataset.role;
        document.getElementById("classCodeField").style.display = role === "student" ? "block" : "none";
      });
    });

    // Tabs
    document.querySelectorAll(".auth-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.tab === "login" ? "loginForm" : "registerForm").classList.add("active");
      });
    });

    // Login — username + password only
    document.getElementById("loginBtn")?.addEventListener("click", async () => {
      const username = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      const role = document.querySelector(".role-btn.active")?.dataset.role || "teacher";
      if (!username || !password) { this.authError("Remplissez tous les champs."); return; }
      try {
        this.showLoading("Connexion…");
        const user = await AUTH.login(username, password, role);
        this.enterApp(user);
      } catch(e) { this.authError(e.message); }
      finally { this.hideLoading(); }
    });

    // Register
    document.getElementById("registerBtn")?.addEventListener("click", async () => {
      const name = document.getElementById("regName").value.trim();
      const username = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;
      const role = document.querySelector(".role-btn.active")?.dataset.role || "teacher";
      const classCode = document.getElementById("regClassCode").value.trim();
      if (!name || !username || !password) { this.authError("Remplissez tous les champs."); return; }
      try {
        this.showLoading("Création du compte…");
        const user = await AUTH.register(username, password, name, role, classCode);
        this.enterApp(user);
      } catch(e) { this.authError(e.message); }
      finally { this.hideLoading(); }
    });

    // Enter key
    ["loginEmail","loginPassword","regEmail","regPassword","regName","regClassCode"].forEach(id => {
      document.getElementById(id)?.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const tab = document.querySelector(".auth-tab.active")?.dataset.tab;
          document.getElementById(tab === "login" ? "loginBtn" : "registerBtn")?.click();
        }
      });
    });
  },

  authError(msg) {
    const el = document.getElementById("authError");
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(() => el.style.display = "none", 4000);
  },

  enterApp(user) {
    document.getElementById("authError").style.display = "none";
    document.getElementById("authScreen").classList.remove("active");

    if (user.role === "teacher") {
      document.getElementById("teacherApp").classList.add("active");
      this.initTeacher(user);
    } else {
      document.getElementById("studentApp").classList.add("active");
      STUDENT.init(user);
    }
  },

  async logout() {
    await AUTH.logout();
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("authScreen").classList.add("active");
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
  },

  // ── TEACHER ───────────────────────────────────────────────────
  async initTeacher(user) {
    document.getElementById("teacherGreet").textContent = user.name.split(" ")[0];
    document.getElementById("teacherNameDisplay").textContent = user.name;
    document.getElementById("teacherAvatar").textContent = user.name.charAt(0).toUpperCase();
    await this.refreshStats();
    await this.renderRecentDocs();
    await this.renderClasses();
    await this.renderSubmissions();
    await this.renderLibrary();
  },

  bindTeacher() {
    // Nav
    document.querySelectorAll(".nav-btn[data-view]").forEach(btn => {
      btn.addEventListener("click", () => this.switchView(btn.dataset.view));
    });

    // Quick create cards
    document.querySelectorAll(".qcard").forEach(card => {
      card.addEventListener("click", () => {
        CREATORS.show(card.dataset.create);
        this.switchView("create");
      });
    });

    // Back button in create
    document.getElementById("backToCreate")?.addEventListener("click", () => this.switchView("dashboard"));

    // Logout
    document.getElementById("logoutBtn")?.addEventListener("click", () => this.logout());

    // New class
    document.getElementById("newClassBtn")?.addEventListener("click", () => this.openModal("newClassModal"));
    document.getElementById("createClassBtn")?.addEventListener("click", () => this.createClass());

    // Filters
    document.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        this.renderLibrary(chip.dataset.type);
      });
    });

    document.getElementById("assignFilterClass")?.addEventListener("change", () => this.renderSubmissions());
    document.getElementById("assignFilterStatus")?.addEventListener("change", () => this.renderSubmissions());

    // Class detail tabs
    document.querySelectorAll("[data-ctab]").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll("[data-ctab]").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".ctab").forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`ctab-${tab.dataset.ctab}`)?.classList.add("active");
      });
    });

    // Share doc
    document.getElementById("shareDocBtn")?.addEventListener("click", () => this.openShareDocModal());
    document.getElementById("confirmShareDoc")?.addEventListener("click", () => this.confirmShare());
    document.getElementById("copyClassCode")?.addEventListener("click", () => {
      const code = document.getElementById("classDetailCode").textContent;
      navigator.clipboard.writeText(code).then(() => this.toast("✅ Code copié !", "success"));
    });

    // Grade submit
    document.getElementById("submitGradeBtn")?.addEventListener("click", () => this.submitGrade());
  },

  switchView(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(`view-${view}`)?.classList.add("active");
    document.querySelector(`.nav-btn[data-view="${view}"]`)?.classList.add("active");
  },

  async refreshStats() {
    const user = AUTH.currentUser;
    if (!user) return;
    const [classes, docs, subs] = await Promise.all([
      DB.getTeacherClasses(user.uid),
      DB.getTeacherDocs(user.uid),
      DB.getSubmissions({ teacherId: user.uid }),
    ]);
    const studentCount = classes.reduce((a, c) => a + (c.students?.length || 0), 0);
    document.getElementById("sClasses").textContent = classes.length;
    document.getElementById("sStudents").textContent = studentCount;
    document.getElementById("sDocs").textContent = docs.length;
    document.getElementById("sPending").textContent = subs.filter(s => s.status === "pending").length;
  },

  async renderRecentDocs() {
    const container = document.getElementById("recentDocs");
    const docs = await DB.getTeacherDocs(AUTH.currentUser.uid);
    const recent = docs.slice(0, 6);
    if (!recent.length) { container.innerHTML = `<p class="empty">Aucun document créé.</p>`; return; }
    container.innerHTML = recent.map(doc => this._docCard(doc)).join("");
  },

  async renderLibrary(filter = "all") {
    const container = document.getElementById("libraryGrid");
    const docs = await DB.getTeacherDocs(AUTH.currentUser.uid);
    const filtered = filter === "all" ? docs : docs.filter(d => d.type === filter);
    if (!filtered.length) { container.innerHTML = `<p class="empty">Aucun document ${filter !== "all" ? "dans cette catégorie" : ""}.</p>`; return; }
    container.innerHTML = filtered.map(doc => this._docCard(doc, true)).join("");
  },

  _docCard(doc, withShare = false) {
    const icons = { slides:"🖥", exercise:"✏️", crossword:"🔤", wordsearch:"🔍", matching:"🔗", evaluation:"📝" };
    const labels = { slides:"Diaporama", exercise:"Exercice", crossword:"Mots croisés", wordsearch:"Mots mêlés", matching:"Relier", evaluation:"Évaluation" };
    const colors = { slides:"#3d6b8a", exercise:"#3d6b4f", crossword:"#7a3d6b", wordsearch:"#3d4f6b", matching:"#5a6b3d", evaluation:"#6b4f3d" };
    return `<div class="doc-card" onclick="APP.previewDoc('${doc.id}')">
      <div class="doc-card-icon" style="background:${colors[doc.type]||"#444"}">${icons[doc.type]||"📄"}</div>
      <div class="doc-card-info">
        <div class="doc-card-title">${doc.title || doc.subject || "Sans titre"}</div>
        <div class="doc-card-meta">${labels[doc.type]||doc.type} · ${doc.level||""} · ${new Date(doc.createdAt).toLocaleDateString("fr-FR")}</div>
      </div>
      <div class="doc-card-actions">
        ${withShare ? `<button class="btn-tool" onclick="event.stopPropagation();APP.quickShare('${doc.id}')">🔗 Partager</button>` : ""}
        <button class="btn-tool" onclick="event.stopPropagation();APP.deleteDoc('${doc.id}')">🗑</button>
      </div>
    </div>`;
  },

  async previewDoc(docId) {
    const doc = await DB.getDoc(docId);
    if (!doc) return;
    document.getElementById("studentDocTitle").textContent = doc.title || doc.subject || "Document";
    const content = document.getElementById("studentDocContent");
    content.innerHTML = `<div id="studentDocActivity"></div>`;
    ACTIVITIES.renderDocForStudent(doc, "studentDocActivity");
    document.getElementById("studentDocFoot").style.display = "none";
    document.getElementById("studentDocModal").classList.add("open");
  },

  async deleteDoc(docId) {
    if (!confirm("Supprimer ce document ?")) return;
    await DB.deleteDoc(docId);
    this.toast("Document supprimé", "success");
    await this.renderLibrary();
    await this.renderRecentDocs();
    await this.refreshStats();
  },

  // ── CLASSES ───────────────────────────────────────────────────
  async createClass() {
    const name = document.getElementById("className").value.trim();
    const level = document.getElementById("classLevel").value;
    const subject = document.getElementById("classSubject").value.trim();
    if (!name) { this.toast("Entrez un nom de classe", "error"); return; }
    try {
      await DB.createClass({ name, level, subject, teacherId: AUTH.currentUser.uid });
      this.closeModal("newClassModal");
      this.toast(`✅ Classe "${name}" créée !`, "success");
      await this.renderClasses();
      await this.refreshStats();
    } catch(e) { this.toast(e.message, "error"); }
  },

  async renderClasses() {
    const container = document.getElementById("classesList");
    const classes = await DB.getTeacherClasses(AUTH.currentUser.uid);
    if (!classes.length) { container.innerHTML = `<p class="empty">Aucune classe. Créez-en une pour partager avec vos élèves !</p>`; return; }
    container.innerHTML = classes.map(cls => `
      <div class="class-card" onclick="APP.openClassDetail('${cls.id}')">
        <div class="class-card-head">
          <div class="class-icon">🏫</div>
          <div>
            <div class="class-name">${cls.name}</div>
            <div class="class-meta">${cls.level} · ${cls.subject || ""}</div>
          </div>
        </div>
        <div class="class-stats">
          <span>👥 ${cls.students?.length || 0} élève(s)</span>
          <span class="class-code-pill">${cls.code}</span>
        </div>
      </div>`).join("");
  },

  async openClassDetail(classId) {
    const cls = await DB.getClass(classId);
    if (!cls) return;
    _currentClassDetail = cls;
    document.getElementById("classDetailTitle").textContent = `${cls.name} · ${cls.level}`;
    document.getElementById("classDetailCode").textContent = cls.code;

    // Load students
    const students = await Promise.all((cls.students || []).map(uid => DB.getUser(uid)));
    document.getElementById("studentsCount").textContent = students.length;
    const sList = document.getElementById("studentsList");
    if (!students.length) { sList.innerHTML = `<p class="empty">Aucun élève. Partagez le code <strong>${cls.code}</strong> avec vos élèves.</p>`; }
    else {
      sList.innerHTML = `<div class="students-table">
        <div class="st-head"><span>Nom</span><span>Identifiant</span><span>Rendus</span></div>
        ${students.map(s => s ? `<div class="st-row">
          <span><strong>${s.name}</strong></span>
          <span style="color:var(--c-text2);font-size:12px">${s.username||"—"}</span>
          <span><button class="btn-tool sm" onclick="APP.viewStudentWork('${s.uid}','${cls.id}')">Voir rendus</button></span>
        </div>` : "").join("")}
      </div>`;
    }

    // Load shared docs
    await this.renderSharedDocs(classId);

    // Populate assignment filter
    const filterSel = document.getElementById("assignFilterClass");
    if (filterSel && !filterSel.querySelector(`option[value="${classId}"]`)) {
      const opt = document.createElement("option");
      opt.value = classId; opt.textContent = cls.name;
      filterSel.appendChild(opt);
    }

    this.openModal("classDetailModal");
  },

  async renderSharedDocs(classId) {
    const container = document.getElementById("sharedDocsList");
    const shares = await DB.getClassShares(classId);
    if (!shares.length) { container.innerHTML = `<p class="empty">Aucun document partagé avec cette classe.</p>`; return; }
    const docs = await Promise.all(shares.map(s => DB.getDoc(s.docId)));
    container.innerHTML = shares.map((share, i) => {
      const doc = docs[i];
      if (!doc) return "";
      return `<div class="share-row">
        <span>${doc.title || doc.subject}</span>
        <span style="color:var(--c-text2);font-size:12px">${share.graded ? "📤 À rendre" : "👁 Lecture"} ${share.dueDate ? `· 📅 ${new Date(share.dueDate).toLocaleDateString("fr-FR")}` : ""}</span>
      </div>`;
    }).join("");
  },

  async openShareDocModal() {
    if (!_currentClassDetail) return;
    const docs = await DB.getTeacherDocs(AUTH.currentUser.uid);
    const sel = document.getElementById("shareDocSelect");
    sel.innerHTML = `<option value="">— Sélectionner un document —</option>` +
      docs.map(d => `<option value="${d.id}">${d.title || d.subject} (${d.type})</option>`).join("");
    this.openModal("shareDocModal");
  },

  async confirmShare() {
    const docId = document.getElementById("shareDocSelect").value;
    const dueDate = document.getElementById("shareDueDate").value;
    const graded = document.getElementById("shareGraded").checked;
    if (!docId) { this.toast("Sélectionnez un document", "error"); return; }
    try {
      await DB.shareDocToClass(docId, _currentClassDetail.id, {
        teacherId: AUTH.currentUser.uid,
        dueDate: dueDate || null,
        graded,
      });
      this.closeModal("shareDocModal");
      this.toast("✅ Document partagé !", "success");
      await this.renderSharedDocs(_currentClassDetail.id);
    } catch(e) { this.toast(e.message, "error"); }
  },

  async quickShare(docId) {
    const classes = await DB.getTeacherClasses(AUTH.currentUser.uid);
    if (!classes.length) { this.toast("Créez d'abord une classe", "error"); return; }
    _currentClassDetail = classes[0];
    document.getElementById("shareDocSelect").value = docId;
    this.openModal("shareDocModal");
  },

  // ── SUBMISSIONS ───────────────────────────────────────────────
  async renderSubmissions() {
    const container = document.getElementById("submissionsList");
    const classFilter = document.getElementById("assignFilterClass")?.value;
    const statusFilter = document.getElementById("assignFilterStatus")?.value;

    const filters = { teacherId: AUTH.currentUser.uid };
    if (classFilter) filters.classId = classFilter;

    let subs = await DB.getSubmissions(filters);
    if (statusFilter) subs = subs.filter(s => s.status === statusFilter);

    if (!subs.length) { container.innerHTML = `<p class="empty">Aucun rendu correspondant.</p>`; return; }

    container.innerHTML = `<div class="subs-table">
      <div class="subs-head"><span>Élève</span><span>Document</span><span>Rendu le</span><span>Score auto</span><span>Note</span><span>Action</span></div>
      ${subs.map(sub => `<div class="subs-row ${sub.status}">
        <span><strong>${sub.studentName||"—"}</strong></span>
        <span>${sub.docTitle||"—"}</span>
        <span style="color:var(--c-text2);font-size:12px">${new Date(sub.submittedAt).toLocaleDateString("fr-FR")}</span>
        <span>${sub.autoScore !== undefined ? `${sub.autoScore}/${sub.autoTotal}` : "—"}</span>
        <span>${sub.status==="graded" ? `<strong>${sub.score}/20</strong>` : `<span class="pending-pill">En attente</span>`}</span>
        <span>${sub.status==="pending"
          ? `<button class="btn-primary sm" onclick="APP.openGrade('${sub.id}')">✏️ Corriger</button>`
          : `<button class="btn-tool sm" onclick="APP.openGrade('${sub.id}')">Modifier</button>`}
        </span>
      </div>`).join("")}
    </div>`;
  },

  _currentSubId: null,

  async openGrade(subId) {
    this._currentSubId = subId;
    const subs = await DB.getSubmissions({ teacherId: AUTH.currentUser.uid });
    const sub = subs.find(s => s.id === subId);
    if (!sub) return;

    const doc = await DB.getDoc(sub.docId);
    const content = document.getElementById("gradeContent");

    // Show student answers
    if (doc && sub.answers && Object.keys(sub.answers).length) {
      const questions = doc.questions || [];
      content.innerHTML = `<h4 style="margin-bottom:12px;font-family:'Fraunces',serif">Réponses de ${sub.studentName}</h4>` +
        questions.map((q,i) => `<div style="padding:10px;background:var(--c-surface2);border-radius:8px;margin-bottom:8px;font-size:13px">
          <div style="color:var(--c-text2);font-size:11px;margin-bottom:4px">Q${i+1} · ${q.text.substring(0,80)}…</div>
          <div><strong>Réponse :</strong> ${sub.answers[i] || "—"}</div>
          <div style="color:var(--c-accent)"><strong>Corrigé :</strong> ${q.answer || "—"}</div>
        </div>`).join("");
    } else {
      content.innerHTML = `<p style="color:var(--c-text2)">Pas de réponses détaillées disponibles.</p>`;
    }

    document.getElementById("gradeScore").value = sub.score || sub.autoScore || "";
    document.getElementById("gradeComment").value = sub.comment || "";
    this.openModal("gradeModal");
  },

  async submitGrade() {
    const score = parseFloat(document.getElementById("gradeScore").value);
    const comment = document.getElementById("gradeComment").value.trim();
    if (isNaN(score) || score < 0 || score > 20) { this.toast("Note entre 0 et 20", "error"); return; }
    try {
      await DB.gradeSubmission(this._currentSubId, score, comment);
      this.closeModal("gradeModal");
      this.toast(`✅ Note ${score}/20 enregistrée !`, "success");
      await this.renderSubmissions();
      await this.refreshStats();
    } catch(e) { this.toast(e.message, "error"); }
  },

  async viewStudentWork(studentId, classId) {
    this.closeModal("classDetailModal");
    this.switchView("assignments");
    document.getElementById("assignFilterClass").value = classId;
    await this.renderSubmissions();
  },

  // ── MODALS ────────────────────────────────────────────────────
  bindModals() {
    document.querySelectorAll(".modal-x[data-close]").forEach(btn => {
      btn.addEventListener("click", () => this.closeModal(btn.dataset.close));
    });
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", e => {
        if (e.target === overlay) this.closeModal(overlay.id);
      });
    });
  },

  openModal(id) { document.getElementById(id)?.classList.add("open"); },
  closeModal(id) { document.getElementById(id)?.classList.remove("open"); },

  // ── CHAT ──────────────────────────────────────────────────────
  _chatHistory: [],

  bindChat() {
    document.getElementById("chatFab")?.addEventListener("click", () => {
      document.getElementById("chatPanel").classList.toggle("open");
    });
    document.getElementById("closeChat")?.addEventListener("click", () => {
      document.getElementById("chatPanel").classList.remove("open");
    });
    const input = document.getElementById("chatInput");
    input?.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendChat(); }
    });
    input?.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    document.getElementById("chatSend")?.addEventListener("click", () => this.sendChat());
  },

  async sendChat() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg) return;
    input.value = ""; input.style.height = "auto";
    this._appendChat("user", msg);
    this._chatHistory.push({ role: "user", content: msg });
    const typing = this._appendTyping();

    try {
      const cfg = window.EDUFLOW_CONFIG || {};
      const key = cfg.GROQ_API_KEY;
      if (!key || key === "YOUR_GROQ_API_KEY_HERE") throw new Error("Clé API Groq non configurée dans config.js");
      const res = await fetch(cfg.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: cfg.GROQ_MODEL || "llama-3.3-70b-versatile",
          max_tokens: 800, temperature: 0.75,
          messages: [
            { role: "system", content: "Tu es un assistant pédagogique expert pour enseignants francophones. Tu aides à concevoir des activités, des évaluations, des conseils de gestion de classe. Réponses concises et pratiques." },
            ...this._chatHistory.slice(-12),
          ],
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Désolé, réessayez.";
      this._chatHistory.push({ role: "assistant", content: reply });
      typing.remove();
      this._appendChat("assistant", reply);
    } catch(e) {
      typing.remove();
      this._appendChat("assistant", "⚙️ " + e.message);
    }
  },

  _appendChat(role, text) {
    const msgs = document.getElementById("chatMsgs");
    const div = document.createElement("div");
    div.className = `cmsg ${role}`;
    const formatted = text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
    div.innerHTML = `<div class="cbubble">${formatted}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  },

  _appendTyping() {
    const msgs = document.getElementById("chatMsgs");
    const div = document.createElement("div");
    div.className = "cmsg assistant";
    div.innerHTML = `<div class="cbubble"><span class="typing"><span></span><span></span><span></span></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  },

  // ── UTILS ─────────────────────────────────────────────────────
  showLoading(msg = "Chargement…") {
    document.getElementById("loadingText").textContent = msg;
    document.getElementById("loadingOverlay").classList.add("open");
  },
  hideLoading() { document.getElementById("loadingOverlay").classList.remove("open"); },

  toast(msg, type = "success") {
    const wrap = document.getElementById("toastWrap");
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },
};
