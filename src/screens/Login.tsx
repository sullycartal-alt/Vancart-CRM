import { useState } from 'react'
import { supabase, supabaseConfigure } from '../lib/supabase'

/**
 * Écran de connexion : portail d'entrée de l'app.
 * Pas d'inscription libre — les comptes sont créés manuellement
 * depuis le dashboard Supabase (voir supabase/README.md).
 */
export function Login() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    })
    setChargement(false)
    if (error) {
      // Message générique en français, sans détail technique
      setErreur('Connexion impossible : vérifiez votre email et votre mot de passe.')
    }
    // En cas de succès, App.tsx détecte la session via onAuthStateChange
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-fond p-6 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-sm space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-white">
            V
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VanCart CRM</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connectez-vous pour accéder à la prospection
          </p>
        </div>

        {!supabaseConfigure && (
          <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            ⚠️ Supabase n'est pas configuré : renseignez VITE_SUPABASE_URL et
            VITE_SUPABASE_ANON_KEY (voir .env.example).
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@vancart.fr"
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="mot-de-passe"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mot de passe
            </label>
            <input
              id="mot-de-passe"
              type="password"
              required
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {erreur && (
            <p className="rounded-xl bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-60"
          >
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Accès réservé à l'équipe VanCart.
        </p>
      </div>
    </div>
  )
}
