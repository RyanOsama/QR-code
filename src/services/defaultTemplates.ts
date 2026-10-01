import { CardTemplateItem } from '../types';

/**
 * High quality vector SVG generators for the 12 default luxury templates
 * (6 Graduation + 6 Wedding/VIP) matching the bookmark format (1200x500).
 */

function svgToDataUrl(svgString: string): string {
  const cleanSvg = svgString.trim();
  // Safe base64 encoding for utf-8 strings
  if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(cleanSvg, 'utf-8').toString('base64')}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

// ============================================================================
// GRADUATION TEMPLATES
// ============================================================================

// 1. Black & Gold Royal Graduation
const gradBlackGoldFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_dark" cx="60%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1c1f26"/>
      <stop offset="100%" stop-color="#090a0f"/>
    </radialGradient>
    <linearGradient id="gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf0cd"/>
      <stop offset="35%" stop-color="#d4af37"/>
      <stop offset="70%" stop-color="#aa7c11"/>
      <stop offset="100%" stop-color="#f3e5ab"/>
    </linearGradient>
    <linearGradient id="gold_subtle" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#fff2c2" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#aa7c11" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="500" rx="36" fill="url(#bg_dark)"/>
  
  <!-- Outer Double Gold Frame -->
  <rect x="24" y="24" width="1152" height="452" rx="24" fill="none" stroke="url(#gold_grad)" stroke-width="2.5" opacity="0.85"/>
  <rect x="34" y="34" width="1132" height="432" rx="18" fill="none" stroke="url(#gold_grad)" stroke-width="1" opacity="0.45" stroke-dasharray="8,6"/>

  <!-- Liquid Gold Wave along the bottom right -->
  <path d="M 400 500 C 650 440, 850 480, 1200 340 L 1200 500 Z" fill="#12141a" opacity="0.95"/>
  <path d="M 420 500 C 680 430, 900 470, 1200 330 L 1200 365 C 920 495, 700 460, 440 500 Z" fill="url(#gold_grad)" opacity="0.95"/>
  <path d="M 700 500 C 880 450, 1020 410, 1200 410 L 1200 435 C 1030 435, 900 470, 720 500 Z" fill="url(#gold_subtle)" opacity="0.6"/>

  <!-- Upper Left Golden Corner Accent -->
  <path d="M 24 140 C 60 80, 120 40, 220 24" fill="none" stroke="url(#gold_grad)" stroke-width="3" opacity="0.75"/>
  <circle cx="220" cy="24" r="4" fill="url(#gold_grad)"/>
  <circle cx="24" cy="140" r="4" fill="url(#gold_grad)"/>

  <!-- Graduation Cap (Mortarboard) on Left -->
  <g transform="translate(130, 260)">
    <!-- Shadow -->
    <ellipse cx="0" cy="55" rx="90" ry="22" fill="#000" opacity="0.6" filter="url(#glow)"/>
    <!-- Skull Cap Base -->
    <path d="M -45 15 Q 0 45 45 15 L 45 35 Q 0 65 -45 35 Z" fill="#16181f" stroke="url(#gold_grad)" stroke-width="1.5"/>
    <!-- Diamond Top -->
    <polygon points="0,-45 95,0 0,45 -95,0" fill="#1e222b" stroke="url(#gold_grad)" stroke-width="3.5"/>
    <polygon points="0,-38 82,0 0,38 -82,0" fill="#13151b" stroke="#333842" stroke-width="1"/>
    <!-- Center Gold Button -->
    <circle cx="0" cy="0" r="7" fill="url(#gold_grad)"/>
    <!-- Gold Tassel Hanging -->
    <path d="M 0 0 C -25 15, -45 40, -50 75" fill="none" stroke="url(#gold_grad)" stroke-width="3"/>
    <rect x="-56" y="75" width="12" height="28" rx="4" fill="url(#gold_grad)"/>
  </g>

  <!-- Gold Foil Confetti / Ribbon Bursts -->
  <g fill="url(#gold_grad)" opacity="0.8">
    <polygon points="260,120 270,110 275,122 265,130" transform="rotate(15 265 120)"/>
    <polygon points="290,170 300,165 302,175 292,180" transform="rotate(-25 295 170)"/>
    <polygon points="1080,100 1092,90 1098,104 1086,112" transform="rotate(35 1085 100)"/>
    <polygon points="1120,150 1130,142 1134,152 1124,160" transform="rotate(-15 1125 150)"/>
    <polygon points="980,80 990,75 993,85 983,90" transform="rotate(45 985 80)"/>
    <circle cx="280" cy="220" r="3"/>
    <circle cx="1040" cy="130" r="3.5"/>
    <circle cx="1140" cy="80" r="2.5"/>
  </g>
