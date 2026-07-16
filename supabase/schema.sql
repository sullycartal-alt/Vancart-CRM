-- ============================================================
-- VanCart CRM — Schéma Supabase
-- À exécuter manuellement dans Supabase → SQL Editor
-- ============================================================

-- Table des commerces prospectés.
-- Reprend les champs du type Commerce (src/types/index.ts) :
-- dateAjout → created_at, dateDerniereAction → updated_at.
create table if not exists public.commerces (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text not null default 'autre'
    check (type in ('café', 'bar', 'restaurant', 'autre')),
  adresse text not null default '',
  gerant text,
  telephone text,
  statut text not null default 'à_visiter'
    check (statut in ('à_visiter', 'pas_là', 'intéressé', 'en_négociation', 'client', 'pas_intéressé')),
  notes text,
  rappel timestamptz,
  prospecteur text not null default 'Sullivan'
    check (prospecteur in ('Sullivan', 'Audrey')),
  -- Qui a créé la fiche : information de traçabilité UNIQUEMENT.
  -- Ne sert jamais à filtrer ni à restreindre l'accès.
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mise à jour automatique de updated_at à chaque modification
create or replace function public.maj_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_maj_updated_at on public.commerces;
create trigger trigger_maj_updated_at
  before update on public.commerces
  for each row
  execute function public.maj_updated_at();

-- ============================================================
-- Row Level Security : accès complet pour tout utilisateur
-- authentifié, aucun accès pour les requêtes anonymes.
-- Pas de cloisonnement entre membres de l'équipe : toute
-- personne connectée voit et modifie toutes les fiches.
-- ============================================================
alter table public.commerces enable row level security;

drop policy if exists "lecture équipe authentifiée" on public.commerces;
create policy "lecture équipe authentifiée"
  on public.commerces for select
  to authenticated
  using (true);

drop policy if exists "insertion équipe authentifiée" on public.commerces;
create policy "insertion équipe authentifiée"
  on public.commerces for insert
  to authenticated
  with check (true);

drop policy if exists "modification équipe authentifiée" on public.commerces;
create policy "modification équipe authentifiée"
  on public.commerces for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "suppression équipe authentifiée" on public.commerces;
create policy "suppression équipe authentifiée"
  on public.commerces for delete
  to authenticated
  using (true);

-- ============================================================
-- Realtime : diffuse en direct les changements de la table
-- à tous les clients connectés.
-- ============================================================
alter publication supabase_realtime add table public.commerces;
