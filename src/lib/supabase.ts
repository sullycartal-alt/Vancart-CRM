import { createClient } from '@supabase/supabase-js'

// Client Supabase initialisé depuis les variables d'environnement.
// Voir .env.example pour la configuration attendue.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const cleAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Vrai si les variables d'environnement Supabase sont renseignées */
export const supabaseConfigure = Boolean(url && cleAnon)

// Des valeurs de repli évitent un crash au chargement si le .env est absent ;
// dans ce cas les appels échoueront proprement et l'écran de connexion
// affichera un message de configuration manquante.
export const supabase = createClient(
  url ?? 'https://configuration-manquante.supabase.co',
  cleAnon ?? 'cle-anon-manquante',
)
