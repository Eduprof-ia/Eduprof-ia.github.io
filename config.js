// ═══════════════════════════════════════════════════════════════
//  EDUFLOW — Configuration
//  1. Remplissez votre clé Groq
//  2. Remplissez votre config Firebase (console.firebase.google.com)
// ═══════════════════════════════════════════════════════════════

const EDUFLOW_CONFIG = {

  // ── GROQ API ──────────────────────────────────────────────────
  // Obtenez votre clé sur : https://console.groq.com/keys
  GROQ_API_KEY: "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",
  GROQ_MODEL:   "llama-3.3-70b-versatile",
  GROQ_ENDPOINT:"https://api.groq.com/openai/v1/chat/completions",

  // ── FIREBASE ──────────────────────────────────────────────────
  // Créez un projet sur : https://console.firebase.google.com
  // Puis : Paramètres > Vos applications > Config SDK
  FIREBASE: {
    apiKey:            "AIzaSyA6_UvjgUF0qwC2Oikkvj4pZEZJ-Zc1M5E",
    authDomain:        "eduflow-7031a.firebaseapp.com",
    projectId:         "eduflow-7031a",
    storageBucket:     "eduflow-7031a.firebasestorage.app",
    messagingSenderId: "1065555775545",
    appId:             "1:1065555775545:web:fc1cdd1f81051dc8f07de8",
  },

  // ── GÉNÉRAL ───────────────────────────────────────────────────
  APP_NAME: "Eduflow",
  BASE_URL:  "https://eduprof-ia.github.io/",   // ex: "https://monecole.github.io/eduflow"
};
