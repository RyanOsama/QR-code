import React from 'react';
import { CardTemplateType } from '../../types';

// ============================================================================
// 1. BESPOKE SVG EMBROIDERY ARTWORK FOR EACH THEME
// ============================================================================

/**
 * 1. ANDALUSIAN ROYAL EMBROIDERY (الأندلسي الملكي)
 * Moorish horseshoe arches, Alhambra arabesque interlaced stars and scrolling filigree.
 */
export const AndalusianCorner: React.FC<{ color: string; accent: string; className?: string; style?: React.CSSProperties }> = ({ color, accent, className, style }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-10 h-10"} style={style}>
    {/* Outer corner frame rule */}
    <path d="M2 2 L2 42 C2 26 12 16 28 16 L28 2 Z" stroke={color} strokeWidth="1.4" fill="none" />
    <path d="M6 6 L6 34 C8 24 16 16 26 14 L26 6 Z" stroke={accent} strokeWidth="0.9" strokeDasharray="2,2" fill="none" />
    {/* Interlocking Arabesque Moorish star & leaf */}
    <path d="M14 14 C14 8 18 4 24 4 C24 10 20 14 14 14 Z" fill={accent} fillOpacity="0.25" stroke={accent} strokeWidth="0.8" />
    <path d="M14 14 C8 14 4 18 4 24 C10 24 14 20 14 14 Z" fill={accent} fillOpacity="0.25" stroke={accent} strokeWidth="0.8" />
    <circle cx="14" cy="14" r="2.5" fill={color} />
    {/* Delicate gold star stitch */}
    <path d="M14 9 L15.5 12.5 L19 14 L15.5 15.5 L14 19 L12.5 15.5 L9 14 L12.5 12.5 Z" fill={accent} />
  </svg>
);

export const AndalusianArchCrest: React.FC<{ color: string; accent: string; className?: string }> = ({ color, accent, className }) => (
  <svg viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-32 h-11"}>
    {/* Outer Moorish pointed horseshoe arch */}
    <path d="M10 40 C10 18 35 6 60 6 C85 6 110 18 110 40" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M18 40 C18 22 38 12 60 12 C82 12 102 22 102 40" stroke={accent} strokeWidth="1" strokeDasharray="3,2" fill="none" />
    {/* Central Crown Finial & 8-point Islamic Star */}
    <path d="M60 2 L62.5 7 L68 8 L64 12 L65 17 L60 14.5 L55 17 L56 12 L52 8 L57.5 7 Z" fill={color} />
    <circle cx="60" cy="10" r="1.5" fill="#ffffff" />
    {/* Arch cutwork lace details */}
    <path d="M42 34 C44 26 52 22 60 22 C68 22 76 26 78 34" stroke={color} strokeWidth="1.1" fill="none" />
    <circle cx="48" cy="27" r="1.5" fill={accent} />
    <circle cx="60" cy="24" r="2" fill={accent} />
    <circle cx="72" cy="27" r="1.5" fill={accent} />
    {/* Side flourishes */}
    <path d="M22 36 C28 32 34 35 38 38" stroke={accent} strokeWidth="1" strokeLinecap="round" />
    <path d="M98 36 C92 32 86 35 82 38" stroke={accent} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/**
 * 2. DAMASK FLORAL LACE EMBROIDERY (الدانتيل الدمشقي الفاخر)
 * Victorian royal damask lace, blooming roses, scrolling acanthus tendrils and botanical leaves.
 */
export const DamaskCorner: React.FC<{ color: string; accent: string; className?: string; style?: React.CSSProperties }> = ({ color, accent, className, style }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-10 h-10"} style={style}>
    {/* Outer delicate lace scallops */}
    <path d="M2 2 L2 44 C2 38 6 36 8 32 C10 28 14 26 18 22 C22 18 26 14 30 10 C34 6 38 2 44 2 Z" stroke={color} strokeWidth="1.2" fill="none" />
    {/* Blooming damask rose bud in corner */}
    <path d="M12 12 C16 9 22 11 23 15 C24 19 19 23 15 22 C11 21 9 16 12 12 Z" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1" />
    <path d="M14 14 C16 12 19 13 20 16 C20 18 17 20 15 19 C13 18 12 16 14 14 Z" fill={color} fillOpacity="0.4" />
    {/* Leaf vine tendrils */}
    <path d="M5 28 C9 26 13 27 15 24 C17 21 16 17 20 16 C24 15 27 18 26 21 C25 24 22 25 21 28" stroke={accent} strokeWidth="0.9" strokeLinecap="round" />
    <path d="M28 5 C26 9 27 13 24 15 C21 17 17 16 16 20 C15 24 18 27 21 26 C24 25 25 22 28 21" stroke={accent} strokeWidth="0.9" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.8" fill={color} />
  </svg>
);

export const DamaskFloralCrest: React.FC<{ color: string; accent: string; className?: string }> = ({ color, accent, className }) => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-28 h-9"}>
    {/* Central Blooming Bridal Rose */}
    <circle cx="60" cy="18" r="6" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.3" />
    <circle cx="60" cy="18" r="3.5" fill={accent} stroke={accent} strokeWidth="0.8" />
    <path d="M57 15 C59 13 62 13 64 15 C65 17 63 20 60 21 C57 20 55 17 57 15 Z" fill="#ffffff" fillOpacity="0.7" />
    {/* Symmetrical Damask Baroque Scroll Tendrils */}
    <path d="M53 18 C46 14 42 8 32 10 C24 12 22 18 14 19 C8 20 4 16 2 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M67 18 C74 14 78 8 88 10 C96 12 98 18 106 19 C112 20 116 16 118 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    {/* Botanical leaf sprouts */}
    <path d="M44 13 C40 10 38 5 42 4 C46 3 48 8 44 13 Z" fill={accent} fillOpacity="0.3" stroke={accent} strokeWidth="0.9" />
    <path d="M76 13 C80 10 82 5 78 4 C74 3 72 8 76 13 Z" fill={accent} fillOpacity="0.3" stroke={accent} strokeWidth="0.9" />
    {/* Bottom ribbon loops */}
    <path d="M48 24 C52 28 56 28 60 28 C64 28 68 28 72 24" stroke={accent} strokeWidth="1" strokeDasharray="2,2" />
  </svg>
);

/**
 * 3. IMPERIAL GILDED EMBROIDERY (الإمبراطوري المذهب)
 * Neoclassical acanthus leaves, stepped gilded Greek-fret corner brackets, royal heraldic crown & laurel stars.
 */
export const ImperialCorner: React.FC<{ color: string; accent: string; className?: string; style?: React.CSSProperties }> = ({ color, accent, className, style }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-10 h-10"} style={style}>
    {/* Stepped Grand Neoclassical Frame */}
    <path d="M2 2 L2 42 L10 42 L10 18 L24 18 L24 10 L42 10 L42 2 Z" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.08" />
    <path d="M6 6 L6 38 L8 38 L8 14 L22 14 L22 6 Z" stroke={accent} strokeWidth="1.1" fill="none" />
    {/* Imperial Acanthus Leaf Bracket */}
    <path d="M14 26 C14 20 20 14 26 14 C32 14 36 20 36 24 C32 26 28 24 26 26 C24 28 24 32 22 34 C20 32 16 30 14 26 Z" fill={accent} fillOpacity="0.35" stroke={accent} strokeWidth="1" />
    {/* Diamond Bullion Stitch Accent */}
    <rect x="14" y="14" width="5" height="5" transform="rotate(45 16.5 16.5)" fill={color} />
    <circle cx="5" cy="5" r="1.5" fill={accent} />
  </svg>
);

