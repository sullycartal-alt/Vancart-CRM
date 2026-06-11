import type { Commerce } from '../types'

// Renvoie une date ISO décalée de N jours par rapport à maintenant
function ilYa(jours: number, heures = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - jours)
  d.setHours(d.getHours() - heures)
  return d.toISOString()
}

// Renvoie une date ISO dans N jours (pour les rappels)
function dans(jours: number): string {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

// 6 commerces parisiens fictifs pour démarrer avec des données réalistes
export const MOCK_COMMERCES: Commerce[] = [
  {
    id: 'mock-1',
    nom: 'Café des Artistes',
    type: 'café',
    adresse: '12 rue des Abbesses, 75018 Paris',
    gerant: 'Karim Benali',
    telephone: '+33612345678',
    statut: 'en_négociation',
    notes: 'Très intéressé par le programme de fidélité. Veut voir une démo avec sa serveuse.',
    rappel: ilYa(0, 2),
    dateAjout: ilYa(8),
    dateDerniereAction: ilYa(4),
    prospecteur: 'Sullivan',
  },
  {
    id: 'mock-2',
    nom: 'Le Perchoir Oberkampf',
    type: 'bar',
    adresse: '14 rue Crespin du Gast, 75011 Paris',
    gerant: 'Marine Dubois',
    telephone: '+33698765432',
    statut: 'intéressé',
    notes: 'A déjà une carte papier, trouve le digital plus pratique. Repasser en soirée.',
    dateAjout: ilYa(6),
    dateDerniereAction: ilYa(5),
    prospecteur: 'Audrey',
  },
  {
    id: 'mock-3',
    nom: 'Bistrot de la Bastille',
    type: 'restaurant',
    adresse: '3 rue de la Roquette, 75011 Paris',
    gerant: 'Pierre Lemaire',
    telephone: '+33145678901',
    statut: 'client',
    notes: 'Signé ! Onboarding fait, première campagne lancée.',
    dateAjout: ilYa(15),
    dateDerniereAction: ilYa(2),
    prospecteur: 'Sullivan',
  },
  {
    id: 'mock-4',
    nom: 'La Cave à Manger',
    type: 'restaurant',
    adresse: '28 rue des Rosiers, 75004 Paris',
    statut: 'pas_là',
    notes: 'Fermé le lundi, repasser mardi midi.',
    rappel: dans(1),
    dateAjout: ilYa(1),
    dateDerniereAction: ilYa(1),
    prospecteur: 'Audrey',
  },
  {
    id: 'mock-5',
    nom: 'Boulangerie Maison Fleur',
    type: 'autre',
    adresse: '45 rue des Batignolles, 75017 Paris',
    gerant: 'Sophie Fleur',
    statut: 'pas_intéressé',
    notes: 'Trop de clients de passage, ne croit pas à la fidélisation.',
    dateAjout: ilYa(10),
    dateDerniereAction: ilYa(10),
    prospecteur: 'Sullivan',
  },
  {
    id: 'mock-6',
    nom: 'Le Zinc de Belleville',
    type: 'bar',
    adresse: '102 boulevard de Belleville, 75020 Paris',
    gerant: 'Nadia Cherif',
    telephone: '+33687654321',
    statut: 'intéressé',
    notes: 'Veut en parler à son associé avant de décider.',
    rappel: ilYa(1),
    dateAjout: ilYa(7),
    dateDerniereAction: ilYa(4),
    prospecteur: 'Audrey',
  },
]
