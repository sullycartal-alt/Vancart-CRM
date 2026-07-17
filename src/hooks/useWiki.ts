import { useCallback, useEffect, useRef, useState } from 'react'
import type { WikiDossier, WikiPage } from '../types'
import { supabase, supabaseConfigure } from '../lib/supabase'

interface DossierRow {
  id: string
  nom: string
  ordre: number
  created_at: string
}

interface PageRow {
  id: string
  dossier_id: string
  titre: string
  contenu: string
  created_at: string
  updated_at: string
}

function dossierDepuisRow(r: DossierRow): WikiDossier {
  return { id: r.id, nom: r.nom, ordre: r.ordre, createdAt: r.created_at }
}

function pageDepuisRow(r: PageRow): WikiPage {
  return {
    id: r.id,
    dossierId: r.dossier_id,
    titre: r.titre,
    contenu: r.contenu ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/**
 * Hook central du wiki d'équipe (espace Docs) : dossiers et pages, avec
 * synchronisation Realtime — la création d'un dossier ou d'une page par
 * l'un apparaît chez l'autre sans recharger. Les fichiers joints sont
 * gérés séparément, à l'échelle de chaque page (voir DocsPage.tsx).
 */
export function useWiki() {
  const [dossiers, setDossiers] = useState<WikiDossier[]>([])
  const [pages, setPages] = useState<WikiPage[]>([])
  const [chargement, setChargement] = useState(supabaseConfigure)

  // Permet aux callbacks stables (useCallback à deps vides) de lire la
  // dernière liste de dossiers sans avoir besoin de la mettre en dépendance
  const dossiersRef = useRef<WikiDossier[]>([])
  useEffect(() => {
    dossiersRef.current = dossiers
  }, [dossiers])

  useEffect(() => {
    if (!supabaseConfigure) return
    let actif = true

    Promise.all([
      supabase.from('wiki_dossiers').select('*').order('ordre', { ascending: true }),
      supabase.from('wiki_pages').select('*').order('created_at', { ascending: true }),
    ]).then(([resDossiers, resPages]) => {
      if (!actif) return
      if (resDossiers.data) setDossiers((resDossiers.data as DossierRow[]).map(dossierDepuisRow))
      if (resPages.data) setPages((resPages.data as PageRow[]).map(pageDepuisRow))
      setChargement(false)
    })

    const canal = supabase
      .channel('wiki-temps-reel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wiki_dossiers' },
        (evenement) => {
          if (evenement.eventType === 'DELETE') {
            const id = (evenement.old as { id?: string }).id
            if (id) setDossiers((precedent) => precedent.filter((d) => d.id !== id))
            return
          }
          const dossier = dossierDepuisRow(evenement.new as DossierRow)
          setDossiers((precedent) =>
            precedent.some((d) => d.id === dossier.id)
              ? precedent.map((d) => (d.id === dossier.id ? dossier : d))
              : [...precedent, dossier],
          )
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wiki_pages' },
        (evenement) => {
          if (evenement.eventType === 'DELETE') {
            const id = (evenement.old as { id?: string }).id
            if (id) setPages((precedent) => precedent.filter((p) => p.id !== id))
            return
          }
          const page = pageDepuisRow(evenement.new as PageRow)
          setPages((precedent) =>
            precedent.some((p) => p.id === page.id)
              ? precedent.map((p) => (p.id === page.id ? page : p))
              : [...precedent, page],
          )
        },
      )
      .subscribe()

    return () => {
      actif = false
      supabase.removeChannel(canal)
    }
  }, [])

  /** Ajoute un dossier à la suite des dossiers existants (tri par "ordre") */
  const ajouterDossier = useCallback(async (nom: string) => {
    const actuels = dossiersRef.current
    const ordre = actuels.length > 0 ? Math.max(...actuels.map((d) => d.ordre)) + 1 : 0
    const { data, error } = await supabase
      .from('wiki_dossiers')
      .insert({ nom, ordre })
      .select()
      .single()
    if (error || !data) {
      console.error('Création du dossier échouée :', error?.message)
      return null
    }
    const dossier = dossierDepuisRow(data as DossierRow)
    setDossiers((precedent) =>
      precedent.some((d) => d.id === dossier.id) ? precedent : [...precedent, dossier],
    )
    return dossier
  }, [])

  /** Ajoute une page vide dans un dossier */
  const ajouterPage = useCallback(async (dossierId: string, titre: string) => {
    const { data, error } = await supabase
      .from('wiki_pages')
      .insert({ dossier_id: dossierId, titre, contenu: '' })
      .select()
      .single()
    if (error || !data) {
      console.error('Création de la page échouée :', error?.message)
      return null
    }
    const page = pageDepuisRow(data as PageRow)
    setPages((precedent) =>
      precedent.some((p) => p.id === page.id) ? precedent : [...precedent, page],
    )
    return page
  }, [])

  /** Modifie le titre et/ou le contenu d'une page (mise à jour optimiste) */
  const modifierPage = useCallback(
    async (id: string, changements: { titre?: string; contenu?: string }) => {
      setPages((precedent) =>
        precedent.map((p) => (p.id === id ? { ...p, ...changements } : p)),
      )
      const { error } = await supabase.from('wiki_pages').update(changements).eq('id', id)
      if (error) console.error('Modification de la page échouée :', error.message)
    },
    [],
  )

  /** Supprime une page (les fichiers joints suivent en cascade côté base) */
  const supprimerPage = useCallback(async (id: string) => {
    setPages((precedent) => precedent.filter((p) => p.id !== id))
    const { error } = await supabase.from('wiki_pages').delete().eq('id', id)
    if (error) console.error('Suppression de la page échouée :', error.message)
  }, [])

  return { dossiers, pages, chargement, ajouterDossier, ajouterPage, modifierPage, supprimerPage }
}
