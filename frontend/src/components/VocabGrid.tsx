import { tokenColor } from '../lib/colors'
import { Token } from './Token'

interface VocabGridProps {
  vocab: Record<string, number>
}

export function VocabGrid({ vocab }: VocabGridProps) {
  const tokens = Object.keys(vocab).sort((a, b) => a.length - b.length || a.localeCompare(b))
  const groups = {
    one: tokens.filter((token) => token.length === 1),
    two: tokens.filter((token) => token.length === 2),
    threePlus: tokens.filter((token) => token.length >= 3),
  }

  return (
    <div className="space-y-4">
      {[
        { label: '1-char tokens', data: groups.one },
        { label: '2-char tokens', data: groups.two },
        { label: '3+ char tokens', data: groups.threePlus },
      ].map((group) => (
        <div key={group.label}>
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{group.label}</h4>
          <div className="flex flex-wrap gap-2">
            {group.data.map((token, idx) => (
              <Token key={`${group.label}-${token}`} token={token} id={vocab[token]} color={tokenColor(idx)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
