# 🎓 EduFlow v2 — Plateforme Pédagogique Complète

> Plateforme enseignant + élèves : créez des diaporamas, exercices, mots croisés, mots mêlés, exercices relier et évaluations avec l'IA Groq. Les élèves s'inscrivent avec un code de classe, font les activités et rendent leurs travaux. Les profs notent directement dans l'app.

---

## 🚀 Démarrage rapide

### 1. Configurer `config.js`
```js
const EDUFLOW_CONFIG = {
  GROQ_API_KEY: "gsk_xxxxxxxxxxxxxxxxxxxx",  // ← votre clé Groq
  GROQ_MODEL:   "llama-3.3-70b-versatile",
  // Firebase (optionnel — fonctionne sans en mode local)
  FIREBASE: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    ...
  },
};
```

### 2. Ouvrir `index.html` dans un navigateur
Ou déployer sur GitHub Pages (voir ci-dessous).

---

## 📁 Structure des fichiers

```
eduflow/
├── index.html      ← App complète (single-page)
├── style.css       ← Design complet
├── config.js       ← ⚙️ VOS CLÉS API (Groq + Firebase)
├── db.js           ← Couche données (Firebase + localStorage)
├── auth.js         ← Authentification (pseudo + mot de passe)
├── creators.js     ← Générateurs de contenu IA
├── activities.js   ← Moteurs interactifs (mots croisés, etc.)
├── student.js      ← Espace élève
├── app.js          ← Contrôleur principal
└── README.md
```

---

## 👩‍🏫 Workflow Enseignant

1. **Créer un compte** → identifiant + mot de passe (pas d'email !)
2. **Créer une classe** → un code est généré automatiquement (ex: `ABC-XYZ`)
3. **Partager le code** avec vos élèves
4. **Créer du contenu** : diaporama, exercice, mots croisés, mots mêlés, relier, évaluation
5. **Partager avec une classe** → optionnel : date limite + à rendre
6. **Corriger et noter** les rendus dans "Travaux & Notes"

---

## 🎒 Workflow Élève

1. **Créer un compte** → prénom+nom, identifiant, mot de passe, **code de classe**
2. **Accéder aux documents** partagés par le prof
3. **Faire les activités** interactivement (mots croisés, mots mêlés, etc.)
4. **Rendre les exercices** notés
5. **Voir ses notes** dans "Mes travaux rendus"

---

## 🔑 Obtenir les clés API

### Groq (IA — GRATUIT)
1. Aller sur [console.groq.com/keys](https://console.groq.com/keys)
2. Créer une clé → copier dans `config.js`

### Firebase (base de données — OPTIONNEL)
Sans Firebase, l'app fonctionne en mode **local** (données dans le navigateur).

Pour activer Firebase (recommandé pour une vraie école) :
1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créer un projet → Ajouter une app Web
3. Copier la config dans `config.js`
4. Activer **Firestore Database** (mode test)
5. Activer **Authentication** → méthode Email/Password

---

## 🌐 Déploiement GitHub Pages

```bash
git init
git add .
git commit -m "EduFlow v2"
git remote add origin https://github.com/VOTRE_NOM/eduflow.git
git push -u origin main
```

Puis : **Settings → Pages → Source: main / root**

URL finale : `https://VOTRE_NOM.github.io/eduflow`

---

## 🎮 Activités disponibles

| Type | Description | Interactif |
|---|---|---|
| 🖥 Diaporama | Slides animées + images + plein écran | Lecture |
| ✏️ Exercice | Texte à trous, QCM, Vrai/Faux, questions ouvertes | ✅ À rendre |
| 🔤 Mots croisés | Grille générée + navigation clavier | ✅ Interactif |
| 🔍 Mots mêlés | Sélection à la souris/tactile | ✅ Interactif |
| 🔗 Relier | Associer colonnes gauche/droite | ✅ Interactif |
| 📝 Évaluation | QCM/Vrai-Faux auto-corrigé + notes | ✅ À rendre |

---

## 📋 Raccourcis clavier

| Touche | Action |
|---|---|
| `→` / `←` | Slide suivante/précédente |
| `Échap` | Fermer plein écran |
| `Entrée` | Envoyer message chat |
| `Tab` | Navigation dans mots croisés |
| `↑↓←→` | Déplacement dans la grille |

---

*EduFlow v2 — Propulsé par Groq IA · Conçu pour les enseignants*
