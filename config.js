// ═══════════════════════════════════════════════════════════════
//  EDUFLOW — Configuration
//  1. Remplissez votre clé Groq
//  2. Remplissez votre config Firebase (console.firebase.google.com)
// ═══════════════════════════════════════════════════════════════

const EDUFLOW_CONFIG = {

  // ── GROQ API ──────────────────────────────────────────────────
  // Obtenez votre clé sur : https://console.groq.com/keys
  GROQ_API_KEY: "YOUR_GROQ_API_KEY_HERE",
  GROQ_MODEL:   "llama-3.3-70b-versatile",
  GROQ_ENDPOINT:"https://api.groq.com/openai/v1/chat/completions",

  // ── FIREBASE ──────────────────────────────────────────────────
  // Créez un projet sur : https://console.firebase.google.com
  // Puis : Paramètres > Vos applications > Config SDK
  FIREBASE: {
    apiKey:            "YOUR_FIREBASE_API_KEY",
    authDomain:        "your-project.firebaseapp.com",
    projectId:         "your-project-id",
    storageBucket:     "your-project.appspot.com",
    messagingSenderId: "000000000000",
    appId:             "1:000000000000:web:xxxxxxxxxxxxxxxx",
  },

  // ── GÉNÉRAL ───────────────────────────────────────────────────
  APP_NAME: "EduFlow",
  BASE_URL:  "",   // ex: "https://monecole.github.io/eduflow"
};
