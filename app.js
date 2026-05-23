/* ================================================================
   EDUFLOW — app.js
   Logique principale : navigation, génération IA, PDF, partage
   ================================================================ */

"use strict";

// ── STATE ────────────────────────────────────────────────────────
const STATE = {
  apiKey: "",
  teacherName: "",
  currentView: "dashboard",
  items: JSON.parse(localStorage.getItem("eduflow_items") || "[]"),
  shareLinks: JSON.parse(localStorage.getItem("eduflow_shares") || "[]"),
  presSlides: [],
  currentSlide: 0,
  presTheme: "modern",
  currentContent: { type: null, data: null },
};

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  initNavigation();
  initDashboard();
  initEvaluation();
  initDevoir();
  initPresentation();
  initLibrary();
  initShare();
  initApiModal();
  initShareModal();
  initFullscreen();
  initMobileMenu();
  initChat();
  updateStats();
  renderRecentList();
  renderLibrary();
  renderShareList();

  // Date par défaut pour devoirs
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dd = document.getElementById("devoirDate");
  if (dd) dd.value = nextWeek.toISOString().split("T")[0];
});

// ── CONFIG ───────────────────────────────────────────────────────
function loadConfig() {
  const saved = localStorage.getItem("eduflow_config");
  if (saved) {
    const cfg = JSON.parse(saved);
    STATE.apiKey = cfg.apiKey || "";
    STATE.teacherName = cfg.teacherName || "";
  }
  // Override depuis api_config.js si présent
  if (typeof API_CONFIG !== "undefined") {
    if (!STATE.apiKey && API_CONFIG.GROK_API_KEY !== "YOUR_GROK_API_KEY_HERE") {
      STATE.apiKey = API_CONFIG.GROK_API_KEY;
    }
  }
  updateApiStatus();
  if (STATE.teacherName) {
    const el = document.getElementById("teacherName");
    if (el) el.textContent = STATE.teacherName;
  }
}

function saveConfig(key, name) {
  STATE.apiKey = key;
  STATE.teacherName = name;
  localStorage.setItem("eduflow_config", JSON.stringify({ apiKey: key, teacherName: name }));
  updateApiStatus();
  if (name) {
    const el = document.getElementById("teacherName");
    if (el) el.textContent = name;
  }
}

function updateApiStatus() {
  const dot = document.getElementById("apiStatus")?.querySelector(".status-dot");
  const txt = document.getElementById("apiStatus")?.querySelector(".status-text");
  if (!dot || !txt) return;
  if (STATE.apiKey && STATE.apiKey !== "YOUR_GROK_API_KEY_HERE") {
    dot.className = "status-dot connected";
    txt.textContent = "API connectée";
  } else {
    dot.className = "status-dot";
    txt.textContent = "API non configurée";
  }
}

// ── NAVIGATION ───────────────────────────────────────────────────
function initNavigation() {
  document.querySelectorAll(".nav-btn, .quick-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view) switchView(view);
    });
  });
}

function switchView(view) {
  STATE.currentView = view;
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.add("active");
  const btn = document.querySelector(`.nav-btn[data-view="${view}"]`);
  if (btn) btn.classList.add("active");
  // Close mobile sidebar
  document.getElementById("sidebar")?.classList.remove("open");
  if (view === "library") renderLibrary();
  if (view === "share") renderShareList();
}

// ── MOBILE MENU ──────────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  hamburger?.addEventListener("click", () => sidebar?.classList.toggle("open"));
  const mobileNew = document.getElementById("mobileNewBtn");
  mobileNew?.addEventListener("click", () => switchView("evaluation"));
}