</svg>
`);

const gradBlackGoldBack = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_dark_back" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#181b22"/>
      <stop offset="100%" stop-color="#08090d"/>
    </radialGradient>
    <linearGradient id="gold_grad_b" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf0cd"/>
      <stop offset="35%" stop-color="#d4af37"/>
      <stop offset="70%" stop-color="#aa7c11"/>
      <stop offset="100%" stop-color="#f3e5ab"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_dark_back)"/>
  <rect x="28" y="28" width="1144" height="444" rx="20" fill="none" stroke="url(#gold_grad_b)" stroke-width="2" opacity="0.8"/>
  <rect x="38" y="38" width="1124" height="424" rx="16" fill="none" stroke="url(#gold_grad_b)" stroke-width="0.8" opacity="0.4" stroke-dasharray="6,6"/>
  <!-- Central Graduation Laurel Crest -->
  <g transform="translate(600, 210)" stroke="url(#gold_grad_b)" fill="none">
    <circle cx="0" cy="0" r="60" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
    <!-- Mortarboard Small Icon -->
    <polygon points="0,-18 35,0 0,18 -35,0" fill="#1f242d" stroke="url(#gold_grad_b)" stroke-width="2"/>
    <circle cx="0" cy="0" r="3" fill="url(#gold_grad_b)"/>
    <path d="M 0 0 C -10 5, -18 15, -20 28" stroke-width="1.5"/>
    <!-- Laurel Wreath -->
    <path d="M -75 25 C -90 -20, -60 -60, 0 -70 C 60 -60, 90 -20, 75 25" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <!-- Bottom Ribbon Line -->
  <path d="M 150 430 L 1050 430" stroke="url(#gold_grad_b)" stroke-width="1" opacity="0.5"/>
  <circle cx="600" cy="430" r="5" fill="url(#gold_grad_b)"/>
</svg>
`);

// 2. Navy Blue & Gold Royal Graduation
const gradNavyGoldFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_navy" cx="55%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#090e17"/>
    </radialGradient>
    <linearGradient id="gold_n" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3d1"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="80%" stop-color="#9a6e0c"/>
      <stop offset="100%" stop-color="#fde49e"/>
    </linearGradient>
    <linearGradient id="deep_navy_wave" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#152238"/>
      <stop offset="100%" stop-color="#080e1a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_navy)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_n)" stroke-width="2.2" opacity="0.8"/>
  <!-- Royal Navy Sweeping Waves -->
  <path d="M 380 500 C 620 420, 840 450, 1200 320 L 1200 500 Z" fill="url(#deep_navy_wave)"/>
  <path d="M 380 500 C 620 420, 840 450, 1200 320 L 1200 345 C 850 470, 640 440, 400 500 Z" fill="url(#gold_n)" opacity="0.9"/>
  <!-- Graduation Cap -->
  <g transform="translate(130, 260)">
    <ellipse cx="0" cy="55" rx="85" ry="20" fill="#020617" opacity="0.7"/>
    <path d="M -42 15 Q 0 42 42 15 L 42 34 Q 0 60 -42 34 Z" fill="#0f172a" stroke="url(#gold_n)" stroke-width="1.4"/>
    <polygon points="0,-45 95,0 0,45 -95,0" fill="#172554" stroke="url(#gold_n)" stroke-width="3.2"/>
    <circle cx="0" cy="0" r="7" fill="url(#gold_n)"/>
    <path d="M 0 0 C -25 15, -45 40, -50 75" fill="none" stroke="url(#gold_n)" stroke-width="3"/>
    <rect x="-56" y="75" width="12" height="28" rx="4" fill="url(#gold_n)"/>
  </g>
  <!-- Confetti -->
  <g fill="url(#gold_n)" opacity="0.85">
    <polygon points="260,110 270,102 274,114 264,120"/>
    <polygon points="1060,95 1072,85 1078,99 1066,107"/>
    <circle cx="1020" cy="140" r="3.5"/>
    <circle cx="285" cy="200" r="3"/>
  </g>
