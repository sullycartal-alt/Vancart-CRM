import { useState } from 'react'
import type { Commerce } from '../types'
import {
  formatDateJour,
  formatDateRelative,
  isRappelAujourdhui,
  isRappelEnRetard,
  isRelanceChaude,
} from '../utils'
import { supabase } from '../lib/supabase'
import { Badge } from '../components/ui/Badge'
import { Drawer } from '../components/ui/Drawer'
import { Stats } from './Stats'

interface AccueilProps {
  commerces: Commerce[]
  metriques: {
    visitesAujourdhui: number
    interessesAujourdhui: number
    tauxConversion: number
  }
  /** Email de la personne connectée (source unique de l'identité, via Supabase Auth) */
  emailUtilisateur: string
  onMarquerRappelFait: (id: string) => void
  onOuvrirCommerce: (commerce: Commerce) => void
}

/** Écran d'accueil : salutation, métriques du jour, rappels et relances chaudes */
export function Accueil({
  commerces,
  metriques,
  emailUtilisateur,
  onMarquerRappelFait,
  onOuvrirCommerce,
}: AccueilProps) {
  // Prénom affiché dans la salutation, dérivé de l'email de la session active
  const prenom = emailUtilisateur.split('@')[0] || 'à toi'
  // Drawer des statistiques (l'ancien onglet Stats)
  const [statsOuvertes, setStatsOuvertes] = useState(false)

  // Rappels du jour ou en retard
  const rappels = commerces.filter(
    (c) => c.rappel && (isRappelAujourdhui(c.rappel) || isRappelEnRetard(c.rappel)),
  )

  // Relances chaudes : intéressés ou en négociation, sans contact depuis plus de 3 jours
  const relancesChaudes = commerces.filter(isRelanceChaude)

  return (
    <div className="space-y-6 p-4">
      {/* En-tête : salutation basée sur la session Supabase active */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold capitalize text-gray-900 dark:text-white">
          Bonjour {prenom} 👋
        </h1>
        <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
          {formatDateJour()}
        </p>
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
                  {c.adresse || 'Adresse non renseignée'} · dernier contact{' '}
                  {formatDateRelative(c.dateDerniereAction)}
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

      {/* Accès aux statistiques (ancien onglet Stats, désormais en drawer) */}
      <button
        onClick={() => setStatsOuvertes(true)}
        className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-primary/30 bg-white text-sm font-semibold text-primary dark:bg-gray-800"
      >
        📊 Voir les stats
      </button>
      <Drawer ouvert={statsOuvertes} onClose={() => setStatsOuvertes(false)}>
        <Stats commerces={commerces} />
      </Drawer>

      {/* Déconnexion : App.tsx détecte la fin de session et réaffiche le Login */}
      <button
        onClick={() => supabase.auth.signOut()}
        className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-medium text-gray-400 dark:text-gray-500"
      >
        Se déconnecter
      </button>
    </div>
  )
}
