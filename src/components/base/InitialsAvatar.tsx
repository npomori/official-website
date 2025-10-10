import type { FC } from 'react'

export interface InitialsAvatarProps {
  name: string
  className?: string
  alt?: string
  /**
   * viewBox size. Actual rendered size should be controlled by CSS (width/height classes).
   */
  boxSize?: number
}

const palette = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f97316', // orange-500
  '#a855f7', // purple-500
  '#06b6d4', // cyan-500
  '#ef4444', // red-500
  '#14b8a6', // teal-500
  '#eab308', // yellow-500
  '#f43f5e' // rose-500
]

const nameHash = (s: string): number => {
  let h = 0
  for (const ch of Array.from(s)) {
    const cp = ch.codePointAt(0) ?? 0
    h = (h << 5) - h + cp
    h |= 0
  }
  return Math.abs(h)
}

const getInitials = (nameRaw: string): string => {
  const name = nameRaw.trim()
  if (!name) return '?'
  // 半角/全角の区切りや中黒をスペースに
  const cleaned = name.replace(/\s+/g, ' ').replace(/[・･•・]/g, ' ')
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0] ?? ''
    const second = parts[1] ?? ''
    const a = Array.from(first)[0] ?? ''
    const b = Array.from(second)[0] ?? ''
    return `${a}${b}`.toUpperCase()
  }
  const chars = Array.from(cleaned)
  return `${chars[0] ?? '?'}`.toUpperCase() + `${chars[1] ?? ''}`.toUpperCase()
}

const InitialsAvatar: FC<InitialsAvatarProps> = ({ name, className, alt, boxSize = 64 }) => {
  const initials = getInitials(name).slice(0, 2)
  const bg = palette[nameHash(name) % palette.length]
  const fontSize = Math.round(boxSize * 0.45)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${boxSize} ${boxSize}`}
      role="img"
      aria-label={alt ?? `${name}のアバター`}
      className={className}
    >
      <title>{alt ?? `${name}のアバター`}</title>
      <rect width="100%" height="100%" rx={boxSize / 2} fill={bg} />
      <text
        x="50%"
        y="50%"
        dy=".1em"
        dominantBaseline="middle"
        alignmentBaseline="middle"
        textAnchor="middle"
        fontFamily="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
        fontSize={fontSize}
        fill="#ffffff"
      >
        {initials}
      </text>
    </svg>
  )
}

export default InitialsAvatar