// ── API CALL ─────────────────────────────────────────────────────
async function callGrokAPI(systemPrompt, userPrompt) {
  const cfg = typeof API_CONFIG !== "undefined" ? API_CONFIG : {};
  const endpoint = cfg.GROK_ENDPOINT || "https://api.x.ai/v1/chat/completions";
  const model = cfg.GROK_MODEL || "grok-3";
  const key = STATE.apiKey;

  if (!key || key === "YOUR_GROK_API_KEY_HERE") {
    throw new Error("Clé API Grok non configurée. Cliquez sur '⚙️ Configurer l'API'.");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: cfg.MAX_TOKENS || 4096,
      temperature: cfg.TEMPERATURE || 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur API : ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── EVALUATION ───────────────────────────────────────────────────
function initEvaluation() {
  const slider = document.getElementById("evalQNum");
  const label = document.getElementById("evalQNumLabel");
  slider?.addEventListener("input", () => (label.textContent = slider.value));

  document.getElementById("generateEvalBtn")?.addEventListener("click", generateEvaluation);
  document.getElementById("saveEvalBtn")?.addEventListener("click", () => saveCurrentContent("evaluation"));
  document.getElementById("exportEvalPdfBtn")?.addEventListener("click", () => exportToPDF("evalPreviewContent", "evaluation"));
  document.getElementById("shareEvalBtn")?.addEventListener("click", () => shareContent("evaluation"));
}

async function generateEvaluation() {
  const subject = document.getElementById("evalSubject").value.trim();
  if (!subject) { showToast("Veuillez entrer un sujet", "error"); return; }

  const level = document.getElementById("evalLevel").value;
  const qNum = document.getElementById("evalQNum").value;
  const duration = document.getElementById("evalDuration").value;
  const teacher = document.getElementById("evalTeacher").value || STATE.teacherName || "Enseignant";
  const instructions = document.getElementById("evalInstructions").value;
  const types = [];
  if (document.getElementById("typeQCM").checked) types.push("QCM (4 choix, une bonne réponse)");
  if (document.getElementById("typeVF").checked) types.push("Vrai/Faux");
  if (document.getElementById("typeOpen").checked) types.push("Questions ouvertes");
  if (document.getElementById("typeCalc").checked) types.push("Calculs / Problèmes");
  if (!types.length) { showToast("Sélectionnez au moins un type de question", "error"); return; }

  showLoading("Génération de l'évaluation…");

  const sys = `Tu es un enseignant expert qui crée des évaluations pédagogiques en français. 
Génère du contenu structuré en Markdown. Sois précis, pédagogique et adapté au niveau demandé.
Inclure : en-tête avec infos, questions numérotées, barème, corrigé en fin (séparé par ---).`;

  const prompt = `Crée une évaluation sur : "${subject}"
Niveau : ${level} | Durée : ${duration} | Questions : ${qNum}
Types : ${types.join(", ")}
Enseignant : ${teacher}
${instructions ? "Instructions spécifiques : " + instructions : ""}

Format Markdown attendu :
# [Titre de l'évaluation]
**Matière:** ... | **Niveau:** ... | **Durée:** ... | **Enseignant:** ...
**Nom :** _________________________  **Classe :** _______  **Date :** __________

---
## Questions (xx points)

**Question 1 — (x pts)**  
[énoncé]
A) ... B) ... C) ... D) ... (si QCM)

[continuer pour toutes les questions]

---
## ✅ Corrigé (pour l'enseignant)
[corrigé détaillé de chaque question]`;

  try {
    const result = await callGrokAPI(sys, prompt);
    renderMarkdownPreview("evalPreviewContent", result);
    STATE.currentContent = { type: "evaluation", data: result, subject, level };
    enablePreviewActions("eval");
    showToast("✅ Évaluation générée !", "success");
  } catch (e) {
    showToast(e.message, "error");
  } finally {
    hideLoading();
  }
}

// ── DEVOIR ───────────────────────────────────────────────────────
function initDevoir() {
  document.getElementById("generateDevoirBtn")?.addEventListener("click", generateDevoir);
  document.getElementById("saveDevoirBtn")?.addEventListener("click", () => saveCurrentContent("devoir"));
  document.getElementById("exportDevoirPdfBtn")?.addEventListener("click", () => exportToPDF("devoirPreviewContent", "devoir"));
  document.getElementById("shareDevoirBtn")?.addEventListener("click", () => shareContent("devoir"));
}

async function generateDevoir() {
  const subject = document.getElementById("devoirSubject").value.trim();
  if (!subject) { showToast("Veuillez entrer un sujet", "error"); return; }

  const level = document.getElementById("devoirLevel").value;
  const type = document.getElementById("devoirType").value;
  const duration = document.getElementById("devoirDuration").value;
  const date = document.getElementById("devoirDate").value;
  const teacher = document.getElementById("devoirTeacher").value || STATE.teacherName || "Enseignant";
  const objectives = document.getElementById("devoirObjectives").value;

  showLoading("Création du devoir…");

  const sys = `Tu es un enseignant expert qui crée des devoirs maison pédagogiques en français. 
Génère du contenu structuré, clair, motivant et adapté au niveau. Format Markdown.`;

  const formattedDate = date ? new Date(date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "À préciser";

  const prompt = `Crée un devoir maison sur : "${subject}"
Niveau : ${level} | Type : ${type} | Durée estimée : ${duration}
Date de rendu : ${formattedDate} | Enseignant : ${teacher}
${objectives ? "Objectifs : " + objectives : ""}

Inclure : titre accrocheur, consignes claires, exercices progressifs, critères de réussite, ressources suggérées.`;

  try {
    const result = await callGrokAPI(sys, prompt);
    renderMarkdownPreview("devoirPreviewContent", result);
    STATE.currentContent = { type: "devoir", data: result, subject, level };
    enablePreviewActions("devoir");
    showToast("✅ Devoir créé !", "success");
  } catch (e) {
    showToast(e.message, "error");
  } finally {
    hideLoading();
  }
}

// ── PRESENTATION ─────────────────────────────────────────────────
function initPresentation() {
  const slider = document.getElementById("presSlideNum");
  const label = document.getElementById("presSlideNumLabel");
  slider?.addEventListener("input", () => (label.textContent = slider.value));

  document.querySelectorAll(".theme-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme-opt").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      STATE.presTheme = btn.dataset.theme;
    });
  });

  document.getElementById("generatePresBtn")?.addEventListener("click", generatePresentation);
  document.getElementById("savePresBtn")?.addEventListener("click", () => saveCurrentContent("presentation"));
  document.getElementById("prevSlideBtn")?.addEventListener("click", () => navigateSlide(-1));
  document.getElementById("nextSlideBtn")?.addEventListener("click", () => navigateSlide(1));
  document.getElementById("fullscreenBtn")?.addEventListener("click", openFullscreen);
  document.getElementById("exportPresPdfBtn")?.addEventListener("click", exportPresAsPDF);
  document.getElementById("sharePresBtn")?.addEventListener("click", () => shareContent("presentation"));

  document.addEventListener("keydown", (e) => {
    if (STATE.currentView === "presentation") {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") navigateSlide(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") navigateSlide(-1);
    }
  });
}