</svg>
`);

// 3. Imperial Purple & Diploma Graduation
const gradPurpleFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_purp" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#3b1d5a"/>
      <stop offset="65%" stop-color="#241038"/>
      <stop offset="100%" stop-color="#140722"/>
    </radialGradient>
    <linearGradient id="gold_p" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff5db"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#a0720b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_purp)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_p)" stroke-width="2.2" opacity="0.85"/>
  <!-- Flowing Silk Ribbon Curve at Bottom -->
  <path d="M 350 500 C 600 400, 800 480, 1200 370 L 1200 500 Z" fill="#1b0a2d" opacity="0.9"/>
  <path d="M 360 500 C 610 400, 820 480, 1200 370 L 1200 395 C 830 500, 630 420, 380 500 Z" fill="url(#gold_p)" opacity="0.9"/>
  <!-- Graduation Cap -->
  <g transform="translate(130, 220)">
    <polygon points="0,-45 95,0 0,45 -95,0" fill="#4c1d95" stroke="url(#gold_p)" stroke-width="3"/>
    <circle cx="0" cy="0" r="7" fill="url(#gold_p)"/>
    <path d="M 0 0 C -25 15, -45 40, -50 75" fill="none" stroke="url(#gold_p)" stroke-width="3"/>
    <rect x="-56" y="75" width="12" height="26" rx="3" fill="url(#gold_p)"/>
  </g>
  <!-- Rolled Parchment Diploma Scroll with Gold Ribbon -->
  <g transform="translate(145, 340)">
    <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <ellipse cx="-45" cy="0" rx="7" ry="12" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
    <ellipse cx="45" cy="0" rx="7" ry="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <!-- Red/Gold Ribbon Knot -->
    <rect x="-10" y="-14" width="20" height="28" rx="3" fill="url(#gold_p)"/>
    <path d="M -5 14 L -15 35 L 0 28 L 15 35 L 5 14 Z" fill="url(#gold_p)"/>
  </g>
</svg>
`);

// 4. Emerald Green & Gold Graduation
const gradEmeraldFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_em" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="60%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#011812"/>
    </radialGradient>
    <linearGradient id="gold_e" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff5db"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9a6e0c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_em)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_e)" stroke-width="2.2" opacity="0.85"/>
  <rect x="34" y="34" width="1132" height="432" rx="16" fill="none" stroke="url(#gold_e)" stroke-width="0.8" opacity="0.4" stroke-dasharray="8,6"/>
  <!-- Graduation Cap -->
  <g transform="translate(130, 220)">
    <polygon points="0,-45 95,0 0,45 -95,0" fill="#047857" stroke="url(#gold_e)" stroke-width="3"/>
    <circle cx="0" cy="0" r="7" fill="url(#gold_e)"/>
    <path d="M 0 0 C -25 15, -45 40, -50 75" fill="none" stroke="url(#gold_e)" stroke-width="3"/>
    <rect x="-56" y="75" width="12" height="26" rx="3" fill="url(#gold_e)"/>
  </g>
  <!-- Rolled Diploma Scroll -->
  <g transform="translate(145, 340)">
    <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#fcfbf7" stroke="#e2e8f0" stroke-width="1.5"/>
    <ellipse cx="-45" cy="0" rx="7" ry="12" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
    <ellipse cx="45" cy="0" rx="7" ry="12" fill="#fcfbf7" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="-10" y="-14" width="20" height="28" rx="3" fill="url(#gold_e)"/>
    <path d="M -5 14 L -15 35 L 0 28 L 15 35 L 5 14 Z" fill="url(#gold_e)"/>
  </g>
