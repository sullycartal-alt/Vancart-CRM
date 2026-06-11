import { useState } from 'react'
import type { Commerce, Prospecteur } from '../types'
import { QUARTIERS } from '../constants'
import {
  formatDateJour,
  formatDateRelative,
  isRappelAujourdhui,
  isRappelEnRetard,
} from '../utils'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Badge } from '../components/ui/Badge'

interface AccueilProps {
  commerces: Commerce[]
  metriques: {
    visitesAujourdhui: number
    interessesAujourdhui: number
    tauxConversion: number
  }
  onMarquerRappelFait: (id: string) => void
  onOuvrirCommerce: (commerce: Commerce) => void
}

/** Écran d'accueil : salutation, métriques du jour, rappels et relances chaudes */
export function Accueil({
  commerces,
  metriques,
  onMarquerRappelFait,
  onOuvrirCommerce,
}: AccueilProps) {
  const [prospecteur, setProspecteur] = useLocalStorage<Prospecteur>(
    'vancart-prospecteur',
    'Sullivan',
  )
  const [quartierActif, setQuartierActif] = useState<string>('Tous')

  // Filtre éventuel sur le quartier actif
  const commercesFiltres =
    quartierActif === 'Tous'
      ? commerces
      : commerces.filter((c) => c.quartier === quartierActif)

  // Rappels du jour ou en retard
  const rappels = commercesFiltres.filter(
    (c) => c.rappel && (isRappelAujourdhui(c.rappel) || isRappelEnRetard(c.rappel)),
  )

  // Relances chaudes : intéressés ou en négociation, sans contact depuis plus de 3 jours
  const TROIS_JOURS_MS = 3 * 24 * 60 * 60 * 1000
  const relancesChaudes = commercesFiltres.filter(
    (c) =>
      (c.statut === 'intéressé' || c.statut === 'en_négociation') &&
      Date.now() - new Date(c.dateDerniereAction).getTime() > TROIS_JOURS_MS,
  )

  return (
    <div className="space-y-6 p-4">
      {/* En-tête : salutation + toggle prospecteur */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour {prospecteur} 👋
          </h1>
          <div className="flex rounded-full bg-gray-200 p-1 dark:bg-gray-700">
            {(['Sullivan', 'Audrey'] as Prospecteur[]).map((p) => (
              <button
                key={p}
                onClick={() => setProspecteur(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  prospecteur === p
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {p[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
            {formatDateJour()}
          </p>
          {/* Sélecteur de quartier actif */}
          <select
            value={quartierActif}
            onChange={(e) => setQuartierActif(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="Tous">Tous quartiers</option>
            {QUARTIERS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Métriques du jour */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Aujourd'hui
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
            <p className="text-2xl font-bold text-primary">{metriques.visitesAujourdhui}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Visités</p>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
            <p className="text-2xl font-bold text-emerald-500">
              {metriques.interessesAujourdhui}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Intéressés</p>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
            <p className="text-2xl font-bold text-blue-500">{metriques.tauxConversion}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Conversion</p>
          </div>
        </div>
      </section>

      {/* Rappels du jour et en retard */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Rappels {rappels.length > 0 && `(${rappels.length})`}
        </h2>
        {rappels.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun rappel pour aujourd'hui 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {rappels.map((c) => (
              <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{c.nom}</h3>
                  <Badge statut={c.statut} />
                </div>
                {c.notes && (
                  <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{c.notes}</p>
                )}
                <div className="flex gap-2">
                  {c.telephone && (
                    <a
                      href={`tel:${c.telephone}`}
                      className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white"
                    >
                      📞 Appeler
                    </a>
                  )}
                  <button
                    onClick={() => onMarquerRappelFait(c.id)}
                    className="flex h-12 flex-1 items-center justify-center rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
                  >
                    ✓ Marquer fait
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Relances chaudes */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Relances chaudes 🔥 {relancesChaudes.length > 0 && `(${relancesChaudes.length})`}
        </h2>
        {relancesChaudes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune relance en attente.
          </p>
        ) : (
          <div className="space-y-3">
            {relancesChaudes.map((c) => (
              <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{c.nom}</h3>
                  <Badge statut={c.statut} />
                </div>
                <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                  {c.quartier} · dernier contact {formatDateRelative(c.dateDerniereAction)}
                </p>
                <button
                  onClick={() => onOuvrirCommerce(c)}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
                >
                  Mettre à jour
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
