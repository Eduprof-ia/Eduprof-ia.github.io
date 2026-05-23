/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              EDUFLOW — Configuration API Grok (xAI)          ║
 * ║   ✏️  Modifiez UNIQUEMENT ce fichier pour changer l'API Key   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * 📌 INSTRUCTIONS :
 *   1. Remplacez la valeur de GROK_API_KEY par votre vraie clé API
 *   2. Obtenez votre clé sur : https://console.x.ai/
 *   3. ⚠️  Ne partagez JAMAIS ce fichier publiquement avec votre clé réelle
 *   4. Ajoutez api_config.js dans votre .gitignore si vous pushez sur GitHub
 *
 * 🔗 Endpoint Grok (xAI) : https://api.x.ai/v1/chat/completions
 */

const API_CONFIG = {
  // ─── Clé API Grok ──────────────────────────────────────────────
  // Remplacez "YOUR_GROK_API_KEY_HERE" par votre clé réelle
  GROK_API_KEY: "YOUR_GROK_API_KEY_HERE",

  // ─── Modèle Grok ───────────────────────────────────────────────
  // Options disponibles : "grok-3", "grok-3-mini", "grok-2"
  GROK_MODEL: "grok-3",

  // ─── Endpoint API ──────────────────────────────────────────────
  GROK_ENDPOINT: "https://api.x.ai/v1/chat/completions",

  // ─── Paramètres de génération ──────────────────────────────────
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,

  // ─── Langue par défaut ─────────────────────────────────────────
  DEFAULT_LANGUAGE: "fr",

  // ─── Fonctionnalité de partage (liens élèves) ──────────────────
  // URL de base de votre déploiement GitHub Pages ou hébergeur
  // Ex: "https://mon-ecole.github.io/eduflow"
  // Laissez vide pour utiliser l'URL courante automatiquement
  BASE_SHARE_URL: "",
};

// Export pour usage dans app.js
if (typeof module !== "undefined") module.exports = API_CONFIG;
