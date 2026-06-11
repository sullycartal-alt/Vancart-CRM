import type { Statut, TypeCommerce } from '../types'

// Liste des quartiers parisiens couverts par la prospection
export const QUARTIERS = [
  'Marais',
  'Batignolles',
  'Montmartre',
  'Oberkampf',
  'République',
  'Nation',
  'Bastille',
  'Saint-Germain',
  'Pigalle',
  'Belleville',
  'Châtelet',
  'Opéra',
  'Autre',
] as const

// Couleur associée à chaque statut du pipeline
export const COULEURS_STATUT: Record<Statut, string> = {
  à_visiter: '#7C3AED',
  pas_là: '#F59E0B',
  intéressé: '#10B981',
  en_négociation: '#3B82F6',
  client: '#059669',
  pas_intéressé: '#6B7280',
}

// Icône emoji associée à chaque type de commerce
export const ICONES_TYPE: Record<TypeCommerce, string> = {
  café: '☕',
  bar: '🍺',
  restaurant: '🍽️',
  autre: '📦',
}

// Liste ordonnée des statuts (utile pour les sélecteurs)
export const STATUTS: Statut[] = [
  'à_visiter',
  'pas_là',
  'intéressé',
  'en_négociation',
  'client',
  'pas_intéressé',
]

// Couleur principale de l'application
export const COULEUR_PRIMAIRE = '#7C3AED'