export const ImperialCrownCrest: React.FC<{ color: string; accent: string; className?: string }> = ({ color, accent, className }) => (
  <svg viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-32 h-11"}>
    {/* Royal Imperial Heraldic Crown */}
    <path d="M48 30 L45 16 L53 22 L60 12 L67 22 L75 16 L72 30 Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    {/* Crown Jewels and Cross Finial */}
    <circle cx="45" cy="15" r="2" fill={accent} />
    <circle cx="53" cy="21" r="1.5" fill={color} />
    <circle cx="60" cy="11" r="2.5" fill={accent} />
    <circle cx="67" cy="21" r="1.5" fill={color} />
    <circle cx="75" cy="15" r="2" fill={accent} />
    <rect x="47" y="27" width="26" height="4" rx="1.5" fill={color} />
    {/* Twin Golden Laurel Victory Branches */}
    <path d="M42 28 C34 26 26 20 22 12 C24 16 28 20 36 22" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M78 28 C86 26 94 20 98 12 C96 16 92 20 84 22" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    {/* Laurel Leaf Pods */}
    <ellipse cx="30" cy="18" rx="3.5" ry="1.8" transform="rotate(-30 30 18)" fill={accent} fillOpacity="0.4" />
    <ellipse cx="90" cy="18" rx="3.5" ry="1.8" transform="rotate(30 90 18)" fill={accent} fillOpacity="0.4" />
    {/* Heraldic 5-point stars */}
    <path d="M16 16 L17.5 19.5 L21 20 L18.5 22.5 L19 26 L16 24 L13 26 L13.5 22.5 L11 20 L14.5 19.5 Z" fill={color} />
    <path d="M104 16 L105.5 19.5 L109 20 L106.5 22.5 L107 26 L104 24 L101 26 L101.5 22.5 L99 20 L102.5 19.5 Z" fill={color} />
  </svg>
);

/**
 * 4. IVORY SILK MINIMAL LUXURY (المينيمال العاجي)
 * Fine hairline silk stitching, Celtic/Greek infinity knots, 8-point geometric diamond star.
 */
export const MinimalKnotCorner: React.FC<{ color: string; accent: string; className?: string; style?: React.CSSProperties }> = ({ color, accent, className, style }) => (
  <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-10 h-10"} style={style}>
    {/* Double hairline border */}
    <path d="M2 2 L2 40 M2 2 L40 2" stroke={color} strokeWidth="1.3" />
    <path d="M6 6 L6 34 M6 6 L34 6" stroke={accent} strokeWidth="0.8" strokeDasharray="1.5,1.5" />
    {/* Infinity Silk Loop / Celtic Knot Corner */}
    <path d="M12 12 C12 6 18 6 18 12 C18 18 12 18 12 24 C12 30 18 30 18 24" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
    <path d="M12 12 C6 12 6 18 12 18 C18 18 18 12 24 12 C30 12 30 18 24 18" stroke={accent} strokeWidth="1" fill="none" strokeLinecap="round" />
    <circle cx="15" cy="15" r="1.5" fill={accent} />
  </svg>
);

export const MinimalDiamondCrest: React.FC<{ color: string; accent: string; className?: string }> = ({ color, accent, className }) => (
  <svg viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-24 h-8"}>
    {/* Fine horizontal hairline with central diamond */}
    <path d="M6 16 L42 16" stroke={accent} strokeWidth="0.8" />
    <path d="M58 16 L94 16" stroke={accent} strokeWidth="0.8" />
    {/* 8-point Luxury Geometric Diamond */}
    <path d="M50 6 L54 13 L61 16 L54 19 L50 26 L46 19 L39 16 L46 13 Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.2" />
    <circle cx="50" cy="16" r="2.2" fill={accent} />
    {/* Mini diamond flanking dots */}
    <rect x="36" y="14.5" width="3" height="3" transform="rotate(45 37.5 16)" fill={color} />
    <rect x="61" y="14.5" width="3" height="3" transform="rotate(45 62.5 16)" fill={color} />
  </svg>
);

/**
 * 5. GRADUATION ROYAL EMBROIDERY (الأكاديمي الملكي)
 */
export const GraduationLaurelCrest: React.FC<{ color: string; accent: string; className?: string }> = ({ color, accent, className }) => (
  <svg viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-32 h-11"}>
    {/* Academic Cap Motif with Golden Tassel */}
    <path d="M60 11 L78 17 L60 23 L42 17 Z" fill={color} stroke={color} strokeWidth="1.3" />
    <path d="M49 20 V25 C49 28 71 28 71 25 V20" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
    <path d="M60 17 L69 22 L68 28" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="68" cy="29" r="1.5" fill={accent} />
    {/* Academic Laurel Wreath */}
    <path d="M38 28 C30 25 24 19 22 11 C24 15 28 19 36 21" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M82 28 C90 25 96 19 98 11 C96 15 92 19 84 21" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    <ellipse cx="28" cy="18" rx="3.5" ry="1.8" transform="rotate(-30 28 18)" fill={accent} fillOpacity="0.4" />
    <ellipse cx="92" cy="18" rx="3.5" ry="1.8" transform="rotate(30 92 18)" fill={accent} fillOpacity="0.4" />
  </svg>
);

/**
 * 6. DINNER ROYAL BANQUET EMBROIDERY (مأدبة الضيافة الملكية)
 */
export const DinnerBanquetCrest: React.FC<{ color: string; accent: string; className?: string }> = ({ color, accent, className }) => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-28 h-9"}>
    {/* Traditional Royal Hospitality Coffee Dallah / Banquet Urn */}
    <path d="M58 8 C58 5 62 5 62 8 L64 16 C68 18 70 22 68 26 C66 30 54 30 52 26 C50 22 52 18 56 16 Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.3" />
    <path d="M64 14 C70 14 74 20 72 24" stroke={accent} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <path d="M54 18 C50 18 48 14 52 12" stroke={accent} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Flanking hospitality banquet arabesque */}
    <path d="M46 22 C38 18 30 20 22 17 C16 15 10 18 4 19" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M74 22 C82 18 90 20 98 17 C104 15 110 18 116 19" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="22" cy="17" r="2" fill={accent} />
    <circle cx="98" cy="17" r="2" fill={accent} />
  </svg>
);

// ============================================================================
// 2. NEW BESPOKE WEDDING MOTIFS & BACKGROUNDS (FROM USER DESIGNS)
// ============================================================================

/**
 * WEDDING THEME 1: BOTANICAL PURPLE & LINEN (الزهور البنفسجية والكتان)
 * Image 1: Linen canvas background, purple botanical flowers at bottom with gold specks,
 * stylized romantic bride/feather silhouette crest at top.
 */
