interface MergeRuleProps {
  left: string
  right: string
  rank: number
}

export function MergeRule({ left, right, rank }: MergeRuleProps) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
      <span className="font-mono text-slate-700 dark:text-slate-200">
        ({left}, {right}) → {left + right}
      </span>
      <span className="text-xs text-slate-500">#{rank + 1}</span>
    </li>
  )
}
