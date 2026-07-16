import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Commerce } from './types'
import { supabase } from './lib/supabase'
import { useCommerces } from './hooks/useCommerces'
import { BottomNav, type Ecran } from './components/ui/BottomNav'
import { Toast } from './components/ui/Toast'
import { CommerceDrawer } from './components/CommerceDrawer'
import { Accueil } from './screens/Accueil'
import { Ajouter } from './screens/Ajouter'
import { Pipeline } from './screens/Pipeline'
import { Carte } from './screens/Carte'
import { Login } from './screens/Login'

/**
 * Composant racine : vérifie la session Supabase au chargement.
 * Sans session active, seul l'écran de connexion est affiché.
 */
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  // Évite un flash de l'écran de connexion pendant la lecture de la session
  const [sessionVerifiee, setSessionVerifiee] = useState(false)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        setSessionVerifiee(true)
      })
      .catch(() => setSessionVerifiee(true))

    // Suit connexions et déconnexions en direct
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evenement, nouvelleSession) => {
      setSession(nouvelleSession)
      setSessionVerifiee(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Recharge la page dès qu'un nouveau service worker prend le contrôle :
  // l'utilisateur voit toujours la dernière version déployée
  useEffect(() => {
    const recharger = () => window.location.reload()
    navigator.serviceWorker?.addEventListener('controllerchange', recharger)
    return () =>
      navigator.serviceWorker?.removeEventListener('controllerchange', recharger)
  }, [])

  if (!sessionVerifiee) {
    return <div className="min-h-screen bg-fond dark:bg-gray-900" />
  }

  if (!session) {
    return <Login />
  }

  return <VanCartApp />
}

/** L'application elle-même, rendue uniquement quand une session est active */
function VanCartApp() {
  const { commerces, ajouter, modifier, supprimer, metriques } = useCommerces()
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [commerceOuvert, setCommerceOuvert] = useState<Commerce | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Le drawer affiche toujours la version à jour du commerce sélectionné
  const commerceActuel = commerceOuvert
    ? (commerces.find((c) => c.id === commerceOuvert.id) ?? null)
    : null

  const handleAjouter = (
    donnees: Omit<Commerce, 'id' | 'dateAjout' | 'dateDerniereAction'>,
  ) => {
    ajouter(donnees)
    setToast(`${donnees.nom} ajouté ✓`)
    // Retour automatique vers l'accueil après ajout
    setEcran('accueil')
  }

  const handleMarquerRappelFait = (id: string) => {
    modifier(id, { rappel: undefined })
    setToast('Rappel marqué fait ✓')
  }

  return (
    <div className="min-h-screen bg-fond pb-16 text-gray-900 dark:bg-gray-900 dark:text-white">
      {/* Transition simple entre écrans : le contenu change avec un léger fondu */}
      <main key={ecran} className="animate-[fadeIn_0.2s_ease-out]">
        {ecran === 'accueil' && (
          <Accueil
            commerces={commerces}
            metriques={metriques}
            onMarquerRappelFait={handleMarquerRappelFait}
            onOuvrirCommerce={setCommerceOuvert}
          />
        )}
        {ecran === 'ajouter' && <Ajouter onAjouter={handleAjouter} />}
        {ecran === 'pipeline' && (
          <Pipeline commerces={commerces} onOuvrirCommerce={setCommerceOuvert} />
        )}
        {ecran === 'carte' && (
          <Carte commerces={commerces} onOuvrirCommerce={setCommerceOuvert} />
        )}
      </main>

      {/* Drawer de détail d'un commerce */}
      <CommerceDrawer
        commerce={commerceActuel}
        onClose={() => setCommerceOuvert(null)}
        onModifier={modifier}
        onSupprimer={supprimer}
      />

      {/* Toast global */}
      <Toast message={toast ?? ''} visible={toast !== null} onClose={() => setToast(null)} />

      {/* Navigation toujours visible en bas */}
      <BottomNav ecranActif={ecran} onChange={setEcran} />
    </div>
  )
}
