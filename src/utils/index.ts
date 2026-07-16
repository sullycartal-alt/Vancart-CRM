import type { Commerce, NiveauPriorite, Statut } from '../types'

/**
 * Normalise un commerce potentiellement issu d'anciennes versions de l'app.
 * Les toutes premières fiches utilisaient un champ "quartier" au lieu
 * d'"adresse" : on migre automatiquement, avec chaîne vide en dernier recours
 * pour qu'aucun champ ne soit jamais undefined.
 */
export function normaliserCommerce(
  brut: Partial<Commerce> & { quartier?: string },
): Commerce {
  const maintenant = new Date().toISOString()
  return {
    id: brut.id ?? '',
    nom: brut.nom ?? '',
    type: brut.type ?? 'autre',
    adresse: brut.adresse ?? brut.quartier ?? '',
    gerant: brut.gerant,
    telephone: brut.telephone,
    statut: brut.statut ?? 'à_visiter',
    notes: brut.notes,
    rappel: brut.rappel,
    dateAjout: brut.dateAjout ?? maintenant,
    dateDerniereAction: brut.dateDerniereAction ?? brut.dateAjout ?? maintenant,
    prospecteur: brut.prospecteur ?? 'Sullivan',
  }
}

/**
 * Formate une date ISO de façon relative en français.
 * Exemples : "à l'instant", "il y a 2 h", "il y a 2 jours"
 */
export function formatDateRelative(dateISO: string): string {
  const date = new Date(dateISO)
  const maintenant = new Date()
  const diffMs = maintenant.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffJours = Math.floor(diffH / 24)

  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffH < 24) return `il y a ${diffH} h`
  if (diffJours === 1) return 'hier'
  if (diffJours < 7) return `il y a ${diffJours} jours`
  if (diffJours < 30) {
    const semaines = Math.floor(diffJours / 7)
    return `il y a ${semaines} semaine${semaines > 1 ? 's' : ''}`
  }
  const mois = Math.floor(diffJours / 30)
  return `il y a ${mois} mois`
}

/** Indique si un rappel est en retard (date passée) */
export function isRappelEnRetard(rappelISO?: string): boolean {
  if (!rappelISO) return false
  return new Date(rappelISO).getTime() < Date.now()
}

/** Un commerce "intéressé"/"en négociation" est une relance chaude s'il est resté sans contact plus de 3 jours */
export function isRelanceChaude(commerce: Commerce): boolean {
  if (commerce.statut !== 'intéressé' && commerce.statut !== 'en_négociation') return false
  const TROIS_JOURS_MS = 3 * 24 * 60 * 60 * 1000
  return Date.now() - new Date(commerce.dateDerniereAction).getTime() > TROIS_JOURS_MS
}

/** Indique si un rappel est prévu aujourd'hui */
export function isRappelAujourdhui(rappelISO?: string): boolean {
  if (!rappelISO) return false
  const rappel = new Date(rappelISO)
  const aujourdhui = new Date()
  return (
    rappel.getFullYear() === aujourdhui.getFullYear() &&
    rappel.getMonth() === aujourdhui.getMonth() &&
    rappel.getDate() === aujourdhui.getDate()
  )
}

/** Indique si une date ISO correspond à aujourd'hui */
export function isAujourdhui(dateISO: string): boolean {
  const date = new Date(dateISO)
  const aujourdhui = new Date()
  return (
    date.getFullYear() === aujourdhui.getFullYear() &&
    date.getMonth() === aujourdhui.getMonth() &&
    date.getDate() === aujourdhui.getDate()
  )
}

/** Libellé français lisible pour chaque statut */
export function getStatutLabel(statut: Statut): string {
  const labels: Record<Statut, string> = {
    à_visiter: 'À visiter',
    pas_là: 'Pas là',
    intéressé: 'Intéressé',
    en_négociation: 'En négociation',
    client: 'Client',
    pas_intéressé: 'Pas intéressé',
  }
  return labels[statut]
}

/**
 * Extrait l'arrondissement parisien depuis une adresse saisie librement.
 * Reconnaît un code postal 750XX (ex : "75018" → "18e") ou une mention
 * explicite comme "11e" / "11ème". Renvoie null si rien n'est détecté.
 */
