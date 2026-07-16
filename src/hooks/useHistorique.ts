import { useEffect, useState } from 'react'
import { supabase, supabaseConfigure } from '../lib/supabase'

/** Une ligne de l'historique des changements de statut (table commerces_historique) */
export interface EntreeHistorique {
  id: string
  commerceId: string
  ancienStatut: string | null
  nouveauStatut: string
  changedAt: string
}

interface HistoriqueRow {
  id: string
  commerce_id: string
  ancien_statut: string | null
  nouveau_statut: string
  changed_at: string
}

/**
 * Charge l'historique des changements de statut depuis Supabase.
 * La table `commerces_historique` n'existe (et ne se peuple) qu'après
 * exécution de supabase/historique_statuts.sql — en son absence, la
 * requête échoue silencieusement et l'historique reste simplement vide,
 * sans faire planter l'app.
 */
export function useHistorique() {
  const [historique, setHistorique] = useState<EntreeHistorique[]>([])
  const [chargement, setChargement] = useState(supabaseConfigure)

  useEffect(() => {
    // chargement démarre déjà à false dans ce cas (valeur initiale de l'état)
    if (!supabaseConfigure) return

    let actif = true

    supabase
      .from('commerces_historique')
      .select('*')
      .order('changed_at', { ascending: true })
      .then(({ data, error }) => {
        if (!actif) return
        if (!error && data) {
          setHistorique(
            (data as HistoriqueRow[]).map((r) => ({
              id: r.id,
              commerceId: r.commerce_id,
              ancienStatut: r.ancien_statut,
              nouveauStatut: r.nouveau_statut,
              changedAt: r.changed_at,
            })),
          )
        }
        setChargement(false)
      })

    // Réagit en direct aux nouveaux changements journalisés par l'équipe
    const canal = supabase
      .channel('historique-temps-reel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'commerces_historique' },
        (evenement) => {
          const r = evenement.new as HistoriqueRow
          const entree: EntreeHistorique = {
            id: r.id,
            commerceId: r.commerce_id,
            ancienStatut: r.ancien_statut,
            nouveauStatut: r.nouveau_statut,
            changedAt: r.changed_at,
          }
          setHistorique((precedent) =>
            precedent.some((h) => h.id === entree.id) ? precedent : [...precedent, entree],
          )
        },
      )
      .subscribe()

    return () => {
      actif = false
      supabase.removeChannel(canal)
    }
  }, [])

  return { historique, chargement }
}
