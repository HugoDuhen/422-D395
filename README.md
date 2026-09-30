# Section 422 — plateforme membres

Application pour la section : accès commun à tout le site pour les membres, avec des rôles
additionnels (sport, photos, cadre, ...) qui débloquent des droits d'édition ou de lecture élargis.

## Stack

- **Serveur** : Node.js + Express + JWT (cookie httpOnly). Stockage des données en **fichier JSON
  local** (`server/data/db.json`), pas de base de données — simple à faire tourner n'importe où,
  y compris en local sans rien à installer à part Node.
- **Client** : React + Vite + Tailwind CSS v4 + Framer Motion, mobile-first
- Une seule app Node déployée : le serveur sert l'API (`/api/*`) et les fichiers statiques du build client.

> Le stockage JSON convient pour une section (usage modéré, un seul process Node). Si le projet
> grossit ou qu'un vrai hébergement avec base de données est disponible plus tard, il sera temps de
> migrer vers une DB — pas avant.

## Rôles

- `isAdmin` (sur le compte, pas un rôle) : gère les comptes, les rôles, tout.
- Rôles dynamiques créés depuis l'admin (`/admin` → onglet Rôles). Par défaut : `sport`, `photos`, `cadre`.
  - `sport` : peut publier/modifier des infos sport (les siennes, ou toutes si admin).
  - `photos` : peut envoyer et supprimer des photos dans le drive.
  - `cadre` : accès en lecture à l'annuaire complet des membres, mais pas de droits d'administration.
- Tout membre connecté voit l'ensemble du site (sport, photos) ; les rôles ne contrôlent que l'édition
  et l'accès à l'annuaire/admin.
- Pour ajouter un nouveau rôle (ex: "cuisine"), l'admin le crée dans l'onglet Rôles puis l'assigne aux
  membres concernés. Un nouveau rôle ne donne des droits d'édition que si le code d'une route les
  vérifie explicitement (ex: `requireRole('cuisine')`) — sinon il sert de simple badge/filtre.

## Photos / drive

- Les photos sont stockées en qualité originale (`server/uploads/originals`) et un aperçu compressé
  (WebP, 1600px de large max) est généré à l'upload avec `sharp` (`server/uploads/previews`).
- La page Photos affiche les aperçus (chargement rapide), et propose un bouton "Qualité max" qui
  télécharge le fichier original.
- Formats acceptés : JPEG, PNG, WebP, GIF, HEIC/HEIF (iPhone). Si `sharp`/libvips ne sait pas décoder un
  HEIC sur l'hébergement (dépend du build), l'app bascule automatiquement l'original en aperçu — l'upload
  ne casse jamais, seul l'aperçu peut être plus lourd que prévu pour ces cas-là.
- L'upload utilise un simple `<input type="file" accept="image/*" multiple>`, ce qui ouvre sur mobile le
  sélecteur natif (galerie + appareil photo), pour envoyer plusieurs photos existantes facilement.

## Stockage des données

Tout vit dans `server/data/db.json` (utilisateurs, rôles, publications sport, métadonnées photos) —
un objet `{ users: [], roles: [], sportEntries: [], photos: [] }` réécrit à chaque écriture
(atomique via fichier temporaire + renommage). Les fichiers photo (originaux + aperçus) vivent à côté
dans `server/uploads/`.

**Sauvegarde** : ces deux dossiers (`server/data/`, `server/uploads/`) sont tout ce qu'il faut copier
pour sauvegarder ou migrer l'appli. À faire régulièrement (ex: copie automatique quotidienne) une fois
en prod.

## Développement local

```bash
# Serveur
cd server
cp .env.example .env
npm install
npm run seed       # crée les rôles par défaut + un compte admin dans data/db.json
npm run dev         # http://localhost:3001

# Client (autre terminal)
cd client
npm install
npm run dev         # http://localhost:5173 (proxy /api vers le serveur)
```

Identifiants du compte admin créés par le seed : voir la sortie de `npm run seed`
(configurable via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` dans `.env`). **Change ce mot de passe
dès la première connexion.**

## Build de production

```bash
cd client && npm run build     # génère client/dist
cd ../server && npm install --omit=dev
```

Le serveur sert automatiquement `client/dist` en production (`NODE_ENV=production`).

## Déploiement (o2switch ou ailleurs)

Pas d'accès o2switch pour l'instant — à faire quand ce sera disponible. En résumé, ça sera :

1. **App Node.js** (cPanel → "Configuration Node.js") : dossier racine `server`, fichier de démarrage
   `src/index.js`, mode Production.
2. Variables d'environnement à définir : `JWT_SECRET` (chaîne longue aléatoire), `PORT` (imposé par
   Passenger), `UPLOADS_DIR` et `DATA_FILE` pointant vers des chemins **persistants** en dehors du
   dossier de déploiement (pour ne pas perdre les données à chaque redéploiement).
3. `npm install --omit=dev`, `npm run seed` (une seule fois, pour créer le premier compte admin),
   build du client (`cd client && npm install && npm run build`), puis redémarrage de l'app.

Aucune base de données à créer — le fichier JSON suffit tant que l'appli tourne sur un seul process.
