import type { JSX } from 'react'

export type Ecran = 'accueil' | 'ajouter' | 'pipeline' | 'stats'

interface BottomNavProps {
  ecranActif: Ecran
  onChange: (ecran: Ecran) => void
}

// Icônes SVG inline pour chaque onglet
const ICONES: Record<Ecran, JSX.Element> = {
  accueil: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  ajouter: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  pipeline: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  stats: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
}

const LIBELLES: Record<Ecran, string> = {
  accueil: 'Accueil',
  ajouter: 'Ajouter',
  pipeline: 'Pipeline',
  stats: 'Stats',
}

const ONGLETS: Ecran[] = ['accueil', 'ajouter', 'pipeline', 'stats']

/** Barre de navigation fixe en bas, 4 onglets, hauteur 64px */
export function BottomNav({ ecranActif, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-stretch border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {ONGLETS.map((ecran) => {
        const actif = ecran === ecranActif
        return (
          <button
            key={ecran}
            onClick={() => onChange(ecran)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
              actif
                ? 'text-primary'
                : 'text-gray-400 dark:text-gray-500'
            }`}
            aria-current={actif ? 'page' : undefined}
          >
            {ICONES[ecran]}
            <span>{LIBELLES[ecran]}</span>
          </button>
        )
      })}
    </nav>
  )
}