export function getArrondissement(adresse: string): string | null {
  // Code postal parisien : 75001 → 75020
  const codePostal = adresse.match(/750(\d{2})/)
  if (codePostal) {
    const numero = parseInt(codePostal[1], 10)
    if (numero >= 1 && numero <= 20) return numero === 1 ? '1er' : `${numero}e`
  }
  // Mention directe de l'arrondissement : "11e", "11ème", "11eme"
  const mention = adresse.match(/\b(\d{1,2})\s*(?:e|er|ème|eme)\b/i)
  if (mention) {
    const numero = parseInt(mention[1], 10)
    if (numero >= 1 && numero <= 20) return numero === 1 ? '1er' : `${numero}e`
  }
  return null
}

const FUSEAU_PARIS = 'Europe/Paris'

function partiesDateParis(date: Date) {
  const parties = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSEAU_PARIS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const val = (type: string) => Number(parties.find((p) => p.type === type)?.value ?? 0)
  return {
    annee: val('year'),
    mois: val('month'),
    jour: val('day'),
    heure: val('hour'),
    minute: val('minute'),
  }
}

/**
 * Convertit une date ISO (UTC) en chaîne "YYYY-MM-DDTHH:mm" représentant
 * l'heure de Paris, pour alimenter un <input type="datetime-local">.
 * Évite le décalage d'1-2h qu'on aurait en tronquant l'ISO brut (UTC).
 */
export function versDatetimeLocalParis(dateISO: string): string {
  const { annee, mois, jour, heure, minute } = partiesDateParis(new Date(dateISO))
  const deuxChiffres = (n: number) => String(n).padStart(2, '0')
  return `${annee}-${deuxChiffres(mois)}-${deuxChiffres(jour)}T${deuxChiffres(heure)}:${deuxChiffres(minute)}`
}

/**
 * Convertit la valeur d'un <input type="datetime-local"> — interprétée comme
 * heure de Paris — en date ISO UTC, quel que soit le fuseau du navigateur.
 */
export function depuisDatetimeLocalParis(valeurLocale: string): string {
  const [datePart, heurePart] = valeurLocale.split('T')
  const [annee, mois, jour] = datePart.split('-').map(Number)
  const [heure, minute] = (heurePart ?? '00:00').split(':').map(Number)

  // Première estimation en UTC, puis correction par le décalage réel de
  // Paris à cette date (gère automatiquement l'heure d'été/hiver)
  const essai = Date.UTC(annee, mois - 1, jour, heure, minute)
  const obtenuAParis = partiesDateParis(new Date(essai))
  const obtenu = Date.UTC(
    obtenuAParis.annee,
    obtenuAParis.mois - 1,
    obtenuAParis.jour,
    obtenuAParis.heure,
    obtenuAParis.minute,
  )
  const decalage = obtenu - essai
  return new Date(essai - decalage).toISOString()
}

/**
 * Calcule le niveau de priorité de relance d'un commerce, à partir de son
 * statut actuel, de l'ancienneté du dernier changement enregistré dans
 * l'historique (ou de la dernière action connue si l'historique est encore
 * vide) et du nombre de passages déjà effectués sans conversion. Les
 * commerces "client" ou "pas_intéressé" sont hors scoring (renvoie null).
 */
export function calculerScore(
  commerce: Commerce,
  historique: { commerceId: string; changedAt: string }[],
): NiveauPriorite | null {
  if (commerce.statut === 'client' || commerce.statut === 'pas_intéressé') return null

  const evenements = historique.filter((h) => h.commerceId === commerce.id)
  const dernierChangement =
    evenements.length > 0
      ? evenements.reduce(
          (plusRecent, e) => (e.changedAt > plusRecent ? e.changedAt : plusRecent),
          evenements[0].changedAt,
        )
      : commerce.dateDerniereAction
  const joursDepuis = (Date.now() - new Date(dernierChangement).getTime()) / 86_400_000
  const passages = Math.max(evenements.length, 1)

  if (commerce.statut === 'intéressé' || commerce.statut === 'en_négociation') {
    if (joursDepuis <= 3) return 'chaud'
    if (joursDepuis <= 7) return 'tiède'
    return 'froid'
  }
  // à_visiter / pas_là : chaud seulement si tout frais, sinon dépend du
  // nombre de passages déjà effectués sans résultat
  if (joursDepuis <= 1) return 'chaud'
  if (passages >= 3 || joursDepuis > 10) return 'froid'
  return 'tiède'
}

/** Formate la date du jour en français, ex : "mercredi 11 juin" */
export function formatDateJour(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
