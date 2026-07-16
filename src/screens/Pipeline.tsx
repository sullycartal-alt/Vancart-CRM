import { useState } from 'react'
import type { Commerce, Prospecteur, Statut } from '../types'
import { COULEURS_STATUT, ICONES_TYPE } from '../constants'
import { formatDateRelative, getStatutLabel, isRappelEnRetard } from '../utils'

interface PipelineProps {
  commerces: Commerce[]
  onOuvrirCommerce: (commerce: Commerce) => void
}

// Ordre d'affichage des groupes dans le pipeline
const ORDRE_GROUPES: Statut[] = [
  'en_négociation',
  'intéressé',
  'pas_là',
  'à_visiter',
  'client',
  'pas_intéressé',
]

type FiltreProspecteur = 'Tous' | Prospecteur

/** Écran pipeline : liste des commerces groupés par statut, avec recherche et filtres */
export function Pipeline({ commerces, onOuvrirCommerce }: PipelineProps) {
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<FiltreProspecteur>('Tous')
  // Le groupe "pas intéressé" est replié par défaut
  const [montrerPasInteresses, setMontrerPasInteresses] = useState(false)

  // Filtre par nom ou adresse + filtre prospecteur
  const filtres = commerces.filter((c) => {
    const texte = recherche.toLowerCase()
    // (c.adresse ?? '') : une fiche d'une ancienne version peut ne pas avoir d'adresse
    const matchTexte =
      c.nom.toLowerCase().includes(texte) ||
      (c.adresse ?? '').toLowerCase().includes(texte)
    const matchProspecteur = filtre === 'Tous' || c.prospecteur === filtre
    return matchTexte && matchProspecteur
  })

  const groupes = ORDRE_GROUPES.map((statut) => ({
    statut,
    commerces: filtres.filter((c) => c.statut === statut),
  })).filter((g) => g.commerces.length > 0)

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline</h1>

      {/* Barre de recherche */}
      <input
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher un nom ou une adresse…"
        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      {/* Filtre rapide par prospecteur */}
      <div className="flex gap-2">
        {(['Tous', 'Sullivan', 'Audrey'] as FiltreProspecteur[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`h-12 flex-1 rounded-xl text-sm font-semibold transition-colors ${
              filtre === f
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Groupes par statut */}
      {groupes.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Aucun commerce trouvé.
        </p>
      )}
      {groupes.map(({ statut, commerces: liste }) => {
        const replie = statut === 'pas_intéressé' && !montrerPasInteresses
        return (
          <section key={statut}>
            {/* Header de groupe avec compteur */}
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COULEURS_STATUT[statut] }}
                />
                {getStatutLabel(statut)} ({liste.length})
              </h2>
              {statut === 'pas_intéressé' && (
                <button
                  onClick={() => setMontrerPasInteresses((v) => !v)}
                  className="text-sm font-semibold text-primary"
                >
                  {replie ? 'Afficher' : 'Masquer'}
                </button>
              )}
            </div>
            {!replie && (
              <div className="space-y-2">
                {liste.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOuvrirCommerce(c)}
                    className="w-full rounded-xl bg-white p-4 text-left shadow-sm dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {ICONES_TYPE[c.type]} {c.nom}
                      </span>
                      {/* Badge prospecteur S / A */}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {c.prospecteur[0]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {c.adresse || 'Adresse non renseignée'}
                      {c.gerant && ` · ${c.gerant}`}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatDateRelative(c.dateDerniereAction)}</span>
                      {c.rappel && (
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            isRappelEnRetard(c.rappel)
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}
                        >
                          ⏰ Rappel
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