export const BotanicalPurpleTopMotif: React.FC<{ color?: string; className?: string }> = ({ color = '#7c3aed', className }) => (
  <svg viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-14 h-12"}>
    {/* Stylized Romantic Bridal Veil / Feather Flourish */}
    <path
      d="M50 8 C46 16 40 25 42 35 C44 45 52 50 48 62 C45 70 38 78 50 82 C55 76 56 68 53 58 C50 48 56 38 58 26 C59 18 56 12 50 8 Z"
      fill={color}
      fillOpacity="0.75"
    />
    <path
      d="M50 15 C54 13 58 15 56 20 C54 25 48 27 49 32 C50 38 55 42 54 48 C52 54 46 60 52 64 C55 58 58 50 56 42 C54 36 57 30 58 24 C59 18 55 15 50 15 Z"
      fill={color}
      fillOpacity="0.45"
    />
    <circle cx="56" cy="12" r="2.5" fill={color} />
  </svg>
);

export const BotanicalPurpleBackground: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className || ''}`}>
    {/* Fine Linen Canvas Weave Pattern */}
    <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="linenWeave" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4 L8 4 M4 0 L4 8" stroke="#d6cfbe" strokeWidth="0.6" strokeDasharray="1,2" />
          <path d="M0 0 L8 8 M8 0 L0 8" stroke="#e8e2d5" strokeWidth="0.3" strokeOpacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#linenWeave)" />
    </svg>

    {/* Bottom Botanical Flowers & Golden Leaves Art (SVG Watercolor style) */}
    <svg
      viewBox="0 0 400 180"
      preserveAspectRatio="xMidYMax slice"
      className="absolute bottom-0 left-0 right-0 w-full h-36 md:h-44 pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="purplePetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7e57c2" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#512da8" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="sageLeaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9ccc65" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#558b2f" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="goldSpeck" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
          <stop offset="70%" stopColor="#ca8a04" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Left Botanical Bush */}
      <g transform="translate(10, 20)">
        {/* Leaves */}
        <path d="M10 140 C5 100 45 90 60 110 C70 125 50 145 10 140 Z" fill="url(#sageLeaf)" />
        <path d="M40 150 C40 115 85 105 100 125 C105 140 75 160 40 150 Z" fill="url(#sageLeaf)" fillOpacity="0.7" />
        <path d="M-10 160 C0 120 -30 95 -40 120 C-45 140 -20 165 -10 160 Z" fill="url(#sageLeaf)" />
        
        {/* Main Purple Flower 1 */}
        <ellipse cx="50" cy="115" rx="20" ry="16" transform="rotate(-15 50 115)" fill="url(#purplePetal)" />
        <ellipse cx="32" cy="108" rx="16" ry="14" transform="rotate(25 32 108)" fill="url(#purplePetal)" fillOpacity="0.9" />
        <ellipse cx="64" cy="122" rx="15" ry="13" transform="rotate(-35 64 122)" fill="url(#purplePetal)" fillOpacity="0.85" />
        <ellipse cx="44" cy="128" rx="18" ry="14" transform="rotate(10 44 128)" fill="url(#purplePetal)" />
        {/* Flower Center Stamen with Gold Dots */}
        <circle cx="45" cy="118" r="5" fill="#facc15" />
        <circle cx="48" cy="114" r="2.5" fill="#fbbf24" />
        <circle cx="42" cy="116" r="2" fill="#ca8a04" />
        <circle cx="46" cy="121" r="2" fill="#fef08a" />
      </g>

      {/* Right Botanical Bush */}
      <g transform="translate(320, 20)">
        {/* Leaves */}
        <path d="M60 140 C65 100 25 90 10 110 C0 125 20 145 60 140 Z" fill="url(#sageLeaf)" />
        <path d="M30 150 C30 115 -15 105 -30 125 C-35 140 -5 160 30 150 Z" fill="url(#sageLeaf)" fillOpacity="0.7" />
        <path d="M80 160 C70 120 100 95 110 120 C115 140 90 165 80 160 Z" fill="url(#sageLeaf)" />

        {/* Main Purple Flower 2 */}
        <ellipse cx="20" cy="115" rx="20" ry="16" transform="rotate(15 20 115)" fill="url(#purplePetal)" />
        <ellipse cx="38" cy="108" rx="16" ry="14" transform="rotate(-25 38 108)" fill="url(#purplePetal)" fillOpacity="0.9" />
        <ellipse cx="6" cy="122" rx="15" ry="13" transform="rotate(35 6 122)" fill="url(#purplePetal)" fillOpacity="0.85" />
        <ellipse cx="26" cy="128" rx="18" ry="14" transform="rotate(-10 26 128)" fill="url(#purplePetal)" />
        {/* Flower Center */}
        <circle cx="25" cy="118" r="5" fill="#facc15" />
        <circle cx="22" cy="114" r="2.5" fill="#fbbf24" />
        <circle cx="28" cy="116" r="2" fill="#ca8a04" />
        <circle cx="24" cy="121" r="2" fill="#fef08a" />
      </g>

      {/* Center Connecting Soft Foliage */}
      <path d="M110 160 C150 140 190 155 240 148 C270 144 290 155 310 165" stroke="#7cb342" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M140 150 C165 135 185 140 210 145" stroke="#8bc34a" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      
      {/* Floating Golden Glitter Specks */}
      <circle cx="70" cy="80" r="4" fill="url(#goldSpeck)" />
      <circle cx="95" cy="95" r="3" fill="url(#goldSpeck)" />
      <circle cx="310" cy="85" r="4" fill="url(#goldSpeck)" />
      <circle cx="285" cy="98" r="3" fill="url(#goldSpeck)" />
      <circle cx="190" cy="135" r="2.5" fill="url(#goldSpeck)" />
      <circle cx="220" cy="130" r="3" fill="url(#goldSpeck)" />
    </svg>
  </div>
);

/**
 * WEDDING THEME 2: ROYAL BURGUNDY ROSE & DAMASK MONOGRAM (العنابي الملكي المورد)
 * Image 2: Subtle rose line-art damask pattern in the background, royal circular monogram emblem,
 * deep burgundy typography, luxury etiquette icons (no cameras / no children).
 */
export const BurgundyMonogramCrest: React.FC<{ color?: string; className?: string }> = ({ color = '#881337', className }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-16 h-16"}>
    {/* Outer Baroque Rose & Scroll Ring */}
    <circle cx="60" cy="60" r="48" stroke={color} strokeWidth="1.2" strokeDasharray="3,1.5" />
    <circle cx="60" cy="60" r="43" stroke={color} strokeWidth="0.8" opacity="0.6" />
    <circle cx="60" cy="60" r="37" stroke={color} strokeWidth="1.4" />

    {/* Symmetrical Ornamental Filigree flourishes around ring */}
    {/* Top Crown & Rose */}
    <path d="M60 7 C55 12 50 15 45 15 C52 18 57 15 60 22 C63 15 68 18 75 15 C70 15 65 12 60 7 Z" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
    {/* Bottom Flourish */}
    <path d="M60 113 C55 108 50 105 45 105 C52 102 57 105 60 98 C63 105 68 102 75 105 C70 105 65 108 60 113 Z" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
    {/* Left Flourish */}
    <path d="M7 60 C12 55 15 50 15 45 C18 52 15 57 22 60 C15 63 18 68 15 75 C15 70 12 65 7 60 Z" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
    {/* Right Flourish */}
    <path d="M113 60 C108 55 105 50 105 45 C102 52 105 57 98 60 C105 63 102 68 105 75 C105 70 108 65 113 60 Z" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />

    {/* Center Calligraphic Royal Monogram Icon */}
    <path
      d="M58 35 C52 38 48 45 50 52 C52 58 60 62 66 65 C72 68 76 72 73 78 C70 84 60 85 54 80 C50 76 49 71 52 68 C53 66 56 68 55 71 C54 74 58 78 64 77 C68 75 69 71 66 68 C62 65 54 60 48 56 C44 51 44 42 49 37 C54 32 64 32 67 36 C68 38 66 39 64 38 C62 36 59 34 58 35 Z"
      fill={color}
    />
    <path
      d="M66 40 C69 44 72 48 70 54 C68 60 62 65 58 67"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export const BurgundyRoseBackground: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className || ''}`}>
    {/* Faint Rose Line-Art Damask Pattern across corners and sides */}
    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="roseLinePattern" width="70" height="70" patternUnits="userSpaceOnUse">
          {/* Delicate Rose Outline */}
          <path d="M35 25 C30 20 22 24 25 30 C20 33 22 41 28 42 C32 46 40 45 42 40 C47 38 46 30 40 28 C41 22 36 21 35 25 Z" stroke="#be123c" strokeWidth="0.7" fill="none" />
          <path d="M30 29 C32 26 36 27 37 30 C39 33 34 37 31 35 Z" stroke="#be123c" strokeWidth="0.5" fill="none" />
          {/* Leaves */}
          <path d="M22 25 C16 20 12 28 18 30 C20 28 21 26 22 25 Z" stroke="#9f1239" strokeWidth="0.6" fill="none" />
          <path d="M44 38 C50 42 54 35 48 33 C46 35 45 37 44 38 Z" stroke="#9f1239" strokeWidth="0.6" fill="none" />
          <path d="M26 43 C22 49 30 52 32 46 C30 45 28 44 26 43 Z" stroke="#9f1239" strokeWidth="0.6" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#roseLinePattern)" />
    </svg>

    {/* Soft Burgundy/Blush Edge Glow */}
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.92) 30%, rgba(254,242,242,0.6) 80%, rgba(255,228,230,0.4) 100%)'
      }}
    />
  </div>
);

