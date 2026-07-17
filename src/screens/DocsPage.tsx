import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { v4 as uuidv4 } from 'uuid'
import type { WikiFichier, WikiPage } from '../types'
import { supabase, supabaseConfigure } from '../lib/supabase'

interface FichierRow {
  id: string
  page_id: string
  nom_original: string
  chemin_storage: string
  taille_octets: number
  created_at: string
}

function fichierDepuisRow(r: FichierRow): WikiFichier {
  return {
    id: r.id,
    pageId: r.page_id,
    nomOriginal: r.nom_original,
    cheminStorage: r.chemin_storage,
    tailleOctets: r.taille_octets,
    createdAt: r.created_at,
  }
}

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
}

interface DocsPageProps {
  page: WikiPage
  onModifier: (id: string, changements: { titre?: string; contenu?: string }) => void
  onSupprimer: (id: string) => void
}

const DELAI_SAUVEGARDE_MS = 1500

/** Vue et édition d'une page du wiki : titre, contenu markdown, fichiers joints */
export function DocsPage({ page, onModifier, onSupprimer }: DocsPageProps) {
  const [mode, setMode] = useState<'edition' | 'lecture'>('lecture')
  const [titre, setTitre] = useState(page.titre)
  const [contenu, setContenu] = useState(page.contenu)
  const [enregistre, setEnregistre] = useState(false)
  const [fichiers, setFichiers] = useState<WikiFichier[]>([])
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const minuteurSauvegarde = useRef<ReturnType<typeof setTimeout> | null>(null)
  const minuteurConfirmation = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputFichier = useRef<HTMLInputElement>(null)

  // Sauvegarde automatique quelques secondes après une pause de frappe,
  // avec une courte confirmation visuelle plutôt qu'un bouton "Enregistrer"
  useEffect(() => {
    if (titre === page.titre && contenu === page.contenu) return
    if (minuteurSauvegarde.current) clearTimeout(minuteurSauvegarde.current)
    minuteurSauvegarde.current = setTimeout(() => {
      onModifier(page.id, { titre, contenu })
      setEnregistre(true)
      if (minuteurConfirmation.current) clearTimeout(minuteurConfirmation.current)
      minuteurConfirmation.current = setTimeout(() => setEnregistre(false), 2000)
    }, DELAI_SAUVEGARDE_MS)
    return () => {
      if (minuteurSauvegarde.current) clearTimeout(minuteurSauvegarde.current)
    }
  }, [titre, contenu, page.id, page.titre, page.contenu, onModifier])

  useEffect(() => {
    return () => {
      if (minuteurConfirmation.current) clearTimeout(minuteurConfirmation.current)
    }
  }, [])

  const chargerFichiers = useCallback(() => {
    if (!supabaseConfigure) return
    supabase
      .from('wiki_fichiers')
      .select('*')
      .eq('page_id', page.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setFichiers((data as FichierRow[]).map(fichierDepuisRow))
      })
  }, [page.id])

  useEffect(() => {
    chargerFichiers()
  }, [chargerFichiers])

  const gererSelectionFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier || !supabaseConfigure) return
    setEnvoiEnCours(true)
    // Chemin organisé par page pour éviter les collisions entre fiches
    const chemin = `${page.id}/${uuidv4()}-${fichier.name}`
    const { error: erreurUpload } = await supabase.storage
      .from('wiki-fichiers')
      .upload(chemin, fichier)
    if (erreurUpload) {
      console.error('Envoi du fichier échoué :', erreurUpload.message)
    } else {
      const { error: erreurInsertion } = await supabase.from('wiki_fichiers').insert({
        page_id: page.id,
        nom_original: fichier.name,
        chemin_storage: chemin,
        taille_octets: fichier.size,
      })
      if (erreurInsertion) console.error('Référencement du fichier échoué :', erreurInsertion.message)
      chargerFichiers()
    }
    setEnvoiEnCours(false)
  }

  const ouvrirFichier = async (fichier: WikiFichier) => {
    const { data, error } = await supabase.storage
      .from('wiki-fichiers')
      .createSignedUrl(fichier.cheminStorage, 60)
    if (!error && data) window.open(data.signedUrl, '_blank', 'noopener')
  }

  const supprimerFichier = async (fichier: WikiFichier) => {
    if (!window.confirm(`Supprimer "${fichier.nomOriginal}" ?`)) return
    await supabase.storage.from('wiki-fichiers').remove([fichier.cheminStorage])
    await supabase.from('wiki_fichiers').delete().eq('id', fichier.id)
    setFichiers((precedent) => precedent.filter((f) => f.id !== fichier.id))
  }

  const confirmerSuppressionPage = () => {
    if (window.confirm(`Supprimer la page "${page.titre}" et ses fichiers joints ?`)) {
      onSupprimer(page.id)
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Titre éditable */}
      <input
        type="text"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg font-bold text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      {/* Bascule édition / lecture + confirmation de sauvegarde */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['lecture', 'edition'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`h-10 rounded-xl px-4 text-sm font-semibold transition-colors ${
                m === mode
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {m === 'lecture' ? 'Aperçu' : 'Éditer'}
            </button>
          ))}
        </div>
        {enregistre && <span className="text-xs font-medium text-emerald-600">Enregistré ✓</span>}
      </div>

      {/* Contenu markdown */}
      {mode === 'edition' ? (
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={14}
          placeholder="Écrivez en markdown…"
          className="w-full rounded-xl border border-gray-300 bg-white p-4 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      ) : (
        <div className="rounded-xl bg-white p-4 text-sm text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100 [&_a]:text-primary [&_a]:underline [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2 [&_strong]:font-bold [&_ul]:mb-2">
          {contenu.trim() ? (
            <ReactMarkdown>{contenu}</ReactMarkdown>
          ) : (
            <p className="text-gray-400">Page vide — passez en mode Éditer pour commencer.</p>
          )}
        </div>
      )}

      {/* Fichiers joints */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Fichiers joints {fichiers.length > 0 && `(${fichiers.length})`}
        </h2>
        {fichiers.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800"
          >
            <button onClick={() => ouvrirFichier(f)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                📎 {f.nomOriginal}
              </p>
              <p className="text-xs text-gray-400">{formatTaille(f.tailleOctets)}</p>
            </button>
            <button
              onClick={() => supprimerFichier(f)}
              className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-red-500"
              aria-label={`Supprimer ${f.nomOriginal}`}
            >
              🗑️
            </button>
          </div>
        ))}
        <input ref={inputFichier} type="file" className="hidden" onChange={gererSelectionFichier} />
        <button
          onClick={() => inputFichier.current?.click()}
          disabled={envoiEnCours}
          className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-dashed border-primary/30 text-sm font-semibold text-primary disabled:opacity-50"
        >
          {envoiEnCours ? 'Envoi…' : '+ Joindre un fichier'}
        </button>
      </section>

      {/* Suppression de la page */}
      <button
        onClick={confirmerSuppressionPage}
        className="h-12 w-full rounded-xl border border-red-300 text-sm font-semibold text-red-600 dark:border-red-800 dark:text-red-400"
      >
        🗑️ Supprimer cette page
      </button>
    </div>
  )
}
