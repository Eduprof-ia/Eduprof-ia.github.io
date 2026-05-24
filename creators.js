/* ================================================================
   creators.js — Créateurs de contenu (Prof)
   Diaporama, Exercice, Mots croisés, Mots mêlés, Relier, Évaluation
   ================================================================ */

const CREATORS = {

  currentType: null,
  currentData: null,

  // ── DISPATCH ─────────────────────────────────────────────────
  show(type) {
    this.currentType = type;
    const container = document.getElementById("createContainer");
    const title = document.getElementById("createTitle");
    const labels = {
      slides: "Créer un Diaporama", exercise: "Créer un Exercice",
      crossword: "Créer des Mots Croisés", wordsearch: "Créer des Mots Mêlés",
      matching: "Créer un Exercice Relier", evaluation: "Créer une Évaluation",
    };
    title.textContent = labels[type] || "Créer";
    const forms = { slides: this.slidesForm, exercise: this.exerciseForm,
      crossword: this.crosswordForm, wordsearch: this.wordsearchForm,
      matching: this.matchingForm, evaluation: this.evaluationForm };
    container.innerHTML = (forms[type] || (() => "<p>Type inconnu</p>")).call(this);
    this.bindForm(type);
    APP.switchView("create");
  },

  // ── SLIDES FORM ──────────────────────────────────────────────
  slidesForm() {
    return `<div class="creator-layout">
      <div class="form-panel">
        <div class="field-group"><label>Sujet</label><input type="text" id="sSubject" placeholder="Ex: La photosynthèse" class="field"/></div>
        <div class="field-group"><label>Niveau</label><select id="sLevel" class="field">
          <option>Primaire</option><option>Collège</option><option selected>Lycée</option><option>Supérieur</option>
        </select></div>
        <div class="field-group"><label>Nombre de slides : <strong id="sNumLabel">6</strong></label>
          <input type="range" id="sNum" min="3" max="20" value="6" class="range-input"/></div>
        <div class="field-group"><label>Thème visuel</label>
          <div class="theme-row">
            <button class="theme-btn active" data-theme="dark">🌑 Sombre</button>
            <button class="theme-btn" data-theme="light">☀️ Clair</button>
            <button class="theme-btn" data-theme="nature">🌿 Nature</button>
            <button class="theme-btn" data-theme="ocean">🌊 Océan</button>
          </div>
        </div>
        <div class="field-group"><label>Points clés (optionnel)</label>
          <textarea id="sKeypoints" class="field" rows="3" placeholder="Un point par ligne…"></textarea></div>
        <div class="field-group"><label>Titre du document</label><input type="text" id="sTitle" placeholder="Mon diaporama" class="field"/></div>
        <button class="btn-primary w-full" id="genSlidesBtn">✨ Générer avec l'IA</button>
      </div>
      <div class="preview-panel" id="slidesPreview">
        <div class="preview-toolbar">
          <span class="preview-label">Aperçu diaporama</span>
          <div class="preview-actions">
            <button class="btn-tool" id="sPrev" disabled>◀</button>
            <span id="sCounter">0/0</span>
            <button class="btn-tool" id="sNext" disabled>▶</button>
            <button class="btn-tool" id="sAddImage" disabled>🖼 Ajouter image</button>
            <button class="btn-tool" id="sFullscreen" disabled>⛶</button>
            <button class="btn-primary sm" id="sSave" disabled>💾 Sauvegarder</button>
          </div>
        </div>
        <div id="slidesStage" class="slides-stage">
          <div class="preview-ph">🖥 Générez un diaporama pour le prévisualiser</div>
        </div>
      </div>
    </div>
    <input type="file" id="slideImageUpload" accept="image/*" style="display:none"/>`;
  },

  // ── EXERCISE FORM ────────────────────────────────────────────
  exerciseForm() {
    return `<div class="creator-layout">
      <div class="form-panel">
        <div class="field-group"><label>Sujet / Texte source</label>
          <textarea id="exSubject" class="field" rows="4" placeholder="Collez le texte ou décrivez le sujet de l'exercice…"></textarea></div>
        <div class="field-group"><label>Type d'exercice</label>
          <div class="check-group">
            <label class="chk"><input type="checkbox" id="exGaps" checked/> Texte à trous</label>
            <label class="chk"><input type="checkbox" id="exQcm"/> QCM</label>
            <label class="chk"><input type="checkbox" id="exVf"/> Vrai/Faux</label>
            <label class="chk"><input type="checkbox" id="exOpen"/> Questions ouvertes</label>
          </div>
        </div>
        <div class="field-group"><label>Niveau</label><select id="exLevel" class="field">
          <option>CE1</option><option>CE2</option><option>CM1</option><option>CM2</option>
          <option>6ème</option><option>5ème</option><option>4ème</option><option>3ème</option>
          <option selected>Seconde</option><option>Première</option><option>Terminale</option>
        </select></div>
        <div class="field-group"><label>Nombre de questions : <strong id="exNumLabel">8</strong></label>
          <input type="range" id="exNum" min="3" max="20" value="8" class="range-input"/></div>
        <div class="field-group"><label>Titre</label><input type="text" id="exTitle" placeholder="Mon exercice" class="field"/></div>
        <button class="btn-primary w-full" id="genExBtn">✨ Générer avec l'IA</button>
      </div>
      <div class="preview-panel">
        <div class="preview-toolbar">
          <span class="preview-label">Aperçu exercice</span>
          <div class="preview-actions">
            <button class="btn-primary sm" id="exSave" disabled>💾 Sauvegarder</button>
          </div>
        </div>
        <div class="preview-content" id="exPreview"><div class="preview-ph">✏️ Générez pour voir l'aperçu</div></div>
      </div>
    </div>`;
  },

  // ── CROSSWORD FORM ───────────────────────────────────────────
  crosswordForm() {
    return `<div class="creator-layout">
      <div class="form-panel">
        <div class="field-group"><label>Thème / Matière</label>
          <input type="text" id="cwTheme" placeholder="Ex: Les capitales d'Europe" class="field"/></div>
        <div class="field-group"><label>Mots à inclure (un par ligne, avec définition)</label>
          <textarea id="cwWords" class="field" rows="8" placeholder="PARIS : Capitale de la France&#10;BERLIN : Capitale de l'Allemagne&#10;MADRID : Capitale de l'Espagne&#10;ROME : Capitale de l'Italie"></textarea></div>
        <div class="field-group"><label>Ou générer automatiquement sur le thème</label>
          <button class="btn-ghost w-full" id="cwGenWords">✨ Générer les mots avec l'IA</button></div>
        <div class="field-group"><label>Taille de la grille</label>
          <select id="cwSize" class="field"><option value="10">Petite (10×10)</option><option value="13" selected>Moyenne (13×13)</option><option value="15">Grande (15×15)</option></select>
        </div>
        <div class="field-group"><label>Titre</label><input type="text" id="cwTitle" placeholder="Mes mots croisés" class="field"/></div>
        <button class="btn-primary w-full" id="genCwBtn">🔤 Générer la grille</button>
      </div>
      <div class="preview-panel">
        <div class="preview-toolbar">
          <span class="preview-label">Grille de mots croisés</span>
          <div class="preview-actions">
            <button class="btn-tool" id="cwCheck" disabled>✅ Vérifier</button>
            <button class="btn-tool" id="cwReveal" disabled>💡 Révéler</button>
            <button class="btn-primary sm" id="cwSave" disabled>💾 Sauvegarder</button>
          </div>
        </div>
        <div id="cwPreview" class="cw-preview-area"><div class="preview-ph">🔤 Générez la grille pour la voir</div></div>
      </div>
    </div>`;
  },

  // ── WORD SEARCH FORM ─────────────────────────────────────────
  wordsearchForm() {
    return `<div class="creator-layout">
      <div class="form-panel">
        <div class="field-group"><label>Thème</label><input type="text" id="wsTheme" placeholder="Ex: Les animaux de la forêt" class="field"/></div>
        <div class="field-group"><label>Mots à cacher (un par ligne)</label>
          <textarea id="wsWords" class="field" rows="6" placeholder="RENARD&#10;LOUP&#10;CERF&#10;SANGLIER&#10;ECUREUIL"></textarea></div>
        <div class="field-group"><label>Ou générer automatiquement</label>
          <button class="btn-ghost w-full" id="wsGenWords">✨ Générer avec l'IA</button></div>
        <div class="field-group"><label>Taille</label>
          <select id="wsSize" class="field"><option value="12">12×12</option><option value="15" selected>15×15</option><option value="18">18×18</option></select>
        </div>
        <div class="field-group"><label>Titre</label><input type="text" id="wsTitle" placeholder="Mots mêlés" class="field"/></div>
        <button class="btn-primary w-full" id="genWsBtn">🔍 Générer la grille</button>
      </div>
      <div class="preview-panel">
        <div class="preview-toolbar">
          <span class="preview-label">Grille de mots mêlés</span>
          <div class="preview-actions">
            <button class="btn-primary sm" id="wsSave" disabled>💾 Sauvegarder</button>
          </div>
        </div>
        <div id="wsPreview" class="ws-preview-area"><div class="preview-ph">🔍 Générez pour voir la grille</div></div>
      </div>
    </div>`;
  },

  // ── MATCHING FORM ────────────────────────────────────────────
  matchingForm() {
    return `<div class="creator-layout">
      <div class="form-panel">
        <div class="field-group"><label>Sujet</label><input type="text" id="mtSubject" placeholder="Ex: Pays et capitales" class="field"/></div>
        <div class="field-group"><label>Paires à relier (format: Gauche → Droite, une par ligne)</label>
          <textarea id="mtPairs" class="field" rows="8" placeholder="France → Paris&#10;Allemagne → Berlin&#10;Espagne → Madrid&#10;Italie → Rome"></textarea></div>
        <div class="field-group"><label>Ou générer automatiquement</label>
          <button class="btn-ghost w-full" id="mtGenPairs">✨ Générer avec l'IA</button></div>
        <div class="field-group"><label>Titre</label><input type="text" id="mtTitle" placeholder="Exercice relier" class="field"/></div>
        <button class="btn-primary w-full" id="genMtBtn">🔗 Générer l'exercice</button>
      </div>
      <div class="preview-panel">
        <div class="preview-toolbar">
          <span class="preview-label">Exercice relier</span>
          <div class="preview-actions">
            <button class="btn-tool" id="mtCheck" disabled>✅ Vérifier</button>
            <button class="btn-tool" id="mtReset" disabled>🔄 Reset</button>
            <button class="btn-primary sm" id="mtSave" disabled>💾 Sauvegarder</button>
          </div>
        </div>
        <div id="mtPreview" class="mt-preview-area"><div class="preview-ph">🔗 Générez pour voir l'exercice</div></div>
      </div>
    </div>`;
  },

  // ── EVALUATION FORM ──────────────────────────────────────────
  evaluationForm() {
    return `<div class="creator-layout">
      <div class="form-panel">
        <div class="field-group"><label>Matière / Sujet</label><input type="text" id="evSubject" placeholder="Ex: Mathématiques — Fractions" class="field"/></div>
        <div class="field-group"><label>Niveau</label><select id="evLevel" class="field">
          <option>6ème</option><option>5ème</option><option>4ème</option><option>3ème</option>
          <option selected>Seconde</option><option>Première</option><option>Terminale</option>
        </select></div>
        <div class="field-group"><label>Types de questions</label>
          <div class="check-group">
            <label class="chk"><input type="checkbox" id="evQcm" checked/> QCM</label>
            <label class="chk"><input type="checkbox" id="evVf"/> Vrai/Faux</label>
            <label class="chk"><input type="checkbox" id="evOpen"/> Questions ouvertes</label>
            <label class="chk"><input type="checkbox" id="evCalc"/> Calculs</label>
          </div>
        </div>
        <div class="field-group"><label>Nombre de questions : <strong id="evNumLabel">10</strong></label>
          <input type="range" id="evNum" min="5" max="30" value="10" class="range-input"/></div>
        <div class="field-group"><label>Durée</label><select id="evDuration" class="field">
          <option>20 min</option><option>30 min</option><option selected>45 min</option><option>1h</option><option>2h</option>
        </select></div>
        <div class="field-group"><label>Titre</label><input type="text" id="evTitle" placeholder="Évaluation" class="field"/></div>
        <button class="btn-primary w-full" id="genEvBtn">✨ Générer avec l'IA</button>
      </div>
      <div class="preview-panel">
        <div class="preview-toolbar">
          <span class="preview-label">Aperçu évaluation</span>
          <div class="preview-actions">
            <button class="btn-primary sm" id="evSave" disabled>💾 Sauvegarder</button>
          </div>
        </div>
        <div class="preview-content" id="evPreview"><div class="preview-ph">📝 Générez pour voir l'aperçu</div></div>
      </div>
    </div>`;
  },

  // ── BIND FORMS ───────────────────────────────────────────────
  bindForm(type) {
    const bindSlider = (id, labelId) => {
      const el = document.getElementById(id);
      const label = document.getElementById(labelId);
      if (el && label) el.addEventListener("input", () => label.textContent = el.value);
    };

    if (type === "slides") {
      bindSlider("sNum", "sNumLabel");
      document.querySelectorAll(".theme-btn").forEach(b => b.addEventListener("click", () => {
        document.querySelectorAll(".theme-btn").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
      }));
      document.getElementById("genSlidesBtn")?.addEventListener("click", () => this.generateSlides());
      document.getElementById("sPrev")?.addEventListener("click", () => ACTIVITIES.navigateSlide(-1));
      document.getElementById("sNext")?.addEventListener("click", () => ACTIVITIES.navigateSlide(1));
      document.getElementById("sFullscreen")?.addEventListener("click", () => ACTIVITIES.fullscreen());
      document.getElementById("sAddImage")?.addEventListener("click", () => {
        document.getElementById("slideImageUpload")?.click();
      });
      document.getElementById("slideImageUpload")?.addEventListener("change", (e) => this.addImageToSlide(e));
      document.getElementById("sSave")?.addEventListener("click", () => this.saveDoc("slides"));
    }

    if (type === "exercise") {
      bindSlider("exNum", "exNumLabel");
      document.getElementById("genExBtn")?.addEventListener("click", () => this.generateExercise());
      document.getElementById("exSave")?.addEventListener("click", () => this.saveDoc("exercise"));
    }

    if (type === "crossword") {
      document.getElementById("cwGenWords")?.addEventListener("click", () => this.generateCwWords());
      document.getElementById("genCwBtn")?.addEventListener("click", () => this.generateCrossword());
      document.getElementById("cwSave")?.addEventListener("click", () => this.saveDoc("crossword"));
      document.getElementById("cwCheck")?.addEventListener("click", () => ACTIVITIES.checkCrossword());
      document.getElementById("cwReveal")?.addEventListener("click", () => ACTIVITIES.revealCrossword());
    }

    if (type === "wordsearch") {
      document.getElementById("wsGenWords")?.addEventListener("click", () => this.generateWsWords());
      document.getElementById("genWsBtn")?.addEventListener("click", () => this.generateWordsearch());
      document.getElementById("wsSave")?.addEventListener("click", () => this.saveDoc("wordsearch"));
    }

    if (type === "matching") {
      document.getElementById("mtGenPairs")?.addEventListener("click", () => this.generateMtPairs());
      document.getElementById("genMtBtn")?.addEventListener("click", () => this.generateMatching());
      document.getElementById("mtSave")?.addEventListener("click", () => this.saveDoc("matching"));
      document.getElementById("mtCheck")?.addEventListener("click", () => ACTIVITIES.checkMatching());
      document.getElementById("mtReset")?.addEventListener("click", () => ACTIVITIES.resetMatching());
    }

    if (type === "evaluation") {
      bindSlider("evNum", "evNumLabel");
      document.getElementById("genEvBtn")?.addEventListener("click", () => this.generateEvaluation());
      document.getElementById("evSave")?.addEventListener("click", () => this.saveDoc("evaluation"));
    }
  },

  // ── AI GENERATORS ────────────────────────────────────────────
  async callGroq(system, user, json = false) {
    const cfg = window.EDUFLOW_CONFIG || {};
    const key = cfg.GROQ_API_KEY;
    if (!key || key === "YOUR_GROQ_API_KEY_HERE") throw new Error("Clé API Groq non configurée dans config.js");
    const res = await fetch(cfg.GROQ_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: cfg.GROQ_MODEL || "llama-3.3-70b-versatile",
        max_tokens: 4096, temperature: 0.7,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Erreur ${res.status}`); }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (json) {
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    }
    return text;
  },

  async generateSlides() {
    const subject = document.getElementById("sSubject")?.value.trim();
    if (!subject) { APP.toast("Entrez un sujet", "error"); return; }
    const num = document.getElementById("sNum")?.value || 6;
    const level = document.getElementById("sLevel")?.value || "Lycée";
    const keypoints = document.getElementById("sKeypoints")?.value || "";
    const theme = document.querySelector(".theme-btn.active")?.dataset.theme || "dark";
    const title = document.getElementById("sTitle")?.value || subject;

    APP.showLoading("Génération du diaporama…");
    try {
      const slides = await this.callGroq(
        `Tu es un enseignant expert. Génère UNIQUEMENT un tableau JSON valide de diapositives pédagogiques. 
Format strict : [{"title":"...","badge":"...","content":"...","emoji":"..."}]
- title : titre court accrocheur
- badge : catégorie (Introduction, Définition, Exemple, Point clé, Exercice, Conclusion…)  
- content : HTML simple avec <p>, <ul><li>, <strong>. 3-6 points max par slide.
- emoji : un emoji pertinent
Rien d'autre que le JSON.`,
        `Sujet: "${subject}" | Niveau: ${level} | ${num} diapositives${keypoints ? "\nPoints clés:\n" + keypoints : ""}`, true
      );
      this.currentData = { type: "slides", title, subject, level, theme, slides };
      ACTIVITIES.renderSlides(slides, theme, "slidesStage");
      ACTIVITIES.currentSlides = slides;
      ACTIVITIES.currentTheme = theme;
      ["sPrev","sNext","sAddImage","sFullscreen","sSave"].forEach(id => {
        const el = document.getElementById(id); if (el) el.disabled = false;
      });
      APP.toast(`✅ ${slides.length} slides générées !`, "success");
    } catch(e) { APP.toast(e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  async generateExercise() {
    const subject = document.getElementById("exSubject")?.value.trim();
    if (!subject) { APP.toast("Entrez un sujet ou un texte", "error"); return; }
    const num = document.getElementById("exNum")?.value || 8;
    const level = document.getElementById("exLevel")?.value;
    const title = document.getElementById("exTitle")?.value || "Exercice";
    const types = [];
    if (document.getElementById("exGaps")?.checked) types.push("texte à trous (indique les trous avec _______)");
    if (document.getElementById("exQcm")?.checked) types.push("QCM avec 4 choix (A/B/C/D)");
    if (document.getElementById("exVf")?.checked) types.push("Vrai/Faux");
    if (document.getElementById("exOpen")?.checked) types.push("questions ouvertes");
    if (!types.length) { APP.toast("Choisissez au moins un type", "error"); return; }

    APP.showLoading("Génération de l'exercice…");
    try {
      const result = await this.callGroq(
        `Tu es un enseignant expert. Génère UNIQUEMENT un JSON valide avec les champs:
{"title":"...","questions":[{"type":"gaps|qcm|vf|open","text":"...","choices":["A)...","B)...","C)...","D)..."],"answer":"...","points":1}]}
Pour les textes à trous, mets les mots manquants sous forme _____ dans le texte.
Pour QCM inclure choices. Pour vf mettre answer "Vrai" ou "Faux". Rien d'autre que le JSON.`,
        `Sujet: "${subject}" | Niveau: ${level} | ${num} questions | Types: ${types.join(", ")}`, true
      );
      result.title = title;
      this.currentData = { type: "exercise", title, subject, level, ...result };
      document.getElementById("exPreview").innerHTML = ACTIVITIES.renderExercisePreview(result);
      document.getElementById("exSave").disabled = false;
      APP.toast("✅ Exercice généré !", "success");
    } catch(e) { APP.toast(e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  async generateCwWords() {
    const theme = document.getElementById("cwTheme")?.value.trim();
    if (!theme) { APP.toast("Entrez un thème", "error"); return; }
    APP.showLoading("Génération des mots…");
    try {
      const data = await this.callGroq(
        `Génère UNIQUEMENT un JSON : {"words":[{"word":"MOT","clue":"Définition courte"}]} 
10-12 mots en MAJUSCULES sans accents, liés au thème. Mots entre 4 et 12 lettres. Rien d'autre.`,
        `Thème: "${theme}"`, true
      );
      const text = data.words.map(w => `${w.word} : ${w.clue}`).join("\n");
      document.getElementById("cwWords").value = text;
      APP.toast("✅ Mots générés !", "success");
    } catch(e) { APP.toast(e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  async generateCrossword() {
    const raw = document.getElementById("cwWords")?.value.trim();
    if (!raw) { APP.toast("Entrez des mots", "error"); return; }
    const size = parseInt(document.getElementById("cwSize")?.value || "13");
    const title = document.getElementById("cwTitle")?.value || "Mots croisés";

    const words = raw.split("\n").map(l => {
      const [word, ...def] = l.split(":");
      return { word: word.trim().toUpperCase().replace(/[^A-Z]/g, ""), clue: def.join(":").trim() };
    }).filter(w => w.word.length >= 3 && w.word.length <= size - 2);

    if (words.length < 3) { APP.toast("Ajoutez au moins 3 mots valides", "error"); return; }

    APP.showLoading("Construction de la grille…");
    try {
      const grid = ACTIVITIES.buildCrossword(words, size);
      this.currentData = { type: "crossword", title, words, grid, size };
      ACTIVITIES.renderCrossword(grid, words, size, "cwPreview");
      ["cwCheck","cwReveal","cwSave"].forEach(id => { const el = document.getElementById(id); if(el) el.disabled = false; });
      APP.toast("✅ Grille générée !", "success");
    } catch(e) { APP.toast("Erreur grille : " + e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  async generateWsWords() {
    const theme = document.getElementById("wsTheme")?.value.trim();
    if (!theme) { APP.toast("Entrez un thème", "error"); return; }
    APP.showLoading("Génération des mots…");
    try {
      const data = await this.callGroq(
        `Génère UNIQUEMENT un JSON : {"words":["MOT1","MOT2",...]} 
10-15 mots en MAJUSCULES sans accents liés au thème. Entre 4 et 12 lettres chacun. Rien d'autre.`,
        `Thème: "${theme}"`, true
      );
      document.getElementById("wsWords").value = data.words.join("\n");
      APP.toast("✅ Mots générés !", "success");
    } catch(e) { APP.toast(e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  async generateWordsearch() {
    const raw = document.getElementById("wsWords")?.value.trim();
    if (!raw) { APP.toast("Entrez des mots", "error"); return; }
    const size = parseInt(document.getElementById("wsSize")?.value || "15");
    const title = document.getElementById("wsTitle")?.value || "Mots mêlés";
    const words = raw.split("\n").map(w => w.trim().toUpperCase().replace(/[^A-Z]/g, "")).filter(w => w.length >= 3 && w.length < size);

    APP.showLoading("Construction de la grille…");
    try {
      const result = ACTIVITIES.buildWordsearch(words, size);
      this.currentData = { type: "wordsearch", title, words, grid: result.grid, placements: result.placements, size };
      ACTIVITIES.renderWordsearch(result, "wsPreview");
      document.getElementById("wsSave").disabled = false;
      APP.toast("✅ Grille générée !", "success");
    } catch(e) { APP.toast("Erreur : " + e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  async generateMtPairs() {
    const subject = document.getElementById("mtSubject")?.value.trim();
    if (!subject) { APP.toast("Entrez un sujet", "error"); return; }
    APP.showLoading("Génération des paires…");
    try {
      const data = await this.callGroq(
        `Génère UNIQUEMENT un JSON : {"pairs":[{"left":"...","right":"..."}]} 
8-10 paires logiques à relier. Rien d'autre.`,
        `Sujet: "${subject}"`, true
      );
      document.getElementById("mtPairs").value = data.pairs.map(p => `${p.left} → ${p.right}`).join("\n");
      APP.toast("✅ Paires générées !", "success");
    } catch(e) { APP.toast(e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  async generateMatching() {
    const raw = document.getElementById("mtPairs")?.value.trim();
    if (!raw) { APP.toast("Entrez des paires", "error"); return; }
    const title = document.getElementById("mtTitle")?.value || "Relier";
    const pairs = raw.split("\n").map(l => {
      const parts = l.split("→");
      return parts.length === 2 ? { left: parts[0].trim(), right: parts[1].trim() } : null;
    }).filter(Boolean);

    if (pairs.length < 2) { APP.toast("Format : Gauche → Droite", "error"); return; }
    this.currentData = { type: "matching", title, pairs };
    ACTIVITIES.renderMatching(pairs, "mtPreview");
    ["mtCheck","mtReset","mtSave"].forEach(id => { const el = document.getElementById(id); if(el) el.disabled = false; });
    APP.toast("✅ Exercice créé !", "success");
  },

  async generateEvaluation() {
    const subject = document.getElementById("evSubject")?.value.trim();
    if (!subject) { APP.toast("Entrez un sujet", "error"); return; }
    const num = document.getElementById("evNum")?.value || 10;
    const level = document.getElementById("evLevel")?.value;
    const duration = document.getElementById("evDuration")?.value;
    const title = document.getElementById("evTitle")?.value || "Évaluation";
    const types = [];
    if (document.getElementById("evQcm")?.checked) types.push("QCM");
    if (document.getElementById("evVf")?.checked) types.push("Vrai/Faux");
    if (document.getElementById("evOpen")?.checked) types.push("questions ouvertes");
    if (document.getElementById("evCalc")?.checked) types.push("calculs");

    APP.showLoading("Génération de l'évaluation…");
    try {
      const result = await this.callGroq(
        `Tu es un enseignant expert. Génère UNIQUEMENT un JSON valide:
{"title":"...","duration":"...","questions":[{"num":1,"type":"qcm|vf|open|calc","text":"...","choices":["A)..."],"answer":"...","points":1}]}
Inclure un corrigé complet dans chaque answer. Rien d'autre que le JSON.`,
        `Sujet: "${subject}" | Niveau: ${level} | ${num} questions | Types: ${types.join(", ")} | Durée: ${duration}`, true
      );
      result.title = title;
      this.currentData = { type: "evaluation", title, subject, level, duration, ...result };
      document.getElementById("evPreview").innerHTML = ACTIVITIES.renderEvalPreview(result);
      document.getElementById("evSave").disabled = false;
      APP.toast("✅ Évaluation générée !", "success");
    } catch(e) { APP.toast(e.message, "error"); }
    finally { APP.hideLoading(); }
  },

  // ── IMAGE DANS SLIDE ─────────────────────────────────────────
  addImageToSlide(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgUrl = ev.target.result;
      const currentIdx = ACTIVITIES.currentSlideIdx;
      if (this.currentData?.slides?.[currentIdx]) {
        this.currentData.slides[currentIdx].image = imgUrl;
        ACTIVITIES.renderSlides(this.currentData.slides, this.currentData.theme, "slidesStage", currentIdx);
        APP.toast("✅ Image ajoutée à la diapositive !", "success");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  },

  // ── SAVE DOC ─────────────────────────────────────────────────
  async saveDoc(type) {
    if (!this.currentData) { APP.toast("Rien à sauvegarder", "error"); return; }
    try {
      const saved = await DB.saveDoc({
        ...this.currentData,
        teacherId: AUTH.currentUser.uid,
        teacherName: AUTH.currentUser.name,
      });
      APP.toast("✅ Sauvegardé dans la bibliothèque !", "success");
      await APP.refreshStats();
      return saved;
    } catch(e) { APP.toast("Erreur : " + e.message, "error"); }
  },
};
