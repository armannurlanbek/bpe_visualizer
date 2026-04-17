import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { compareTokenizers } from '../api'
import { fadeInUp, staggerContainer } from '../lib/animations'
import { tokenColor } from '../lib/colors'
import type { CompareResponse, TrainedTokenizerState } from '../types'
import { Explainer } from './Explainer'
import { Stats } from './Stats'
import { Token } from './Token'

interface CompareViewProps {
  trained: TrainedTokenizerState | null
}

const DEMOS = {
  English: 'Lower newest words become reusable chunks quickly.',
  Russian: 'В некотором царстве люди изучают токенизацию.',
  Kazakh: 'Бүгін біз BPE алгоритмін көрнекі түрде үйренеміз.',
}

export function CompareView({ trained }: CompareViewProps) {
  const [text, setText] = useState(DEMOS.English)
  const [result, setResult] = useState<CompareResponse | null>(null)
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
        const response = await compareTokenizers(text, trained.merges, trained.vocab)
        setResult(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Comparison failed.')
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => window.clearTimeout(timer)
  }, [text, trained])

  const chartData = useMemo(
    () =>
      result
        ? [
            { name: 'Your BPE', tokens: result.my_count },
            { name: 'tiktoken', tokens: result.tiktoken_count },
          ]
        : [],
    [result]
  )

  if (!trained) {
    return (
      <div className="glass-card text-sm text-slate-600 dark:text-slate-300">
        Train your tokenizer first, then compare it side-by-side with OpenAI&apos;s tokenizer.
      </div>
    )
  }

  return (
    <motion.section variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <Explainer
          title="Your BPE vs tiktoken"
          body="OpenAI's tokenizer uses a much larger merge vocabulary. This view compares tokenization output and token counts for the exact same text input."
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="glass-card space-y-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(DEMOS).map(([label, sample]) => (
            <button
              type="button"
              key={label}
              onClick={() => setText(sample)}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:border-accent hover:text-accent dark:border-slate-700"
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="h-32 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none ring-accent/30 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {loading && <p className="text-xs text-slate-500">Comparing tokenizers...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </motion.div>

      {result && (
        <>
          <motion.div variants={fadeInUp} className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card">
              <h3 className="mb-3 font-display text-xl text-slate-900 dark:text-white">Your BPE</h3>
              <div className="flex flex-wrap gap-2">
                {result.my_tokens.map((token, index) => (
                  <Token key={`my-${token}-${index}`} token={token} id={result.my_ids[index]} color={tokenColor(index)} />
                ))}
              </div>
            </div>
            <div className="glass-card">
              <h3 className="mb-3 font-display text-xl text-slate-900 dark:text-white">tiktoken (GPT-4)</h3>
              <div className="flex flex-wrap gap-2">
                {result.tiktoken_tokens.map((token, index) => (
                  <Token
                    key={`tt-${token}-${index}`}
                    token={token}
                    id={result.tiktoken_ids[index]}
                    color={tokenColor(index + 30)}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="glass-card">
            <h3 className="mb-3 font-display text-xl text-slate-900 dark:text-white">Token Count Comparison</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <Stats
            items={[
              { label: 'Your Token Count', value: result.my_count },
              { label: 'tiktoken Count', value: result.tiktoken_count },
              { label: 'Your Vocab Size', value: result.my_vocab_size },
              { label: 'tiktoken Vocab', value: result.tiktoken_vocab_size.toLocaleString() },
            ]}
          />
        </>
      )}
    </motion.section>
  )
}
