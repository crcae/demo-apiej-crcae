/** Soft animated backdrop for landing content below the hero — light, readable. */
export function ContentMotionBg(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#F8FAFC]" />
      <div className="animate-content-orbs absolute inset-0 opacity-90" />
      <svg
        className="content-roads absolute inset-0 h-full w-full opacity-[0.11]"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="contentRoadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A6CFF" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#contentRoadGrad)" strokeLinecap="round" strokeWidth="1.4">
          <path className="content-road content-road-a" d="M-20 120 C200 80, 400 180, 620 140 S980 60, 1220 110" />
          <path className="content-road content-road-b" d="M-40 320 C180 280, 420 380, 680 340 S1020 260, 1240 310" />
          <path className="content-road content-road-c" d="M-10 540 C220 500, 460 600, 720 560 S1060 480, 1230 530" />
          <path className="content-road content-road-d" d="M-30 760 C260 720, 500 800, 780 760 S1100 700, 1250 750" />
          <path className="content-road content-road-e" d="M280 -20 C300 160, 260 340, 320 520 S360 720, 300 920" />
          <path className="content-road content-road-f" d="M720 -10 C700 180, 760 360, 740 540 S720 740, 780 920" />
          <path className="content-road content-road-g" d="M1040 0 C1000 200, 1080 400, 1040 600 S1020 800, 1100 920" />
        </g>
        <circle r="2.8" fill="#FF7A00" className="content-pulse">
          <animateMotion dur="14s" repeatCount="indefinite" path="M-20 120 C200 80, 400 180, 620 140 S980 60, 1220 110" />
        </circle>
        <circle r="2.4" fill="#4A6CFF" className="content-pulse">
          <animateMotion dur="16s" repeatCount="indefinite" begin="1s" path="M-40 320 C180 280, 420 380, 680 340 S1020 260, 1240 310" />
        </circle>
        <circle r="2.6" fill="#10B981" className="content-pulse">
          <animateMotion dur="15s" repeatCount="indefinite" begin="0.5s" path="M280 -20 C300 160, 260 340, 320 520 S360 720, 300 920" />
        </circle>
        <circle r="2.2" fill="#4A6CFF" className="content-pulse">
          <animateMotion dur="18s" repeatCount="indefinite" begin="2s" path="M720 -10 C700 180, 760 360, 740 540 S720 740, 780 920" />
        </circle>
      </svg>
    </div>
  );
}