/**
 * WEDDING THEME 3: SAGE & WHITE CALLA LILY (زنبق الكالا الزمردي)
 * Image 3: Elegant olive/sage calligraphy "دعوة زفاف", white calla lilies blooming from bottom,
 * soft ambient lighting vignette.
 */
export const CallaSageTopCalligraphy: React.FC<{ color?: string; className?: string }> = ({ color = '#3f6212', className }) => (
  <svg viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-36 h-12"}>
    {/* Artistic Fluid Arabic Calligraphy "دعوة زفاف" */}
    <path
      d="M135 32 C132 20 125 15 118 18 C112 21 110 30 115 38 C120 44 130 42 136 34 C138 30 142 32 140 36 C134 47 116 49 108 40 C102 32 104 20 114 13 C124 7 137 12 142 24 C144 28 140 32 135 32 Z"
      fill={color}
    />
    <path
      d="M110 24 C104 18 95 18 88 22 C82 26 80 32 84 36 C88 40 96 38 100 32 C104 27 106 20 102 16"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* "زفاف" Calligraphy flourish */}
    <path
      d="M80 34 C72 26 62 20 50 25 C42 29 38 38 44 44 C50 50 62 46 68 38 C72 32 76 25 74 18 C72 12 65 14 62 18"
      fill={color}
    />
    <path
      d="M52 20 C42 18 34 22 26 28 C20 33 16 40 22 43 C28 46 36 40 40 34 C44 27 46 22 42 18"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    {/* Diacritic dots */}
    <circle cx="68" cy="12" r="2.2" fill={color} />
    <circle cx="44" cy="12" r="2.2" fill={color} />
    <circle cx="28" cy="18" r="2" fill={color} />
  </svg>
);

