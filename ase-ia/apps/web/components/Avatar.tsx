/** Avatar de ASE-IA: robot minimalista en paleta institucional. */
export default function Avatar({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="ASE-IA"
      className={className}
    >
      <rect width="48" height="48" rx="12" fill="#1b3a66" />
      {/* antena */}
      <line x1="24" y1="9" x2="24" y2="14" stroke="#4fc3f7" strokeWidth="2" />
      <circle cx="24" cy="8" r="2" fill="#4fc3f7" />
      {/* cabeza */}
      <rect x="12" y="15" width="24" height="18" rx="6" fill="#ffffff" />
      {/* ojos */}
      <circle cx="19" cy="24" r="2.6" fill="#1b3a66" />
      <circle cx="29" cy="24" r="2.6" fill="#1b3a66" />
      <circle cx="19.9" cy="23.2" r="0.8" fill="#4fc3f7" />
      <circle cx="29.9" cy="23.2" r="0.8" fill="#4fc3f7" />
      {/* sonrisa */}
      <path
        d="M19 29 q5 3 10 0"
        stroke="#4fc3f7"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
