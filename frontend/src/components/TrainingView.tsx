import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCorpus, getSampleCorpora, trainBpe } from '../api'
import { fadeInUp, staggerContainer } from '../lib/animations'
import { tokenColor } from '../lib/colors'
import type { CorpusMeta, TrainedTokenizerState } from '../types'
import { Explainer } from './Explainer'
import { MergeRule } from './MergeRule'
import { Stats } from './Stats'
import { Token } from './Token'
import { VocabGrid } from './VocabGrid'

interface TrainingViewProps {
  trained: TrainedTokenizerState | null
  onTrained: (state: TrainedTokenizerState) => void
}

const DEFAULT_TEXT = 'low lower newest wider low lower lowest newest'

export function TrainingView({ trained, onTrained }: TrainingViewProps) {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [numMerges, setNumMerges] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [corpora, setCorpora] = useState<CorpusMeta[]>([])
  const [selectedCorpus, setSelectedCorpus] = useState('')

  useEffect(() => {
    getSampleCorpora()
      .then((response) => setCorpora(response.corpora))
      .catch(() => {
        setCorpora([])
      })
  }, [])

  useEffect(() => {
    if (!trained?.steps.length || !autoPlay) {
      return
    }
    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % trained.steps.length)
    }, 1250)
    return () => window.clearInterval(timer)
  }, [autoPlay, trained?.steps])

  useEffect(() => {
    setStepIndex(0)
  }, [trained?.steps.length])

  const currentStep = trained?.steps[stepIndex] ?? null

  const stats = useMemo(() => {
    if (!trained) {
      return []
    }
    const tokenCount = Object.keys(trained.vocab).length
    const avgTokenLength =
      Object.keys(trained.vocab).reduce((acc, token) => acc + token.length, 0) / Math.max(tokenCount, 1)

    return [
      { label: 'Total Tokens', value: tokenCount },
      { label: 'Learned Merges', value: trained.merges.length },
      { label: 'Avg Token Length', value: avgTokenLength.toFixed(2) },
      { label: 'Compression Proxy', value: `${(1 / Math.max(avgTokenLength, 1)).toFixed(2)}x` },
    ]
  }, [trained])

  async function handleLoadCorpus(corpusId: string) {
    setSelectedCorpus(corpusId)
    if (!corpusId) {
      return
    }
    try {
      const corpus = await getCorpus(corpusId)
      setText(corpus.text)
    } catch {
      setError('Could not load selected corpus.')
    }
  }

  async function handleTrain() {
    setLoading(true)
    setError('')
    try {
      const result = await trainBpe(text, numMerges)
      onTrained({
        merges: result.merges,
        vocab: result.vocab,
        steps: result.steps,
        initialChars: result.initial_chars,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <Explainer
          title="How BPE Learns"
          body="BPE repeatedly merges the most frequent adjacent pair. This training view lets you inspect each merge and see the vocabulary evolve from characters to reusable chunks."
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="glass-card space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-40 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none ring-accent/30 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="space-y-3">
            <label className="block text-sm font-medium">Sample corpus</label>
            <select
              value={selectedCorpus}
              onChange={(event) => handleLoadCorpus(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Use custom text</option>
              {corpora.map((corpus) => (
                <option key={corpus.id} value={corpus.id}>
                  {corpus.name}
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium">Merges: {numMerges}</label>
            <input
              type="range"
              min={1}
              max={50}
              value={numMerges}
              onChange={(event) => setNumMerges(Number(event.target.value))}
              className="w-full accent-accent"
            />
            <button
              type="button"
              onClick={handleTrain}
              disabled={loading || !text.trim()}
              className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Training...' : 'Train'}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </motion.div>

      {trained && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <div className="glass-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl text-slate-900 dark:text-white">
                Step {Math.min(stepIndex + 1, trained.steps.length)} of {trained.steps.length}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStepIndex((idx) => Math.max(0, idx - 1))}
                  className="rounded-lg border border-slate-300 p-2 dark:border-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setAutoPlay((value) => !value)}
                  className="rounded-lg bg-amber px-3 py-2 text-xs font-semibold text-white"
                >
                  {autoPlay ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStepIndex((idx) => Math.min((trained.steps.length || 1) - 1, idx + 1))
                  }
                  className="rounded-lg border border-slate-300 p-2 dark:border-slate-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {currentStep && (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Best pair: <span className="font-mono text-teal">{currentStep.pair.join(' + ')}</span> with count{' '}
                  <strong>{currentStep.count}</strong>
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Before merge</h4>
                    <div className="space-y-2">
                      {currentStep.words_before.slice(0, 10).map((word, wordIdx) => (
                        <div key={`before-${wordIdx}`} className="flex flex-wrap gap-1">
                          <AnimatePresence mode="popLayout">
                            {word.map((token, tokenIdx) => (
                              <Token
                                key={`${wordIdx}-before-${tokenIdx}-${token}`}
                                token={token}
                                color={tokenColor(tokenIdx)}
                                highlight={
                                  token === currentStep.pair[0] ||
                                  token === currentStep.pair[1]
                                }
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">After merge</h4>
                    <div className="space-y-2">
                      {currentStep.words_after.slice(0, 10).map((word, wordIdx) => (
                        <div key={`after-${wordIdx}`} className="flex flex-wrap gap-1">
                          <AnimatePresence mode="popLayout">
                            {word.map((token, tokenIdx) => (
                              <Token
                                key={`${wordIdx}-after-${tokenIdx}-${token}`}
                                token={token}
                                color={tokenColor(tokenIdx)}
                                highlight={token === currentStep.new_token}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card">
              <h3 className="mb-3 font-display text-xl text-slate-900 dark:text-white">Merge rules</h3>
              <ul className="max-h-[420px] space-y-2 overflow-auto pr-1">
                {[...trained.merges].reverse().map((merge, idx) => (
                  <MergeRule
                    key={`${merge[0]}-${merge[1]}-${idx}`}
                    left={merge[0]}
                    right={merge[1]}
                    rank={trained.merges.length - idx - 1}
                  />
                ))}
              </ul>
            </div>
            <div className="glass-card">
              <h3 className="mb-3 font-display text-xl text-slate-900 dark:text-white">Vocabulary</h3>
              <VocabGrid vocab={trained.vocab} />
            </div>
          </div>

          {stats.length > 0 && <Stats items={stats} />}
        </motion.div>
      )}
    </motion.section>
  )
}
