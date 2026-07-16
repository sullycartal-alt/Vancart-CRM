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
import { COULEUR_PRIMAIRE, COULEURS_STATUT, STATUTS } from '../constants'
import { getArrondissement, getStatutLabel, isAujourdhui } from '../utils'
import { useHistorique } from '../hooks/useHistorique'

interface StatsProps {
  commerces: Commerce[]
}

const JOURS_ABREGES = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

// Renvoie un tableau des 7 derniers jours (aujourd'hui inclus), du plus ancien au plus récent
function derniersSeptJours(): { debut: number; fin: number; label: string }[] {
  const jours = []
  for (let i = 6; i >= 0; i--) {
    const jour = new Date()
    jour.setDate(jour.getDate() - i)
    jour.setHours(0, 0, 0, 0)
    const debut = jour.getTime()
    const fin = debut + 24 * 60 * 60 * 1000
    jours.push({ debut, fin, label: `${JOURS_ABREGES[jour.getDay()]} ${jour.getDate()}` })
  }
  return jours
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
  const { historique } = useHistorique()

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

  // Commerces par arrondissement (extrait depuis l'adresse) avec leur taux de
  // conversion, classés par nombre de commerces
  const parArrondissement = useMemo(() => {
    const compteur = new Map<string, { total: number; clients: number }>()
    filtres.forEach((c) => {
      const arrondissement = getArrondissement(c.adresse)
      if (!arrondissement) return
      const entree = compteur.get(arrondissement) ?? { total: 0, clients: 0 }
      entree.total += 1
      if (c.statut === 'client') entree.clients += 1
      compteur.set(arrondissement, entree)
    })
    return [...compteur.entries()]
      .map(([arrondissement, { total, clients }]) => ({
        arrondissement,
        total,
        taux: total > 0 ? Math.round((clients / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filtres])

  // Taux de conversion global : clients / commerces contactés au moins une
  // fois (donc hors "à_visiter", qui n'ont pas encore été démarchés)
  const tauxConversionGlobal = useMemo(() => {
    const contactes = filtres.filter((c) => c.statut !== 'à_visiter')
    if (contactes.length === 0) return null
    const clientsContactes = contactes.filter((c) => c.statut === 'client').length
    return Math.round((clientsContactes / contactes.length) * 100)
  }, [filtres])

  // Visites (créations + changements de statut confondus) des 7 derniers jours
  const visitesSeptJours = useMemo(() => {
    const jours = derniersSeptJours()
    return jours.map(({ debut, fin, label }) => ({
      label,
      visites: historique.filter((h) => {
        const t = new Date(h.changedAt).getTime()
        return t >= debut && t < fin
      }).length,
    }))
  }, [historique])

  // Temps moyen entre le premier contact et le passage au statut "client",
  // calculé uniquement sur les commerces effectivement passés client
  const tempsMoyenConversionJours = useMemo(() => {
    if (historique.length === 0) return null
    const parCommerce = new Map<string, typeof historique>()
    historique.forEach((h) => {
      const liste = parCommerce.get(h.commerceId) ?? []
      liste.push(h)
      parCommerce.set(h.commerceId, liste)
    })

    const durees: number[] = []
    parCommerce.forEach((evenements, commerceId) => {
      const commerce = commerces.find((c) => c.id === commerceId)
      if (!commerce || commerce.statut !== 'client') return
      const tries = [...evenements].sort(
        (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
      )
      const premierContact = tries[0]
      const passageClient = tries.find((e) => e.nouveauStatut === 'client')
      if (!premierContact || !passageClient) return
      durees.push(
        new Date(passageClient.changedAt).getTime() -
          new Date(premierContact.changedAt).getTime(),
      )
    })

    if (durees.length === 0) return null
    const moyenneMs = durees.reduce((a, b) => a + b, 0) / durees.length
    return moyenneMs / (1000 * 60 * 60 * 24)
  }, [historique, commerces])

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

      {/* Conversion hors à_visiter + temps moyen de conversion */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
          <p className="text-3xl font-bold text-emerald-600">
            {tauxConversionGlobal !== null ? `${tauxConversionGlobal}%` : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Conversion (hors à visiter)
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
          <p className="text-3xl font-bold text-primary">
            {tempsMoyenConversionJours !== null
              ? `${tempsMoyenConversionJours.toFixed(1).replace('.', ',')} j`
              : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Temps moyen de conversion
          </p>
        </div>
      </div>

      {/* Visites des 7 derniers jours (historique des changements de statut) */}
      <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Visites — 7 derniers jours
        </h2>
        {historique.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pas encore de données (l'historique se peuple après l'exécution du
            script supabase/historique_statuts.sql).
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={visitesSeptJours} margin={{ left: -20, right: 8 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="visites" fill={COULEUR_PRIMAIRE} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

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

      {/* Commerces par arrondissement */}
      <section className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Commerces par arrondissement
        </h2>
        {parArrondissement.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée.</p>
        ) : (
          <ol className="space-y-2">
            {parArrondissement.map(({ arrondissement, total, taux }, index) => (
              <li key={arrondissement} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-200">
                  <span className="mr-2 font-bold text-primary">{index + 1}.</span>
                  {arrondissement} arrondissement
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {total} · {taux}% clients
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
