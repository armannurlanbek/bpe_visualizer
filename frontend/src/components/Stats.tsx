interface StatItem {
  label: string
  value: string | number
}

interface StatsProps {
  items: StatItem[]
}

export function Stats({ items }: StatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="glass-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
