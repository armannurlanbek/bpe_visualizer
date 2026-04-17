import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { encodeText } from '../api'
import { fadeInUp, staggerContainer } from '../lib/animations'
import { tokenColor } from '../lib/colors'
import type { EncodeResponse, TrainedTokenizerState } from '../types'
import { Explainer } from './Explainer'
import { Stats } from './Stats'
import { Token } from './Token'

interface EncodingViewProps {
  trained: TrainedTokenizerState | null
}

export function EncodingView({ trained }: EncodingViewProps) {
  const [text, setText] = useState('lower newest widely')
  const [result, setResult] = useState<EncodeResponse | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!trained || !text.trim()) {
      setResult(null)
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const response = await encodeText(text, trained.merges, trained.vocab)
        setResult(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Encoding failed.')
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => window.clearTimeout(timer)
  }, [text, trained])

  const stats = useMemo(() => {
    if (!result) {
      return []
    }
    return [
      { label: 'Characters', value: text.length },
      { label: 'Tokens', value: result.tokens.length },
      { label: 'Tokens / Char', value: result.tokens_per_char.toFixed(3) },
      { label: 'Vocab Size', value: Object.keys(trained?.vocab ?? {}).length },
    ]
  }, [result, text.length, trained?.vocab])

  if (!trained) {
    return (
      <div className="glass-card text-sm text-slate-600 dark:text-slate-300">
        Train the tokenizer first in the Train view, then come back to see live encoding.
      </div>
    )
  }

  return (
    <motion.section variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <Explainer
          title="Live Encoding Playground"
          body="Encoding applies your learned merge rules to unseen text. Type below and watch your custom tokenizer produce token chunks and IDs in real time."
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="glass-card space-y-4">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="h-36 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none ring-accent/30 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={showSteps} onChange={() => setShowSteps((value) => !value)} />
            Show merge rules used
          </label>
          {loading && <span className="text-xs text-slate-500">Encoding...</span>}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </motion.div>

      {result && (
        <>
          <motion.div variants={fadeInUp} className="glass-card">
            <h3 className="mb-3 font-display text-xl text-slate-900 dark:text-white">Tokens</h3>
            <div className="flex flex-wrap gap-2">
              {result.tokens.map((token, index) => (
                <Token key={`${token}-${index}`} token={token} id={result.ids[index]} color={tokenColor(index)} />
              ))}
            </div>
          </motion.div>

          {showSteps && (
            <motion.div variants={fadeInUp} className="glass-card">
              <h3 className="mb-3 font-display text-xl text-slate-900 dark:text-white">Merge rule order</h3>
              <div className="max-h-52 space-y-1 overflow-auto pr-1 text-xs text-slate-600 dark:text-slate-300">
                {trained.merges.map((merge, index) => (
                  <p key={`${merge[0]}-${merge[1]}-${index}`} className="font-mono">
                    {index + 1}. ({merge[0]}, {merge[1]}) → {merge[0] + merge[1]}
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {stats.length > 0 && <Stats items={stats} />}
        </>
      )}
    </motion.section>
  )
}
