// Types de données du CRM VanCart

/** Type de commerce prospecté */
export type TypeCommerce = 'café' | 'bar' | 'restaurant' | 'autre'

/** Statut d'un commerce dans le pipeline de prospection */
export type Statut =
  | 'à_visiter'
  | 'pas_là'
  | 'intéressé'
  | 'en_négociation'
  | 'client'
  | 'pas_intéressé'

/** Prospecteur : l'un des deux fondateurs */
export type Prospecteur = 'Sullivan' | 'Audrey'

/** Un commerce prospecté sur le terrain */
export interface Commerce {
  id: string
  nom: string
  type: TypeCommerce
  quartier: string
  adresse?: string
  gerant?: string
  telephone?: string
  statut: Statut
  notes?: string
  /** Date de rappel au format ISO */
  rappel?: string
  /** Date d'ajout au format ISO */
  dateAjout: string
  /** Date de la dernière action au format ISO */
  dateDerniereAction: string
  prospecteur: Prospecteur
}