</svg>
`);

// 5. Champagne Silk & Gold Graduation
const gradChampagneFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_champ" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#faf5ec"/>
      <stop offset="70%" stop-color="#f1e6d0"/>
      <stop offset="100%" stop-color="#e8d5b5"/>
    </radialGradient>
    <linearGradient id="gold_c" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#b8860b"/>
      <stop offset="100%" stop-color="#8c6204"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_champ)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_c)" stroke-width="2" opacity="0.85"/>
  <path d="M 400 500 C 650 440, 850 480, 1200 340 L 1200 370 C 880 495, 680 460, 420 500 Z" fill="url(#gold_c)" opacity="0.8"/>
  <g transform="translate(130, 250)">
    <polygon points="0,-45 95,0 0,45 -95,0" fill="#1e293b" stroke="url(#gold_c)" stroke-width="3"/>
    <circle cx="0" cy="0" r="7" fill="url(#gold_c)"/>
    <path d="M 0 0 C -25 15, -45 40, -50 75" fill="none" stroke="url(#gold_c)" stroke-width="3"/>
    <rect x="-56" y="75" width="12" height="28" rx="4" fill="url(#gold_c)"/>
  </g>
</svg>
`);

// 6. Powder Blue & Sky Ribbon Graduation
const gradPowderBlueFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_pb" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#f0f7ff"/>
      <stop offset="70%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#bfdbfe"/>
    </radialGradient>
    <linearGradient id="navy_pb" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="gold_pb" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9a6e0c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_pb)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#navy_pb)" stroke-width="2" opacity="0.8"/>
  <path d="M 380 500 C 620 420, 840 450, 1200 330 L 1200 500 Z" fill="url(#navy_pb)"/>
  <g transform="translate(130, 250)">
    <polygon points="0,-45 95,0 0,45 -95,0" fill="#1e3a8a" stroke="url(#gold_pb)" stroke-width="3"/>
    <circle cx="0" cy="0" r="7" fill="url(#gold_pb)"/>
    <path d="M 0 0 C -25 15, -45 40, -50 75" fill="none" stroke="url(#gold_pb)" stroke-width="3"/>
    <rect x="-56" y="75" width="12" height="28" rx="4" fill="url(#gold_pb)"/>
  </g>
