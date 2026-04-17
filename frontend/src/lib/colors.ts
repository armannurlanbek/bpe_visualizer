const hueStep = 47

export function tokenColor(index: number): string {
  const hue = (index * hueStep) % 360
  return `hsl(${hue} 80% 55%)`
}
