import { useState } from 'react'
import { useWiki } from '../hooks/useWiki'
import { Toast } from '../components/ui/Toast'
import { DocsListe } from './DocsListe'
import { DocsPage } from './DocsPage'

interface DocsProps {
  onRetourProspection: () => void
}

type VueDocs = { type: 'liste' } | { type: 'page'; pageId: string }

/**
 * Racine de l'espace Docs : wiki d'équipe séparé de la prospection, avec sa
 * propre navigation interne (liste des dossiers → page → retour) et sa
 * propre barre de titre, pour bien marquer que c'est un autre espace.
 */
export function Docs({ onRetourProspection }: DocsProps) {
  const { dossiers, pages, chargement, ajouterDossier, ajouterPage, modifierPage, supprimerPage } =
    useWiki()
  const [vue, setVue] = useState<VueDocs>({ type: 'liste' })
  const [toast, setToast] = useState<string | null>(null)

  const pageOuverte = vue.type === 'page' ? (pages.find((p) => p.id === vue.pageId) ?? null) : null

  return (
    <div className="min-h-screen bg-fond dark:bg-gray-900">
      {/* Barre de titre distincte (fond violet plein) pour marquer visuellement
          qu'on est dans un autre espace que la prospection */}
      <header className="sticky top-0 z-20 bg-primary text-white shadow-sm">
        <div className="flex h-12 items-center gap-2 px-3">
          <button
            onClick={onRetourProspection}
            className="flex h-9 items-center gap-1 rounded-full px-2 text-xs font-semibold text-white/90 active:bg-white/10"
          >
            ← Prospection
          </button>
          <span className="ml-auto text-xs font-bold uppercase tracking-wide text-white/70">
            Docs VanCart
          </span>
        </div>
        {/* Fil d'Ariane interne : dossiers → page, indépendant du retour à la prospection */}
        {vue.type === 'page' && (
          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2">
            <button
              onClick={() => setVue({ type: 'liste' })}
              className="shrink-0 text-sm font-semibold text-white/90"
            >
              ‹ Dossiers
            </button>
            <span className="truncate text-sm font-bold">{pageOuverte?.titre || 'Page'}</span>
          </div>
        )}
      </header>

      <main key={vue.type} className="animate-[fadeIn_0.2s_ease-out]">
        {vue.type === 'liste' && (
          <DocsListe
            dossiers={dossiers}
            pages={pages}
            onOuvrirPage={(pageId) => setVue({ type: 'page', pageId })}
            onAjouterDossier={async (nom) => {
              const dossier = await ajouterDossier(nom)
              if (dossier) setToast('Dossier créé ✓')
            }}
            onAjouterPage={async (dossierId, titre) => {
              const page = await ajouterPage(dossierId, titre)
              if (page) {
                setToast('Page créée ✓')
                setVue({ type: 'page', pageId: page.id })
              }
            }}
          />
        )}

        {vue.type === 'page' && pageOuverte && (
          <DocsPage
            page={pageOuverte}
            onModifier={modifierPage}
            onSupprimer={async (id) => {
              await supprimerPage(id)
              setToast('Page supprimée ✓')
              setVue({ type: 'liste' })
            }}
          />
        )}

        {vue.type === 'page' && !pageOuverte && !chargement && (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Page introuvable.</p>
        )}
      </main>

      <Toast message={toast ?? ''} visible={toast !== null} onClose={() => setToast(null)} />
    </div>
  )
}
