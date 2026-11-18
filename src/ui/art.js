// Dost: a soft baby elephant. Minimal face (dot eyes, blush), calm states only.
// States are CSS classes on the wrapper: is-idle, is-listening, is-speaking, is-thinking, is-still.

function elephantInner() {
  return `
  <g class="el-ear el-ear--l"><ellipse cx="40" cy="70" rx="31" ry="37" fill="var(--el-ear)"/><ellipse cx="44" cy="72" rx="19" ry="24" fill="var(--el-inner)"/></g>
  <g class="el-ear el-ear--r"><ellipse cx="120" cy="70" rx="31" ry="37" fill="var(--el-ear)"/><ellipse cx="116" cy="72" rx="19" ry="24" fill="var(--el-inner)"/></g>
  <path d="M73 98 C 72 120, 78 133, 95 130" fill="none" stroke="var(--el-body)" stroke-width="17" stroke-linecap="round"/>
  <circle cx="80" cy="70" r="43" fill="var(--el-body)"/>
  <path d="M74 32 q4 -9 9 -1 M80 31 q5 -8 9 1" fill="none" stroke="var(--el-ear)" stroke-width="3" stroke-linecap="round"/>
  <path d="M70 116 q4 2 8 0 M73 123 q4 2 8 0" fill="none" stroke="var(--el-ear)" stroke-width="2.2" stroke-linecap="round"/>
  <ellipse cx="58" cy="86" rx="7" ry="4.5" fill="var(--el-inner)" opacity=".85"/>
  <ellipse cx="102" cy="86" rx="7" ry="4.5" fill="var(--el-inner)" opacity=".85"/>
  <g class="el-eyes-open"><circle cx="66" cy="70" r="4.4" fill="var(--ink)"/><circle cx="94" cy="70" r="4.4" fill="var(--ink)"/>
    <circle cx="67.4" cy="68.6" r="1.3" fill="#fff"/><circle cx="95.4" cy="68.6" r="1.3" fill="#fff"/></g>
  <g class="el-eyes-closed" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round">
    <path d="M61 71 q5 4 10 0"/><path d="M89 71 q5 4 10 0"/></g>`;
}

export function elephant({ size = 120, state = "idle", label = "Dost, your YourDOST guide" } = {}) {
  return `<span class="dost is-${state}" style="--size:${size}px">
    <svg viewBox="0 0 160 150" role="img" aria-label="${label}"><g class="el-body">${elephantInner()}</g></svg></span>`;
}

export function heroScene() {
  return `<svg class="scene" viewBox="0 0 320 150" aria-hidden="true" preserveAspectRatio="xMidYMax slice">
    <defs><radialGradient id="sunGlow"><stop offset="0" style="stop-color:var(--sun-disc);stop-opacity:.45"/>
      <stop offset="1" style="stop-color:var(--sun-disc);stop-opacity:0"/></radialGradient></defs>
    <circle cx="252" cy="44" r="46" fill="url(#sunGlow)"/>
    <circle cx="252" cy="44" r="24" fill="var(--sun-disc)"/>
    <rect x="22" y="34" width="62" height="16" rx="8" fill="var(--cloud)"/>
    <rect x="44" y="24" width="34" height="16" rx="8" fill="var(--cloud)"/>
    <rect x="168" y="70" width="48" height="12" rx="6" fill="var(--cloud)" opacity=".8"/>
    <path d="M120 40 l5 4 l5 -4 M138 50 l4 3 l4 -3" fill="none" stroke="var(--bird)" stroke-width="2" stroke-linecap="round"/>
    <path d="M-10 150 L-10 112 C 60 86, 140 92, 200 110 C 250 124, 300 102, 340 96 L340 150 Z" fill="var(--hill-back)"/>
    <path d="M-10 150 L-10 128 C 70 112, 170 118, 240 128 C 280 134, 310 126, 340 120 L340 150 Z" fill="var(--hill-front)"/>
    <g fill="var(--tree)"><path d="M30 126 l9 -30 l9 30 z"/><path d="M46 128 l7 -22 l7 22 z"/><path d="M290 124 l8 -26 l8 26 z"/></g>
    <g transform="translate(116 50) scale(.56)"><g class="scene-dost">${elephantInner()}</g></g>
  </svg>`;
}

// A thin strip of hills for the bottom edge of the home card.
export function hillStrip() {
  return `<svg class="hill-strip" viewBox="0 0 320 40" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 40 L0 18 C 60 6, 140 10, 200 20 C 250 28, 290 14, 320 10 L320 40 Z" fill="var(--hill-back)"/>
    <path d="M0 40 L0 28 C 70 18, 170 22, 240 30 C 280 34, 305 28, 320 24 L320 40 Z" fill="var(--hill-front)"/>
    <g fill="var(--tree)"><path d="M22 30 l6 -18 l6 18 z"/><path d="M34 31 l5 -13 l5 13 z"/><path d="M292 26 l6 -17 l6 17 z"/></g>
  </svg>`;
}