export const CallaSageBackground: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className || ''}`}>
    {/* Soft Warm Sage Light Vignette */}
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.95) 0%, rgba(247,250,247,0.85) 60%, rgba(240,245,238,0.7) 100%)'
      }}
    />

    {/* Tall Calla Lily Floral Artwork at the Bottom */}
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMax slice"
      className="absolute bottom-0 left-0 right-0 w-full h-44 md:h-52 pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft Pearlescent Calla Petal Gradient */}
        <linearGradient id="callaPetalWhite" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#f4f6f0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#d9e2cf" stopOpacity="0.85" />
        </linearGradient>
        {/* Rich Sage / Olive Leaves */}
        <linearGradient id="sageStem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#65a30d" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#365314" stopOpacity="0.95" />
        </linearGradient>
        {/* Golden Yellow Spadix */}
        <linearGradient id="spadixGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* Main Calla Lily 1 (Left-Center) */}
      <g transform="translate(110, 60)">
        {/* Stems */}
        <path d="M50 180 C48 130 52 90 54 65" stroke="url(#sageStem)" strokeWidth="6" strokeLinecap="round" />
        {/* Outer Flared Petal */}
        <path
          d="M54 65 C40 45 30 20 48 5 C62 -10 75 10 70 30 C66 45 60 55 54 65 Z"
          fill="url(#callaPetalWhite)"
          stroke="#c5d1be"
          strokeWidth="1.2"
        />
        {/* Curled Lip of Calla Lily */}
        <path
          d="M48 5 C35 25 45 55 54 65 C60 50 68 35 62 18 C58 5 52 -5 48 5 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="0.8"
        />
        {/* Golden Central Spadix */}
        <path d="M52 45 L54 18" stroke="url(#spadixGold)" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Main Calla Lily 2 (Right-Center) */}
      <g transform="translate(200, 75)">
        <path d="M40 165 C42 120 38 85 36 60" stroke="url(#sageStem)" strokeWidth="5.5" strokeLinecap="round" />
        <path
          d="M36 60 C24 40 18 15 32 2 C44 -10 56 8 52 26 C48 40 42 50 36 60 Z"
          fill="url(#callaPetalWhite)"
          stroke="#c5d1be"
          strokeWidth="1.2"
        />
        <path
          d="M32 2 C20 20 30 48 36 60 C42 46 48 32 44 16 C40 4 36 -4 32 2 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="0.8"
        />
        <path d="M34 42 L36 16" stroke="url(#spadixGold)" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* Lush Broad Botanical Leaves on Sides */}
      {/* Left Leaf Group */}
      <path
        d="M-20 240 C10 160 30 110 80 80 C65 120 45 180 20 240 Z"
        fill="url(#sageStem)"
        fillOpacity="0.8"
      />
      <path
        d="M30 240 C50 170 70 125 110 105 C95 145 75 195 50 240 Z"
        fill="url(#sageStem)"
        fillOpacity="0.6"
      />
      {/* Right Leaf Group */}
      <path
        d="M420 240 C390 160 370 110 320 80 C335 120 355 180 380 240 Z"
        fill="url(#sageStem)"
        fillOpacity="0.8"
      />
      <path
        d="M370 240 C350 170 330 125 290 105 C305 145 325 195 350 240 Z"
        fill="url(#sageStem)"
        fillOpacity="0.6"
      />
    </svg>
  </div>
);

/**
 * WEDDING THEME 4: SCULPTED 3D IVORY & CALLA LUXURY (المنحوتة العاجية ثلاثية الأبعاد)
 * Image 4: Minimalist 3D sculptural curves/folds in warm champagne ivory,
 * single centerpiece calla blossom between names, spaced classical typography.
 */
export const SculptedCallaMotif: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-8 h-11"}>
    {/* Slender Stem */}
    <path d="M25 65 C25 45 26 35 25 28" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M25 45 C28 40 32 38 35 39 C34 44 30 46 25 45 Z" fill="#65a30d" />
    {/* Sculpted Calla Petal */}
    <path
      d="M25 28 C20 18 16 8 22 2 C28 -3 34 5 32 14 C30 20 27 24 25 28 Z"
      fill="#fffefb"
      stroke="#d1d5db"
      strokeWidth="0.8"
    />
    <path
      d="M22 2 C16 10 20 22 25 28 C27 22 30 16 28 8 C26 2 24 -1 22 2 Z"
      fill="#fbf7ee"
    />
    <path d="M24 20 L25 8" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SculptedIvoryBackground: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className || ''}`}>
    {/* Cream/Champagne Base */}
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, #FBF8F3 0%, #F5EFEB 40%, #EFE8DE 100%)'
      }}
    />

    {/* Sculpted 3D Drapery Folds & Top Calla Lilies (SVG 3D effect) */}
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMin slice"
      className="absolute top-0 left-0 right-0 w-full h-44 md:h-52 pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sculptShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d5c7b3" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#e8dfd1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fbf8f3" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sculptHighlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f5efeb" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Sculpted 3D Swirl Waves */}
      <path
        d="M-20 -10 C60 60 140 70 200 40 C260 10 340 50 420 -10 L420 80 C340 130 260 110 200 120 C140 130 60 110 -20 80 Z"
        fill="url(#sculptHighlight)"
      />
      <path
        d="M0 20 C80 90 150 95 200 70 C250 45 320 80 400 30"
        stroke="url(#sculptShadow)"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 10 C100 70 160 75 200 55 C240 35 300 65 360 20"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sculpted Calla Flower in the Top Swirl */}
      <g transform="translate(180, 20)">
        {/* Soft Lily Bloom */}
        <path
          d="M20 70 C10 45 5 20 18 5 C28 -8 38 10 34 30 C30 45 25 58 20 70 Z"
          fill="#ffffff"
          stroke="#d8cab8"
          strokeWidth="1.2"
        />
        <path d="M18 5 C10 20 16 48 20 70 C24 55 28 40 25 20 C22 5 20 -2 18 5 Z" fill="#fdfbf7" />
        <path d="M19 45 L20 20" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="translate(225, 35) scale(0.85)">
        <path
          d="M20 70 C10 45 5 20 18 5 C28 -8 38 10 34 30 C30 45 25 58 20 70 Z"
          fill="#ffffff"
          stroke="#d8cab8"
          strokeWidth="1.2"
        />
        <path d="M18 5 C10 20 16 48 20 70 C24 55 28 40 25 20 C22 5 20 -2 18 5 Z" fill="#fdfbf7" />
        <path d="M19 45 L20 20" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  </div>
);

/**
 * WEDDING ETIQUETTE ICONS:
 * No Cameras (ممنوع التصوير) & No Children (ممنوع اصطحاب الأطفال)
 * Displayed at bottom of wedding cards (as seen in Image 2).
 */
export const WeddingEtiquetteIcons: React.FC<{ color?: string; className?: string }> = ({ color = '#881337', className }) => (
  <div className={`flex items-center justify-center gap-3 ${className || ''}`}>
    {/* No Camera Icon */}
    <div className="flex items-center justify-center transition-transform hover:scale-110" title="ممنوع التصوير">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke={color} strokeWidth="1.5" />
        {/* Camera body outline */}
        <rect x="7" y="8" width="10" height="8" rx="1.5" stroke={color} strokeWidth="1.2" />
        <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.2" />
      </svg>
    </div>

    {/* No Children Icon */}
    <div className="flex items-center justify-center transition-transform hover:scale-110" title="جنة الأطفال منازلهم">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
        <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke={color} strokeWidth="1.5" />
        {/* Stroller / Baby outline */}
        <circle cx="12" cy="8.5" r="2" stroke={color} strokeWidth="1.2" />
        <path d="M8.5 15.5 C9.5 13 11 12 13.5 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="9" cy="16" r="1.3" fill={color} />
        <circle cx="15" cy="16" r="1.3" fill={color} />
      </svg>
    </div>
  </div>
);

// ============================================================================
// 2B. BESPOKE GOLDEN FLORAL WEDDING ARTWORK (قالب الزفاف الذهبي الفاخر)
// ============================================================================

export const InitialsMonogram: React.FC<{
  groomInitial?: string;
  brideInitial?: string;
  color?: string;
  accent?: string;
  className?: string;
}> = ({
  groomInitial = 'A',
  brideInitial = 'M',
  color = '#8C6D34',
  accent = '#BFA063',
  className = '',
}) => (
  <div className={`flex items-center justify-center gap-2 select-none ${className}`}>
    <span
      className="font-serif text-2xl sm:text-3xl font-normal tracking-wider"
      style={{
        color,
        fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
        textShadow: '0 0.5px 1px rgba(140, 109, 52, 0.25)',
      }}
    >
      {groomInitial}
    </span>
    {/* Delicate botanical sprig between initials */}
    <svg viewBox="0 0 24 32" className="w-5 h-7 -my-1" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 30 C12 20 12 10 12 3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      {/* Lower leaves */}
      <path d="M12 23 C7 21 5 16 6 13 C9.5 13.5 11.5 17.5 12 19.5" fill={accent} fillOpacity="0.8" stroke={color} strokeWidth="0.8" />
      <path d="M12 19 C17 17 19 12 18 9 C14.5 9.5 12.5 13.5 12 15.5" fill={accent} fillOpacity="0.8" stroke={color} strokeWidth="0.8" />
      {/* Mid leaves */}
      <path d="M12 13 C7.5 11 6 7 7.5 4.5 C10 5 11.5 8.5 12 10.5" fill={accent} fillOpacity="0.85" stroke={color} strokeWidth="0.8" />
      <path d="M12 9 C16.5 7 18 3 16.5 1 C14 1.5 12.5 5 12 6.5" fill={accent} fillOpacity="0.85" stroke={color} strokeWidth="0.8" />
      <circle cx="12" cy="2.5" r="1.5" fill={color} />
    </svg>
    <span
      className="font-serif text-2xl sm:text-3xl font-normal tracking-wider"
      style={{
        color,
        fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
        textShadow: '0 0.5px 1px rgba(140, 109, 52, 0.25)',
      }}
    >
      {brideInitial}
    </span>
  </div>
);

