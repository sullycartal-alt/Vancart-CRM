import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Commerce, Prospecteur } from '../types'
import { COULEURS_STATUT, STATUTS } from '../constants'
import { getStatutLabel, isAujourdhui } from '../utils'

interface StatsProps {
  commerces: Commerce[]
}

type Periode = 'aujourdhui' | 'semaine' | 'total'

const JOURS_SEMAINE = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
]

// Indique si une date ISO est dans la semaine en cours (lundi → dimanche)
function isCetteSemaine(dateISO: string): boolean {
  const date = new Date(dateISO)
  const maintenant = new Date()
  const debutSemaine = new Date(maintenant)
  const jour = maintenant.getDay()
  // Lundi = début de semaine
  debutSemaine.setDate(maintenant.getDate() - ((jour + 6) % 7))
  debutSemaine.setHours(0, 0, 0, 0)
  return date >= debutSemaine
}

/** Écran de statistiques : métriques globales, graphiques et comparatif fondateurs */
export function Stats({ commerces }: StatsProps) {
  const [periode, setPeriode] = useState<Periode>('total')

  // Commerces filtrés selon la période sélectionnée (sur la date d'ajout)
  const filtres = useMemo(() => {
    if (periode === 'aujourdhui') return commerces.filter((c) => isAujourdhui(c.dateAjout))
    if (periode === 'semaine') return commerces.filter((c) => isCetteSemaine(c.dateAjout))
    return commerces
  }, [commerces, periode])

  const clients = filtres.filter((c) => c.statut === 'client').length
  const tauxConversion =
    filtres.length > 0 ? Math.round((clients / filtres.length) * 100) : 0

  // Répartition par statut pour le bar chart horizontal
  const donneesStatuts = STATUTS.map((statut) => ({
    statut,
    label: getStatutLabel(statut),
    nombre: filtres.filter((c) => c.statut === statut).length,
  })).filter((d) => d.nombre > 0)

  // Top quartiers, classés par nombre de commerces
  const topQuartiers = useMemo(() => {
    const compteur = new Map<string, number>()
    filtres.forEach((c) => compteur.set(c.quartier, (compteur.get(c.quartier) ?? 0) + 1))
    return [...compteur.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [filtres])

  // Comparatif Sullivan vs Audrey
  const comparatif = (['Sullivan', 'Audrey'] as Prospecteur[]).map((p) => {
    const siens = filtres.filter((c) => c.prospecteur === p)
    const sesClients = siens.filter((c) => c.statut === 'client').length
    return {
      prospecteur: p,
      ajoutes: siens.length,
      taux: siens.length > 0 ? Math.round((sesClients / siens.length) * 100) : 0,
    }
  })

  // Meilleur jour de la semaine selon l'historique des ajouts (toutes périodes)
  const meilleurJour = useMemo(() => {
    if (commerces.length === 0) return null
    const compteur = new Array(7).fill(0)
    commerces.forEach((c) => {
      compteur[new Date(c.dateAjout).getDay()]++
    })
    const max = Math.max(...compteur)
    return max > 0 ? JOURS_SEMAINE[compteur.indexOf(max)] : null
  }, [commerces])

  const PERIODES: { valeur: Periode; label: string }[] = [
    { valeur: 'aujourdhui', label: "Aujourd'hui" },
    { valeur: 'semaine', label: 'Cette semaine' },
    { valeur: 'total', label: 'Total' },
  ]

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques</h1>

      {/* Sélecteur de période */}
      <div className="flex gap-2">
        {PERIODES.map(({ valeur, label }) => (
          <button
            key={valeur}
            onClick={() => setPeriode(valeur)}
            className={`h-12 flex-1 rounded-xl text-sm font-semibold transition-colors ${
              periode === valeur
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
          <p className="text-3xl font-bold text-primary">{filtres.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Commerces ajoutés</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
          <p className="text-3xl font-bold text-emerald-600">{tauxConversion}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Taux de conversion</p>
        </div>
      </div>

      {/* Répartition par statut */}
      <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Répartition par statut
        </h2>
        {donneesStatuts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée.</p>
        ) : (
          <ResponsiveContainer width="100%" height={donneesStatuts.length * 44 + 20}>
            <BarChart data={donneesStatuts} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={100}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="nombre" radius={[0, 8, 8, 0]}>
                {donneesStatuts.map((d) => (
                  <Cell key={d.statut} fill={COULEURS_STATUT[d.statut]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Top quartiers */}
      <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Top quartiers
        </h2>
        {topQuartiers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée.</p>
        ) : (
          <ol className="space-y-2">
            {topQuartiers.map(([quartier, nombre], index) => (
              <li key={quartier} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-200">
                  <span className="mr-2 font-bold text-primary">{index + 1}.</span>
                  {quartier}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {nombre}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Comparatif Sullivan vs Audrey */}
      <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Sullivan vs Audrey
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {comparatif.map((c) => (
            <div
              key={c.prospecteur}
              className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-700"
            >
              <p className="font-bold text-gray-900 dark:text-white">{c.prospecteur}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{c.ajoutes}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ajoutés</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                {c.taux}% conversion
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Meilleur jour */}
      {meilleurJour && (
        <section className="rounded-xl bg-primary/10 p-4 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Meilleur jour de prospection :{' '}
            <span className="font-bold capitalize text-primary">{meilleurJour}</span> 📈
          </p>
        </section>
      )}
    </div>
  )
}
