function svgToDataUrl(svgString) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const FRACTION_WALL_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" font-family="system-ui, sans-serif">
  <rect width="800" height="450" rx="16" fill="#0f172a"/>
  <text x="400" y="42" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="bold">
    Fraction Wall — Comparing Benchmarks (1, ½, ⅓, ¼, ⅙, ⅛)
  </text>
  <!-- 1 Whole -->
  <g transform="translate(50, 65)">
    <rect width="700" height="52" rx="6" fill="#2563eb" stroke="#1e293b" stroke-width="3"/>
    <text x="350" y="33" text-anchor="middle" fill="#ffffff" font-size="20" font-weight="bold">1 Whole (1.0 = 100%)</text>
  </g>
  <!-- Halves -->
  <g transform="translate(50, 125)">
    <rect x="0" width="350" height="52" rx="6" fill="#0891b2" stroke="#0f172a" stroke-width="3"/>
    <rect x="350" width="350" height="52" rx="6" fill="#0891b2" stroke="#0f172a" stroke-width="3"/>
    <text x="175" y="33" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold">½ (0.5 = 50%)</text>
    <text x="525" y="33" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold">½</text>
  </g>
  <!-- Thirds -->
  <g transform="translate(50, 185)">
    <rect x="0" width="233.3" height="52" rx="6" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>
    <rect x="233.3" width="233.3" height="52" rx="6" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>
    <rect x="466.6" width="233.3" height="52" rx="6" fill="#16a34a" stroke="#0f172a" stroke-width="3"/>
    <text x="116" y="33" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold">⅓ (≈0.33)</text>
    <text x="350" y="33" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold">⅓</text>
    <text x="583" y="33" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold">⅓</text>
  </g>
  <!-- Quarters -->
  <g transform="translate(50, 245)">
    <rect x="0" width="175" height="52" rx="6" fill="#d97706" stroke="#0f172a" stroke-width="3"/>
    <rect x="175" width="175" height="52" rx="6" fill="#d97706" stroke="#0f172a" stroke-width="3"/>
    <rect x="350" width="175" height="52" rx="6" fill="#d97706" stroke="#0f172a" stroke-width="3"/>
    <rect x="525" width="175" height="52" rx="6" fill="#d97706" stroke="#0f172a" stroke-width="3"/>
    <text x="87" y="33" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="bold">¼ (0.25)</text>
    <text x="262" y="33" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="bold">¼</text>
    <text x="437" y="33" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="bold">¼</text>
    <text x="612" y="33" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="bold">¼</text>
  </g>
  <!-- Sixths -->
  <g transform="translate(50, 305)">
    <rect x="0" width="116.6" height="52" rx="6" fill="#9333ea" stroke="#0f172a" stroke-width="3"/>
    <rect x="116.6" width="116.6" height="52" rx="6" fill="#9333ea" stroke="#0f172a" stroke-width="3"/>
    <rect x="233.2" width="116.6" height="52" rx="6" fill="#9333ea" stroke="#0f172a" stroke-width="3"/>
    <rect x="349.8" width="116.6" height="52" rx="6" fill="#9333ea" stroke="#0f172a" stroke-width="3"/>
    <rect x="466.4" width="116.6" height="52" rx="6" fill="#9333ea" stroke="#0f172a" stroke-width="3"/>
    <rect x="583" width="117" height="52" rx="6" fill="#9333ea" stroke="#0f172a" stroke-width="3"/>
    <text x="58" y="33" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">⅙</text>
    <text x="175" y="33" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">⅙</text>
    <text x="291" y="33" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">⅙</text>
    <text x="408" y="33" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">⅙</text>
    <text x="524" y="33" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">⅙</text>
    <text x="641" y="33" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">⅙</text>
  </g>
  <!-- Benchmark dashed line at 1/2 -->
  <line x1="400" y1="60" x2="400" y2="375" stroke="#facc15" stroke-width="3" stroke-dasharray="8,6"/>
  <text x="400" y="415" text-anchor="middle" fill="#fde047" font-size="16" font-weight="bold">
    Yellow Line = ½ Benchmark (½ = 2/4 = 3/6 &gt; ⅓)
  </text>