export const GoldenHeartIcon: React.FC<{ color?: string; className?: string }> = ({
  color = '#BFA063',
  className = 'w-3 h-3',
}) => (
  <svg viewBox="0 0 24 24" fill={color} className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export const GoldenFooterDivider: React.FC<{
  text?: string;
  color?: string;
  className?: string;
}> = ({
  text = 'بحضوركم تكتمل فرحتنا',
  color = '#8C6D34',
  className = '',
}) => (
  <div className={`flex items-center justify-center gap-2 select-none ${className}`}>
    {/* Left flourish wing */}
    <svg viewBox="0 0 40 12" className="w-7 h-2.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 6 L20 6" stroke={color} strokeWidth="1" />
      <path d="M20 6 C23 3 27 3 29 6 C27 9 23 9 20 6 Z" fill={color} fillOpacity="0.85" />
      <path d="M29 6 L40 6" stroke={color} strokeWidth="1" />
      <circle cx="35" cy="6" r="1.5" fill={color} />
      <path d="M24 2 C26 0.5 29 1.5 29 3 C27 3.5 25 3 24 2 Z" fill={color} />
      <path d="M24 10 C26 11.5 29 10.5 29 9 C27 8.5 25 9 24 10 Z" fill={color} />
    </svg>
    <span
      className="text-[9px] sm:text-[10.5px] font-bold tracking-wider"
      style={{
        color,
        fontFamily: "'Amiri', 'Traditional Arabic', serif",
        textShadow: '0 0.5px 1px rgba(255,255,255,0.8)',
      }}
    >
      {text}
    </span>
    {/* Right flourish wing (mirrored) */}
    <svg viewBox="0 0 40 12" className="w-7 h-2.5 transform scale-x-[-1]" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 6 L20 6" stroke={color} strokeWidth="1" />
      <path d="M20 6 C23 3 27 3 29 6 C27 9 23 9 20 6 Z" fill={color} fillOpacity="0.85" />
      <path d="M29 6 L40 6" stroke={color} strokeWidth="1" />
      <circle cx="35" cy="6" r="1.5" fill={color} />
      <path d="M24 2 C26 0.5 29 1.5 29 3 C27 3.5 25 3 24 2 Z" fill={color} />
      <path d="M24 10 C26 11.5 29 10.5 29 9 C27 8.5 25 9 24 10 Z" fill={color} />
    </svg>
  </div>
);

export const GoldenFloralFrontBackground: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] ${className || ''}`}>
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="none"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Luxurious Multi-stop Metallic Gold Gradient */}
        <linearGradient id="goldWaveGrad" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#C89D4B" />
          <stop offset="18%" stopColor="#E9D396" />
          <stop offset="42%" stopColor="#BA8E3C" />
          <stop offset="68%" stopColor="#F5E4B5" />
          <stop offset="88%" stopColor="#A3782B" />
          <stop offset="100%" stopColor="#7E591A" />
        </linearGradient>

        <linearGradient id="goldLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFC386" />
          <stop offset="35%" stopColor="#C99E48" />
          <stop offset="70%" stopColor="#A4792B" />
          <stop offset="100%" stopColor="#735118" />
        </linearGradient>

        <linearGradient id="goldHighlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF4D4" />
          <stop offset="50%" stopColor="#ECCF8E" />
          <stop offset="100%" stopColor="#C49B48" />
        </linearGradient>

        <linearGradient id="cardSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCFAF7" />
          <stop offset="50%" stopColor="#FAF7F2" />
          <stop offset="100%" stopColor="#F6F1E8" />
        </linearGradient>
      </defs>

      {/* Main warm ivory card surface */}
      <rect width="400" height="240" fill="url(#cardSurfaceGrad)" />

      {/* Subtle luxury outer border hairline */}
      <rect
        x="1.5"
        y="1.5"
        width="397"
        height="237"
        rx="8"
        stroke="#E5D6BA"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />

      {/* ========================================================
          LEFT SIDE: Sweeping Metallic Gold Wave & Laurel Branch
          ======================================================== */}
      {/* 1. Underlying soft golden glow */}
      <path
        d="M0 0 L84 0 C54 38 32 85 45 132 C58 178 44 212 0 240 L0 0 Z"
        fill="url(#goldWaveGrad)"
      />

      {/* 2. Inner gleaming highlight contours */}
      <path
        d="M84 0 C54 38 32 85 45 132 C58 178 44 212 0 240"
        stroke="url(#goldHighlightGrad)"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M92 0 C61 42 38 88 52 133 C66 181 50 216 4 240"
        stroke="#CAA256"
        strokeWidth="0.75"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M97 0 C66 45 43 91 57 134 C71 183 55 219 9 240"
        stroke="#DFC285"
        strokeWidth="0.5"
        strokeDasharray="2.5, 2.5"
        fill="none"
        opacity="0.5"
      />

      {/* 3. Golden Laurel Branch & Foliage Sprouting into the Card */}
      <g transform="translate(14, 18)">
        {/* Main curved central stem */}
        <path
          d="M 12 195 C 8 155 16 112 28 72 C 34 44 29 20 22 5"
          stroke="url(#goldLeafGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Leaf 1: Top terminal leaf */}
        <path d="M 22 5 C 29 -3 39 4 34 16 C 28 15 23 10 22 5 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 22 5 Q 29 8 34 16" stroke="#FFF7E6" strokeWidth="0.7" opacity="0.8" />

        {/* Leaf pair 2 (y ~ 26) */}
        <path d="M 25 26 C 16 20 10 28 15 37 C 20 35 24 31 25 26 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 25 26 Q 16 30 15 37" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />
        <path d="M 27 28 C 38 22 45 32 39 43 C 33 40 29 35 27 28 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 27 28 Q 36 33 39 43" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />

        {/* Leaf pair 3 (y ~ 54) */}
        <path d="M 29 54 C 18 47 11 58 17 67 C 23 65 28 60 29 54 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 29 54 Q 18 59 17 67" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />
        <path d="M 30 58 C 42 50 51 61 44 73 C 38 70 33 65 30 58 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 30 58 Q 40 64 44 73" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />

        {/* Leaf pair 4 (y ~ 88) */}
        <path d="M 27 88 C 15 80 8 92 15 101 C 21 98 26 94 27 88 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 27 88 Q 16 93 15 101" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />
        <path d="M 28 92 C 40 83 49 95 41 107 C 35 104 31 99 28 92 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 28 92 Q 38 97 41 107" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />

        {/* Leaf pair 5 (y ~ 124) */}
        <path d="M 22 124 C 11 117 5 128 12 137 C 18 134 21 129 22 124 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 22 124 Q 12 129 12 137" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />
        <path d="M 23 128 C 35 120 42 132 34 143 C 29 140 25 135 23 128 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 23 128 Q 32 133 34 143" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />

        {/* Leaf pair 6 (y ~ 158) */}
        <path d="M 16 158 C 7 152 2 163 9 171 C 14 168 16 163 16 158 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
        <path d="M 17 162 C 28 156 34 167 27 176 C 22 173 19 168 17 162 Z" fill="url(#goldLeafGrad)" stroke="#6C4D15" strokeWidth="0.4" />
      </g>

      {/* ========================================================
          BOTTOM-RIGHT ACCENT: Delicate Curved Golden Hairline
          ======================================================== */}
      <path
        d="M 290 240 C 330 235 365 215 385 180 C 395 160 398 140 400 130"
        stroke="url(#goldHighlightGrad)"
        strokeWidth="1.2"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M 305 240 C 342 236 374 218 392 186 C 399 172 400 156 400 148"
        stroke="#CAA256"
        strokeWidth="0.6"
        strokeDasharray="3, 3"
        fill="none"
        opacity="0.55"
      />
    </svg>
  </div>
);

export const GoldenFloralBackBackground: React.FC<{
  className?: string;
  showEnglishNote?: boolean;
  englishNoteText?: string;
}> = ({
  className,
  showEnglishNote = true,
  englishNoteText = 'A Special Day\nA Lasting Memory',
}) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] ${className || ''}`}>
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="none"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="backGoldWaveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7E591A" />
          <stop offset="25%" stopColor="#A3782B" />
          <stop offset="55%" stopColor="#E9D396" />
          <stop offset="85%" stopColor="#C89D4B" />
          <stop offset="100%" stopColor="#F5E4B5" />
        </linearGradient>

        <linearGradient id="flowerPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FDFBF7" />
          <stop offset="75%" stopColor="#F3E7D5" />
          <stop offset="100%" stopColor="#DFC3A0" />
        </linearGradient>

        <linearGradient id="flowerPetalShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5EADA" />
          <stop offset="100%" stopColor="#D4BA94" />
        </linearGradient>

        <linearGradient id="goldLeafGradBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5C782" />
          <stop offset="50%" stopColor="#BA8F3E" />
          <stop offset="100%" stopColor="#755217" />
        </linearGradient>
      </defs>

      {/* Warm Ivory cardstock surface */}
      <rect width="400" height="240" fill="#FCFAF7" />

      {/* Subtle luxury outer border hairline */}
      <rect
        x="1.5"
        y="1.5"
        width="397"
        height="237"
        rx="8"
        stroke="#E5D6BA"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />

      {/* ========================================================
          BOTTOM-LEFT: Metallic Gold Wave & Accents
          ======================================================== */}
      <path
        d="M 0 240 L 165 240 C 130 215 85 195 48 185 C 18 177 0 182 0 182 Z"
        fill="url(#backGoldWaveGrad)"
      />
      <path
        d="M 165 240 C 130 215 85 195 48 185 C 18 177 0 182 0 182"
        stroke="#FFF2CE"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M 180 240 C 145 212 96 189 54 179 C 22 171 0 174 0 174"
        stroke="#CAA256"
        strokeWidth="0.75"
        strokeDasharray="3, 3"
        fill="none"
        opacity="0.65"
      />

      {/* ========================================================
          TOP-LEFT: Faint Watermark Botanical Line Art
          ======================================================== */}
      <g opacity="0.32" transform="translate(8, 14)">
        <path d="M 5 50 C 15 25 35 12 55 5 C 45 28 25 48 5 50 Z" fill="none" stroke="#BA8E3C" strokeWidth="1" />
        <path d="M 5 50 Q 32 26 55 5" stroke="#BA8E3C" strokeWidth="0.7" />
        <path d="M 30 70 C 42 48 62 38 80 30 C 68 52 48 68 30 70 Z" fill="none" stroke="#BA8E3C" strokeWidth="1" />
        <path d="M 30 70 Q 58 48 80 30" stroke="#BA8E3C" strokeWidth="0.7" />
      </g>

      {/* ========================================================
          TOP-RIGHT: Golden Leaf Sprays along the Right Edge
          ======================================================== */}
      <g transform="translate(305, 5)">
        <path d="M 75 12 C 60 22 55 38 52 55 C 65 42 75 28 75 12 Z" fill="url(#goldLeafGradBack)" stroke="#5B3E12" strokeWidth="0.4" />
        <path d="M 75 12 Q 62 32 52 55" stroke="#FFF7E6" strokeWidth="0.5" opacity="0.7" />
        <path d="M 50 35 C 35 45 32 60 30 75 C 42 62 50 48 50 35 Z" fill="url(#goldLeafGradBack)" stroke="#5B3E12" strokeWidth="0.4" />
        <path d="M 85 45 C 72 58 70 75 68 90 C 80 75 88 60 85 45 Z" fill="url(#goldLeafGradBack)" stroke="#5B3E12" strokeWidth="0.4" />
      </g>

      {/* ========================================================
          RIGHT & BOTTOM-RIGHT: Lush Blooming Flower & Golden Leaves
          ======================================================== */}
      <g transform="translate(240, 95)">
        {/* Golden Leaves extending outwards and upwards */}
        <g>
          {/* Leaf high right */}
          <path d="M 110 95 C 130 65 155 55 165 45 C 152 75 132 98 110 95 Z" fill="url(#goldLeafGradBack)" stroke="#5B3E12" strokeWidth="0.5" />
          <path d="M 110 95 Q 140 72 165 45" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />

          {/* Leaf mid right */}
          <path d="M 65 55 C 75 25 105 12 125 5 C 112 35 95 55 65 55 Z" fill="url(#goldLeafGradBack)" stroke="#5B3E12" strokeWidth="0.5" />
          <path d="M 65 55 Q 98 28 125 5" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />

          {/* Leaf upper-left reaching toward center */}
          <path d="M 35 75 C 15 55 -5 65 -20 75 C -10 90 15 90 35 75 Z" fill="url(#goldLeafGradBack)" stroke="#5B3E12" strokeWidth="0.5" />
          <path d="M 35 75 Q 10 75 -20 75" stroke="#FFF7E6" strokeWidth="0.6" opacity="0.8" />

          {/* Leaf lower center */}
          <path d="M 40 115 C 10 118 -8 135 2 145 C 20 142 35 130 40 115 Z" fill="url(#goldLeafGradBack)" stroke="#5B3E12" strokeWidth="0.5" />
        </g>

        {/* Small Flower Bud on Left with Golden Calyx */}
        <g transform="translate(18, 52)">
          {/* Calyx */}
          <path d="M -5 18 C -10 10 -2 0 8 4 C 14 8 10 20 -5 18 Z" fill="url(#goldLeafGradBack)" stroke="#7E5F22" strokeWidth="0.5" />
          {/* Bud petals */}
          <path d="M 0 14 C -3 5 4 -3 14 0 C 18 4 14 18 0 14 Z" fill="url(#flowerPetalGrad)" stroke="#B38A3A" strokeWidth="0.6" />
          <path d="M 3 10 C 1 2 9 -1 12 2" stroke="#CA9E4F" strokeWidth="0.5" fill="none" />
        </g>

        {/* Main Exquisite Multi-layered Blooming Flower */}
        <g transform="translate(85, 82)">
          {/* Layer 1: Outer large petals */}
          <path d="M -48 -8 C -62 -35 -30 -60 0 -54 C 30 -60 62 -35 48 -8 C 62 20 30 52 0 46 C -30 52 -62 20 -48 -8 Z" fill="url(#flowerPetalShadow)" stroke="#B88E3E" strokeWidth="0.8" />
          <path d="M -38 -20 C -48 -45 -18 -55 0 -48 C 18 -55 48 -45 38 -20 C 48 5 22 35 0 28 C -22 35 -48 5 -38 -20 Z" fill="url(#flowerPetalGrad)" stroke="#C89D4B" strokeWidth="0.8" />

          {/* Layer 2: Interlocking mid petals with delicate curvature */}
          <path d="M -30 0 C -40 -20 -15 -35 0 -30 C 15 -35 40 -20 30 0 C 40 20 15 35 0 30 C -15 35 -40 20 -30 0 Z" fill="#FFFDF9" stroke="#C49A46" strokeWidth="0.7" />
          <path d="M -20 -12 C -28 -28 -5 -30 0 -22 C 5 -30 28 -28 20 -12 C 28 8 5 22 0 16 C -5 22 -28 8 -20 -12 Z" fill="url(#flowerPetalGrad)" stroke="#BA8E3C" strokeWidth="0.7" />

          {/* Layer 3: Inner rosebud petals */}
          <path d="M -14 0 C -18 -10 -6 -18 0 -15 C 6 -18 18 -10 14 0 C 18 10 6 18 0 15 C -6 18 -18 10 -14 0 Z" fill="url(#flowerPetalShadow)" stroke="#A07628" strokeWidth="0.75" />
          <path d="M -8 -4 C -10 -9 -3 -12 0 -10 C 3 -12 10 -9 8 -4 C 10 3 3 8 0 6 C -3 8 -10 3 -8 -4 Z" fill="#FFFBF5" stroke="#A07628" strokeWidth="0.6" />

          {/* Layer 4: Golden Stamen Center */}
          <circle cx="0" cy="0" r="8" fill="#CAA04A" stroke="#8C6826" strokeWidth="0.7" />
          {/* Anther / Pollen specks */}
          <circle cx="-3" cy="-3" r="1.4" fill="#FFF7E6" />
          <circle cx="3" cy="-2" r="1.3" fill="#FFF7E6" />
          <circle cx="-2" cy="3" r="1.2" fill="#755015" />
          <circle cx="3" cy="2" r="1.2" fill="#755015" />
          <circle cx="0" cy="0" r="1.5" fill="#FFEBB8" />
        </g>
      </g>
    </svg>

    {/* Elegant English Note in bottom-left gold area */}
    {showEnglishNote && (
      <div className="absolute bottom-2.5 left-3.5 text-left pointer-events-none z-10">
        <p
          className="text-[8.5px] sm:text-[9.5px] font-serif leading-tight tracking-wider"
          style={{
            color: '#FFF8EB',
            fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
            textShadow: '0 1px 3px rgba(45, 30, 10, 0.75)',
          }}
        >
          {englishNoteText.split('\n').map((line, i) => (
            <span key={i} className="block font-medium">
              {line}
            </span>
          ))}
        </p>
      </div>
    )}
  </div>
);

