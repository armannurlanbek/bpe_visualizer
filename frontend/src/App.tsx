import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { CompareView } from './components/CompareView'
import { EncodingView } from './components/EncodingView'
import { Header } from './components/Header'
import { TrainingView } from './components/TrainingView'
import type { Mode, TrainedTokenizerState } from './types'

function App() {
  const [mode, setMode] = useState<Mode>('train')
  const [trained, setTrained] = useState<TrainedTokenizerState | null>(null)

  return (
    <div className="min-h-screen">
      <Header mode={mode} onModeChange={setMode} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {mode === 'train' && <TrainingView trained={trained} onTrained={setTrained} />}
            {mode === 'encode' && <EncodingView trained={trained} />}
            {mode === 'compare' && <CompareView trained={trained} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
