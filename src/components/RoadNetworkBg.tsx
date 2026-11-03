/** Subtle animated road-network SVG for landing background. */
export function RoadNetworkBg(): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.14]"
    >
      <svg className="road-network h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A6CFF" />
            <stop offset="50%" stopColor="#00a2ff" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#roadGrad)" strokeWidth="1.5" strokeLinecap="round">
          <path className="road-line road-a" d="M40 120 C200 80, 320 200, 480 160 S780 40, 1160 100" />
          <path className="road-line road-b" d="M20 320 C180 280, 340 400, 520 360 S820 280, 1180 340" />
          <path className="road-line road-c" d="M60 520 C220 480, 400 600, 580 560 S880 480, 1140 540" />
          <path className="road-line road-d" d="M80 700 C280 660, 420 720, 640 680 S920 620, 1100 700" />
          <path className="road-line road-e" d="M200 40 C240 180, 260 360, 300 520 S340 700, 380 780" />
          <path className="road-line road-f" d="M600 20 C580 160, 640 300, 620 460 S600 640, 660 780" />
          <path className="road-line road-g" d="M980 60 C940 200, 1000 340, 960 500 S940 680, 1020 760" />
        </g>
        <g fill="#4A6CFF">
          <circle className="road-node" cx="480" cy="160" r="3.5" />
          <circle className="road-node" cx="520" cy="360" r="3.5" />
          <circle className="road-node" cx="580" cy="560" r="3.5" />
          <circle className="road-node" cx="300" cy="520" r="3" />
          <circle className="road-node" cx="620" cy="460" r="3" />
          <circle className="road-node" cx="960" cy="500" r="3" />
        </g>
      </svg>
    </div>
  );
}
