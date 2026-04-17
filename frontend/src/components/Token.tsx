import { motion } from 'framer-motion'
import { tokenPop } from '../lib/animations'

interface TokenProps {
  token: string
  id?: number
  color: string
  highlight?: boolean
}

export function Token({ token, id, color, highlight = false }: TokenProps) {
  return (
    <motion.div
      layout
      variants={tokenPop}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${
        highlight ? 'border-teal bg-teal/20 shadow-lg shadow-teal/20' : 'border-transparent'
      }`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span>{token === '▁' ? '␠' : token}</span>
      {typeof id === 'number' && (
        <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">{id}</span>
      )}
    </motion.div>
  )
}
