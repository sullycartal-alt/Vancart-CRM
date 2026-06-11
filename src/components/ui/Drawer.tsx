import type { ReactNode } from 'react'

interface DrawerProps {
  ouvert: boolean
  onClose: () => void
  children: ReactNode
}

/** Panneau qui monte du bas de l'écran avec un overlay sombre derrière */
export function Drawer({ ouvert, onClose, children }: DrawerProps) {
  if (!ouvert) return null

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay sombre : un tap ferme le drawer */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panneau coulissant */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] animate-[slideUp_0.25s_ease-out] overflow-y-auto rounded-t-2xl bg-white p-5 pb-8 shadow-2xl dark:bg-gray-800">
        {/* Poignée visuelle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
        {children}
      </div>
    </div>
  )
}
