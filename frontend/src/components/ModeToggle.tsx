import type { Mode } from '../types'

interface ModeToggleProps {
  value: Mode
  onChange: (mode: Mode) => void
}

const modes: { id: Mode; label: string }[] = [
  { id: 'train', label: 'Train' },
  { id: 'encode', label: 'Encode' },
  { id: 'compare', label: 'Compare' },
]

export function ModeToggle({ value, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            value === mode.id
              ? 'bg-accent text-white shadow'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
