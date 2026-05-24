/* ================================================================
   activities.js — Moteurs d'activités interactives
   Mots croisés, Mots mêlés, Relier, Diaporama, Exercice, Éval
   ================================================================ */

const ACTIVITIES = {
  currentSlides: [],
  currentSlideIdx: 0,
  currentTheme: "dark",
  cwData: null,
  wsData: null,
  mtData: null,

  // ══════════════════════════════════════════════════════════════
  // DIAPORAMA
  // ══════════════════════════════════════════════════════════════
  themeCSS: {
    dark:   { bg:"linear-gradient(135deg,#0f172a,#1e293b)", color:"#f1f5f9", accent:"#f59e0b", sub:"#94a3b8" },
    light:  { bg:"linear-gradient(135deg,#fefce8,#fdf4dc)", color:"#1a1208", accent:"#d97706", sub:"#78716c" },
    nature: { bg:"linear-gradient(135deg,#052e16,#14532d)", color:"#f0fdf4", accent:"#4ade80", sub:"#86efac" },
    ocean:  { bg:"linear-gradient(135deg,#0c1445,#1e3a8a)", color:"#eff6ff", accent:"#38bdf8", sub:"#bae6fd" },
  },

  renderSlides(slides, theme, containerId, activeIdx = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;
    this.currentSlides = slides;
    this.currentTheme = theme;
    this.currentSlideIdx = activeIdx;
    const t = this.themeCSS[theme] || this.themeCSS.dark;

    container.innerHTML = slides.map((s, i) => `
      <div class="slide-card ${i === activeIdx ? "active" : ""}"
           style="background:${t.bg};color:${t.color};display:${i === activeIdx ? "flex" : "none"};flex-direction:column;min-height:340px;border-radius:16px;padding:36px 44px;position:relative;overflow:hidden;animation:slideIn .35s ease">
        <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:${t.accent};opacity:.06"></div>
        <div style="font-size:28px;margin-bottom:10px">${s.emoji || "📖"}</div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:${t.sub};margin-bottom:8px;font-weight:600">${s.badge || ""}</div>
        <h2 style="font-family:'Fraunces',serif;font-size:clamp(18px,2.5vw,26px);font-weight:700;margin-bottom:16px;color:${t.accent};line-height:1.2">${s.title}</h2>
        <div style="font-size:14px;line-height:1.8;flex:1">${s.content}</div>
        ${s.image ? `<img src="${s.image}" style="max-height:160px;object-fit:contain;border-radius:10px;margin-top:14px;align-self:center"/>` : ""}
        <div style="position:absolute;bottom:14px;right:20px;font-size:11px;opacity:.4">${i+1} / ${slides.length}</div>
      </div>`).join("");

    this._updateSlideCounter(containerId);
  },

  navigateSlide(dir) {
    const slides = this.currentSlides;
    if (!slides.length) return;
    this.currentSlideIdx = Math.max(0, Math.min(slides.length - 1, this.currentSlideIdx + dir));
    const stage = document.getElementById("slidesStage") || document.getElementById("fsSlideStage");
    if (stage) {
      stage.querySelectorAll(".slide-card").forEach((el, i) => {
        el.style.display = i === this.currentSlideIdx ? "flex" : "none";
        el.classList.toggle("active", i === this.currentSlideIdx);
      });
    }
    this._updateSlideCounter("slidesStage");
    // sync fullscreen if open
    const fsStage = document.getElementById("fsSlideStage");
    if (fsStage) {
      fsStage.querySelectorAll(".slide-card").forEach((el, i) => {
        el.style.display = i === this.currentSlideIdx ? "flex" : "none";
      });
      const fc = document.getElementById("fsCounter");
      if (fc) fc.textContent = `${this.currentSlideIdx + 1} / ${slides.length}`;
    }
  },

  _updateSlideCounter(containerId) {
    const el = document.getElementById("sCounter");
    if (el) el.textContent = `${this.currentSlideIdx + 1} / ${this.currentSlides.length}`;
  },

  fullscreen() {
    let overlay = document.getElementById("fsOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "fsOverlay";
      overlay.style.cssText = "position:fixed;inset:0;background:#000;z-index:900;display:flex;flex-direction:column";
      overlay.innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;padding:14px 24px;background:rgba(255,255,255,.05)">
          <button onclick="ACTIVITIES.navigateSlide(-1)" style="background:rgba(255,255,255,.15);border:none;color:#fff;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:16px">◀</button>
          <span id="fsCounter" style="color:rgba(255,255,255,.6);flex:1;text-align:center">1/${this.currentSlides.length}</span>
          <button onclick="ACTIVITIES.navigateSlide(1)" style="background:rgba(255,255,255,.15);border:none;color:#fff;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:16px">▶</button>
          <button onclick="document.getElementById('fsOverlay').remove()" style="background:rgba(255,50,50,.3);border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer">✕ Fermer</button>
        </div>
        <div id="fsSlideStage" style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px"></div>`;
      document.body.appendChild(overlay);
    }
    const fsStage = document.getElementById("fsSlideStage");
    fsStage.innerHTML = "";
    const t = this.themeCSS[this.currentTheme] || this.themeCSS.dark;
    this.currentSlides.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = "slide-card";
      el.style.cssText = `background:${t.bg};color:${t.color};${i === this.currentSlideIdx ? "display:flex" : "display:none"};flex-direction:column;width:100%;max-width:900px;min-height:500px;border-radius:20px;padding:48px 64px;position:relative;overflow:hidden`;
      el.innerHTML = `
        <div style="font-size:36px;margin-bottom:12px">${s.emoji||"📖"}</div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:${t.sub};margin-bottom:8px;font-weight:600">${s.badge||""}</div>
        <h2 style="font-family:'Fraunces',serif;font-size:32px;font-weight:700;margin-bottom:20px;color:${t.accent}">${s.title}</h2>
        <div style="font-size:16px;line-height:1.9;flex:1">${s.content}</div>
        ${s.image ? `<img src="${s.image}" style="max-height:200px;object-fit:contain;border-radius:12px;margin-top:16px;align-self:center"/>` : ""}
        <div style="position:absolute;bottom:16px;right:24px;font-size:13px;opacity:.4">${i+1}/${this.currentSlides.length}</div>`;
      fsStage.appendChild(el);
    });
    document.getElementById("fsCounter").textContent = `${this.currentSlideIdx+1} / ${this.currentSlides.length}`;
    document.addEventListener("keydown", this._fsKeyHandler = (e) => {
      if (e.key === "ArrowRight") this.navigateSlide(1);
      if (e.key === "ArrowLeft") this.navigateSlide(-1);
      if (e.key === "Escape") { overlay.remove(); document.removeEventListener("keydown", this._fsKeyHandler); }
    });
  },

  // ══════════════════════════════════════════════════════════════
  // EXERCICE PREVIEW
  // ══════════════════════════════════════════════════════════════
  renderExercisePreview(data) {
    const questions = data.questions || [];
    return `<div style="font-family:'DM Sans',sans-serif">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;margin-bottom:4px;color:var(--c-accent)">${data.title}</h2>
      <p style="font-size:12px;color:var(--c-text2);margin-bottom:20px">${questions.length} questions · ${questions.reduce((a,q)=>a+(q.points||1),0)} points</p>
      ${questions.map((q,i) => `
        <div class="ex-question" data-idx="${i}" style="background:var(--c-surface2);border:1px solid var(--c-border);border-radius:10px;padding:16px;margin-bottom:12px">
          <div style="font-size:11px;color:var(--c-accent);font-weight:600;margin-bottom:6px;text-transform:uppercase">Q${i+1} · ${q.points||1} pt${q.points>1?"s":""}</div>
          <p style="margin-bottom:10px;font-size:14px">${q.text}</p>
          ${q.type === "qcm" ? `<div style="display:flex;flex-direction:column;gap:6px">${(q.choices||[]).map(c=>`
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--c-border);transition:all .2s">
              <input type="radio" name="q${i}" value="${c.substring(0,1)}" style="accent-color:var(--c-accent)"/> ${c}
            </label>`).join("")}</div>` : ""}
          ${q.type === "vf" ? `<div style="display:flex;gap:10px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="q${i}" value="Vrai" style="accent-color:var(--c-accent)"/> Vrai</label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="q${i}" value="Faux" style="accent-color:var(--c-accent)"/> Faux</label>
          </div>` : ""}
          ${q.type === "gaps" ? `<div style="font-size:14px;line-height:2.2">${q.text.replace(/_+/g, `<input type="text" style="border:none;border-bottom:2px solid var(--c-accent);background:transparent;color:var(--c-text);width:100px;outline:none;font-size:14px;text-align:center"/>`)} </div>` : ""}
          ${q.type === "open" || q.type === "calc" ? `<textarea style="width:100%;background:var(--c-surface);border:1px solid var(--c-border);border-radius:6px;color:var(--c-text);padding:8px;font-size:13px;resize:vertical;margin-top:6px" rows="3" placeholder="Votre réponse…"></textarea>` : ""}
        </div>`).join("")}
    </div>`;
  },

  // ══════════════════════════════════════════════════════════════
  // ÉVALUATION PREVIEW
  // ══════════════════════════════════════════════════════════════
  renderEvalPreview(data) {
    return this.renderExercisePreview(data);
  },

  // ══════════════════════════════════════════════════════════════
  // MOTS CROISÉS
  // ══════════════════════════════════════════════════════════════
  buildCrossword(words, size) {
    const grid = Array.from({length: size}, () => Array(size).fill(null));
    const placed = [];

    const canPlace = (word, row, col, horiz) => {
      for (let i = 0; i < word.length; i++) {
        const r = horiz ? row : row + i;
        const c = horiz ? col + i : col;
        if (r < 0 || r >= size || c < 0 || c >= size) return false;
        const cell = grid[r][c];
        if (cell !== null && cell.letter !== word[i]) return false;
        // check neighbors
        if (cell === null) {
          if (horiz) {
            if (r > 0 && grid[r-1][c] !== null && !(placed.some(p=>!p.horiz&&p.col===c&&p.row<=r&&p.row+p.word.length>r))) return false;
            if (r < size-1 && grid[r+1][c] !== null && !(placed.some(p=>!p.horiz&&p.col===c&&p.row<=r&&p.row+p.word.length>r))) return false;
          } else {
            if (c > 0 && grid[r][c-1] !== null && !(placed.some(p=>p.horiz&&p.row===r&&p.col<=c&&p.col+p.word.length>c))) return false;
            if (c < size-1 && grid[r][c+1] !== null && !(placed.some(p=>p.horiz&&p.row===r&&p.col<=c&&p.col+p.word.length>c))) return false;
          }
        }
      }
      // check borders
      if (horiz) {
        if (col > 0 && grid[row][col-1] !== null) return false;
        if (col + word.length < size && grid[row][col + word.length] !== null) return false;
      } else {
        if (row > 0 && grid[row-1][col] !== null) return false;
        if (row + word.length < size && grid[row + word.length][col] !== null) return false;
      }
      return true;
    };

    const placeWord = (word, row, col, horiz, num) => {
      for (let i = 0; i < word.length; i++) {
        const r = horiz ? row : row + i;
        const c = horiz ? col + i : col;
        grid[r][c] = { letter: word[i], num: i === 0 ? num : null };
      }
      placed.push({ word, row, col, horiz, num });
    };

    // Place first word in center horizontally
    const sorted = [...words].sort((a, b) => b.word.length - a.word.length);
    const first = sorted[0];
    const startCol = Math.floor((size - first.word.length) / 2);
    const startRow = Math.floor(size / 2);
    placeWord(first.word, startRow, startCol, true, 1);

    // Try to place remaining words
    let num = 2;
    for (let wi = 1; wi < sorted.length; wi++) {
      const { word } = sorted[wi];
      let bestScore = -1, bestR = 0, bestC = 0, bestH = true;

      for (const p of placed) {
        for (let li = 0; li < word.length; li++) {
          const letter = word[li];
          for (let pi = 0; pi < p.word.length; pi++) {
            if (p.word[pi] !== letter) continue;
            if (p.horiz) {
              // place vertically crossing at p.col+pi, word[li] at that row
              const r = p.row - li;
              const c = p.col + pi;
              if (canPlace(word, r, c, false)) {
                const score = li + (p.word.length - pi);
                if (score > bestScore) { bestScore = score; bestR = r; bestC = c; bestH = false; }
              }
            } else {
              const r = p.row + pi;
              const c = p.col - li;
              if (canPlace(word, r, c, true)) {
                const score = li + (p.word.length - pi);
                if (score > bestScore) { bestScore = score; bestR = r; bestC = c; bestH = true; }
              }
            }
          }
        }
      }

      if (bestScore >= 0) {
        placeWord(word, bestR, bestC, bestH, num++);
      } else {
        // fallback: random placement
        for (let attempt = 0; attempt < 80; attempt++) {
          const horiz = Math.random() > 0.5;
          const r = Math.floor(Math.random() * (size - (horiz ? 1 : word.length)));
          const c = Math.floor(Math.random() * (size - (horiz ? word.length : 1)));
          if (canPlace(word, r, c, horiz)) { placeWord(word, r, c, horiz, num++); break; }
        }
      }
    }

    return { grid, placed };
  },

  renderCrossword(gridData, words, size, containerId) {
    const { grid, placed } = gridData;
    this.cwData = { grid: gridData, words, size, placed };
    const cluesH = placed.filter(p => p.horiz).sort((a,b) => a.num-b.num);
    const cluesV = placed.filter(p => !p.horiz).sort((a,b) => a.num-b.num);

    // Find word data for clues
    const wordMap = {};
    words.forEach(w => wordMap[w.word] = w.clue);

    const gridHTML = `<div class="cw-grid" style="display:inline-grid;grid-template-columns:repeat(${size},32px);gap:2px;background:var(--c-border);border:2px solid var(--c-border);border-radius:8px;padding:2px">
      ${Array.from({length:size}, (_,r) => Array.from({length:size}, (_,c) => {
        const cell = grid[r][c];
        if (!cell) return `<div style="width:32px;height:32px;background:var(--c-bg)"></div>`;
        const numLabel = cell.num ? `<span style="position:absolute;top:1px;left:2px;font-size:8px;font-weight:700;color:var(--c-accent);line-height:1">${cell.num}</span>` : "";
        return `<div style="width:32px;height:32px;background:var(--c-surface);position:relative;display:flex;align-items:center;justify-content:center">
          ${numLabel}
          <input type="text" maxlength="1" data-row="${r}" data-col="${c}" data-ans="${cell.letter}"
            style="width:100%;height:100%;border:none;background:transparent;text-align:center;font-size:14px;font-weight:700;color:var(--c-text);text-transform:uppercase;outline:none;caret-color:var(--c-accent)"
            oninput="this.value=this.value.toUpperCase();ACTIVITIES._cwNext(this,${r},${c},${size})"
            onkeydown="ACTIVITIES._cwKey(event,${r},${c},${size})"/>
        </div>`;
      }).join("")).join("")}
    </div>`;

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div style="display:flex;gap:24px;flex-wrap:wrap;padding:16px;overflow-y:auto;max-height:520px">
        <div style="overflow-x:auto">${gridHTML}</div>
        <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:16px">
          <div>
            <h4 style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--c-accent)">→ HORIZONTALEMENT</h4>
            ${cluesH.map(p=>`<div style="font-size:12px;margin-bottom:5px;padding:4px 0;border-bottom:1px solid var(--c-border)"><strong>${p.num}.</strong> ${wordMap[p.word]||p.word}</div>`).join("")}
          </div>
          <div>
            <h4 style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--c-accent)">↓ VERTICALEMENT</h4>
            ${cluesV.map(p=>`<div style="font-size:12px;margin-bottom:5px;padding:4px 0;border-bottom:1px solid var(--c-border)"><strong>${p.num}.</strong> ${wordMap[p.word]||p.word}</div>`).join("")}
          </div>
        </div>
      </div>`;
  },

  _cwNext(input, r, c, size) {
    // Auto-advance to next cell
    const next = document.querySelector(`input[data-row="${r}"][data-col="${c+1}"]`) ||
                 document.querySelector(`input[data-row="${r+1}"]`);
    if (next) next.focus();
  },

  _cwKey(e, r, c, size) {
    if (e.key === "Backspace" && !e.target.value) {
      const prev = document.querySelector(`input[data-row="${r}"][data-col="${c-1}"]`);
      if (prev) { prev.value = ""; prev.focus(); }
    }
    if (e.key === "ArrowRight") document.querySelector(`input[data-row="${r}"][data-col="${c+1}"]`)?.focus();
    if (e.key === "ArrowLeft")  document.querySelector(`input[data-row="${r}"][data-col="${c-1}"]`)?.focus();
    if (e.key === "ArrowDown")  document.querySelector(`input[data-row="${r+1}"][data-col="${c}"]`)?.focus();
    if (e.key === "ArrowUp")    document.querySelector(`input[data-row="${r-1}"][data-col="${c}"]`)?.focus();
  },

  checkCrossword() {
    const inputs = document.querySelectorAll(".cw-grid input");
    let correct = 0, total = 0;
    inputs.forEach(inp => {
      total++;
      if (inp.value.toUpperCase() === inp.dataset.ans) {
        inp.style.color = "#4ade80"; correct++;
      } else if (inp.value) {
        inp.style.color = "#f87171";
      }
    });
    APP.toast(`✅ ${correct}/${total} lettres correctes !`, correct === total ? "success" : "info");
  },

  revealCrossword() {
    document.querySelectorAll(".cw-grid input").forEach(inp => {
      inp.value = inp.dataset.ans;
      inp.style.color = "#94a3b8";
    });
    APP.toast("Grille révélée", "info");
  },

  // ══════════════════════════════════════════════════════════════
  // MOTS MÊLÉS
  // ══════════════════════════════════════════════════════════════
  buildWordsearch(words, size) {
    const grid = Array.from({length:size}, () => Array(size).fill(""));
    const placements = [];
    const DIRS = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const word of words) {
      let placed = false;
      for (let attempt = 0; attempt < 150 && !placed; attempt++) {
        const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
        const rStart = Math.floor(Math.random() * size);
        const cStart = Math.floor(Math.random() * size);
        const cells = [];
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const r = rStart + dr*i, c = cStart + dc*i;
          if (r < 0 || r >= size || c < 0 || c >= size) { ok = false; break; }
          if (grid[r][c] && grid[r][c] !== word[i]) { ok = false; break; }
          cells.push([r, c]);
        }
        if (ok) {
          cells.forEach(([r,c], i) => grid[r][c] = word[i]);
          placements.push({ word, cells });
          placed = true;
        }
      }
    }

    // fill empty cells
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!grid[r][c]) grid[r][c] = LETTERS[Math.floor(Math.random() * 26)];

    return { grid, placements, size };
  },

  renderWordsearch(data, containerId) {
    const { grid, placements, size } = data;
    this.wsData = data;

    const container = document.getElementById(containerId);
    if (!container) return;

    let selecting = false, startCell = null, selectedCells = [], foundWords = new Set();

    const cellSize = Math.min(28, Math.floor(400 / size));

    container.innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap;padding:16px;overflow-y:auto;max-height:540px">
        <div>
          <div id="wsGrid" style="display:inline-grid;grid-template-columns:repeat(${size},${cellSize}px);gap:1px;background:var(--c-border);border:2px solid var(--c-border);border-radius:8px;padding:2px;user-select:none">
            ${grid.map((row,r) => row.map((letter,c) => `
              <div class="ws-cell" data-r="${r}" data-c="${c}"
                style="width:${cellSize}px;height:${cellSize}px;background:var(--c-surface);display:flex;align-items:center;justify-content:center;font-size:${Math.max(10,cellSize-6)}px;font-weight:700;cursor:pointer;border-radius:2px;transition:background .15s;color:var(--c-text)">
                ${letter}
              </div>`).join("")).join("")}
          </div>
          <div id="wsFoundCount" style="margin-top:10px;font-size:13px;color:var(--c-text2);text-align:center">0 / ${placements.length} mots trouvés</div>
        </div>
        <div style="flex:1;min-width:140px">
          <h4 style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--c-accent)">Mots à trouver :</h4>
          ${placements.map(p=>`<div id="ws-word-${p.word}" style="font-size:13px;margin-bottom:6px;padding:4px 8px;border-radius:4px;border:1px solid var(--c-border)">${p.word}</div>`).join("")}
        </div>
      </div>`;

    // Selection logic
    const wsGrid = document.getElementById("wsGrid");
    let hoveredCells = [];

    const getCellAt = (el) => {
      const cell = el.closest(".ws-cell");
      if (!cell) return null;
      return { r: parseInt(cell.dataset.r), c: parseInt(cell.dataset.c), el: cell };
    };

    const highlightPath = (start, end) => {
      hoveredCells.forEach(el => { if (!el.dataset.found) el.style.background = "var(--c-surface)"; });
      hoveredCells = [];
      if (!start || !end) return;
      const dr = Math.sign(end.r - start.r), dc = Math.sign(end.c - start.c);
      let r = start.r, c = start.c;
      while (true) {
        const el = wsGrid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if (el) { el.style.background = "rgba(232,168,56,0.3)"; hoveredCells.push(el); }
        if (r === end.r && c === end.c) break;
        r += dr; c += dc;
        if (hoveredCells.length > 20) break;
      }
    };

    const checkSelection = (start, end) => {
      if (!start || !end) return;
      const dr = Math.sign(end.r - start.r), dc = Math.sign(end.c - start.c);
      let word = "", cells = [], r = start.r, c = start.c;
      while (true) {
        const cellEl = wsGrid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        word += cellEl?.textContent.trim() || "";
        cells.push({ r, c, el: cellEl });
        if (r === end.r && c === end.c) break;
        r += dr; c += dc;
        if (cells.length > 20) break;
      }
      const rev = word.split("").reverse().join("");
      const match = placements.find(p => p.word === word || p.word === rev);
      if (match && !foundWords.has(match.word)) {
        foundWords.add(match.word);
        cells.forEach(({el}) => { if(el) { el.style.background="#4ade8040"; el.dataset.found="1"; el.style.color="#4ade80"; }});
        const wordEl = document.getElementById(`ws-word-${match.word}`);
        if (wordEl) { wordEl.style.textDecoration = "line-through"; wordEl.style.color = "#4ade80"; wordEl.style.borderColor = "#4ade80"; }
        document.getElementById("wsFoundCount").textContent = `${foundWords.size} / ${placements.length} mots trouvés`;
        if (foundWords.size === placements.length) APP.toast("🎉 Bravo ! Tous les mots trouvés !", "success");
        else APP.toast(`✅ "${match.word}" trouvé !`, "success");
      } else {
        hoveredCells.forEach(el => { if(!el.dataset.found) el.style.background="var(--c-surface)"; });
      }
    };

    wsGrid.addEventListener("mousedown", e => {
      const cell = getCellAt(e.target);
      if (!cell) return;
      selecting = true; startCell = cell;
    });
    wsGrid.addEventListener("mousemove", e => {
      if (!selecting) return;
      const cell = getCellAt(e.target);
      if (cell) highlightPath(startCell, cell);
    });
    wsGrid.addEventListener("mouseup", e => {
      if (!selecting) return;
      selecting = false;
      const cell = getCellAt(e.target);
      checkSelection(startCell, cell);
      hoveredCells.forEach(el => { if(!el.dataset.found) el.style.background="var(--c-surface)"; });
      hoveredCells = [];
    });

    // Touch support
    wsGrid.addEventListener("touchstart", e => {
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = getCellAt(el);
      if (cell) { selecting = true; startCell = cell; }
    }, { passive: true });
    wsGrid.addEventListener("touchmove", e => {
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = getCellAt(el);
      if (cell && selecting) highlightPath(startCell, cell);
    }, { passive: true });
    wsGrid.addEventListener("touchend", e => {
      if (!selecting) return;
      selecting = false;
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = getCellAt(el);
      checkSelection(startCell, cell);
      hoveredCells.forEach(el => { if(!el.dataset.found) el.style.background="var(--c-surface)"; });
      hoveredCells = [];
    }, { passive: true });
  },

  // ══════════════════════════════════════════════════════════════
  // RELIER (MATCHING)
  // ══════════════════════════════════════════════════════════════
  renderMatching(pairs, containerId) {
    this.mtData = { pairs, selected: null, matched: new Set(), connections: [] };
    const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div style="padding:16px">
        <svg id="mtSvg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1"></svg>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;position:relative">
          <div id="mtLeft" style="display:flex;flex-direction:column;gap:10px">
            ${pairs.map((p,i) => `<div class="mt-item mt-left" data-idx="${i}" data-side="left" 
              style="padding:10px 16px;background:var(--c-surface2);border:2px solid var(--c-border);border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:all .2s;position:relative">
              ${p.left}</div>`).join("")}
          </div>
          <div id="mtRight" style="display:flex;flex-direction:column;gap:10px">
            ${shuffledRight.map((p,i) => `<div class="mt-item mt-right" data-idx="${pairs.indexOf(p)}" data-side="right"
              style="padding:10px 16px;background:var(--c-surface2);border:2px solid var(--c-border);border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:all .2s">
              ${p.right}</div>`).join("")}
          </div>
        </div>
      </div>`;

    container.style.position = "relative";

    document.querySelectorAll(".mt-item").forEach(item => {
      item.addEventListener("click", () => this._mtSelect(item));
    });
  },

  _mtSelect(el) {
    const mt = this.mtData;
    if (!mt) return;
    const idx = parseInt(el.dataset.idx);
    const side = el.dataset.side;

    if (mt.matched.has(`${idx}`)) return; // already matched

    if (!mt.selected) {
      mt.selected = { el, idx, side };
      el.style.borderColor = "var(--c-accent)";
      el.style.background = "rgba(232,168,56,0.1)";
    } else {
      if (mt.selected.side === side) {
        // same side — switch selection
        mt.selected.el.style.borderColor = "var(--c-border)";
        mt.selected.el.style.background = "var(--c-surface2)";
        mt.selected = { el, idx, side };
        el.style.borderColor = "var(--c-accent)";
        el.style.background = "rgba(232,168,56,0.1)";
        return;
      }
      // Different sides — check match
      const leftIdx = side === "right" ? mt.selected.idx : idx;
      const rightIdx = side === "right" ? idx : mt.selected.idx;
      const correct = leftIdx === rightIdx;

      if (correct) {
        [el, mt.selected.el].forEach(e => {
          e.style.borderColor = "#4ade80";
          e.style.background = "rgba(74,222,128,0.1)";
          e.style.cursor = "default";
        });
        mt.matched.add(`${leftIdx}`);
        this._drawConnection(mt.selected.el, el, "#4ade80");
        if (mt.matched.size === mt.pairs.length) APP.toast("🎉 Tout relié correctement !", "success");
        else APP.toast("✅ Bonne association !", "success");
      } else {
        [el, mt.selected.el].forEach(e => {
          e.style.borderColor = "#f87171";
          setTimeout(() => { e.style.borderColor = "var(--c-border)"; e.style.background = "var(--c-surface2)"; }, 700);
        });
        APP.toast("❌ Mauvaise association", "error");
      }
      mt.selected = null;
    }
  },

  _drawConnection(elA, elB, color) {
    // Visual connection via border flash (SVG needs absolute coords)
    elA.style.boxShadow = `0 0 0 2px ${color}`;
    elB.style.boxShadow = `0 0 0 2px ${color}`;
  },

  checkMatching() {
    const mt = this.mtData;
    if (!mt) return;
    APP.toast(`${mt.matched.size}/${mt.pairs.length} paires reliées correctement`, "info");
  },

  resetMatching() {
    if (!this.mtData) return;
    this.renderMatching(this.mtData.pairs, document.querySelector(".mt-preview-area")?.id || "mtPreview");
    APP.toast("Exercice réinitialisé", "info");
  },

  // ══════════════════════════════════════════════════════════════
  // RENDER FROM SAVED DOC (lecture seule + interactif élève)
  // ══════════════════════════════════════════════════════════════
  renderDocForStudent(doc, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    switch(doc.type) {
      case "slides":
        container.innerHTML = `<div id="studentSlidesStage"></div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:14px;justify-content:center">
            <button class="btn-tool" onclick="ACTIVITIES.navigateSlide(-1)">◀</button>
            <span id="sCounter" style="color:var(--c-text2);font-size:13px">1/${doc.slides?.length||0}</span>
            <button class="btn-tool" onclick="ACTIVITIES.navigateSlide(1)">▶</button>
            <button class="btn-tool" onclick="ACTIVITIES.fullscreen()">⛶ Plein écran</button>
          </div>`;
        this.renderSlides(doc.slides || [], doc.theme || "dark", "studentSlidesStage");
        break;
      case "exercise":
      case "evaluation":
        container.innerHTML = this.renderExercisePreview(doc);
        break;
      case "crossword":
        this.renderCrossword(doc.grid, doc.words, doc.size, containerId);
        break;
      case "wordsearch":
        this.renderWordsearch({ grid: doc.grid, placements: doc.placements, size: doc.size }, containerId);
        break;
      case "matching":
        this.renderMatching(doc.pairs, containerId);
        break;
      default:
        container.innerHTML = `<p style="color:var(--c-text2)">Aperçu non disponible pour ce type.</p>`;
    }
  },

  // Collect student answers from a rendered exercise
  collectAnswers(doc) {
    const answers = {};
    if (doc.type === "exercise" || doc.type === "evaluation") {
      (doc.questions || []).forEach((q, i) => {
        if (q.type === "qcm" || q.type === "vf") {
          const radio = document.querySelector(`input[name="q${i}"]:checked`);
          answers[i] = radio?.value || "";
        } else {
          const ta = document.querySelector(`.ex-question[data-idx="${i}"] textarea`);
          const inputs = document.querySelectorAll(`.ex-question[data-idx="${i}"] input[type="text"]`);
          if (ta) answers[i] = ta.value;
          else answers[i] = Array.from(inputs).map(x=>x.value).join("|");
        }
      });
    }
    return answers;
  },

  // Auto-grade QCM/VF
  autoGrade(doc, answers) {
    let score = 0, total = 0;
    (doc.questions || []).forEach((q, i) => {
      const pts = q.points || 1;
      total += pts;
      if (q.type === "qcm" || q.type === "vf") {
        if ((answers[i]||"").toLowerCase().includes(q.answer?.toLowerCase()?.substring(0,1))) score += pts;
      }
    });
    return { score, total };
  },
};
