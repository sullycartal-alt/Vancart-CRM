import { useEffect } from 'react'

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
}

/** Notification éphémère affichée 2 secondes en bas de l'écran */
export function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-[fadeIn_0.2s_ease-out] rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
      {message}
    </div>
  )
}