async function generatePresentation() {
  const subject = document.getElementById("presSubject").value.trim();
  if (!subject) { showToast("Veuillez entrer un sujet", "error"); return; }

  const level = document.getElementById("presLevel").value;
  const slideNum = document.getElementById("presSlideNum").value;
  const keypoints = document.getElementById("presKeypoints").value;
  const teacher = document.getElementById("presTeacher").value || STATE.teacherName || "Enseignant";

  showLoading("Création des diapositives…");

  const sys = `Tu es un enseignant expert qui crée des présentations pédagogiques.
Génère EXACTEMENT un tableau JSON valide de diapositives. Rien d'autre, juste le JSON.
Format : [{"title":"...","badge":"...","content":"..."}, ...]
- title : titre court et accrocheur
- badge : catégorie (ex: "Introduction", "Point clé", "Exemple", "Conclusion")
- content : contenu en HTML simple (balises p, ul/li, strong autorisées)
Contenu en français, adapté au niveau ${level}.`;

  const prompt = `Sujet : "${subject}" | Niveau : ${level} | ${slideNum} diapositives
Enseignant : ${teacher}
${keypoints ? "Points clés : " + keypoints : ""}
Génère exactement ${slideNum} diapositives JSON.`;

  try {
    const result = await callGrokAPI(sys, prompt);
    const clean = result.replace(/```json|```/g, "").trim();
    const slides = JSON.parse(clean);
    STATE.presSlides = slides;
    STATE.currentContent = { type: "presentation", data: slides, subject, level };
    renderSlides(slides, STATE.presTheme);
    enablePreviewActions("pres");
    showToast(`✅ ${slides.length} diapositives créées !`, "success");
  } catch (e) {
    showToast("Erreur de génération : " + e.message, "error");
  } finally {
    hideLoading();
  }
}

function renderSlides(slides, theme) {
  const container = document.getElementById("slidesContainer");
  container.innerHTML = "";
  STATE.currentSlide = 0;

  slides.forEach((slide, i) => {
    const el = document.createElement("div");
    el.className = `slide theme-${theme}${i === 0 ? " active" : ""}`;
    el.innerHTML = `
      <div class="slide-deco"></div>
      <div class="slide-badge">${slide.badge || ""}</div>
      <h2 class="slide-title">${slide.title}</h2>
      <div class="slide-body">${slide.content}</div>
      <div class="slide-number">${i + 1} / ${slides.length}</div>`;
    container.appendChild(el);
  });

  updateSlideCounter();
}

function navigateSlide(dir) {
  const slides = document.querySelectorAll("#slidesContainer .slide");
  if (!slides.length) return;
  slides[STATE.currentSlide].classList.remove("active");
  STATE.currentSlide = Math.max(0, Math.min(slides.length - 1, STATE.currentSlide + dir));
  slides[STATE.currentSlide].classList.add("active");
  updateSlideCounter();
  // Sync fullscreen
  syncFullscreenSlide();
}

function updateSlideCounter() {
  const total = document.querySelectorAll("#slidesContainer .slide").length;
  const el = document.getElementById("slideCounter");
  if (el) el.textContent = total ? `${STATE.currentSlide + 1}/${total}` : "0/0";
}

function openFullscreen() {
  if (!STATE.presSlides.length) return;
  const overlay = document.getElementById("fullscreenOverlay");
  const fsSlide = document.getElementById("fsSlide");
  fsSlide.innerHTML = "";
  STATE.presSlides.forEach((slide, i) => {
    const el = document.createElement("div");
    el.className = `slide theme-${STATE.presTheme}${i === STATE.currentSlide ? " active" : ""}`;
    el.innerHTML = `
      <div class="slide-deco"></div>
      <div class="slide-badge">${slide.badge || ""}</div>
      <h2 class="slide-title">${slide.title}</h2>
      <div class="slide-body">${slide.content}</div>
      <div class="slide-number">${i + 1} / ${STATE.presSlides.length}</div>`;
    fsSlide.appendChild(el);
  });
  updateFsCounter();
  overlay.classList.add("open");
}

function syncFullscreenSlide() {
  const fsSlides = document.querySelectorAll("#fsSlide .slide");
  fsSlides.forEach((s, i) => s.classList.toggle("active", i === STATE.currentSlide));
  updateFsCounter();
}

function updateFsCounter() {
  const el = document.getElementById("fsCounter");
  if (el) el.textContent = `${STATE.currentSlide + 1}/${STATE.presSlides.length}`;
}

function initFullscreen() {
  document.getElementById("fsClose")?.addEventListener("click", () => {
    document.getElementById("fullscreenOverlay")?.classList.remove("open");
  });
  document.getElementById("fsPrev")?.addEventListener("click", () => navigateSlide(-1));
  document.getElementById("fsNext")?.addEventListener("click", () => navigateSlide(1));
  document.addEventListener("keydown", (e) => {
    const fs = document.getElementById("fullscreenOverlay");
    if (!fs?.classList.contains("open")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") navigateSlide(1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") navigateSlide(-1);
    if (e.key === "Escape") fs.classList.remove("open");
  });
}

async function exportPresAsPDF() {
  if (!STATE.presSlides.length) return;
  showLoading("Export PDF de la présentation…");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const slides = document.querySelectorAll("#slidesContainer .slide");
  const original = STATE.currentSlide;

  for (let i = 0; i < slides.length; i++) {
    slides.forEach((s, j) => s.classList.toggle("active", j === i));
    await new Promise((r) => setTimeout(r, 100));
    const canvas = await html2canvas(slides[i], { scale: 2, useCORS: true, backgroundColor: null });
    const img = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage();
    pdf.addImage(img, "PNG", 0, 0, 297, 210);
  }

  slides.forEach((s, j) => s.classList.toggle("active", j === original));
  STATE.currentSlide = original;
  pdf.save(`presentation-${Date.now()}.pdf`);
  hideLoading();
  showToast("✅ PDF exporté !", "success");
}