</svg>
`);

export const HUNDREDTHS_GRID_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" font-family="system-ui, sans-serif">
  <rect width="800" height="420" rx="16" fill="#0f172a"/>
  <text x="400" y="40" text-anchor="middle" fill="#f8fafc" font-size="21" font-weight="bold">
    10×10 Hundredths Grid &amp; Number Line — ¾ = 0.75 = 75%
  </text>
  <!-- 10x10 Grid (75 shaded) -->
  <g transform="translate(65, 65)">
    <rect width="280" height="280" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
    <!-- 7 full columns of 10 = 70 -->
    <rect x="0" y="0" width="196" height="280" fill="#10b981"/>
    <!-- 5 squares in 8th column = 5 -->
    <rect x="196" y="0" width="28" height="140" fill="#34d399"/>
    <!-- Grid lines -->
    <path d="M28 0v280M56 0v280M84 0v280M112 0v280M140 0v280M168 0v280M196 0v280M224 0v280M252 0v280
             M0 28h280M0 56h280M0 84h280M0 112h280M0 140h280M0 168h280M0 196h280M0 224h280M0 252h280"
          stroke="#0f172a" stroke-width="2"/>
  </g>
  <!-- Equivalences Card -->
  <g transform="translate(390, 80)">
    <rect width="350" height="250" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="25" y="45" fill="#94a3b8" font-size="14" font-weight="bold">SHADED REGION REPRESENTATIONS</text>
    <text x="25" y="90" fill="#38bdf8" font-size="24" font-weight="bold">• Fraction: 75/100 = ¾</text>
    <text x="25" y="135" fill="#34d399" font-size="24" font-weight="bold">• Decimal: 0.75</text>
    <text x="25" y="180" fill="#fbbf24" font-size="24" font-weight="bold">• Percentage: 75%</text>
    <text x="25" y="222" fill="#e2e8f0" font-size="15">Question: How many more squares to reach 4/5 (80%)?</text>
  </g>
</svg>
`);

export const ROOT_SYSTEMS_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" font-family="system-ui, sans-serif">
  <rect width="800" height="440" rx="16" fill="#0f172a"/>
  <text x="400" y="40" text-anchor="middle" fill="#f8fafc" font-size="22" font-weight="bold">
    Plant Root Systems — Tap Root vs. Fibrous Root (B6.1.1.1.1)
  </text>
  <!-- Soil line -->
  <rect x="40" y="170" width="720" height="220" rx="12" fill="#3f2e21" stroke="#78350f" stroke-width="2"/>
  <line x1="40" y1="170" x2="760" y2="170" stroke="#84cc16" stroke-width="4"/>
  <!-- Left: Tap Root -->
  <g transform="translate(220, 170)">
    <!-- Shoot -->
    <path d="M0 0 V-75" stroke="#22c55e" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="-26" cy="-50" rx="24" ry="12" fill="#22c55e"/>
    <ellipse cx="26" cy="-62" rx="24" ry="12" fill="#22c55e"/>
    <!-- Main primary tap root -->
    <path d="M0 0 L-4 175 L0 190 L4 175 Z" fill="#f59e0b" stroke="#fbbf24" stroke-width="6"/>
    <!-- Lateral roots -->
    <path d="M0 40 L-60 75 M0 65 L55 100 M0 95 L-50 130 M0 125 L45 155" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
    <text x="0" y="-95" text-anchor="middle" fill="#fef08a" font-size="18" font-weight="bold">TAP ROOT SYSTEM</text>
    <text x="85" y="45" fill="#fde68a" font-size="14">← Main Primary Root</text>
    <text x="85" y="105" fill="#fde68a" font-size="14">← Lateral Branch Roots</text>
    <text x="0" y="212" text-anchor="middle" fill="#e2e8f0" font-size="14">Examples: Mango, Bean, Carrot, Tridax</text>
  </g>
  <!-- Right: Fibrous Root -->
  <g transform="translate(580, 170)">
    <!-- Grass blades -->
    <path d="M0 0 L-25 -80 M0 0 L0 -90 M0 0 L25 -80" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>
    <!-- Fibrous roots branching from base -->
    <path d="M0 0 C-30 40 -70 90 -85 150
             M0 0 C-15 50 -40 110 -45 165
             M0 0 C-5 60 -10 120 -8 170
             M0 0 C10 60 20 120 25 168
             M0 0 C25 50 55 105 65 160
             M0 0 C40 40 80 85 95 140"
          fill="none" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
    <text x="0" y="-100" text-anchor="middle" fill="#fef08a" font-size="18" font-weight="bold">FIBROUS ROOT SYSTEM</text>
    <text x="0" y="212" text-anchor="middle" fill="#e2e8f0" font-size="14">Examples: Maize, Grass, Rice, Onion</text>
  </g>
