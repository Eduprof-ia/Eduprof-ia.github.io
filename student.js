/* ================================================================
   student.js — Espace Élève : voir docs, faire activités, rendre
   ================================================================ */

const STUDENT = {
  currentDoc: null,
  currentShareId: null,

  async init(user) {
    document.getElementById("studentGreet").textContent = user.name.split(" ")[0];
    document.getElementById("studentNameDisplay").textContent = user.name;
    document.getElementById("studentAvatar").textContent = user.name.charAt(0).toUpperCase();

    if (user.classId) {
      const cls = await DB.getClass(user.classId);
      if (cls) {
        document.getElementById("studentClassBadge").textContent = cls.name;
        document.getElementById("studentClassName").textContent = `Classe : ${cls.name} · ${cls.subject || ""}`;
      }
    }

    this.bindNav();
    await this.loadDocs(user);
    await this.loadAssignments(user);
    await this.loadDone(user);
  },

  bindNav() {
    document.querySelectorAll(".snav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".snav-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".sview").forEach(v => v.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`sview-${btn.dataset.sview}`)?.classList.add("active");
      });
    });
    document.getElementById("studentLogoutBtn")?.addEventListener("click", () => APP.logout());
  },

  async loadDocs(user) {
    const container = document.getElementById("studentDocs");
    if (!user.classId) { container.innerHTML = `<p class="empty">Vous n'êtes dans aucune classe.</p>`; return; }

    try {
      const shares = await DB.getStudentShares(user.classId);
      if (!shares.length) { container.innerHTML = `<p class="empty">Votre professeur n'a pas encore partagé de document.</p>`; return; }

      const docs = await Promise.all(shares.map(s => DB.getDoc(s.docId)));
      const valid = shares.map((s, i) => ({ share: s, doc: docs[i] })).filter(x => x.doc);

      container.innerHTML = valid.map(({ share, doc }) => `
        <div class="sdoc-card" onclick="STUDENT.openDoc('${share.id}','${doc.id}')">
          <div class="sdoc-icon">${this._typeIcon(doc.type)}</div>
          <div class="sdoc-info">
            <div class="sdoc-title">${doc.title || doc.subject || "Document"}</div>
            <div class="sdoc-meta">${this._typeLabel(doc.type)} · ${doc.level || ""}
              ${share.dueDate ? ` · 📅 Rendu : ${new Date(share.dueDate).toLocaleDateString("fr-FR")}` : ""}
            </div>
          </div>
          <div class="sdoc-badge ${share.graded ? "graded" : "view"}">${share.graded ? "📤 À rendre" : "👁 Voir"}</div>
        </div>`).join("");
    } catch(e) { container.innerHTML = `<p class="empty">Erreur de chargement : ${e.message}</p>`; }
  },

  async loadAssignments(user) {
    const container = document.getElementById("studentAssignments");
    if (!user.classId) { container.innerHTML = `<p class="empty">Aucune classe.</p>`; return; }

    try {
      const shares = await DB.getStudentShares(user.classId);
      const graded = shares.filter(s => s.graded);
      if (!graded.length) { container.innerHTML = `<p class="empty">Aucun devoir assigné.</p>`; return; }

      // Check which are already submitted
      const subs = await DB.getSubmissions({ studentId: user.uid });
      const submittedShareIds = new Set(subs.map(s => s.shareId));

      const docs = await Promise.all(graded.map(s => DB.getDoc(s.docId)));
      container.innerHTML = graded.map((share, i) => {
        const doc = docs[i];
        if (!doc) return "";
        const done = submittedShareIds.has(share.id);
        return `<div class="assign-card ${done ? "done" : ""}">
          <div class="assign-icon">${this._typeIcon(doc.type)}</div>
          <div class="assign-info">
            <div class="assign-title">${doc.title || doc.subject}</div>
            <div class="assign-meta">${this._typeLabel(doc.type)}
              ${share.dueDate ? ` · 📅 ${new Date(share.dueDate).toLocaleDateString("fr-FR")}` : ""}
            </div>
          </div>
          ${done
            ? `<span class="badge-done">✅ Rendu</span>`
            : `<button class="btn-primary sm" onclick="STUDENT.openDoc('${share.id}','${doc.id}')">Commencer</button>`}
        </div>`;
      }).join("");
    } catch(e) { container.innerHTML = `<p class="empty">Erreur : ${e.message}</p>`; }
  },

  async loadDone(user) {
    const container = document.getElementById("studentDone");
    try {
      const subs = await DB.getSubmissions({ studentId: user.uid });
      if (!subs.length) { container.innerHTML = `<p class="empty">Aucun travail rendu.</p>`; return; }

      container.innerHTML = subs.map(sub => `
        <div class="done-card">
          <div class="done-info">
            <div class="done-title">${sub.docTitle || "Document"}</div>
            <div class="done-meta">Rendu le ${new Date(sub.submittedAt).toLocaleDateString("fr-FR", {day:"numeric",month:"long"})}</div>
          </div>
          <div class="done-grade">
            ${sub.status === "graded"
              ? `<span class="grade-badge">${sub.score}/20</span>${sub.comment ? `<div class="grade-comment">"${sub.comment}"</div>` : ""}`
              : `<span class="pending-badge">En attente de correction</span>`}
          </div>
        </div>`).join("");
    } catch(e) { container.innerHTML = `<p class="empty">Erreur : ${e.message}</p>`; }
  },

  async openDoc(shareId, docId) {
    const doc = await DB.getDoc(docId);
    if (!doc) { APP.toast("Document introuvable", "error"); return; }

    this.currentDoc = doc;
    this.currentShareId = shareId;

    // Get share info to check if graded
    const shares = await DB.getStudentShares(AUTH.currentUser.classId);
    const share = shares.find(s => s.id === shareId);

    document.getElementById("studentDocTitle").textContent = doc.title || doc.subject || "Document";
    const content = document.getElementById("studentDocContent");
    content.innerHTML = `<div id="studentDocActivity"></div>`;

    ACTIVITIES.renderDocForStudent(doc, "studentDocActivity");

    const foot = document.getElementById("studentDocFoot");
    if (share?.graded) {
      // Check if already submitted
      const subs = await DB.getSubmissions({ studentId: AUTH.currentUser.uid });
      const already = subs.find(s => s.shareId === shareId);
      if (already) {
        foot.style.display = "flex";
        foot.innerHTML = `<div style="color:var(--c-text2);font-size:13px">✅ Déjà rendu${already.status==="graded" ? ` · Note : ${already.score}/20` : " · En attente de correction"}</div>`;
      } else {
        foot.style.display = "flex";
        document.getElementById("submitWorkBtn").onclick = () => this.submitWork(share, doc);
      }
    } else {
      foot.style.display = "none";
    }

    document.getElementById("studentDocModal").classList.add("open");
  },

  async submitWork(share, doc) {
    const answers = ACTIVITIES.collectAnswers(doc);
    const { score, total } = ACTIVITIES.autoGrade(doc, answers);

    const sub = {
      shareId: share.id,
      docId: doc.id,
      docTitle: doc.title || doc.subject,
      docType: doc.type,
      studentId: AUTH.currentUser.uid,
      studentName: AUTH.currentUser.name,
      classId: AUTH.currentUser.classId,
      teacherId: share.teacherId || doc.teacherId,
      answers,
      autoScore: score,
      autoTotal: total,
    };

    try {
      await DB.submitWork(sub);
      document.getElementById("studentDocModal").classList.remove("open");
      APP.toast("📤 Travail rendu avec succès !", "success");
      await this.loadAssignments(AUTH.currentUser);
      await this.loadDone(AUTH.currentUser);
    } catch(e) { APP.toast("Erreur : " + e.message, "error"); }
  },

  _typeIcon: (t) => ({ slides:"🖥", exercise:"✏️", crossword:"🔤", wordsearch:"🔍", matching:"🔗", evaluation:"📝" }[t] || "📄"),
  _typeLabel: (t) => ({ slides:"Diaporama", exercise:"Exercice", crossword:"Mots croisés", wordsearch:"Mots mêlés", matching:"Relier", evaluation:"Évaluation" }[t] || t),
};
