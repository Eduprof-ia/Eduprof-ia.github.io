# 🎓 EduFlow — Plateforme Enseignant

> Logiciel web pour enseignants : générez des évaluations, devoirs et présentations animées avec l'IA Grok, exportez en PDF, et partagez avec vos élèves.

![EduFlow](https://img.shields.io/badge/EduFlow-v1.0-e8a838?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![HTML](https://img.shields.io/badge/HTML%2FCSS%2FJS-Single%20Page-blue?style=flat-square)

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📝 **Évaluations** | QCM, Vrai/Faux, questions ouvertes, calculs — générées par IA |
| 📖 **Devoirs** | Exercices, rédactions, projets — adaptés au niveau |
| 🖥 **Présentations** | Diapositives animées avec 4 thèmes visuels |
| 📄 **Export PDF** | Export haute qualité de tous vos documents |
| 🔗 **Partage élèves** | Liens uniques pour partager en lecture seule |
| 🤖 **Chat IA** | Assistant pédagogique conversationnel intégré |
| 📚 **Bibliothèque** | Sauvegardez et retrouvez toutes vos créations |

---

## 🚀 Déploiement sur GitHub Pages

### 1. Cloner / uploader le projet
```bash
git init
git add .
git commit -m "Initial commit — EduFlow"
git remote add origin https://github.com/VOTRE_NOM/eduflow.git
git push -u origin main
```

### 2. Activer GitHub Pages
- Allez dans **Settings** → **Pages**
- Source : `main` / `root`
- Votre app sera disponible sur : `https://VOTRE_NOM.github.io/eduflow`

### 3. Configurer l'URL de partage
Dans `api_config.js`, mettez à jour :
```javascript
BASE_SHARE_URL: "https://VOTRE_NOM.github.io/eduflow",
```

---

## 🔑 Configuration API Grok

### Option A — Interface graphique (recommandé)
1. Ouvrez l'app → cliquez **⚙️ Configurer l'API**
2. Entrez votre clé API Grok
3. Sauvegardez — la clé est stockée localement dans votre navigateur

### Option B — Fichier `api_config.js`
```javascript
const API_CONFIG = {
  GROK_API_KEY: "xai-votre-clé-ici",  // ← Modifiez ici
  GROK_MODEL: "grok-3",
  // ...
};
```

> ⚠️ **Important** : Si vous déployez publiquement, ajoutez `api_config.js` dans `.gitignore` pour ne pas exposer votre clé.

### Obtenir une clé API Grok
Rendez-vous sur [console.x.ai](https://console.x.ai/) pour créer votre compte et générer une clé.

---

## 📁 Structure du projet

```
eduflow/
├── index.html      # Application principale (single-page)
├── style.css       # Styles et animations
├── app.js          # Logique complète (navigation, IA, PDF, chat)
├── api_config.js   # ← VOTRE CLÉ API (ne pas partager publiquement)
└── README.md       # Ce fichier
```

---

## 🎨 Thèmes de présentation

| Thème | Style |
|---|---|
| 🎨 **Moderne** | Dark blue gradient, accents dorés |
| 📚 **Académique** | Fond crème, bleu institutionnel |
| 🌈 **Coloré** | Gradient violet/indigo, texte blanc |
| ◻️ **Minimal** | Blanc pur, bordures noires |

---

## 🔗 Système de partage élèves

Chaque document sauvegardé génère un lien unique :
```
https://votre-site.github.io/eduflow?view=eleve&doc=ABC123
```

Les élèves voient le document en **lecture seule** avec une interface épurée, sans avoir besoin de compte.

---

## 🤖 Assistant Chat IA

L'assistant conversationnel (bouton 💬 en bas à droite) peut :
- Conseiller sur la conception pédagogique
- Suggérer des activités différenciées
- Répondre aux questions sur l'enseignement
- Garder le contexte de la conversation

---

## 📋 Raccourcis clavier

| Touche | Action |
|---|---|
| `→` / `↓` | Diapositive suivante (en présentation) |
| `←` / `↑` | Diapositive précédente |
| `Échap` | Fermer le mode plein écran |
| `Entrée` | Envoyer un message (chat) |

---

## 📄 Licence

MIT © 2025 EduFlow

---

*Propulsé par [Grok (xAI)](https://x.ai) · Conçu pour les enseignants*
