// ─── EduFlow — Clé API Groq ───────────────────────────────────────
// Remplacez la valeur ci-dessous par votre clé API Groq
// Obtenez-la sur : https://console.groq.com/keys

const API_CONFIG = {
  GROQ_API_KEY: "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",   // ← mettez votre clé ici
  GROQ_MODEL:   "llama-3.3-70b-versatile",   // ou "mixtral-8x7b-32768", "gemma2-9b-it"
  GROQ_ENDPOINT:"https://api.groq.com/openai/v1/chat/completions",
  MAX_TOKENS:   4096,
  TEMPERATURE:  0.7,
  BASE_SHARE_URL: "",                        // ex: "https://monsite.github.io/eduflow"
};