// ── PDF EXPORT ───────────────────────────────────────────────────
async function exportToPDF(contentId, type) {
  const el = document.getElementById(contentId);
  if (!el || !el.textContent.trim() || el.querySelector(".preview-placeholder")) {
    showToast("Rien à exporter", "error"); return;
  }
  showLoading("Export PDF en cours…");
  try {
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#1a1815" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    let y = 0;
    const pageH = pdf.internal.pageSize.getHeight();
    while (y < h) {
      if (y > 0) pdf.addPage();
      pdf.addImage(img, "PNG", 0, -y, w, h);
      y += pageH;
    }
    pdf.save(`eduflow-${type}-${Date.now()}.pdf`);
    showToast("✅ PDF exporté !", "success");
  } catch (e) {
    showToast("Erreur export : " + e.message, "error");
  } finally {
    hideLoading();
  }
}

// ── SAVE & LIBRARY ───────────────────────────────────────────────
function saveCurrentContent(type) {
  if (!STATE.currentContent.data) { showToast("Rien à sauvegarder", "error"); return; }
  const item = {
    id: Date.now().toString(),
    type,
    subject: STATE.currentContent.subject || "Sans titre",
    level: STATE.currentContent.level || "",
    data: STATE.currentContent.data,
    createdAt: new Date().toISOString(),
  };
  STATE.items.unshift(item);
  localStorage.setItem("eduflow_items", JSON.stringify(STATE.items));
  updateStats();
  renderRecentList();
  showToast("✅ Sauvegardé dans la bibliothèque !", "success");
}

function initLibrary() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderLibrary(btn.dataset.filter);
    });
  });
}

function renderLibrary(filter = "all") {
  const grid = document.getElementById("libraryGrid");
  if (!grid) return;
  const items = filter === "all" ? STATE.items : STATE.items.filter((i) => i.type === filter);
  if (!items.length) {
    grid.innerHTML = `<p class="empty-state">Aucun élément${filter !== "all" ? " dans cette catégorie" : ""}.</p>`;
    return;
  }
  grid.innerHTML = items
    .map((item) => `
    <div class="library-card" data-id="${item.id}">
      <div class="library-card-header">
        <div class="library-card-type" style="background:${typeColor(item.type)}">${typeEmoji(item.type)}</div>
        <div>
          <div class="library-card-title">${item.subject}</div>
          <div class="library-card-meta">${typeLabel(item.type)} · ${item.level} · ${formatDate(item.createdAt)}</div>
        </div>
      </div>
      <div class="library-card-actions">
        <button class="btn-tool" onclick="openItem('${item.id}')">👁 Voir</button>
        <button class="btn-tool" onclick="exportItemPDF('${item.id}')">📄 PDF</button>
        <button class="btn-tool" onclick="shareItem('${item.id}')">🔗 Partager</button>
        <button class="btn-danger" onclick="deleteItem('${item.id}')">🗑</button>
      </div>
    </div>`)
    .join("");
}

function openItem(id) {
  const item = STATE.items.find((i) => i.id === id);
  if (!item) return;
  switchView(item.type);
  STATE.currentContent = { type: item.type, data: item.data, subject: item.subject, level: item.level };
  if (item.type === "presentation") {
    STATE.presSlides = item.data;
    renderSlides(item.data, STATE.presTheme);
    enablePreviewActions("pres");
  } else {
    const contentId = item.type === "evaluation" ? "evalPreviewContent" : "devoirPreviewContent";
    renderMarkdownPreview(contentId, item.data);
    enablePreviewActions(item.type === "evaluation" ? "eval" : "devoir");
  }
}

function exportItemPDF(id) {
  const item = STATE.items.find((i) => i.id === id);
  if (!item) return;
  openItem(id);
  setTimeout(() => {
    if (item.type === "presentation") exportPresAsPDF();
    else exportToPDF(item.type === "evaluation" ? "evalPreviewContent" : "devoirPreviewContent", item.type);
  }, 500);
}

function deleteItem(id) {
  STATE.items = STATE.items.filter((i) => i.id !== id);
  localStorage.setItem("eduflow_items", JSON.stringify(STATE.items));
  STATE.shareLinks = STATE.shareLinks.filter((s) => s.itemId !== id);
  localStorage.setItem("eduflow_shares", JSON.stringify(STATE.shareLinks));
  updateStats();
  renderLibrary();
  renderRecentList();
  renderShareList();
  showToast("Élément supprimé", "success");
}

// ── SHARE ────────────────────────────────────────────────────────
function initShare() {}

function shareContent(type) {
  if (!STATE.currentContent.data) { showToast("Générez d'abord du contenu", "error"); return; }
  const id = Date.now().toString(36);
  const shareData = {
    id,
    itemId: null,
    type,
    subject: STATE.currentContent.subject,
    data: STATE.currentContent.data,
    createdAt: new Date().toISOString(),
  };
  STATE.shareLinks.unshift(shareData);
  localStorage.setItem("eduflow_shares", JSON.stringify(STATE.shareLinks));
  updateStats();
  renderShareList();
  openShareModal(shareData);
}

