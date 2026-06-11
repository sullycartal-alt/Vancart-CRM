# VanCart CRM 📱

CRM mobile-first de prospection terrain pour **VanCart**, la carte de fidélité digitale.

Conçu pour deux fondateurs — **Sullivan** et **Audrey** — qui font du porte-à-porte à Paris pour signer des cafés, bars et restaurants. L'application fonctionne hors-ligne (PWA), s'installe sur l'écran d'accueil et stocke toutes les données en local sur le téléphone (localStorage).

## Fonctionnalités

- **Accueil** : métriques du jour (visites, intéressés, taux de conversion), rappels du jour, relances chaudes (prospects intéressés non contactés depuis plus de 3 jours)
- **Ajouter** : formulaire ultra-rapide optimisé mobile pour saisir un commerce en pleine rue (gros boutons, vibration à la validation)
- **Pipeline** : liste des commerces groupés par statut, recherche, filtre par prospecteur, mise à jour rapide via un drawer
- **Stats** : graphiques Recharts, top quartiers, comparatif Sullivan vs Audrey, meilleur jour de prospection

## Stack technique

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (service worker + manifest)
- [Recharts](https://recharts.org/) pour les graphiques
- Persistance locale via `localStorage` (aucun backend nécessaire)

## Démarrage en local

```bash
npm install
npm run dev
```

L'application est disponible sur [http://localhost:5173](http://localhost:5173).

Pour vérifier le build de production :

```bash
npm run build
npm run preview
```

## Déploiement sur Vercel

1. Connectez le repo GitHub à [Vercel](https://vercel.com) (New Project → Import Git Repository)
2. Framework preset : **Vite** (détecté automatiquement)
3. Build command : `npm run build`
4. Output directory : `dist`
5. Déployez 🚀

Chaque push sur `main` déclenchera automatiquement un nouveau déploiement.

## Installation PWA sur téléphone

### Safari (iOS)

1. Ouvrez l'URL de l'application dans Safari
2. Touchez le bouton **Partager** (carré avec flèche vers le haut)
3. Choisissez **Sur l'écran d'accueil**
4. Validez : l'icône VanCart apparaît comme une vraie app, en plein écran

### Chrome (Android)

1. Ouvrez l'URL de l'application dans Chrome
2. Touchez le menu ⋮ → **Installer l'application** (ou la bannière d'installation)

## Données

Au premier lancement, 6 commerces parisiens fictifs sont pré-chargés pour découvrir l'application. Toutes les données sont stockées dans le `localStorage` du navigateur : elles restent sur l'appareil et survivent aux fermetures de l'app.
