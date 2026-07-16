# Configuration Supabase — VanCart CRM

## 1. Créer le projet

1. Créez un compte sur [supabase.com](https://supabase.com) et un nouveau projet (région `eu-west` conseillée).
2. Récupérez dans **Settings → API** : l'URL du projet et la clé **anon public**.
3. Copiez `.env.example` en `.env` à la racine du repo et remplissez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Sur Vercel, ajoutez ces deux variables dans **Settings → Environment Variables**.

## 2. Créer la table et les règles d'accès

Ouvrez **SQL Editor** dans le dashboard Supabase, collez le contenu de `schema.sql` et exécutez-le. Cela crée :

- la table `commerces` avec tous les champs de l'app,
- les règles de sécurité (RLS) : **tout utilisateur connecté voit et modifie tout**, les requêtes non authentifiées sont totalement bloquées,
- l'activation du temps réel (les changements d'un téléphone apparaissent en direct sur l'autre).

## 3. Créer les comptes Sullivan et Audrey

⚠️ La création de comptes par SQL direct dans `auth.users` n'est **pas recommandée** par Supabase (mots de passe hachés, colonnes internes susceptibles de changer). La procédure officielle et fiable passe par le dashboard :

1. Dashboard Supabase → **Authentication → Users → Add user → Create new user**
2. Créez les deux comptes :
   - Email de Sullivan + mot de passe choisi
   - Email d'Audrey + mot de passe choisi
3. Cochez **Auto Confirm User** pour chaque compte (sinon un email de confirmation serait requis).

C'est tout : l'app n'a pas de page d'inscription, seuls ces comptes créés manuellement peuvent se connecter.

Pensez aussi à désactiver les inscriptions libres par sécurité :
**Authentication → Sign In / Up → Providers → Email** : décochez « Allow new users to sign up ».

## 4. Vérifier

Lancez l'app (`npm run dev`), connectez-vous avec un des deux comptes, ajoutez un commerce, puis ouvrez l'app dans un autre navigateur avec l'autre compte : la fiche doit apparaître en direct.