function shareItem(id) {
  const item = STATE.items.find((i) => i.id === id);
  if (!item) return;
  const shareId = Date.now().toString(36);
  const shareData = {
    id: shareId,
    itemId: id,
    type: item.type,
    subject: item.subject,
    data: item.data,
    createdAt: new Date().toISOString(),
  };
  STATE.shareLinks.unshift(shareData);
  localStorage.setItem("eduflow_shares", JSON.stringify(STATE.shareLinks));
  updateStats();
  renderShareList();
  openShareModal(shareData);
}

function renderShareList() {
  const list = document.getElementById("shareList");
  if (!list) return;
  if (!STATE.shareLinks.length) {
    list.innerHTML = `<p class="empty-state">Aucun lien de partage. Sauvegardez du contenu et partagez-le.</p>`;
    return;
  }
  list.innerHTML = STATE.shareLinks
    .map((s) => {
      const url = buildShareURL(s.id);
      return `
    <div class="share-item">
      <div style="font-size:20px">${typeEmoji(s.type)}</div>
      <div class="share-item-info">
        <div class="share-item-title">${s.subject} <span style="color:var(--c-text3);font-size:11px">${typeLabel(s.type)}</span></div>
        <div class="share-item-link">${url}</div>
      </div>
      <div class="share-item-actions">
        <button class="btn-tool" onclick='openShareModal(${JSON.stringify(s)})'>🔗 Lien</button>
        <button class="btn-tool" onclick="previewStudentView('${s.id}')">👁 Élève</button>
        <button class="btn-danger" onclick="deleteShare('${s.id}')">🗑</button>
      </div>
    </div>`;
    })
    .join("");
}

function buildShareURL(id) {
  const base =
    typeof API_CONFIG !== "undefined" && API_CONFIG.BASE_SHARE_URL
      ? API_CONFIG.BASE_SHARE_URL
      : window.location.origin + window.location.pathname;
  return `${base}?view=eleve&doc=${id}`;
}

function deleteShare(id) {
  STATE.shareLinks = STATE.shareLinks.filter((s) => s.id !== id);
  localStorage.setItem("eduflow_shares", JSON.stringify(STATE.shareLinks));
  updateStats();
  renderShareList();
  showToast("Lien supprimé", "success");
}

function previewStudentView(id) {
  const share = STATE.shareLinks.find((s) => s.id === id);
  if (!share) return;
  switchView("share");
  const mock = document.getElementById("studentPreviewMock");
  if (!mock) return;
  let html = "";
  if (share.type === "presentation" && Array.isArray(share.data)) {
    html = share.data
      .map(
        (s, i) => `<div style="margin-bottom:20px;padding:16px;background:#f0ead8;border-radius:8px;border-left:4px solid #e8a838">
      <div style="font-size:11px;color:#8b8270;text-transform:uppercase;letter-spacing:.06em">${s.badge}</div>
      <h3 style="font-family:'Fraunces',serif;font-size:17px;margin:6px 0">${s.title}</h3>
      <div style="font-size:13px;color:#3a3020">${s.content}</div>
    </div>`
      )
      .join("");
  } else {
    html = `<div style="font-size:14px;line-height:1.8;color:#1a1208">${marked.parse(String(share.data))}</div>`;
  }
  mock.querySelector(".student-content").innerHTML = html;
}

// ── MODALS ───────────────────────────────────────────────────────
function initApiModal() {
  document.getElementById("configApiBtn")?.addEventListener("click", () => {
    const modal = document.getElementById("apiModal");
    document.getElementById("apiKeyInput").value = STATE.apiKey;
    document.getElementById("teacherNameInput").value = STATE.teacherName;
    modal?.classList.add("open");
  });
  document.getElementById("closeApiModal")?.addEventListener("click", () => document.getElementById("apiModal")?.classList.remove("open"));
  document.getElementById("cancelApiModal")?.addEventListener("click", () => document.getElementById("apiModal")?.classList.remove("open"));
  document.getElementById("toggleApiKey")?.addEventListener("click", () => {
    const inp = document.getElementById("apiKeyInput");
    inp.type = inp.type === "password" ? "text" : "password";
  });
  document.getElementById("saveApiConfig")?.addEventListener("click", () => {
    const key = document.getElementById("apiKeyInput").value.trim();
    const name = document.getElementById("teacherNameInput").value.trim();
    saveConfig(key, name);
    document.getElementById("apiModal")?.classList.remove("open");
    showToast("✅ Configuration enregistrée !", "success");
  });
  document.getElementById("apiModal")?.addEventListener("click", (e) => {
    if (e.target.id === "apiModal") document.getElementById("apiModal")?.classList.remove("open");
  });
}

function initShareModal() {
  document.getElementById("closeShareModal")?.addEventListener("click", () => document.getElementById("shareLinkModal")?.classList.remove("open"));
  document.getElementById("copyShareLink")?.addEventListener("click", () => {
    const inp = document.getElementById("shareLinkInput");
    navigator.clipboard.writeText(inp.value).then(() => showToast("✅ Lien copié !", "success"));
  });
}

function openShareModal(shareData) {
  const url = buildShareURL(shareData.id);
  document.getElementById("shareLinkInput").value = url;
  document.getElementById("shareLinkModal")?.classList.add("open");
}

