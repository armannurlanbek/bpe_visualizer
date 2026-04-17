interface ExplainerProps {
  title: string
  body: string
}

export function Explainer({ title, body }: ExplainerProps) {
  return (
    <div className="glass-card border-l-4 border-l-accent">
      <h2 className="mb-2 font-display text-2xl text-slate-900 dark:text-white">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  )
}
