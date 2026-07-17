-- ============================================================
-- VanCart CRM — Wiki d'équipe (espace "Docs")
-- À exécuter manuellement dans Supabase → SQL Editor, APRÈS schema.sql
-- ============================================================

create table if not exists public.wiki_dossiers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ordre integer not null default 0,
  -- Traçabilité uniquement : ne restreint jamais l'accès
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.wiki_dossiers (id) on delete cascade,
  titre text not null,
  contenu text not null default '',
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wiki_fichiers (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.wiki_pages (id) on delete cascade,
  nom_original text not null,
  chemin_storage text not null,
  taille_octets integer,
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_wiki_pages_dossier_id on public.wiki_pages (dossier_id);
create index if not exists idx_wiki_fichiers_page_id on public.wiki_fichiers (page_id);

-- Mise à jour automatique de updated_at/updated_by — même principe que la
-- fonction maj_updated_at() déjà utilisée sur la table commerces
-- (voir schema.sql), étendue ici pour tamponner aussi l'auteur du changement.
create or replace function public.maj_wiki_page()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists trigger_maj_wiki_page on public.wiki_pages;
create trigger trigger_maj_wiki_page
  before update on public.wiki_pages
  for each row
  execute function public.maj_wiki_page();

-- ============================================================
-- Row Level Security : exactement les mêmes règles que la table
-- commerces — accès complet en lecture/écriture pour tout utilisateur
-- authentifié, rien pour les requêtes anonymes, aucun cloisonnement
-- entre membres de l'équipe.
-- ============================================================

alter table public.wiki_dossiers enable row level security;
alter table public.wiki_pages enable row level security;
alter table public.wiki_fichiers enable row level security;

drop policy if exists "lecture équipe authentifiée" on public.wiki_dossiers;
create policy "lecture équipe authentifiée"
  on public.wiki_dossiers for select to authenticated using (true);
drop policy if exists "insertion équipe authentifiée" on public.wiki_dossiers;
create policy "insertion équipe authentifiée"
  on public.wiki_dossiers for insert to authenticated with check (true);
drop policy if exists "modification équipe authentifiée" on public.wiki_dossiers;
create policy "modification équipe authentifiée"
  on public.wiki_dossiers for update to authenticated using (true) with check (true);
drop policy if exists "suppression équipe authentifiée" on public.wiki_dossiers;
create policy "suppression équipe authentifiée"
  on public.wiki_dossiers for delete to authenticated using (true);

drop policy if exists "lecture équipe authentifiée" on public.wiki_pages;
create policy "lecture équipe authentifiée"
  on public.wiki_pages for select to authenticated using (true);
drop policy if exists "insertion équipe authentifiée" on public.wiki_pages;
create policy "insertion équipe authentifiée"
  on public.wiki_pages for insert to authenticated with check (true);
drop policy if exists "modification équipe authentifiée" on public.wiki_pages;
create policy "modification équipe authentifiée"
  on public.wiki_pages for update to authenticated using (true) with check (true);
drop policy if exists "suppression équipe authentifiée" on public.wiki_pages;
create policy "suppression équipe authentifiée"
  on public.wiki_pages for delete to authenticated using (true);

drop policy if exists "lecture équipe authentifiée" on public.wiki_fichiers;
create policy "lecture équipe authentifiée"
  on public.wiki_fichiers for select to authenticated using (true);
drop policy if exists "insertion équipe authentifiée" on public.wiki_fichiers;
create policy "insertion équipe authentifiée"
  on public.wiki_fichiers for insert to authenticated with check (true);
drop policy if exists "modification équipe authentifiée" on public.wiki_fichiers;
create policy "modification équipe authentifiée"
  on public.wiki_fichiers for update to authenticated using (true) with check (true);
drop policy if exists "suppression équipe authentifiée" on public.wiki_fichiers;
create policy "suppression équipe authentifiée"
  on public.wiki_fichiers for delete to authenticated using (true);

-- ============================================================
-- Realtime : sur wiki_dossiers et wiki_pages uniquement (pas nécessaire
-- sur wiki_fichiers, dont la liste est chargée à l'ouverture de chaque
-- page plutôt qu'en direct).
-- ============================================================
alter publication supabase_realtime add table public.wiki_dossiers;
alter publication supabase_realtime add table public.wiki_pages;

-- ============================================================
-- Supabase Storage — bucket "wiki-fichiers" (à créer manuellement,
-- le SQL Editor ne peut pas créer de bucket lui-même) :
--
-- 1. Dashboard Supabase → Storage → New bucket
--    - Nom : wiki-fichiers
--    - Public bucket : NON (laisser privé — l'app utilise des URLs
--      signées temporaires pour ouvrir/télécharger un fichier)
--
-- 2. Une fois le bucket créé, posez ses policies d'accès. Sur la
--    plupart des projets Supabase, le SQL Editor autorise la création
--    de policies sur storage.objects : décommentez et exécutez le bloc
--    ci-dessous dans ce cas.
--
--    create policy "wiki lecture authentifiée"
--    on storage.objects for select
--    to authenticated
--    using (bucket_id = 'wiki-fichiers');
--
--    create policy "wiki insertion authentifiée"
--    on storage.objects for insert
--    to authenticated
--    with check (bucket_id = 'wiki-fichiers');
--
--    create policy "wiki suppression authentifiée"
--    on storage.objects for delete
--    to authenticated
--    using (bucket_id = 'wiki-fichiers');
--
--    Si l'éditeur refuse (erreur de permission sur storage.objects),
--    posez les mêmes règles depuis l'interface :
--    Storage → wiki-fichiers → Policies → New policy → pour SELECT,
--    INSERT et DELETE, choisissez le modèle "For authenticated users
--    only", sans restriction supplémentaire.
-- ============================================================
