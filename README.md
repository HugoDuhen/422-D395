# Section 422 — plateforme membres

Application pour la section : accès commun à tout le site pour les membres, avec des rôles
additionnels (sport, photos, cadre, ...) qui débloquent des droits d'édition ou de lecture élargis.

## Stack

- **Serveur** : Node.js + Express + Prisma (SQLite en dev, MySQL en prod) + JWT (cookie httpOnly)
- **Client** : React + Vite + Tailwind CSS v4 + Framer Motion, mobile-first
- Une seule app Node déployée : le serveur sert l'API (`/api/*`) et les fichiers statiques du build client.

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

## Développement local

```bash
# Serveur
cd server
cp .env.example .env
npm install
npx prisma db push       # crée dev.db (SQLite)
node prisma/seed.js      # crée les rôles par défaut + un compte admin
npm run dev               # http://localhost:3001

# Client (autre terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (proxy /api vers le serveur)
```

Identifiants du compte admin créés par le seed : voir la sortie de `node prisma/seed.js`
(configurable via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` dans `.env`). **Change ce mot de passe
dès la première connexion.**

## Build de production

```bash
cd client && npm run build     # génère client/dist
cd ../server && npm install --omit=dev
```

Le serveur sert automatiquement `client/dist` en production (`NODE_ENV=production`).

## Déploiement sur o2switch (cPanel)

1. **Base de données MySQL** : crée une base MySQL depuis cPanel, note utilisateur/mot de
   passe/nom de base.
2. **Datasource Prisma** : dans `server/prisma/schema.prisma`, passe `provider = "sqlite"` à
   `provider = "mysql"`. Renseigne `DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DBNAME"`
   dans `server/.env` (côté serveur o2switch, pas dans le repo).
3. **App Node.js (cPanel → "Configuration Node.js")** :
   - Version Node : la plus récente disponible (Node 20+).
   - Dossier racine de l'app : `server`.
   - Fichier de démarrage (Application startup file) : `src/index.js`.
   - Mode : Production.
   - Variables d'environnement à définir dans l'interface cPanel : `DATABASE_URL`, `JWT_SECRET`
     (chaîne longue aléatoire), `PORT` (généralement imposé par cPanel/Passenger), `UPLOADS_DIR`
     (ex: `/home/USER/section-uploads` — en dehors du dossier servi publiquement).
4. Depuis le terminal cPanel (ou SSH) :
   ```bash
   cd ~/section/server
   npm install --omit=dev
   npx prisma generate
   npx prisma db push          # crée les tables sur MySQL (premier déploiement)
   node prisma/seed.js         # crée les rôles + le compte admin initial
   ```
   Puis build le client (peut se faire en local et uploader `client/dist`, ou directement sur le
   serveur si Node/npm y sont dispo pour le build) :
   ```bash
   cd ~/section/client
   npm install
   npm run build
   ```
5. Redémarre l'app Node depuis cPanel ("Restart").
6. Pointe le domaine/sous-domaine de la section vers l'app Node (cPanel s'en charge via le proxy
   Passenger une fois l'app configurée).

### Mises à jour ultérieures du schéma

Pour un petit projet avec un seul environnement de prod, le plus simple reste `npx prisma db push`
après avoir modifié `schema.prisma` (pousse le nouveau schéma sur MySQL sans gérer de fichiers de
migration séparés). Attention aux avertissements de perte de données si tu supprimes une colonne.