// ── CHAT IA ──────────────────────────────────────────────────────
function initChat() {
  // Build chat UI
  const chatHTML = `
  <div class="chat-fab" id="chatFab" title="Assistant IA EduFlow">
    <svg viewBox="0 0 24 24" width="24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" fill="none" stroke-width="2"/></svg>
    <span class="chat-badge" id="chatBadge" style="display:none">1</span>
  </div>
  <div class="chat-panel" id="chatPanel">
    <div class="chat-header">
      <div class="chat-header-info">
        <div class="chat-avatar">🤖</div>
        <div>
          <div class="chat-name">Assistant EduFlow</div>
          <div class="chat-status" id="chatStatusLabel">Propulsé par Grok IA</div>
        </div>
      </div>
      <div class="chat-header-actions">
        <button class="chat-action-btn" id="clearChatBtn" title="Effacer la conversation">🗑</button>
        <button class="chat-action-btn" id="closeChatBtn" title="Fermer">✕</button>
      </div>
    </div>
    <div class="chat-suggestions" id="chatSuggestions">
      <button class="chat-chip" data-msg="Comment créer une évaluation efficace pour le lycée ?">💡 Conseils évaluation</button>
      <button class="chat-chip" data-msg="Quelles sont les meilleures pratiques pour un devoir différencié ?">📚 Différenciation</button>
      <button class="chat-chip" data-msg="Comment rendre une présentation plus engageante pour les élèves ?">🎯 Engager les élèves</button>
      <button class="chat-chip" data-msg="Suggère des activités pour la gestion de classe">🏫 Gestion de classe</button>
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="chat-msg assistant">
        <div class="chat-bubble">
          👋 Bonjour ! Je suis votre assistant pédagogique. Je peux vous aider à :<br><br>
          • <strong>Améliorer vos évaluations</strong> et devoirs<br>
          • <strong>Donner des conseils pédagogiques</strong><br>
          • <strong>Suggérer des activités</strong> adaptées<br>
          • <strong>Répondre à vos questions</strong> sur l'enseignement<br><br>
          Comment puis-je vous aider ?
        </div>
        <div class="chat-time">Maintenant</div>
      </div>
    </div>
    <div class="chat-input-area">
      <textarea class="chat-input" id="chatInput" placeholder="Posez votre question…" rows="1"></textarea>
      <button class="chat-send" id="chatSend">
        <svg viewBox="0 0 24 24" width="18"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>`;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = chatHTML;
  document.body.appendChild(wrapper);

  // Inject chat styles
  const style = document.createElement("style");
  style.textContent = chatCSS();
  document.head.appendChild(style);

  // Events
  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  fab?.addEventListener("click", () => {
    panel.classList.toggle("open");
    document.getElementById("chatBadge").style.display = "none";
    if (panel.classList.contains("open")) document.getElementById("chatInput").focus();
  });
  document.getElementById("closeChatBtn")?.addEventListener("click", () => panel.classList.remove("open"));
  document.getElementById("clearChatBtn")?.addEventListener("click", clearChat);

  const input = document.getElementById("chatInput");
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  input?.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });
  document.getElementById("chatSend")?.addEventListener("click", sendChatMessage);

  document.querySelectorAll(".chat-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.getElementById("chatInput").value = chip.dataset.msg;
      sendChatMessage();
      document.getElementById("chatSuggestions").style.display = "none";
    });
  });
}

const CHAT_HISTORY = [];

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;
  input.value = "";
  input.style.height = "auto";

  appendChatMessage("user", msg);
  CHAT_HISTORY.push({ role: "user", content: msg });

  const typing = appendChatTyping();

  try {
    const sys = `Tu es un assistant pédagogique expert pour enseignants francophones. 
Tu t'appelles "Assistant EduFlow". Tu aides les enseignants avec :
- La conception d'évaluations, devoirs et présentations
- Les stratégies pédagogiques et didactiques
- La différenciation et l'inclusion
- La gestion de classe et la motivation des élèves
- Les outils numériques éducatifs
Réponds de façon concise, bienveillante et pratique. Utilise des listes à puces quand c'est pertinent. Maximum 300 mots sauf si demande approfondie.`;

    const messages = [{ role: "system", content: sys }, ...CHAT_HISTORY];
    const cfg = typeof API_CONFIG !== "undefined" ? API_CONFIG : {};
    const endpoint = cfg.GROK_ENDPOINT || "https://api.x.ai/v1/chat/completions";
    const key = STATE.apiKey;

    if (!key || key === "YOUR_GROK_API_KEY_HERE") throw new Error("API non configurée");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: cfg.GROK_MODEL || "grok-3",
        max_tokens: 1000,
        temperature: 0.75,
        messages: messages.slice(0, 20),
      }),
    });

    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu répondre.";
    CHAT_HISTORY.push({ role: "assistant", content: reply });
    typing.remove();
    appendChatMessage("assistant", reply);
  } catch (e) {
    typing.remove();
    const errMsg = e.message.includes("configurée")
      ? "⚙️ Configurez votre clé API Grok pour utiliser le chat IA."
      : "❌ Erreur : " + e.message;
    appendChatMessage("assistant", errMsg);
  }
}

function appendChatMessage(role, content) {
  const messages = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;

  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^•\s/gm, "• ")
    .replace(/\n/g, "<br>");

  const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  div.innerHTML = `<div class="chat-bubble">${formatted}</div><div class="chat-time">${now}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function appendChatTyping() {
  const messages = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "chat-msg assistant";
  div.innerHTML = `<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function clearChat() {
  CHAT_HISTORY.length = 0;
  const messages = document.getElementById("chatMessages");
  messages.innerHTML = `<div class="chat-msg assistant">
    <div class="chat-bubble">Chat effacé. Comment puis-je vous aider ?</div>
    <div class="chat-time">Maintenant</div>
  </div>`;
  document.getElementById("chatSuggestions").style.display = "flex";
}

