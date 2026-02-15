export default function WanderingAmp({ size = 360, className = "" }) {
  const s = Number(size) || 360;

  return (
    <div
      className={`wanderingAmp ${className}`}
      style={{ width: s, height: s }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 420 420" width="100%" height="100%">
        {/* soft glow */}
        <defs>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="ampFace" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(253,244,225,0.16)" />
            <stop offset="1" stopColor="rgba(253,244,225,0.06)" />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse
          className="wanderingAmp__shadow"
          cx="210"
          cy="338"
          rx="120"
          ry="22"
          fill="rgba(0,0,0,0.22)"
        />

        {/* whole character group */}
        <g className="wanderingAmp__guy" filter="url(#softGlow)">
          {/* cable tail */}
          <path
            className="wanderingAmp__cable"
            d="M318 250 C360 262, 366 300, 338 320 C320 334, 290 330, 286 312"
            fill="none"
            stroke="rgba(253,244,225,0.35)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle
            cx="285"
            cy="312"
            r="6"
            fill="rgba(250,187,76,0.9)"
          />

          {/* amp body */}
          <rect
            x="120"
            y="120"
            width="180"
            height="170"
            rx="26"
            fill="rgba(0,0,0,0.28)"
            stroke="rgba(245,232,205,0.25)"
            strokeWidth="2"
          />
          {/* amp face panel */}
          <rect
            x="140"
            y="145"
            width="140"
            height="110"
            rx="18"
            fill="url(#ampFace)"
            stroke="rgba(245,232,205,0.22)"
            strokeWidth="2"
          />

          {/* speaker grid dots */}
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 7 }).map((__, col) => (
              <circle
                key={`${row}-${col}`}
                cx={160 + col * 18}
                cy={168 + row * 16}
                r="3.1"
                fill="rgba(253,244,225,0.55)"
                opacity="0.35"
              />
            ))
          )}

          {/* knobs */}
          <g className="wanderingAmp__knobs">
            <circle cx="165" cy="268" r="10" fill="rgba(250,187,76,0.85)" />
            <circle cx="205" cy="268" r="10" fill="rgba(246,165,81,0.85)" />
            <circle cx="245" cy="268" r="10" fill="rgba(250,187,76,0.75)" />
          </g>

          {/* cute face */}
          <g className="wanderingAmp__face">
            <circle cx="185" cy="212" r="6" fill="rgba(253,244,225,0.92)" />
            <circle cx="235" cy="212" r="6" fill="rgba(253,244,225,0.92)" />
            <path
              d="M190 232 C205 246, 215 246, 230 232"
              fill="none"
              stroke="rgba(253,244,225,0.9)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* blush */}
            <ellipse cx="170" cy="226" rx="10" ry="6" fill="rgba(246,165,81,0.35)" />
            <ellipse cx="250" cy="226" rx="10" ry="6" fill="rgba(246,165,81,0.35)" />
          </g>

          {/* legs */}
          <g className="wanderingAmp__legs">
            <path
              className="wanderingAmp__leg wanderingAmp__leg--left"
              d="M165 290 C150 314, 150 332, 165 346"
              fill="none"
              stroke="rgba(253,244,225,0.8)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              className="wanderingAmp__leg wanderingAmp__leg--right"
              d="M255 290 C270 314, 270 332, 255 346"
              fill="none"
              stroke="rgba(253,244,225,0.8)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* shoes */}
            <ellipse cx="160" cy="350" rx="18" ry="9" fill="rgba(0,0,0,0.35)" />
            <ellipse cx="260" cy="350" rx="18" ry="9" fill="rgba(0,0,0,0.35)" />
          </g>

          {/* floating music note */}
          <g className="wanderingAmp__note">
            <path
              d="M295 150 v48 c0 12-10 22-22 22s-22-10-22-22 10-22 22-22c4 0 8 1 11 3v-46l44-10v20z"
              fill="rgba(250,187,76,0.9)"
              opacity="0.9"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