</svg>
`);

// ============================================================================
// WEDDING & ROYAL INVITATION TEMPLATES
// ============================================================================

// 7. Golden Floral Ivory Wedding
const weddingGoldenFloralFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_ivory_wf" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#fffdfa"/>
      <stop offset="70%" stop-color="#fcf6ec"/>
      <stop offset="100%" stop-color="#f5ecda"/>
    </radialGradient>
    <linearGradient id="gold_w" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dfc06b"/>
      <stop offset="50%" stop-color="#c59b27"/>
      <stop offset="100%" stop-color="#8a670f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_ivory_wf)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_w)" stroke-width="2"/>
  <rect x="34" y="34" width="1132" height="432" rx="16" fill="none" stroke="url(#gold_w)" stroke-width="0.8" stroke-dasharray="6,4" opacity="0.6"/>
  <!-- Top Left Floral Watercolor Bouquet -->
  <g transform="translate(100, 100)">
    <!-- Rose 1 -->
    <circle cx="0" cy="0" r="38" fill="#fdf2e9" stroke="#e0c3a8" stroke-width="1.5"/>
    <circle cx="-5" cy="-5" r="24" fill="#f9e2d2" stroke="#d4ab8e" stroke-width="1.2"/>
    <circle cx="-3" cy="-3" r="12" fill="#edd0be"/>
    <!-- Leaves -->
    <path d="M 35 -15 C 60 -40, 90 -20, 75 10 C 60 4, 45 -5, 35 -15 Z" fill="#b7c9ab" stroke="#8fa87f" stroke-width="1.2"/>
    <path d="M -15 35 C -40 60, -20 90, 10 75 C 4 60, -5 45, -15 35 Z" fill="#b7c9ab" stroke="#8fa87f" stroke-width="1.2"/>
    <!-- Gold Sprigs -->
    <path d="M 0 0 C 40 -60, 90 -50, 110 -80" fill="none" stroke="url(#gold_w)" stroke-width="1.8"/>
    <circle cx="110" cy="-80" r="4" fill="url(#gold_w)"/>
  </g>
  <!-- Bottom Right Floral Bouquet -->
  <g transform="translate(1100, 400)">
    <circle cx="0" cy="0" r="38" fill="#fdf2e9" stroke="#e0c3a8" stroke-width="1.5"/>
    <circle cx="5" cy="5" r="24" fill="#f9e2d2" stroke="#d4ab8e" stroke-width="1.2"/>
    <circle cx="3" cy="3" r="12" fill="#edd0be"/>
    <path d="M -35 15 C -60 40, -90 20, -75 -10 C -60 -4, -45 5, -35 15 Z" fill="#b7c9ab" stroke="#8fa87f" stroke-width="1.2"/>
    <path d="M 15 -35 C 40 -60, 20 -90, -10 -75 C -4 -60, 5 -45, 15 -35 Z" fill="#b7c9ab" stroke="#8fa87f" stroke-width="1.2"/>
    <path d="M 0 0 C -40 60, -90 50, -110 80" fill="none" stroke="url(#gold_w)" stroke-width="1.8"/>
    <circle cx="-110" cy="80" r="4" fill="url(#gold_w)"/>
  </g>
</svg>
`);

// 8. Blush Pink Classic Rose Wedding
const weddingBlushRoseFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_blush" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#fff5f6"/>
      <stop offset="70%" stop-color="#fde2e6"/>
      <stop offset="100%" stop-color="#f8ccd3"/>
    </radialGradient>
    <linearGradient id="gold_blush" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dfc06b"/>
      <stop offset="100%" stop-color="#9a6e0c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_blush)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_blush)" stroke-width="2"/>
  <!-- Top Left Roses -->
  <g transform="translate(100, 95)">
    <circle cx="0" cy="0" r="36" fill="#f4a7b9" stroke="#e07a90" stroke-width="1.5"/>
    <circle cx="-4" cy="-4" r="22" fill="#ec728c"/>
    <path d="M 30 -10 C 50 -30, 80 -15, 65 10 Z" fill="#a3b899"/>
  </g>
  <!-- Bottom Right Roses -->
  <g transform="translate(1100, 405)">
    <circle cx="0" cy="0" r="36" fill="#f4a7b9" stroke="#e07a90" stroke-width="1.5"/>
    <circle cx="4" cy="4" r="22" fill="#ec728c"/>
    <path d="M -30 10 C -50 30, -80 15, -65 -10 Z" fill="#a3b899"/>
  </g>