function chatCSS() {
  return `
.chat-fab {
  position: fixed; bottom: 28px; right: 28px;
  width: 56px; height: 56px;
  background: var(--c-accent); color: var(--c-bg);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 400;
  box-shadow: 0 4px 20px rgba(232,168,56,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  border: none;
}
.chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(232,168,56,0.5); }
.chat-fab svg { stroke: var(--c-bg); }

.chat-badge {
  position: absolute; top: -4px; right: -4px;
  width: 18px; height: 18px; background: #e05555;
  border-radius: 50%; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; color: #fff;
}

.chat-panel {
  position: fixed; bottom: 96px; right: 28px;
  width: 380px; max-height: 580px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  display: flex; flex-direction: column;
  z-index: 399; overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  transform: scale(0.92) translateY(16px);
  opacity: 0; pointer-events: none;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  transform-origin: bottom right;
}
.chat-panel.open {
  transform: scale(1) translateY(0);
  opacity: 1; pointer-events: all;
}

.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid var(--c-border);
  background: var(--c-surface2);
}
.chat-header-info { display: flex; align-items: center; gap: 10px; }
.chat-avatar { font-size: 24px; }
.chat-name { font-size: 14px; font-weight: 600; }
.chat-status { font-size: 11px; color: var(--c-text3); }
.chat-header-actions { display: flex; gap: 6px; }
.chat-action-btn {
  background: none; border: none; color: var(--c-text3);
  cursor: pointer; padding: 4px 6px; border-radius: 6px;
  font-size: 14px; transition: all 0.2s;
}
.chat-action-btn:hover { background: var(--c-border); color: var(--c-text); }

.chat-suggestions {
  display: flex; gap: 8px; padding: 10px 12px;
  overflow-x: auto; border-bottom: 1px solid var(--c-border);
  flex-wrap: nowrap;
}
.chat-suggestions::-webkit-scrollbar { display: none; }
.chat-chip {
  white-space: nowrap; padding: 5px 12px;
  background: var(--c-surface2); border: 1px solid var(--c-border);
  border-radius: 16px; font-size: 11px; color: var(--c-text2);
  cursor: pointer; font-family: var(--font-body);
  transition: all 0.2s; flex-shrink: 0;
}
.chat-chip:hover { border-color: var(--c-accent); color: var(--c-accent); }

.chat-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  scrollbar-width: thin; scrollbar-color: var(--c-border) transparent;
}

.chat-msg { display: flex; flex-direction: column; gap: 4px; }
.chat-msg.user { align-items: flex-end; }
.chat-msg.assistant { align-items: flex-start; }

.chat-bubble {
  max-width: 88%; padding: 10px 14px;
  border-radius: 16px; font-size: 13px; line-height: 1.6;
}
.chat-msg.user .chat-bubble {
  background: var(--c-accent); color: var(--c-bg);
  border-bottom-right-radius: 4px;
}
.chat-msg.assistant .chat-bubble {
  background: var(--c-surface2); color: var(--c-text);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--c-border);
}
.chat-time { font-size: 10px; color: var(--c-text3); padding: 0 4px; }

.chat-typing { display: flex; gap: 5px; align-items: center; padding: 12px 16px; }
.chat-typing span {
  width: 7px; height: 7px; background: var(--c-text3);
  border-radius: 50%; animation: typingBounce 1.2s ease infinite;
}
.chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce {
  0%,60%,100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.chat-input-area {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 12px 14px; border-top: 1px solid var(--c-border);
  background: var(--c-surface2);
}
.chat-input {
  flex: 1; background: var(--c-surface);
  border: 1px solid var(--c-border); border-radius: 12px;
  color: var(--c-text); font-family: var(--font-body); font-size: 13px;
  padding: 9px 13px; outline: none; resize: none;
  max-height: 120px; line-height: 1.5;
  transition: border-color 0.2s;
}
.chat-input:focus { border-color: var(--c-accent); }
.chat-input::placeholder { color: var(--c-text3); }

.chat-send {
  width: 38px; height: 38px; flex-shrink: 0;
  background: var(--c-accent); border: none; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.chat-send:hover { background: var(--c-accent2); transform: scale(1.05); }
.chat-send svg { stroke: var(--c-bg); fill: none; stroke-width: 2; }

@media (max-width: 480px) {
  .chat-panel { right: 12px; left: 12px; width: auto; bottom: 88px; }
  .chat-fab { bottom: 20px; right: 16px; }
}`;
}

// ── DASHBOARD ────────────────────────────────────────────────────
function initDashboard() {
  document.getElementById("configApiBtn")?.addEventListener("click", () => {
    const modal = document.getElementById("apiModal");
    document.getElementById("apiKeyInput").value = STATE.apiKey;
    document.getElementById("teacherNameInput").value = STATE.teacherName;
    modal?.classList.add("open");
  });
}

function updateStats() {
  const counts = { evaluation: 0, devoir: 0, presentation: 0 };
  STATE.items.forEach((i) => { if (counts[i.type] !== undefined) counts[i.type]++; });
  document.getElementById("statEval").textContent = counts.evaluation;
  document.getElementById("statDevoir").textContent = counts.devoir;
  document.getElementById("statPres").textContent = counts.presentation;
  document.getElementById("statShare").textContent = STATE.shareLinks.length;
}

