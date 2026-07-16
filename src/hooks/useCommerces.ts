import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Commerce } from '../types'
import { supabase, supabaseConfigure } from '../lib/supabase'
import { MOCK_COMMERCES } from '../data/mockData'
import { isAujourdhui, normaliserCommerce } from '../utils'

// Clé du cache hors-ligne : Supabase est la source de vérité, le
// localStorage ne sert qu'à afficher immédiatement les données
// connues quand le réseau est absent ou lent.
const CLE_CACHE = 'vancart-commerces'

// Données de démo uniquement derrière un flag explicite (voir .env.example)
const DEMO_ACTIVE = import.meta.env.VITE_DEMO_DATA === 'true'

/** Ligne de la table Supabase `commerces` */
interface CommerceRow {
  id: string
  nom: string
  type: Commerce['type']
  adresse: string | null
  gerant: string | null
  telephone: string | null
  statut: Commerce['statut']
  notes: string | null
  rappel: string | null
  prospecteur: Commerce['prospecteur']
  created_at: string
  updated_at: string
}

// Conversion ligne Supabase → objet Commerce de l'app
function rowVersCommerce(row: CommerceRow): Commerce {
  return normaliserCommerce({
    id: row.id,
    nom: row.nom,
    type: row.type,
    adresse: row.adresse ?? '',
    gerant: row.gerant ?? undefined,
    telephone: row.telephone ?? undefined,
    statut: row.statut,
    notes: row.notes ?? undefined,
    rappel: row.rappel ?? undefined,
    dateAjout: row.created_at,
    dateDerniereAction: row.updated_at,
    prospecteur: row.prospecteur,
  })
}

// Conversion objet Commerce → colonnes modifiables de la table
function commerceVersRow(c: Commerce) {
  return {
    id: c.id,
    nom: c.nom,
    type: c.type,
    adresse: c.adresse,
    gerant: c.gerant ?? null,
    telephone: c.telephone ?? null,
    statut: c.statut,
    notes: c.notes ?? null,
    rappel: c.rappel ?? null,
    prospecteur: c.prospecteur,
  }
}

// Lecture du cache hors-ligne (avec migration des anciennes fiches "quartier")
function lireCache(): Commerce[] {
  try {
    const brut = window.localStorage.getItem(CLE_CACHE)
    if (brut === null) return DEMO_ACTIVE && !supabaseConfigure ? MOCK_COMMERCES : []
    const liste = JSON.parse(brut) as unknown[]
    return Array.isArray(liste)
      ? liste.map((c) => normaliserCommerce(c as Partial<Commerce>))
      : []
  } catch {
    return []
  }
}

function ecrireCache(commerces: Commerce[]) {
  try {
    window.localStorage.setItem(CLE_CACHE, JSON.stringify(commerces))
  } catch {
    // Stockage indisponible : le cache est facultatif
  }
}

/**
 * Hook central de gestion des commerces.
 * Source de vérité : Supabase (partagé par toute l'équipe, temps réel).
 * Les écritures sont optimistes : l'interface réagit immédiatement,
 * la synchronisation se fait en arrière-plan.
 */
export function useCommerces() {
  const [commerces, setCommercesInterne] = useState<Commerce[]>(lireCache)

  // Toute mise à jour de la liste alimente aussi le cache hors-ligne
  const setCommerces = useCallback(
    (maj: (precedents: Commerce[]) => Commerce[]) => {
      setCommercesInterne((precedents) => {
        const suivants = maj(precedents)
        ecrireCache(suivants)
        return suivants
      })
    },
    [],
  )

  // Chargement initial depuis Supabase + abonnement temps réel
  useEffect(() => {
    if (!supabaseConfigure) return

    let actif = true

    supabase
      .from('commerces')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!actif || error || !data) return
        setCommerces(() => (data as CommerceRow[]).map(rowVersCommerce))
      })

    // Realtime : applique en direct les changements faits par les autres
    const canal = supabase
      .channel('commerces-temps-reel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'commerces' },
        (evenement) => {
          const nouveau = rowVersCommerce(evenement.new as CommerceRow)
          setCommerces((precedents) =>
            precedents.some((c) => c.id === nouveau.id)
              ? precedents
              : [nouveau, ...precedents],
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commerces' },
        (evenement) => {
          const modifie = rowVersCommerce(evenement.new as CommerceRow)
          setCommerces((precedents) =>
            precedents.map((c) => (c.id === modifie.id ? modifie : c)),
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'commerces' },
        (evenement) => {
          const idSupprime = (evenement.old as { id?: string }).id
          if (!idSupprime) return
          setCommerces((precedents) => precedents.filter((c) => c.id !== idSupprime))
        },
      )
      .subscribe()

    return () => {
      actif = false
      supabase.removeChannel(canal)
    }
  }, [setCommerces])

  /** Ajoute un commerce (mise à jour optimiste puis insertion Supabase) */
  const ajouter = (
    donnees: Omit<Commerce, 'id' | 'dateAjout' | 'dateDerniereAction'>,
  ): Commerce => {
    const maintenant = new Date().toISOString()
    const nouveau: Commerce = {
      ...donnees,
      id: uuidv4(),
      dateAjout: maintenant,
      dateDerniereAction: maintenant,
    }
    setCommerces((precedents) => [nouveau, ...precedents])
    if (supabaseConfigure) {
      supabase
        .from('commerces')
        .insert(commerceVersRow(nouveau))
        .then(({ error }) => {
          if (error) console.error('Ajout Supabase échoué :', error.message)
        })
    }
    return nouveau
  }

  /** Modifie un commerce et met à jour sa date de dernière action */
  const modifier = (id: string, changements: Partial<Commerce>) => {
    const cible = commerces.find((c) => c.id === id)
    if (!cible) return
    const modifie: Commerce = {
      ...cible,
      ...changements,
      dateDerniereAction: new Date().toISOString(),
    }
    setCommerces((precedents) => precedents.map((c) => (c.id === id ? modifie : c)))
    if (supabaseConfigure) {
      supabase
        .from('commerces')
        .update(commerceVersRow(modifie))
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Modification Supabase échouée :', error.message)
        })
    }
  }

  /** Supprime définitivement un commerce */
  const supprimer = (id: string) => {
    setCommerces((precedents) => precedents.filter((c) => c.id !== id))
    if (supabaseConfigure) {
      supabase
        .from('commerces')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Suppression Supabase échouée :', error.message)
        })
    }
  }

  // Métriques du jour, recalculées à chaque changement de la liste
  const metriques = useMemo(() => {
    const visitesAujourdhui = commerces.filter((c) =>
      isAujourdhui(c.dateDerniereAction),
    ).length
    const interessesAujourdhui = commerces.filter(
      (c) =>
        isAujourdhui(c.dateDerniereAction) &&
        (c.statut === 'intéressé' || c.statut === 'en_négociation'),
    ).length
    const clients = commerces.filter((c) => c.statut === 'client').length
    const tauxConversion =
      commerces.length > 0 ? Math.round((clients / commerces.length) * 100) : 0

    return { visitesAujourdhui, interessesAujourdhui, tauxConversion }
  }, [commerces])

  return { commerces, ajouter, modifier, supprimer, metriques }
}
