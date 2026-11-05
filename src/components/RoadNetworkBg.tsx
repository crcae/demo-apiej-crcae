interface RoadNetworkBgProps {
  /** Confine motion to a section (hero) instead of the whole viewport. */
  scoped?: boolean;
  /** Skip SVG animateMotion dots (reduced motion / mobile tier). */
  reduceMotion?: boolean;
  /** Fewer strokes + no blur filters for mobile. */
  light?: boolean;
}

/** Soft road-network backdrop — prefer scoped to hero to avoid GPU waste below the fold. */
export function RoadNetworkBg({
  scoped = false,
  reduceMotion = false,
  light = false,
}: RoadNetworkBgProps): React.JSX.Element {
  const shell = scoped
    ? 'pointer-events-none absolute inset-0 z-0 overflow-hidden'
    : 'pointer-events-none fixed inset-0 z-0 overflow-hidden';

  return (
    <div aria-hidden="true" className={shell}>
      <div className="absolute inset-0 bg-[#0B1228]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_5%,rgba(74,108,255,0.12),transparent_50%),radial-gradient(ellipse_at_85%_25%,rgba(255,122,0,0.09),transparent_45%),radial-gradient(ellipse_at_55%_95%,rgba(16,185,129,0.08),transparent_48%),radial-gradient(ellipse_at_40%_50%,rgba(0,162,255,0.04),transparent_55%)]" />
      {!light && <div className="absolute inset-0 animate-road-wash opacity-45" />}

      <svg
        className="road-network absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A6CFF" />
            <stop offset="35%" stopColor="#00a2ff" />
            <stop offset="70%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
          {!light && (
            <>
              <filter id="roadSoft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.4" />
              </filter>
              <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </>
          )}
        </defs>

        <g
          fill="none"
          stroke="url(#roadGrad)"
          strokeLinecap="round"
          filter={light ? undefined : 'url(#roadSoft)'}
        >
          <path className="road-line road-a" strokeWidth="2" d="M40 120 C200 80, 320 200, 480 160 S780 40, 1160 100" />
          <path className="road-line road-b" strokeWidth="1.8" d="M20 320 C180 280, 340 400, 520 360 S820 280, 1180 340" />
          <path className="road-line road-c" strokeWidth="2.2" d="M60 520 C220 480, 400 600, 580 560 S880 480, 1140 540" />
          <path className="road-line road-d" strokeWidth="1.6" d="M80 700 C280 660, 420 720, 640 680 S920 620, 1100 700" />
          <path className="road-line road-e" strokeWidth="1.7" d="M200 40 C240 180, 260 360, 300 520 S340 700, 380 780" />
          <path className="road-line road-f" strokeWidth="2" d="M600 20 C580 160, 640 300, 620 460 S600 640, 660 780" />
          {!light && (
            <>
              <path className="road-line road-g" strokeWidth="1.8" d="M980 60 C940 200, 1000 340, 960 500 S940 680, 1020 760" />
              <path className="road-line road-h" strokeWidth="1.5" d="M100 200 C300 240, 500 180, 700 220 S1000 260, 1180 200" />
              <path className="road-line road-i" strokeWidth="1.5" d="M150 600 C350 560, 550 620, 750 580 S1050 540, 1150 600" />
              <path className="road-line road-j" strokeWidth="1.4" d="M0 450 C160 420, 280 500, 440 470 S760 410, 1200 480" />
              <path className="road-line road-k" strokeWidth="1.6" d="M420 0 C400 140, 460 280, 440 420 S420 620, 500 800" />
              <path className="road-line road-l" strokeWidth="1.5" d="M800 0 C820 160, 760 300, 790 460 S830 640, 780 800" />
            </>
          )}
        </g>

        {!reduceMotion && (
          <g filter={light ? undefined : 'url(#dotGlow)'}>
            <circle r="3" fill="#FF7A00" className="road-pulse-dot">
              <animateMotion dur="8.5s" repeatCount="indefinite" path="M40 120 C200 80, 320 200, 480 160 S780 40, 1160 100" />
            </circle>
            <circle r="2.6" fill="#4A6CFF" className="road-pulse-dot">
              <animateMotion dur="10s" repeatCount="indefinite" begin="0.8s" path="M20 320 C180 280, 340 400, 520 360 S820 280, 1180 340" />
            </circle>
            {!light && (
              <>
                <circle r="2.8" fill="#10B981" className="road-pulse-dot">
                  <animateMotion dur="9s" repeatCount="indefinite" begin="0.4s" path="M200 40 C240 180, 260 360, 300 520 S340 700, 380 780" />
                </circle>
                <circle r="2.4" fill="#00a2ff" className="road-pulse-dot">
                  <animateMotion dur="11s" repeatCount="indefinite" begin="1.5s" path="M600 20 C580 160, 640 300, 620 460 S600 640, 660 780" />
                </circle>
                <circle r="2.5" fill="#FF7A00" className="road-pulse-dot">
                  <animateMotion dur="8s" repeatCount="indefinite" begin="0.2s" path="M100 200 C300 240, 500 180, 700 220 S1000 260, 1180 200" />
                </circle>
                <circle r="2.2" fill="#10B981" className="road-pulse-dot">
                  <animateMotion dur="9.5s" repeatCount="indefinite" begin="2.1s" path="M0 450 C160 420, 280 500, 440 470 S760 410, 1200 480" />
                </circle>
              </>
            )}
          </g>
        )}

        <g fill="#4A6CFF">
          <circle className="road-node road-n1" cx="480" cy="160" r="3.5" />
          <circle className="road-node road-n2" cx="520" cy="360" r="3.5" />
          <circle className="road-node road-n3" cx="580" cy="560" r="3" />
          {!light && (
            <>
              <circle className="road-node road-n4" cx="300" cy="520" r="3" />
              <circle className="road-node road-n5" cx="620" cy="460" r="3" />
              <circle className="road-node road-n6" cx="960" cy="500" r="3" />
              <circle className="road-node road-n7" cx="700" cy="220" r="2.5" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
