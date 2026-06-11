import { useState } from 'react'
import type { Commerce, Prospecteur, Statut, TypeCommerce } from '../types'
import { COULEURS_STATUT, ICONES_TYPE, QUARTIERS, STATUTS } from '../constants'
import { getStatutLabel } from '../utils'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface AjouterProps {
  onAjouter: (donnees: Omit<Commerce, 'id' | 'dateAjout' | 'dateDerniereAction'>) => void
}

const TYPES: TypeCommerce[] = ['café', 'bar', 'restaurant', 'autre']
const LIBELLES_TYPE: Record<TypeCommerce, string> = {
  café: 'Café',
  bar: 'Bar',
  restaurant: 'Restaurant',
  autre: 'Autre',
}

// Les 5 statuts proposés à l'ajout (un commerce n'est jamais "client" d'emblée)
const STATUTS_AJOUT: Statut[] = STATUTS.filter((s) => s !== 'client')

/** Écran d'ajout rapide d'un commerce, optimisé pour la saisie terrain */
export function Ajouter({ onAjouter }: AjouterProps) {
  const [prospecteur, setProspecteur] = useLocalStorage<Prospecteur>(
    'vancart-prospecteur',
    'Sullivan',
  )
  const [nom, setNom] = useState('')
  const [type, setType] = useState<TypeCommerce>('café')
  const [quartier, setQuartier] = useState<string>(QUARTIERS[0])
  const [statut, setStatut] = useState<Statut>('à_visiter')
  const [gerant, setGerant] = useState('')
  const [notes, setNotes] = useState('')
  const [rappel, setRappel] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return

    // Retour haptique à la validation
    navigator.vibrate?.(50)

    onAjouter({
      nom: nom.trim(),
      type,
      quartier,
      statut,
      gerant: gerant.trim() || undefined,
      notes: notes.trim() || undefined,
      rappel: rappel ? new Date(rappel).toISOString() : undefined,
      prospecteur,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Nouveau commerce
      </h1>

      {/* Nom du commerce, avec autofocus pour saisir vite */}
      <div>
        <label htmlFor="nom" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nom du commerce *
        </label>
        <input
          id="nom"
          type="text"
          autoFocus
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Café de la Place"
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Type de commerce : 4 gros boutons visuels */}
      <div>
        <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Type</p>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                type === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <span className="text-xl">{ICONES_TYPE[t]}</span>
              {LIBELLES_TYPE[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Quartier */}
      <div>
        <label htmlFor="quartier" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Quartier
        </label>
        <select
          id="quartier"
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          {QUARTIERS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      {/* Statut : gros boutons colorés */}
      <div>
        <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Statut</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUTS_AJOUT.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatut(s)}
              className="h-12 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{
                backgroundColor: COULEURS_STATUT[s],
                opacity: statut === s ? 1 : 0.4,
              }}
            >
              {getStatutLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Gérant (optionnel) */}
      <div>
        <label htmlFor="gerant" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gérant (optionnel)
        </label>
        <input
          id="gerant"
          type="text"
          value={gerant}
          onChange={(e) => setGerant(e.target.value)}
          placeholder="Prénom Nom"
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Note libre */}
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Note
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Contexte, objections, à retenir…"
          className="w-full rounded-xl border border-gray-300 bg-white p-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Rappel (optionnel) */}
      <div>
        <label htmlFor="rappel" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rappel (optionnel)
        </label>
        <input
          id="rappel"
          type="datetime-local"
          value={rappel}
          onChange={(e) => setRappel(e.target.value)}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Toggle prospecteur */}
      <div>
        <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Prospecteur
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(['Sullivan', 'Audrey'] as Prospecteur[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProspecteur(p)}
              className={`h-12 rounded-xl border-2 text-sm font-semibold transition-colors ${
                prospecteur === p
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Validation */}
      <button
        type="submit"
        className="h-14 w-full rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/30 active:scale-[0.98]"
      >
        Ajouter ce commerce ✓
      </button>
    </form>
  )
}