// ============================================================================
// 3. TEMPLATE STYLING & CORNER RESOLVER
// ============================================================================

export function renderThemeCorners(
  theme: CardTemplateType,
  palette: any
) {
  // Bespoke background themes handle their own rich borders and corners
  if (
    theme === 'wedding_golden_floral' ||
    theme === 'wedding_botanical_purple' ||
    theme === 'wedding_royal_burgundy' ||
    theme === 'wedding_calla_sage' ||
    theme === 'wedding_sculpted_ivory'
  ) {
    return null;
  }

  const corners: Array<{ pos: 'tl' | 'tr' | 'bl' | 'br'; posClass: string; transform: string }> = [
    { pos: 'tl', posClass: 'top-1 left-1', transform: 'rotate(0deg)' },
    { pos: 'tr', posClass: 'top-1 right-1', transform: 'scaleX(-1)' },
    { pos: 'bl', posClass: 'bottom-1 left-1', transform: 'scaleY(-1)' },
    { pos: 'br', posClass: 'bottom-1 right-1', transform: 'scale(-1, -1)' },
  ];

  const primaryColor = palette.frameBorderOuter;
  const accentColor = palette.cornerBorder;

  return (
    <>
      {corners.map((c) => {
        let CornerComponent = AndalusianCorner;
        if (theme === 'wedding_damask') CornerComponent = DamaskCorner;
        else if (theme === 'wedding_imperial' || theme === 'graduation_royal' || theme === 'graduation_classic' || theme === 'graduation' || theme === 'royal_graduation') CornerComponent = ImperialCorner;
        else if (theme === 'wedding_minimal_luxury') CornerComponent = MinimalKnotCorner;
        else if (theme === 'dinner_royal' || theme === 'dinner_classic' || theme === 'dinner') CornerComponent = AndalusianCorner;

        return (
          <div key={c.pos} className={`absolute ${c.posClass} pointer-events-none z-10`} style={{ transform: c.transform }}>
            <CornerComponent color={primaryColor} accent={accentColor} className="w-8 h-8" />
          </div>
        );
      })}
    </>
  );
}

