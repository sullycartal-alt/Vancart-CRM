import type { Statut } from '../types'

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

/** Formate la date du jour en français, ex : "mercredi 11 juin" */
export function formatDateJour(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