</svg>
`);

export const STORY_MAP_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" font-family="system-ui, sans-serif">
  <rect width="800" height="420" rx="16" fill="#0f172a"/>
  <text x="400" y="42" text-anchor="middle" fill="#f8fafc" font-size="21" font-weight="bold">
    Reading Comprehension — Main Idea &amp; Supporting Details Organizer
  </text>
  <!-- Main Idea Box -->
  <rect x="150" y="70" width="500" height="85" rx="14" fill="#dc2626" stroke="#fca5a5" stroke-width="2"/>
  <text x="400" y="102" text-anchor="middle" fill="#fecaca" font-size="13" font-weight="bold">MAIN IDEA (WHAT THE PASSAGE IS MOSTLY ABOUT)</text>
  <text x="400" y="132" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="bold">
    “Market day at Makola brings traders and buyers together in busy trade.”
  </text>
  <!-- Connectors -->
  <path d="M250 155 L150 215 M400 155 L400 215 M550 155 L650 215" stroke="#94a3b8" stroke-width="3"/>
  <!-- Detail 1 -->
  <rect x="40" y="215" width="220" height="145" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="150" y="245" text-anchor="middle" fill="#38bdf8" font-size="14" font-weight="bold">SUPPORTING DETAIL 1</text>
  <text x="150" y="278" text-anchor="middle" fill="#e2e8f0" font-size="14">Lorries arrive at dawn</text>
  <text x="150" y="300" text-anchor="middle" fill="#e2e8f0" font-size="14">unloading fresh yams,</text>
  <text x="150" y="322" text-anchor="middle" fill="#e2e8f0" font-size="14">tomatoes, and plantains.</text>
  <!-- Detail 2 -->
  <rect x="290" y="215" width="220" height="145" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="400" y="245" text-anchor="middle" fill="#34d399" font-size="14" font-weight="bold">SUPPORTING DETAIL 2</text>
  <text x="400" y="278" text-anchor="middle" fill="#e2e8f0" font-size="14">Traders call out prices</text>
  <text x="400" y="300" text-anchor="middle" fill="#e2e8f0" font-size="14">and arrange colourful</text>
  <text x="400" y="322" text-anchor="middle" fill="#e2e8f0" font-size="14">stalls along the lanes.</text>
  <!-- Detail 3 -->
  <rect x="540" y="215" width="220" height="145" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="650" y="245" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="bold">SUPPORTING DETAIL 3</text>
  <text x="650" y="278" text-anchor="middle" fill="#e2e8f0" font-size="14">Parents and children</text>
  <text x="650" y="300" text-anchor="middle" fill="#e2e8f0" font-size="14">bargain politely for</text>
  <text x="650" y="322" text-anchor="middle" fill="#e2e8f0" font-size="14">weekly household food.</text>
</svg>
`);

export const BAR_CHART_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" font-family="system-ui, sans-serif">
  <rect width="800" height="420" rx="16" fill="#0f172a"/>
  <text x="400" y="42" text-anchor="middle" fill="#f8fafc" font-size="21" font-weight="bold">
    Class Survey Bar Chart — Modes of Transport to School (B6.1.3.1.2)
  </text>
  <!-- Axes -->
  <line x1="120" y1="75" x2="120" y2="340" stroke="#94a3b8" stroke-width="3"/>
  <line x1="120" y1="340" x2="700" y2="340" stroke="#94a3b8" stroke-width="3"/>
  <!-- Bars -->
  <rect x="165" y="110" width="90" height="230" rx="6" fill="#3b82f6"/>
  <text x="210" y="100" text-anchor="middle" fill="#93c5fd" font-size="16" font-weight="bold">18</text>
  <text x="210" y="368" text-anchor="middle" fill="#e2e8f0" font-size="15">Walking</text>

  <rect x="305" y="160" width="90" height="180" rx="6" fill="#10b981"/>
  <text x="350" y="150" text-anchor="middle" fill="#6ee7b7" font-size="16" font-weight="bold">14</text>
  <text x="350" y="368" text-anchor="middle" fill="#e2e8f0" font-size="15">Trotro / Bus</text>

  <rect x="445" y="250" width="90" height="90" rx="6" fill="#f59e0b"/>
  <text x="490" y="240" text-anchor="middle" fill="#fde68a" font-size="16" font-weight="bold">7</text>
  <text x="490" y="368" text-anchor="middle" fill="#e2e8f0" font-size="15">Car / Taxi</text>

  <rect x="585" y="290" width="90" height="50" rx="6" fill="#a855f7"/>
  <text x="630" y="280" text-anchor="middle" fill="#d8b4fe" font-size="16" font-weight="bold">4</text>
  <text x="630" y="368" text-anchor="middle" fill="#e2e8f0" font-size="15">Bicycle</text>
</svg>
`);

export const PRESET_DIAGRAMS = [
  {
    id: 'fraction-wall',
    type: 'image',
    caption: 'Fraction Wall — Comparing Benchmarks (1, ½, ⅓, ¼, ⅙)',
    url: FRACTION_WALL_SVG,
  },
  {
    id: 'hundredths-grid',
    type: 'image',
    caption: '10×10 Hundredths Grid — ¾ = 0.75 = 75%',
    url: HUNDREDTHS_GRID_SVG,
  },
  {
    id: 'root-systems',
    type: 'image',
    caption: 'Plant Root Systems — Tap Root vs. Fibrous Root Diagram',
    url: ROOT_SYSTEMS_SVG,
  },
  {
    id: 'story-map',
    type: 'image',
    caption: 'Reading Comprehension — Main Idea & Supporting Details Map',
    url: STORY_MAP_SVG,
  },
  {
    id: 'bar-chart',
    type: 'image',
    caption: 'Class Survey Bar Chart — Modes of Transport to School',
    url: BAR_CHART_SVG,
  },
];
