import { useState } from 'react'
import type { Commerce, Statut } from '../types'
import { COULEURS_STATUT, ICONES_TYPE, STATUTS } from '../constants'
import { formatDateRelative, getStatutLabel } from '../utils'
import { Drawer } from './ui/Drawer'
import { Badge } from './ui/Badge'

interface CommerceDrawerProps {
  commerce: Commerce | null
  onClose: () => void
  onModifier: (id: string, changements: Partial<Commerce>) => void
  onSupprimer: (id: string) => void
}

/** Drawer de détail d'un commerce : mise à jour rapide du statut, notes, rappel */
export function CommerceDrawer({
  commerce,
  onClose,
  onModifier,
  onSupprimer,
}: CommerceDrawerProps) {
  const [noteAdditive, setNoteAdditive] = useState('')

  if (!commerce) return null

  const changerStatut = (statut: Statut) => {
    navigator.vibrate?.(30)
    onModifier(commerce.id, { statut })
  }

  const ajouterNote = () => {
    if (!noteAdditive.trim()) return
    // La nouvelle note s'ajoute à la suite des notes existantes
    const notes = commerce.notes
      ? `${commerce.notes}\n— ${noteAdditive.trim()}`
      : noteAdditive.trim()
    onModifier(commerce.id, { notes })
    setNoteAdditive('')
  }

  const changerRappel = (valeur: string) => {
    onModifier(commerce.id, {
      rappel: valeur ? new Date(valeur).toISOString() : undefined,
    })
  }

  const supprimer = () => {
    // Confirmation avant suppression définitive
    if (window.confirm(`Supprimer "${commerce.nom}" définitivement ?`)) {
      onSupprimer(commerce.id)
      onClose()
    }
  }

  return (
    <Drawer ouvert={true} onClose={onClose}>
      <div className="space-y-5">
        {/* En-tête : nom, type, quartier, statut */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {ICONES_TYPE[commerce.type]} {commerce.nom}
            </h2>
            <Badge statut={commerce.statut} />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {commerce.quartier}
            {commerce.adresse && ` · ${commerce.adresse}`}
          </p>
          {commerce.gerant && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérant : {commerce.gerant}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Ajouté {formatDateRelative(commerce.dateAjout)} par {commerce.prospecteur} ·
            dernière action {formatDateRelative(commerce.dateDerniereAction)}
          </p>
        </div>

        {/* Notes existantes */}
        {commerce.notes && (
          <p className="whitespace-pre-line rounded-xl bg-gray-100 p-3 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {commerce.notes}
          </p>
        )}

        {/* Sélecteur de statut rapide */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Changer le statut
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STATUTS.map((s) => (
              <button
                key={s}
                onClick={() => changerStatut(s)}
                className="h-12 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{
                  backgroundColor: COULEURS_STATUT[s],
                  opacity: commerce.statut === s ? 1 : 0.4,
                }}
              >
                {getStatutLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Note additive */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Ajouter une note
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={noteAdditive}
              onChange={(e) => setNoteAdditive(e.target.value)}
              placeholder="Nouvelle info…"
              className="h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={ajouterNote}
              className="h-12 rounded-xl bg-primary px-4 font-semibold text-white"
            >
              +
            </button>
          </div>
        </div>

        {/* Rappel */}
        <div>
          <label
            htmlFor="rappel-drawer"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Rappel
          </label>
          <input
            id="rappel-drawer"
            type="datetime-local"
            defaultValue={commerce.rappel ? commerce.rappel.slice(0, 16) : ''}
            onChange={(e) => changerRappel(e.target.value)}
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {commerce.telephone && (
            <a
              href={`tel:${commerce.telephone}`}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-white"
            >
              📞 Appeler
            </a>
          )}
          <button
            onClick={supprimer}
            className="h-12 w-full rounded-xl border border-red-300 font-semibold text-red-600 dark:border-red-800 dark:text-red-400"
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </Drawer>
  )
}
