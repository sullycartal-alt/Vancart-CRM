import { useState, useCallback } from 'react'

/**
 * Hook générique de persistance dans localStorage.
 * Lit la valeur au montage et écrit à chaque mise à jour (JSON parse/stringify).
 */
export function useLocalStorage<T>(cle: string, valeurInitiale: T) {
  const [valeur, setValeurInterne] = useState<T>(() => {
    try {
      const brut = window.localStorage.getItem(cle)
      return brut !== null ? (JSON.parse(brut) as T) : valeurInitiale
    } catch {
      // En cas de JSON invalide, on repart de la valeur initiale
      return valeurInitiale
    }
  })

  const setValeur = useCallback(
    (nouvelleValeur: T | ((precedente: T) => T)) => {
      setValeurInterne((precedente) => {
        const resolue =
          nouvelleValeur instanceof Function ? nouvelleValeur(precedente) : nouvelleValeur
        try {
          window.localStorage.setItem(cle, JSON.stringify(resolue))
        } catch {
          // Stockage plein ou indisponible : on garde la valeur en mémoire
        }
        return resolue
      })
    },
    [cle],
  )

  return [valeur, setValeur] as const
}
