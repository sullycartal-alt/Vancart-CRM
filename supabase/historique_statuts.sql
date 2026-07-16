-- ============================================================
-- VanCart CRM — Historique des changements de statut
-- À exécuter manuellement dans Supabase → SQL Editor, APRÈS schema.sql
--
-- ⚠️ Cette table ne se peuple qu'à partir du moment où ce script est
-- exécuté : les changements de statut antérieurs à cette migration
-- ne sont pas récupérables rétroactivement (ils n'ont jamais été
-- tracés). Les statistiques qui s'appuient dessus (temps moyen de
-- conversion, visites des 7 derniers jours, scoring des prospects)
-- ne montreront des résultats complets qu'après quelques jours
-- d'usage réel de l'équipe.
-- ============================================================

create table if not exists public.commerces_historique (
  id uuid primary key default gen_random_uuid(),
  commerce_id uuid not null references public.commerces (id) on delete cascade,
  -- Vide pour la toute première entrée (création du commerce)
  ancien_statut text,
  nouveau_statut text not null,
  -- Qui a fait le changement : traçabilité uniquement, ne restreint jamais l'accès
  changed_by uuid references auth.users (id) on delete set null default auth.uid(),
  changed_at timestamptz not null default now()
);

create index if not exists idx_commerces_historique_commerce_id
  on public.commerces_historique (commerce_id);
create index if not exists idx_commerces_historique_changed_at
  on public.commerces_historique (changed_at);

-- ============================================================
-- Row Level Security : mêmes règles que la table commerces —
-- accès complet pour tout utilisateur authentifié, aucun accès
-- pour les requêtes anonymes, aucun cloisonnement entre membres
-- de l'équipe.
-- ============================================================
alter table public.commerces_historique enable row level security;

drop policy if exists "lecture équipe authentifiée" on public.commerces_historique;
create policy "lecture équipe authentifiée"
  on public.commerces_historique for select
  to authenticated
  using (true);

drop policy if exists "insertion équipe authentifiée" on public.commerces_historique;
create policy "insertion équipe authentifiée"
  on public.commerces_historique for insert
  to authenticated
  with check (true);

drop policy if exists "modification équipe authentifiée" on public.commerces_historique;
create policy "modification équipe authentifiée"
  on public.commerces_historique for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "suppression équipe authentifiée" on public.commerces_historique;
create policy "suppression équipe authentifiée"
  on public.commerces_historique for delete
  to authenticated
  using (true);

-- ============================================================
-- Journalisation automatique : une entrée à chaque création d'un
-- commerce (ancien_statut vide), et une entrée à chaque fois que le
-- statut change réellement de valeur lors d'une modification (pas à
-- chaque modification — uniquement quand le statut change).
-- ============================================================

create or replace function public.journaliser_creation_commerce()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.commerces_historique (commerce_id, ancien_statut, nouveau_statut, changed_by)
  values (new.id, null, new.statut, auth.uid());
  return new;
end;
$$;

drop trigger if exists trigger_historique_creation on public.commerces;
create trigger trigger_historique_creation
  after insert on public.commerces
  for each row
  execute function public.journaliser_creation_commerce();

create or replace function public.journaliser_changement_statut()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.statut is distinct from old.statut then
    insert into public.commerces_historique (commerce_id, ancien_statut, nouveau_statut, changed_by)
    values (new.id, old.statut, new.statut, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_historique_statut on public.commerces;
create trigger trigger_historique_statut
  after update on public.commerces
  for each row
  execute function public.journaliser_changement_statut();

-- ============================================================
-- Realtime : pour une future vue "activité de l'équipe en direct".
-- ============================================================
alter publication supabase_realtime add table public.commerces_historique;
