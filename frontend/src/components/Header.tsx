import { ExternalLink, FlaskConical } from 'lucide-react'
import { ModeToggle } from './ModeToggle'
import type { Mode } from '../types'

interface HeaderProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
}

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-paper/90 backdrop-blur dark:border-slate-800 dark:bg-night/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/15 p-2 text-accent">
            <FlaskConical size={18} />
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-none">BPE Lab</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tokenizer Visualizer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle value={mode} onChange={onModeChange} />
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:border-accent hover:text-accent dark:border-slate-700 dark:text-slate-300"
            aria-label="Open GitHub repository"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </header>
  )
}
