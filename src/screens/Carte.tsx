import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Commerce, Prospecteur } from '../types'
import { COULEURS_STATUT, STATUTS } from '../constants'
import { getStatutLabel } from '../utils'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Badge } from '../components/ui/Badge'

interface CarteProps {
  commerces: Commerce[]
  onOuvrirCommerce: (commerce: Commerce) => void
}

/**
 * Entrée du cache de géocodage : soit une adresse trouvée (coordonnées),
 * soit un échec horodaté. Un échec est retenté après 24h plutôt que
 * d'être ignoré indéfiniment (l'API Nominatim peut être temporairement
 * indisponible sans que l'adresse soit fausse).
 */
type EntreeGeocache =
  | { statut: 'trouvé'; lat: number; lon: number }
  | { statut: 'échec'; tente: string }
type GeoCache = Record<string, EntreeGeocache>

const VINGT_QUATRE_H_MS = 24 * 60 * 60 * 1000

// Centre de Paris et zoom initial
const CENTRE_PARIS: [number, number] = [48.8566, 2.3522]
const ZOOM_INITIAL = 13

type FiltreProspecteur = 'Tous' | Prospecteur

/** Écran carte : commerces géocodés sur une carte OpenStreetMap de Paris */
export function Carte({ commerces, onOuvrirCommerce }: CarteProps) {
  const [filtre, setFiltre] = useState<FiltreProspecteur>('Tous')
  // Cache des géocodages pour éviter de rappeler Nominatim à chaque ouverture
  const [cache, setCache] = useLocalStorage<GeoCache>('geocache', {})

  // Géocode les adresses absentes du cache ou dont l'échec date de plus de
  // 24h, une par une (limite Nominatim ~1 req/s)
  useEffect(() => {
    // (c.adresse ?? '') : une fiche d'une ancienne version peut ne pas avoir d'adresse
    const aGeocoder = commerces.filter((c) => {
      const adresse = (c.adresse ?? '').trim()
      if (adresse === '') return false
      const entree = cache[c.adresse]
      if (!entree) return true
      if (entree.statut === 'trouvé') return false
      return Date.now() - new Date(entree.tente).getTime() > VINGT_QUATRE_H_MS
    })
    if (aGeocoder.length === 0) return

    let annule = false
    ;(async () => {
      for (const commerce of aGeocoder) {
        // Politesse vis-à-vis de l'API gratuite : 1 requête par seconde max
        await new Promise((r) => setTimeout(r, 1100))
        if (annule) return
        let entree: EntreeGeocache
        try {
          const reponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              commerce.adresse + ', Paris, France',
            )}&format=json&limit=1`,
          )
          const resultats = await reponse.json()
          entree =
            Array.isArray(resultats) && resultats[0]
              ? {
                  statut: 'trouvé',
                  lat: parseFloat(resultats[0].lat),
                  lon: parseFloat(resultats[0].lon),
                }
              : { statut: 'échec', tente: new Date().toISOString() }
        } catch {
          // Échec réseau ou parsing : retenté automatiquement après 24h
          entree = { statut: 'échec', tente: new Date().toISOString() }
        }
        if (annule) return
        setCache((precedent) => ({ ...precedent, [commerce.adresse]: entree }))
      }
    })()

    return () => {
      annule = true
    }
  }, [commerces, cache, setCache])

  // Commerces affichables : filtre prospecteur + coordonnées connues
  const marqueurs = useMemo(
    () =>
      commerces
        .filter((c) => filtre === 'Tous' || c.prospecteur === filtre)
        .map((c) => ({ commerce: c, entree: cache[c.adresse] }))
        .filter(
          (
            m,
          ): m is {
            commerce: Commerce
            entree: Extract<EntreeGeocache, { statut: 'trouvé' }>
          } => m.entree?.statut === 'trouvé',
        ),
    [commerces, filtre, cache],
  )

  // Commerces avec une adresse renseignée mais toujours introuvables sur la
  // carte (adresse mal saisie, ou géocodage pas encore passé) : Sullivan et
  // Audrey peuvent ainsi repérer une saisie à corriger plutôt que de se
  // demander pourquoi un commerce n'apparaît pas.
  const nonLocalises = useMemo(
    () =>
      commerces.filter((c) => {
        const adresse = (c.adresse ?? '').trim()
        if (adresse === '') return false
        return cache[c.adresse]?.statut !== 'trouvé'
      }),
    [commerces, cache],
  )

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col">
      {/* Top bar : filtre prospecteur + légende des statuts */}
      <div className="space-y-2 p-3">
        <div className="flex gap-2">
          {(['Tous', 'Sullivan', 'Audrey'] as FiltreProspecteur[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`h-12 flex-1 rounded-xl text-sm font-semibold transition-colors ${
                filtre === f
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {/* Légende compacte horizontale */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {STATUTS.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COULEURS_STATUT[s] }}
              />
              {getStatutLabel(s)}
            </span>
          ))}
        </div>
        {/* Indicateur des commerces non localisés (adresse à vérifier) */}
        {nonLocalises.length > 0 && (
          <div className="rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            ⚠️ {nonLocalises.length} commerce{nonLocalises.length > 1 ? 's' : ''} non
            localisé{nonLocalises.length > 1 ? 's' : ''} (adresse à vérifier) :{' '}
            {nonLocalises
              .slice(0, 4)
              .map((c) => c.nom)
              .join(', ')}
            {nonLocalises.length > 4 && ` +${nonLocalises.length - 4} autre(s)`}
          </div>
        )}
      </div>

      {/* La carte occupe toute la hauteur restante. z-0 garde les drawers
          et la navigation au-dessus des tuiles Leaflet. */}
      <div className="relative z-0 flex-1">
        <MapContainer
          center={CENTRE_PARIS}
          zoom={ZOOM_INITIAL}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {marqueurs.map(({ commerce, entree }) => (
            <CircleMarker
              key={commerce.id}
              center={[entree.lat, entree.lon]}
              radius={10}
              pathOptions={{
                color: '#FFFFFF',
                weight: 2,
                fillColor: COULEURS_STATUT[commerce.statut],
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="space-y-2">
                  <p className="font-semibold">{commerce.nom}</p>
                  <Badge statut={commerce.statut} />
                  {commerce.gerant && (
                    <p className="text-sm text-gray-600">Gérant : {commerce.gerant}</p>
                  )}
                  <button
                    onClick={() => onOuvrirCommerce(commerce)}
                    className="h-12 w-full rounded-lg bg-primary px-3 text-sm font-semibold text-white"
                  >
                    Voir détail
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
