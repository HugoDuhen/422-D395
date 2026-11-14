# Section 422 — plateforme membres

Application pour la section : accès commun à tout le site pour les membres, avec des rôles
additionnels (sport, photos, cadre, ...) qui débloquent des droits d'édition ou de lecture élargis.

## Stack

- **Serveur** : Node.js + Express + JWT (cookie httpOnly). Stockage des données en **Postgres**
  (table par entité : users, roles, sport_entries, albums).
- **Client** : React + Vite + Tailwind CSS v4 + Framer Motion, mobile-first.
- **Hébergement visé (gratuit)** : [Vercel](https://vercel.com) pour le site (frontend statique +
  API en fonction serverless) + [Neon](https://neon.tech) pour la base Postgres (free tier, se
  réveille automatiquement — pas de pause manuelle comme sur d'autres fournisseurs). Pas de fichier à
  stocker côté serveur (les photos sont des liens vers des albums iCloud, voir plus bas), donc pas
  besoin de stockage objet.
- En local ou sur un hébergeur classique (o2switch...), le même code tourne en un seul process Node
  qui sert l'API et le build du client (`server/src/index.js`). Sur Vercel, le client est déployé à
  part comme site statique et l'API comme fonction serverless (`api/index.mjs`) — les deux partagent
  le même code (`server/src/app.js`).

> Pourquoi Postgres et pas un simple fichier JSON (version précédente) ? Les fonctions serverless de
> Vercel ont un système de fichiers éphémère — rien n'est persistant entre deux requêtes. Il fallait
> un vrai stockage externe. Les données restent minimales (pas de fichiers binaires), donc le free
> tier Neon (500 Mo) est très confortable.

## Rôles

- `isAdmin` (sur le compte, pas un rôle) : gère les comptes, les rôles, tout.
- Rôles dynamiques créés depuis l'admin (`/admin` → onglet Rôles). Par défaut : `sport`, `photos`, `cadre`.
  - `sport` : peut publier/modifier des infos sport (les siennes, ou toutes si admin).
  - `photos` : peut ajouter/modifier/supprimer des liens d'albums photos.
  - `cadre` : accès en lecture à l'annuaire complet des membres, mais pas de droits d'administration.
- Tout membre connecté voit l'ensemble du site (sport, photos) ; les rôles ne contrôlent que l'édition
  et l'accès à l'annuaire/admin.
- Pour ajouter un nouveau rôle (ex: "cuisine"), l'admin le crée dans l'onglet Rôles puis l'assigne aux
  membres concernés. Un nouveau rôle ne donne des droits d'édition que si le code d'une route les
  vérifie explicitement (ex: `requireRole('cuisine')`) — sinon il sert de simple badge/filtre.

## Photos

Les photos elles-mêmes ne sont **pas** hébergées par l'appli : elles vivent dans des **albums
partagés iCloud** créés à côté. L'appli ne gère que la liste des liens (titre, URL de l'album,
description, qui l'a ajouté). Avantage : zéro stockage fichier côté serveur, zéro limite de taille à
gérer, et ça tient dans n'importe quel free tier de base de données.

- N'importe quel membre avec le rôle `photos` peut ajouter/modifier/supprimer un lien d'album (le
  sien, ou n'importe lequel si admin).
- Tout le monde peut voir la liste et cliquer pour ouvrir l'album sur iCloud.
- Le champ lien accepte n'importe quelle URL `http(s)://` (pas restreint à icloud.com, au cas où un
  autre service serait utilisé un jour).

## Développement local

Il faut un Postgres accessible (local, ou directement une base Neon de dev — dans les deux cas,
même code).

```bash
# Serveur
cd server
cp .env.example .env    # renseigne DATABASE_URL (+ JWT_SECRET)
npm install
npm run migrate          # crée les tables si elles n'existent pas
npm run seed              # crée les rôles par défaut + un compte admin
npm run dev                # http://localhost:3001

# Client (autre terminal)
cd client
npm install
npm run dev                # http://localhost:5173 (proxy /api vers le serveur)
```

Identifiants du compte admin créés par le seed : voir la sortie de `npm run seed`
(configurable via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` dans `.env`). **Change ce mot de passe
dès la première connexion.**

## Déploiement sur Vercel + Neon (gratuit)

1. **Créer la base Neon** : compte sur [neon.tech](https://neon.tech) → nouveau projet → copier la
   "Connection string" (format `postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require`).
2. **Appliquer le schéma une première fois** depuis ta machine, en pointant vers Neon :
   ```bash
   cd server
   DATABASE_URL="<connection string Neon>" npm run migrate
   DATABASE_URL="<connection string Neon>" npm run seed
   ```
3. **Créer le projet Vercel** : sur [vercel.com](https://vercel.com), "Add New Project" → importer le
   repo GitHub `HugoDuhen/422-D395`. Vercel détecte `vercel.json` à la racine (build du client,
   fonction serverless pour l'API) — pas de configuration manuelle de build nécessaire.
4. **Variables d'environnement** (Vercel → Settings → Environment Variables) :
   - `DATABASE_URL` : la connection string Neon.
   - `JWT_SECRET` : une chaîne longue aléatoire (différente de celle utilisée en local).
   - `NODE_ENV` : `production`.
5. Déployer. Le site est servi en statique, l'API tourne en fonction serverless sur `/api/*`.
6. Pour les mises à jour de schéma plus tard : relancer `npm run migrate` avec `DATABASE_URL` pointée
   sur Neon (les `CREATE TABLE IF NOT EXISTS` sont sans danger à rejouer).

### Limites du free tier à connaître

- **Neon** : 500 Mo de stockage (largement suffisant, aucun fichier binaire stocké), le compute se
  met en veille après inactivité mais se réveille automatiquement à la prochaine requête (pas
  d'action manuelle, contrairement à certains autres fournisseurs).
- **Vercel (Hobby)** : gratuit pour un usage non-commercial, largement suffisant pour le trafic d'une
  section. Un cold start (une petite latence) est possible sur la première requête après une période
  d'inactivité.

## Alternative : o2switch ou tout hébergeur avec process Node persistant

Si un hébergement avec accès direct (cPanel, VPS...) devient disponible, le même code tourne sans
rien changer côté archi (juste `DATABASE_URL` à pointer vers la base Postgres choisie — Neon reste
valable, ou une base Postgres fournie par l'hébergeur) :

1. **App Node.js** (cPanel → "Configuration Node.js", ou équivalent) : dossier racine `server`,
   fichier de démarrage `src/index.js`, mode Production.
2. Variables d'environnement : `DATABASE_URL`, `JWT_SECRET`, `PORT` (souvent imposé par l'hébergeur).
3. `npm install --omit=dev`, `npm run migrate`, `npm run seed` (une seule fois), build du client
   (`cd client && npm install && npm run build` — le serveur sert `client/dist` automatiquement en
   production), puis démarrage/redémarrage de l'app.
