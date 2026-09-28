interface AvatarProps {
    hue: number;
    size?: number;
}

export function Avatar({ hue, size = 40 }: AvatarProps) {
  return (
    <div
      className="rounded-lg overflow-hidden shrink-0 relative"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, hsl(${hue},55%,55%), hsl(${hue},60%,40%))` }}
      />
      <svg
        viewBox="0 0 40 50"
        width="70%"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-30"
        fill="white"
      >
        <circle cx="20" cy="14" r="10" />
        <ellipse cx="20" cy="44" rx="16" ry="14" />
      </svg>
    </div>
  )
}