</svg>
`);

// 9. Royal Burgundy Velvet Wedding
const weddingBurgundyFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_burg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#6b1220"/>
      <stop offset="65%" stop-color="#450a14"/>
      <stop offset="100%" stop-color="#280309"/>
    </radialGradient>
    <linearGradient id="gold_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3d1"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9a6e0c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_burg)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_bg)" stroke-width="2.2" opacity="0.9"/>
  <rect x="34" y="34" width="1132" height="432" rx="16" fill="none" stroke="url(#gold_bg)" stroke-width="0.8" opacity="0.4" stroke-dasharray="6,4"/>
  <!-- Top Left Deep Red Roses -->
  <g transform="translate(95, 95)">
    <circle cx="0" cy="0" r="38" fill="#991b1b" stroke="url(#gold_bg)" stroke-width="1.5"/>
    <circle cx="-4" cy="-4" r="24" fill="#7f1d1d"/>
    <circle cx="-2" cy="-2" r="12" fill="#58111a"/>
  </g>
  <!-- Bottom Right Roses -->
  <g transform="translate(1105, 405)">
    <circle cx="0" cy="0" r="38" fill="#991b1b" stroke="url(#gold_bg)" stroke-width="1.5"/>
    <circle cx="4" cy="4" r="24" fill="#7f1d1d"/>
    <circle cx="2" cy="2" r="12" fill="#58111a"/>
  </g>
  <!-- Gold Swirl Ribbon -->
  <path d="M 200 480 C 450 430, 800 520, 1100 440" fill="none" stroke="url(#gold_bg)" stroke-width="2.5" opacity="0.8"/>
</svg>
`);

// 10. Golden Silk Waves Luxury
const weddingSilkWavesFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_silk" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#fffdf8"/>
      <stop offset="60%" stop-color="#f7eedc"/>
      <stop offset="100%" stop-color="#ebd8be"/>
    </radialGradient>
    <linearGradient id="gold_silk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fae7b5"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="80%" stop-color="#9a6e0c"/>
      <stop offset="100%" stop-color="#fdf1cd"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_silk)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_silk)" stroke-width="2" opacity="0.8"/>
  <!-- Flowing 3D Silk Ribbon Waves -->
  <path d="M 0 350 C 300 200, 600 450, 1200 250 L 1200 500 L 0 500 Z" fill="#efe0ca" opacity="0.7"/>
  <path d="M 0 340 C 300 190, 600 440, 1200 240 L 1200 265 C 600 465, 300 215, 0 365 Z" fill="url(#gold_silk)" opacity="0.9"/>
  <path d="M 0 180 C 250 80, 500 240, 900 120 L 900 135 C 500 255, 250 95, 0 195 Z" fill="url(#gold_silk)" opacity="0.6"/>
</svg>
`);

// 11. Sage Green & Gold Leaves
const weddingSageGoldFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_sage" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#93a88b"/>
      <stop offset="65%" stop-color="#799271"/>
      <stop offset="100%" stop-color="#5f7757"/>
    </radialGradient>
    <linearGradient id="gold_sg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3d1"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9a6e0c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_sage)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_sg)" stroke-width="2.2"/>
  <rect x="34" y="34" width="1132" height="432" rx="16" fill="none" stroke="url(#gold_sg)" stroke-width="0.8" opacity="0.5" stroke-dasharray="6,4"/>
  <!-- Gold Botanical Leaves at Top Left -->
  <g transform="translate(90, 90)" stroke="url(#gold_sg)" fill="url(#gold_sg)">
    <path d="M 0 0 C 40 -30, 80 -20, 110 -50" fill="none" stroke-width="2"/>
    <ellipse cx="40" cy="-20" rx="14" ry="7" transform="rotate(-30 40 -20)"/>
    <ellipse cx="80" cy="-35" rx="14" ry="7" transform="rotate(-40 80 -35)"/>
    <ellipse cx="110" cy="-50" rx="12" ry="6" transform="rotate(-50 110 -50)"/>
  </g>
  <!-- Gold Botanical Leaves at Bottom Right -->
  <g transform="translate(1110, 410)" stroke="url(#gold_sg)" fill="url(#gold_sg)">
    <path d="M 0 0 C -40 30, -80 20, -110 50" fill="none" stroke-width="2"/>
    <ellipse cx="-40" cy="20" rx="14" ry="7" transform="rotate(-30 -40 20)"/>
    <ellipse cx="-80" cy="35" rx="14" ry="7" transform="rotate(-40 -80 35)"/>
    <ellipse cx="-110" cy="50" rx="12" ry="6" transform="rotate(-50 -110 50)"/>
  </g>
</svg>
`);

