import type { Statut } from '../../types'
import { COULEURS_STATUT } from '../../constants'
import { getStatutLabel } from '../../utils'

interface BadgeProps {
  statut: Statut
}

/** Badge coloré affichant le statut d'un commerce */
export function Badge({ statut }: BadgeProps) {
  const couleur = COULEURS_STATUT[statut]
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: couleur }}
    >
      {getStatutLabel(statut)}
    </span>
  )
}
