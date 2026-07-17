import { useState } from 'react'
import type { WikiDossier, WikiPage } from '../types'
import { Drawer } from '../components/ui/Drawer'

interface DocsListeProps {
  dossiers: WikiDossier[]
  pages: WikiPage[]
  onOuvrirPage: (pageId: string) => void
  onAjouterDossier: (nom: string) => void
  onAjouterPage: (dossierId: string, titre: string) => void
}

/** Liste des dossiers (dépliables) et de leurs pages, avec recherche et création */
export function DocsListe({
  dossiers,
  pages,
  onOuvrirPage,
  onAjouterDossier,
  onAjouterPage,
}: DocsListeProps) {
  const [recherche, setRecherche] = useState('')
  const [dossiersOuverts, setDossiersOuverts] = useState<Set<string>>(new Set())
  const [drawerDossierOuvert, setDrawerDossierOuvert] = useState(false)
  const [nomDossier, setNomDossier] = useState('')
  const [dossierPourPage, setDossierPourPage] = useState<string | null>(null)
  const [titrePage, setTitrePage] = useState('')

  const texte = recherche.trim().toLowerCase()
  const pagesFiltrees = texte ? pages.filter((p) => p.titre.toLowerCase().includes(texte)) : null

  const toggleDossier = (id: string) => {
    setDossiersOuverts((precedent) => {
      const suivant = new Set(precedent)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })
  }

  const dossiersTries = [...dossiers].sort((a, b) => a.ordre - b.ordre)

  const validerDossier = () => {
    if (!nomDossier.trim()) return
    onAjouterDossier(nomDossier.trim())
    setNomDossier('')
    setDrawerDossierOuvert(false)
  }

  const validerPage = () => {
    if (!titrePage.trim() || !dossierPourPage) return
    onAjouterPage(dossierPourPage, titrePage.trim())
    setTitrePage('')
    setDossierPourPage(null)
  }

  return (
    <div className="space-y-4 p-4">
      {/* Recherche par titre de page, cohérente avec celle du Pipeline */}
      <input
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher une page…"
        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      {pagesFiltrees ? (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Résultats ({pagesFiltrees.length})
          </h2>
          {pagesFiltrees.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucune page trouvée.
            </p>
          ) : (
            <div className="space-y-2">
              {pagesFiltrees.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOuvrirPage(p.id)}
                  className="w-full rounded-xl bg-white p-4 text-left shadow-sm dark:bg-gray-800"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">
                    📄 {p.titre}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <button
            onClick={() => setDrawerDossierOuvert(true)}
            className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-primary/30 bg-white text-sm font-semibold text-primary dark:bg-gray-800"
          >
            + Nouveau dossier
          </button>

          {dossiersTries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucun dossier pour l'instant.
            </p>
          ) : (
            <div className="space-y-3">
              {dossiersTries.map((dossier) => {
                const pagesDuDossier = pages.filter((p) => p.dossierId === dossier.id)
                const ouvert = dossiersOuverts.has(dossier.id)
                return (
                  <section
                    key={dossier.id}
                    className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800"
                  >
                    <button
                      onClick={() => toggleDossier(dossier.id)}
                      className="flex h-14 w-full items-center justify-between px-4"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">
                        📁 {dossier.nom} ({pagesDuDossier.length})
                      </span>
                      <span className="text-lg text-gray-400">{ouvert ? '−' : '+'}</span>
                    </button>
                    {ouvert && (
                      <div className="space-y-2 border-t border-gray-100 p-3 dark:border-gray-700">
                        {pagesDuDossier.length === 0 && (
                          <p className="px-1 py-2 text-sm text-gray-400">Aucune page.</p>
                        )}
                        {pagesDuDossier.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => onOuvrirPage(p.id)}
                            className="flex h-12 w-full items-center rounded-lg bg-gray-50 px-3 text-left text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                          >
                            📄 {p.titre}
                          </button>
                        ))}
                        <button
                          onClick={() => setDossierPourPage(dossier.id)}
                          className="flex h-12 w-full items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
                        >
                          + Nouvelle page
                        </button>
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Drawer de création de dossier */}
      <Drawer ouvert={drawerDossierOuvert} onClose={() => setDrawerDossierOuvert(false)}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nouveau dossier</h2>
          <input
            type="text"
            autoFocus
            value={nomDossier}
            onChange={(e) => setNomDossier(e.target.value)}
            placeholder="Nom du dossier"
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={validerDossier}
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/30 active:scale-[0.98]"
          >
            Créer ✓
          </button>
        </div>
      </Drawer>

      {/* Drawer de création de page */}
      <Drawer ouvert={dossierPourPage !== null} onClose={() => setDossierPourPage(null)}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle page</h2>
          <input
            type="text"
            autoFocus
            value={titrePage}
            onChange={(e) => setTitrePage(e.target.value)}
            placeholder="Titre de la page"
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={validerPage}
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/30 active:scale-[0.98]"
          >
            Créer et éditer ✓
          </button>
        </div>
      </Drawer>
    </div>
  )
}
