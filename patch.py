with open("app.js", "r") as f:
    content = f.read()

old = """function loadConfig() {
  const saved = localStorage.getItem("eduflow_config");
  if (saved) {
    const cfg = JSON.parse(saved);
    STATE.apiKey = cfg.apiKey || "";
    STATE.teacherName = cfg.teacherName || "";
  }
  // Override depuis api_config.js si présent
  if (typeof API_CONFIG !== "undefined") {
    if (!STATE.apiKey && API_CONFIG.GROQ_API_KEY !== "YOUR_GROQ_API_KEY_HERE") {
      STATE.apiKey = API_CONFIG.GROQ_API_KEY;
    }
  }
  updateApiStatus();
  if (STATE.teacherName) {
    const el = document.getElementById("teacherName");
    if (el) el.textContent = STATE.teacherName;
  }
}"""

new = """function loadConfig() {
  // Priorité 1 : api_config.js (clé en dur dans le fichier)
  if (typeof API_CONFIG !== "undefined" && API_CONFIG.GROQ_API_KEY && API_CONFIG.GROQ_API_KEY !== "YOUR_GROQ_API_KEY_HERE") {
    STATE.apiKey = API_CONFIG.GROQ_API_KEY;
  }
  // Priorité 2 : localStorage (clé saisie via l'interface sidebar)
  const saved = localStorage.getItem("eduflow_config");
  if (saved) {
    const cfg = JSON.parse(saved);
    if (cfg.apiKey) STATE.apiKey = cfg.apiKey;
    if (cfg.teacherName) STATE.teacherName = cfg.teacherName;
  }
  updateApiStatus();
  if (STATE.teacherName) {
    const el = document.getElementById("teacherName");
    if (el) el.textContent = STATE.teacherName;
  }
}"""

if old in content:
    content = content.replace(old, new)
    with open("app.js", "w") as f:
        f.write(content)
    print("loadConfig patché OK")
else:
    print("PATTERN NOT FOUND")
    # Show what's there
    idx = content.find("function loadConfig")
    print(repr(content[idx:idx+600]))
