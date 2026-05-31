# 🎓 EduFlow — Plateforme Pédagogique Complète

Application web pour enseignants et élèves — 2 fichiers seulement.

## 📁 Fichiers
- `index.html` — Toute l'application (app complète)
- `config.js`  — **Vos clés API** (Groq + Firebase)

## ⚡ Démarrage

### 1. Remplir `config.js`
```js
GROQ_API_KEY: "gsk_votre_clé",  // console.groq.com/keys
FIREBASE: { ... }               // console.firebase.google.com
```

### 2. Ouvrir `index.html` dans Chrome/Firefox
✅ Fonctionne sans serveur, sans installation !

## 👩‍🏫 Workflow Enseignant
1. Créer un compte → identifiant + mot de passe
2. Créer une classe → code généré automatiquement
3. Partager le code avec les élèves
4. Créer du contenu (diaporamas, exercices, mots croisés…)
5. Partager les documents avec la classe
6. Corriger et noter les rendus

## 🎒 Workflow Élève
**Connexion directe** (sans compte) :
- Choisir "Je suis Élève" → entrer le code de classe → accéder immédiatement

**Avec compte** (pour rendre des travaux notés) :
- Créer un compte → entrer le code de classe → identifiant + mot de passe

## 🎮 Activités disponibles
| Activité | Description |
|---|---|
| 🖥 Diaporama | Slides animées, 4 thèmes, images, plein écran |
| ✏️ Exercice | Texte à trous, QCM, Vrai/Faux, questions ouvertes |
| 🔤 Mots croisés | Grille interactive, clavier, vérification |
| 🔍 Mots mêlés | Sélection souris + tactile, surlignage |
| 🔗 Relier | Associer colonnes, validation animée |
| 📝 Évaluation | Noté automatiquement, corrigé par le prof |

## 🌐 Déploiement GitHub Pages
```bash
git init && git add . && git commit -m "EduFlow"
git remote add origin https://github.com/VOUS/eduflow.git
git push -u origin main
# Puis Settings → Pages → main / root
```

## 🔑 Firebase (optionnel)
Sans Firebase : données stockées localement (parfait pour tester).
Avec Firebase : multi-appareils, données persistantes.

Activez dans Firebase Console :
- Firestore Database (mode test)
