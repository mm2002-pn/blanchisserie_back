/**
 * Icône de marque B&C Teranga — "La Machine" (piste J du dossier identité).
 * Machine à laver de face : hublot, bandeau de commande, voyant.
 * Deux variantes : `solid` (grands formats, fond clair) et le tracé par défaut
 * (petits formats — favicon, icône d'app, tampon — reste lisible dès 16 px).
 */
export function BrandMark({
  className,
  style,
  variant = 'line',
}: {
  className?: string;
  style?: React.CSSProperties;
  /** `full` = couleurs de marque figées (écran de connexion) · `solid` = pleine (à partir de ~24px sur fond clair) · `line` = tracée (petits formats/fond sombre) */
  variant?: 'full' | 'solid' | 'line';
}) {
  if (variant === 'full') {
    return (
      <svg viewBox="0 0 96 96" className={className} style={style} fill="none">
        <rect x="14" y="10" width="68" height="76" rx="9" fill="#FFFFFF" />
        <rect x="14" y="10" width="68" height="20" fill="#0B1A2E" opacity="0.14" />
        <circle cx="27" cy="20" r="4" fill="#DE6B0E" className="animate-pulse" />
        <rect x="54" y="17" width="20" height="6" rx="3" fill="#0B1A2E" opacity="0.3" />
        <circle cx="48" cy="57" r="22" fill="#0B1A2E" />
        <circle cx="48" cy="57" r="15" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.22" />
        <path
          d="M36 60 q6 -7 12 0 t12 0"
          fill="none"
          stroke="#DE6B0E"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (variant === 'solid') {
    return (
      <svg viewBox="0 0 96 96" className={className} style={style} fill="none">
        <rect x="14" y="10" width="68" height="76" rx="9" fill="currentColor" />
        <rect x="14" y="10" width="68" height="20" fill="#000" opacity="0.14" />
        <circle cx="27" cy="20" r="4" fill="#DE6B0E" />
        <rect x="54" y="17" width="20" height="6" rx="3" fill="#fff" opacity="0.55" />
        <circle cx="48" cy="57" r="22" fill="#fff" />
        <circle cx="48" cy="57" r="15" fill="none" stroke="#000" strokeWidth="3" opacity="0.14" />
        <path
          d="M36 60 q6 -7 12 0 t12 0"
          fill="none"
          stroke="#DE6B0E"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 96 96" className={className} style={style} fill="none">
      <rect
        x="16"
        y="12"
        width="64"
        height="72"
        rx="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <path d="M16 32 H80" stroke="currentColor" strokeWidth="6" />
      <circle cx="48" cy="58" r="16" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="29" cy="22" r="4" fill="currentColor" />
    </svg>
  );
}

/**
 * Verrouillage horizontal officiel : icône + "B&C / TERANGA" sur la même ligne,
 * signature "L'Art du Blanc et de la Couleur" sur la ligne suivante.
 * `tone` bascule les couleurs de texte pour fond clair vs fond marine.
 */
export function BrandLockup({
  tone = 'dark',
  showSignature = true,
  className,
}: {
  tone?: 'dark' | 'light';
  showSignature?: boolean;
  className?: string;
}) {
  const nameColor = tone === 'light' ? '#fff' : '#17356B';
  const teCorColor = tone === 'light' ? '#F0A03D' : '#DE6B0E';
  const sigColor = tone === 'light' ? '#C9D4E4' : '#8B97A8';
  const iconColor = tone === 'light' ? '#fff' : '#17356B';

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <BrandMark variant="line" className="w-9 h-9 shrink-0" style={{ color: iconColor }} />
        <div className="leading-none">
          <div
            className="font-heading font-bold text-lg tracking-tight"
            style={{ color: nameColor }}
          >
            B&amp;C <span style={{ color: teCorColor }}>TERANGA</span>
          </div>
          {showSignature && (
            <div
              className="text-[9.5px] font-heading tracking-[0.14em] uppercase mt-1"
              style={{ color: sigColor }}
            >
              L'Art du Blanc et de la Couleur
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
