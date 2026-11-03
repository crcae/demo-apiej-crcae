/** Animated road-network backdrop — present but not competing with hero content. */
export function RoadNetworkBg(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Atmospheric brand washes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(74,108,255,0.18),transparent_50%),radial-gradient(ellipse_at_80%_30%,rgba(255,122,0,0.14),transparent_45%),radial-gradient(ellipse_at_50%_90%,rgba(16,185,129,0.12),transparent_40%)]" />

      <svg
        className="road-network absolute inset-0 h-full w-full opacity-[0.26]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A6CFF" />
            <stop offset="45%" stopColor="#00a2ff" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
          <filter id="roadSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        <g fill="none" stroke="url(#roadGrad)" strokeLinecap="round" filter="url(#roadSoft)">
          <path id="route-a" className="road-line road-a" strokeWidth="2" d="M40 120 C200 80, 320 200, 480 160 S780 40, 1160 100" />
          <path id="route-b" className="road-line road-b" strokeWidth="1.8" d="M20 320 C180 280, 340 400, 520 360 S820 280, 1180 340" />
          <path id="route-c" className="road-line road-c" strokeWidth="2.2" d="M60 520 C220 480, 400 600, 580 560 S880 480, 1140 540" />
          <path id="route-d" className="road-line road-d" strokeWidth="1.6" d="M80 700 C280 660, 420 720, 640 680 S920 620, 1100 700" />
          <path id="route-e" className="road-line road-e" strokeWidth="1.7" d="M200 40 C240 180, 260 360, 300 520 S340 700, 380 780" />
          <path id="route-f" className="road-line road-f" strokeWidth="2" d="M600 20 C580 160, 640 300, 620 460 S600 640, 660 780" />
          <path id="route-g" className="road-line road-g" strokeWidth="1.8" d="M980 60 C940 200, 1000 340, 960 500 S940 680, 1020 760" />
          <path id="route-h" className="road-line road-h" strokeWidth="1.5" d="M100 200 C300 240, 500 180, 700 220 S1000 260, 1180 200" />
          <path id="route-i" className="road-line road-i" strokeWidth="1.5" d="M150 600 C350 560, 550 620, 750 580 S1050 540, 1150 600" />
        </g>

        {/* Traveling light pulses along routes */}
        <circle r="3.5" fill="#FF7A00" className="road-pulse-dot">
          <animateMotion dur="9s" repeatCount="indefinite" path="M40 120 C200 80, 320 200, 480 160 S780 40, 1160 100" />
        </circle>
        <circle r="3" fill="#4A6CFF" className="road-pulse-dot">
          <animateMotion dur="11s" repeatCount="indefinite" begin="1.2s" path="M20 320 C180 280, 340 400, 520 360 S820 280, 1180 340" />
        </circle>
        <circle r="3.2" fill="#10B981" className="road-pulse-dot">
          <animateMotion dur="10s" repeatCount="indefinite" begin="0.6s" path="M200 40 C240 180, 260 360, 300 520 S340 700, 380 780" />
        </circle>
        <circle r="2.8" fill="#00a2ff" className="road-pulse-dot">
          <animateMotion dur="12s" repeatCount="indefinite" begin="2s" path="M600 20 C580 160, 640 300, 620 460 S600 640, 660 780" />
        </circle>
        <circle r="3" fill="#FF7A00" className="road-pulse-dot">
          <animateMotion dur="8.5s" repeatCount="indefinite" begin="0.3s" path="M100 200 C300 240, 500 180, 700 220 S1000 260, 1180 200" />
        </circle>

        <g fill="#4A6CFF">
          <circle className="road-node" cx="480" cy="160" r="4" />
          <circle className="road-node" cx="520" cy="360" r="4" />
          <circle className="road-node" cx="580" cy="560" r="3.5" />
          <circle className="road-node" cx="300" cy="520" r="3.5" />
          <circle className="road-node" cx="620" cy="460" r="3.5" />
          <circle className="road-node" cx="960" cy="500" r="3.5" />
          <circle className="road-node" cx="700" cy="220" r="3" />
        </g>
      </svg>
    </div>
  );
}