function renderRecentList() {
  const list = document.getElementById("recentList");
  if (!list) return;
  const recent = STATE.items.slice(0, 5);
  if (!recent.length) {
    list.innerHTML = `<p class="empty-state">Aucune création pour l'instant. Commencez par créer une évaluation, un devoir ou une présentation !</p>`;
    return;
  }
  list.innerHTML = recent
    .map((item) => `
    <div class="recent-item" onclick="openItem('${item.id}')">
      <div class="recent-item-type" style="background:${typeColor(item.type)}">${typeEmoji(item.type)}</div>
      <div class="recent-item-info">
        <div class="recent-item-title">${item.subject}</div>
        <div class="recent-item-meta">${typeLabel(item.type)} · ${item.level} · ${formatDate(item.createdAt)}</div>
      </div>
      <div class="recent-item-actions">
        <button class="btn-tool" onclick="event.stopPropagation();exportItemPDF('${item.id}')">📄 PDF</button>
      </div>
    </div>`)
    .join("");
}

// ── HELPERS ──────────────────────────────────────────────────────
function renderMarkdownPreview(id, md) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="markdown-content">${marked.parse(md)}</div>`;
}

function enablePreviewActions(prefix) {
  document.getElementById(`save${cap(prefix)}Btn`)?.removeAttribute("disabled");
  document.getElementById(`export${cap(prefix)}PdfBtn`)?.removeAttribute("disabled");
  document.getElementById(`share${cap(prefix)}Btn`)?.removeAttribute("disabled");
  if (prefix === "pres") {
    document.getElementById("prevSlideBtn")?.removeAttribute("disabled");
    document.getElementById("nextSlideBtn")?.removeAttribute("disabled");
    document.getElementById("fullscreenBtn")?.removeAttribute("disabled");
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function typeEmoji(type) {
  return { evaluation: "📝", devoir: "📖", presentation: "🖥" }[type] || "📄";
}
function typeLabel(type) {
  return { evaluation: "Évaluation", devoir: "Devoir", presentation: "Présentation" }[type] || type;
}
function typeColor(type) {
  return { evaluation: "rgba(61,107,79,0.3)", devoir: "rgba(74,90,138,0.3)", presentation: "rgba(122,61,107,0.3)" }[type] || "rgba(100,100,100,0.2)";
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function showLoading(msg = "Chargement…") {
  document.getElementById("loadingText").textContent = msg;
  document.getElementById("loadingOverlay")?.classList.add("open");
}
function hideLoading() {
  document.getElementById("loadingOverlay")?.classList.remove("open");
}

function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── URL PARAM : Vue Élève ─────────────────────────────────────────
(function checkStudentView() {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get("doc");
  if (params.get("view") !== "eleve" || !docId) return;

  const shares = JSON.parse(localStorage.getItem("eduflow_shares") || "[]");
  const share = shares.find((s) => s.id === docId);
  if (!share) return;

  document.body.innerHTML = `
    <style>
      body { font-family: 'DM Sans', sans-serif; background: #f8f6f0; color: #1a1208; margin: 0; }
      .sv-header { background: #1a1208; color: #f0ead8; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
      .sv-logo { font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px; color: #e8a838; }
      .sv-badge { font-size: 11px; background: #e8a838; color: #1a1208; padding: 3px 10px; border-radius: 12px; font-weight: 600; }
      .sv-title { text-align: center; padding: 32px 24px 16px; font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; }
      .sv-meta { text-align: center; color: #8b8270; font-size: 13px; margin-bottom: 32px; }
      .sv-content { max-width: 800px; margin: 0 auto; padding: 0 24px 60px; font-size: 15px; line-height: 1.8; }
      .sv-content h2 { font-family: 'Fraunces', serif; font-size: 19px; border-bottom: 2px solid #e8a838; padding-bottom: 6px; margin: 28px 0 12px; }
      .sv-content ul { padding-left: 20px; }
      .sv-content li { margin-bottom: 6px; }
      .sv-slide { background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 28px; margin-bottom: 18px; }
      .sv-slide-badge { font-size: 11px; color: #8b8270; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; font-weight: 600; }
      .sv-slide-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: #1a1208; margin-bottom: 12px; }
      .sv-footer { text-align: center; color: #8b8270; font-size: 12px; padding: 20px; border-top: 1px solid #e0d8c8; margin-top: 40px; }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <div class="sv-header"><span class="sv-logo">EduFlow</span><span class="sv-badge">Vue Élève</span></div>
    <div class="sv-title">${share.subject}</div>
    <div class="sv-meta">${typeLabel(share.type)} · Partagé par votre enseignant·e</div>
    <div class="sv-content" id="svContent"></div>
    <div class="sv-footer">EduFlow — Plateforme pédagogique</div>`;

  const content = document.getElementById("svContent");
  if (share.type === "presentation" && Array.isArray(share.data)) {
    content.innerHTML = share.data.map((s, i) => `
      <div class="sv-slide">
        <div class="sv-slide-badge">${s.badge || `Diapositive ${i+1}`}</div>
        <div class="sv-slide-title">${s.title}</div>
        <div>${s.content}</div>
      </div>`).join("");
  } else {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js";
    script.onload = () => { content.innerHTML = marked.parse(String(share.data)); };
    document.head.appendChild(script);
  }
})();