export function renderThemeTopCrest(theme: CardTemplateType, palette: any) {
  if (theme === 'wedding_golden_floral') {
    return null; // Handled directly via InitialsMonogram
  }
  if (theme === 'wedding_botanical_purple') {
    return <BotanicalPurpleTopMotif color={palette.headerText || '#6d28d9'} className="w-12 h-10 mx-auto" />;
  }
  if (theme === 'wedding_royal_burgundy') {
    return <BurgundyMonogramCrest color={palette.headerText || '#881337'} className="w-14 h-14 mx-auto" />;
  }
  if (theme === 'wedding_calla_sage') {
    return <CallaSageTopCalligraphy color={palette.headerText || '#3f6212'} className="w-32 h-10 mx-auto" />;
  }
  if (theme === 'wedding_sculpted_ivory') {
    return <SculptedCallaMotif className="w-8 h-10 mx-auto" />;
  }
  if (theme === 'wedding_damask') {
    return <DamaskFloralCrest color={palette.headerText} accent={palette.accentText} className="w-24 h-8 mx-auto" />;
  }
  if (theme === 'wedding_imperial') {
    return <ImperialCrownCrest color={palette.headerText} accent={palette.accentText} className="w-24 h-8 mx-auto" />;
  }
  if (theme === 'wedding_minimal_luxury') {
    return <MinimalDiamondCrest color={palette.headerText} accent={palette.accentText} className="w-20 h-6 mx-auto" />;
  }
  if (theme === 'graduation_royal' || theme === 'graduation_classic' || theme === 'graduation' || theme === 'royal_graduation') {
    return <GraduationLaurelCrest color={palette.headerText} accent={palette.accentText} className="w-24 h-8 mx-auto" />;
  }
  if (theme === 'dinner_royal' || theme === 'dinner_classic' || theme === 'dinner') {
    return <DinnerBanquetCrest color={palette.headerText} accent={palette.accentText} className="w-24 h-7 mx-auto" />;
  }
  // Default: Andalusian Arch Crest
  return <AndalusianArchCrest color={palette.headerText} accent={palette.accentText} className="w-24 h-8 mx-auto" />;
}

export function renderWeddingRichBackground(theme: CardTemplateType) {
  if (theme === 'wedding_golden_floral') {
    return <GoldenFloralFrontBackground />;
  }
  if (theme === 'wedding_botanical_purple') {
    return <BotanicalPurpleBackground />;
  }
  if (theme === 'wedding_royal_burgundy') {
    return <BurgundyRoseBackground />;
  }
  if (theme === 'wedding_calla_sage') {
    return <CallaSageBackground />;
  }
  if (theme === 'wedding_sculpted_ivory') {
    return <SculptedIvoryBackground />;
  }
  return null;
}