// 12. Midnight Navy Gold Waves Wedding
const weddingMidnightNavyFront = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <radialGradient id="bg_mn" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#14213d"/>
      <stop offset="65%" stop-color="#0b132b"/>
      <stop offset="100%" stop-color="#050a17"/>
    </radialGradient>
    <linearGradient id="gold_mn" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3d1"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9a6e0c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="url(#bg_mn)"/>
  <rect x="24" y="24" width="1152" height="452" rx="22" fill="none" stroke="url(#gold_mn)" stroke-width="2.2"/>
  <path d="M 0 450 C 350 350, 750 480, 1200 360 L 1200 500 L 0 500 Z" fill="#070c18"/>
  <path d="M 0 440 C 350 340, 750 470, 1200 350 L 1200 375 C 750 495, 350 365, 0 465 Z" fill="url(#gold_mn)" opacity="0.95"/>
</svg>
`);

// Back Template Universal Maker
function createUniversalBack(bgColor: string, strokeColor: string, isDark: boolean = true): string {
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" width="1200" height="500">
  <defs>
    <linearGradient id="gold_b_u" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff3d1"/>
      <stop offset="40%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9a6e0c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" rx="36" fill="${bgColor}"/>
  <rect x="26" y="26" width="1148" height="448" rx="22" fill="none" stroke="${strokeColor}" stroke-width="2" opacity="0.85"/>
  <rect x="36" y="36" width="1128" height="428" rx="16" fill="none" stroke="${strokeColor}" stroke-width="0.8" opacity="0.4" stroke-dasharray="6,4"/>
  <!-- Central Emblem / Monogram Frame -->
  <g transform="translate(600, 210)" stroke="${strokeColor}" fill="none">
    <circle cx="0" cy="0" r="55" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6"/>
    <circle cx="0" cy="0" r="62" stroke-width="0.8" opacity="0.4"/>
    <path d="M -15 0 L 15 0 M 0 -15 L 0 15" stroke-width="1.2" opacity="0.5"/>
  </g>
  <!-- Subtle Footer Line -->
  <path d="M 200 420 L 1000 420" stroke="${strokeColor}" stroke-width="1" opacity="0.4"/>
  <circle cx="600" cy="420" r="4" fill="${strokeColor}"/>
</svg>
  `);
}

