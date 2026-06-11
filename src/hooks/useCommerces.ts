import { useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Commerce } from '../types'
import { useLocalStorage } from './useLocalStorage'
import { MOCK_COMMERCES } from '../data/mockData'
import { isAujourdhui } from '../utils'

/**
 * Hook central de gestion des commerces.
 * Persiste la liste dans localStorage et expose les actions + métriques du jour.
 */
export function useCommerces() {
  const [commerces, setCommerces] = useLocalStorage<Commerce[]>(
    'vancart-commerces',
    MOCK_COMMERCES,
  )

  /** Ajoute un commerce (id et dates générés automatiquement) */
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
    return nouveau
  }

  /** Modifie un commerce et met à jour sa date de dernière action */
  const modifier = (id: string, changements: Partial<Commerce>) => {
    setCommerces((precedents) =>
      precedents.map((c) =>
        c.id === id
          ? { ...c, ...changements, dateDerniereAction: new Date().toISOString() }
          : c,
      ),
    )
  }

  /** Supprime définitivement un commerce */
  const supprimer = (id: string) => {
    setCommerces((precedents) => precedents.filter((c) => c.id !== id))
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