export const INITIAL_DEFAULT_TEMPLATES: Omit<CardTemplateItem, 'created_at' | 'updated_at'>[] = [
  // ================= GRADUATION TEMPLATES =================
  {
    id: 'tpl_grad_black_gold',
    name: 'تخرج - الأسود والذهبي الملكي (Royal Black & Gold)',
    category: 'graduation',
    front_image: gradBlackGoldFront,
    back_image: gradBlackGoldBack,
    text_color_scheme: 'gold',
    default_primary_color: '#D4AF37',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_grad_navy_blue',
    name: 'تخرج - الكحلي والأزرق الملكي (Navy & Gold)',
    category: 'graduation',
    front_image: gradNavyGoldFront,
    back_image: createUniversalBack('#090e17', 'url(#gold_b_u)', true),
    text_color_scheme: 'gold',
    default_primary_color: '#F3E5AB',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_grad_imperial_purple',
    name: 'تخرج - البنفسجي الإمبراطوري مع الشهادة (Imperial Purple)',
    category: 'graduation',
    front_image: gradPurpleFront,
    back_image: createUniversalBack('#140722', 'url(#gold_b_u)', true),
    text_color_scheme: 'gold',
    default_primary_color: '#FDF0CD',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_grad_emerald_green',
    name: 'تخرج - الزمردي الأخضر الملكي مع الشهادة (Emerald Green)',
    category: 'graduation',
    front_image: gradEmeraldFront,
    back_image: createUniversalBack('#011812', 'url(#gold_b_u)', true),
    text_color_scheme: 'gold',
    default_primary_color: '#FDE49E',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_grad_champagne_silk',
    name: 'تخرج - العاجي والذهب الدافئ (Champagne Silk)',
    category: 'graduation',
    front_image: gradChampagneFront,
    back_image: createUniversalBack('#f5ecda', '#a0720b', false),
    text_color_scheme: 'dark',
    default_primary_color: '#1e293b',
    default_accent_color: '#8c6204',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_grad_powder_blue',
    name: 'تخرج - السماوي الهادئ والأشرطة الذهبية (Powder Blue Ribbon)',
    category: 'graduation',
    front_image: gradPowderBlueFront,
    back_image: createUniversalBack('#dbeafe', '#1e3a8a', false),
    text_color_scheme: 'dark',
    default_primary_color: '#0f172a',
    default_accent_color: '#1e3a8a',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },

  // ================= WEDDING & VIP TEMPLATES =================
  {
    id: 'tpl_wedding_golden_floral',
    name: 'زفاف - الورد العاجي والإطار الذهبي (Golden Floral Ivory)',
    category: 'wedding',
    front_image: weddingGoldenFloralFront,
    back_image: createUniversalBack('#fcf6ec', '#c59b27', false),
    text_color_scheme: 'dark',
    default_primary_color: '#1e293b',
    default_accent_color: '#c59b27',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_wedding_blush_rose',
    name: 'زفاف - الوردي الناعم الكلاسيكي (Blush Pink Rose)',
    category: 'wedding',
    front_image: weddingBlushRoseFront,
    back_image: createUniversalBack('#fde2e6', '#c59b27', false),
    text_color_scheme: 'dark',
    default_primary_color: '#334155',
    default_accent_color: '#b8860b',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_wedding_royal_burgundy',
    name: 'زفاف - العنابي المخملي الفاخر (Royal Burgundy Velvet)',
    category: 'wedding',
    front_image: weddingBurgundyFront,
    back_image: createUniversalBack('#280309', 'url(#gold_b_u)', true),
    text_color_scheme: 'gold',
    default_primary_color: '#FDF0CD',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_wedding_silk_waves',
    name: 'زفاف - الموجات الحريرية الذهبية (Golden Silk Waves)',
    category: 'wedding',
    front_image: weddingSilkWavesFront,
    back_image: createUniversalBack('#f7eedc', '#b8860b', false),
    text_color_scheme: 'dark',
    default_primary_color: '#1e293b',
    default_accent_color: '#b8860b',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_wedding_sage_gold',
    name: 'زفاف - الأخضر الزيتوني وأوراق الذهب (Sage & Gold Leaf)',
    category: 'wedding',
    front_image: weddingSageGoldFront,
    back_image: createUniversalBack('#5f7757', 'url(#gold_b_u)', true),
    text_color_scheme: 'gold',
    default_primary_color: '#FFF3D1',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
  {
    id: 'tpl_wedding_midnight_navy',
    name: 'زفاف - الكحلي الليلي المذهب (Midnight Navy Gold)',
    category: 'wedding',
    front_image: weddingMidnightNavyFront,
    back_image: createUniversalBack('#050a17', 'url(#gold_b_u)', true),
    text_color_scheme: 'gold',
    default_primary_color: '#FFF3D1',
    default_accent_color: '#FFFFFF',
    default_qr_position: 'right',
    is_active: true,
    is_builtin: true,
    company_id: null,
  },
];
