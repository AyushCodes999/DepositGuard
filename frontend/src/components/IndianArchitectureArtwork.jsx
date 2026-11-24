import React, { useEffect, useState, useRef } from "react";

/**
 * IndianArchitectureArtwork
 * 
 * A layered, interconnected Indian residential architecture artwork.
 * Built with clean, crisp multi-layer SVG + subtle CSS/scroll parallax.
 * 
 * Layers (Back to Front):
 *  1. Far Background: Distant apartments, rooftop water tanks on stilts, domes/chhattris (#DDD6C7)
 *  2. Midground Back: Interconnected flats, balconies with railings, pitched tile roofs (#C2B29F)
 *  3. Midground Front: Rajasthani jharokhas, jaali lattice accents, stepped terraces (#7C6F64)
 *  4. Foreground: Intricate facades, warm amber glowing windows, emerald accents (#1F2D2B)
 */
export default function IndianArchitectureArtwork() {
  const [scrollY, setScrollY] = useState(0);
  const [pointerX, setPointerX] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    let currentScroll = window.scrollY || 0;
    let targetScroll = currentScroll;
    let currentPx = 0;
    let targetPx = 0;

    let isRunning = false;

    const requestTick = () => {
      if (!isRunning) {
        isRunning = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      targetScroll = window.scrollY || 0;
      requestTick();
    };

    const onMouseMove = (e) => {
      const halfW = window.innerWidth / 2;
      targetPx = Math.max(-1, Math.min(1, (e.clientX - halfW) / halfW));
      requestTick();
    };

    const onMouseLeave = () => {
      targetPx = 0;
      requestTick();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave, { passive: true });

    const tick = () => {
      const scrollDiff = targetScroll - currentScroll;
      const pxDiff = targetPx - currentPx;

      if (Math.abs(scrollDiff) > 0.1 || Math.abs(pxDiff) > 0.002) {
        currentScroll += scrollDiff * 0.12;
        currentPx += pxDiff * 0.08;
        setScrollY(currentScroll);
        setPointerX(currentPx);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentScroll = targetScroll;
        currentPx = targetPx;
        setScrollY(currentScroll);
        setPointerX(currentPx);
        isRunning = false;
      }
    };

    requestTick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  // Parallax ratio normalized by viewport height
  const vh = typeof window !== "undefined" ? window.innerHeight || 800 : 800;
  const par = Math.min(1.4, Math.max(0, scrollY / vh));

  // Multi-layer vertical shift on scroll and subtle horizontal tilt on pointer
  const l1Y = (par * 18).toFixed(1);
  const l1X = (pointerX * -5).toFixed(1);

  const l2Y = (par * 38).toFixed(1);
  const l2X = (pointerX * -10).toFixed(1);

  const l3Y = (par * 62).toFixed(1);
  const l3X = (pointerX * -16).toFixed(1);

  const l4Y = (par * 90).toFixed(1);
  const l4X = (pointerX * -22).toFixed(1);

  return (
    <div className="absolute inset-x-0 bottom-0 w-full h-[46vh] sm:h-[48vh] min-h-[360px] max-h-[560px] pointer-events-none select-none overflow-hidden z-[1] flex items-end">
      <style>{`
        @keyframes amberWindowPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.85; }
        }
        @keyframes amberWindowPulseAlt {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 0.40; }
        }
        .dg-amber-win-1 {
          animation: amberWindowPulse 4.5s ease-in-out infinite;
        }
        .dg-amber-win-2 {
          animation: amberWindowPulseAlt 6s ease-in-out infinite;
        }
      `}</style>

      <svg
        viewBox="0 0 1600 540"
        className="w-full h-full object-cover object-bottom"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          {/* Jaali lattice pattern for midground balconies */}
          <pattern id="jaali-mid" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1.6" fill="#7C6F64" opacity="0.6" />
            <path d="M0 4h8M4 0v8" stroke="#7C6F64" strokeWidth="0.5" opacity="0.35" />
          </pattern>

          {/* Jaali lattice pattern for foreground balconies */}
          <pattern id="jaali-fore" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="2.2" fill="#1F2D2B" opacity="0.75" />
            <path d="M0 5h10M5 0v10" stroke="#1F2D2B" strokeWidth="0.7" opacity="0.45" />
          </pattern>

          {/* Mangalore tile roof hatch texture */}
          <pattern id="mangalore-tile" width="6" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#15211F" strokeWidth="0.9" opacity="0.3" />
          </pattern>

          {/* Atmospheric sky haze gradient */}
          <linearGradient id="skyHaze" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAF8F4" stopOpacity="0" />
            <stop offset="60%" stopColor="#FAF8F4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FAF8F4" stopOpacity="0.85" />
          </linearGradient>

          {/* Soft grounding gradient to bottom edge */}
          <linearGradient id="groundBlend" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1F2D2B" stopOpacity="0" />
            <stop offset="80%" stopColor="#1F2D2B" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1F2D2B" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* =====================================================================
            LAYER 1: FAR BACKGROUND (Muted Warm Stone: #DDD6C7)
            Distant skyline of Indian apartment blocks, rooftop water tanks on stilts,
            stair mumties, communication poles, and subtle Rajasthani cupolas/chhattris.
        ===================================================================== */}
        <g
          style={{
            transform: `translate3d(${l1X}px, ${l1Y}px, 0)`,
            transition: "transform 100ms ease-out",
          }}
          opacity="0.88"
        >
          {/* Distant Apartments Silhouette */}
          <path
            fill="#DDD6C7"
            d="
              M0,540 L0,270 
              L45,270 L45,245 L95,245 L95,270 L140,270 L140,290 
              L185,290 L185,260 L240,260 L240,235 L300,235 L300,260 L345,260 L345,295 
              L385,295 L385,270 L430,270 L430,250 L470,250 L470,270 L520,270 L520,285
              L560,285 L560,240 L625,240 L625,265 L670,265 L670,290 
              L710,290 L710,255 L755,255 L755,230 L820,230 L820,255 L865,255 L865,285 
              L910,285 L910,260 L965,260 L965,240 L1015,240 L1015,260 L1055,260 L1055,290
              L1100,290 L1100,250 L1160,250 L1160,270 L1210,270 L1210,295
              L1250,295 L1250,245 L1315,245 L1315,270 L1365,270 L1365,290
              L1410,290 L1410,235 L1470,235 L1470,260 L1525,260 L1525,285 L1600,285
              L1600,540 Z
            "
          />

          {/* Rooftop Water Tanks on 4-Legged Stilts (Sintex / Poly storage tanks) */}
          {/* Tank 1 */}
          <g transform="translate(60, 222)">
            <rect x="0" y="0" width="18" height="15" rx="2" fill="#D3CBB9" />
            <ellipse cx="9" cy="2" rx="9" ry="2" fill="#C9C0AC" />
            <line x1="2" y1="15" x2="0" y2="23" stroke="#C9C0AC" strokeWidth="1.2" />
            <line x1="16" y1="15" x2="18" y2="23" stroke="#C9C0AC" strokeWidth="1.2" />
          </g>

          {/* Tank 2 */}
          <g transform="translate(265, 212)">
            <rect x="0" y="0" width="22" height="16" rx="2" fill="#D3CBB9" />
            <ellipse cx="11" cy="2" rx="11" ry="2" fill="#C9C0AC" />
            <line x1="2" y1="16" x2="0" y2="23" stroke="#C9C0AC" strokeWidth="1.2" />
            <line x1="20" y1="16" x2="22" y2="23" stroke="#C9C0AC" strokeWidth="1.2" />
          </g>

          {/* Distant Rajasthani Chhattri Dome (x: 440) */}
          <g transform="translate(440, 230)">
            <path d="M0,15 C0,4 6,0 15,0 C24,0 30,4 30,15 Z" fill="#D3CBB9" />
            <line x1="15" y1="0" x2="15" y2="-5" stroke="#C9C0AC" strokeWidth="1.5" />
            <rect x="4" y="15" width="2" height="5" fill="#C9C0AC" />
            <rect x="14" y="15" width="2" height="5" fill="#C9C0AC" />
            <rect x="24" y="15" width="2" height="5" fill="#C9C0AC" />
          </g>

          {/* Tank 3 */}
          <g transform="translate(775, 206)">
            <rect x="0" y="0" width="24" height="17" rx="3" fill="#D3CBB9" />
            <ellipse cx="12" cy="2" rx="12" ry="2" fill="#C9C0AC" />
            <line x1="2" y1="17" x2="0" y2="24" stroke="#C9C0AC" strokeWidth="1.2" />
            <line x1="22" y1="17" x2="24" y2="24" stroke="#C9C0AC" strokeWidth="1.2" />
          </g>

          {/* Distant Chhattri Dome (x: 980) */}
          <g transform="translate(980, 222)">
            <path d="M0,14 C0,3 5,0 13,0 C21,0 26,3 26,14 Z" fill="#D3CBB9" />
            <line x1="13" y1="0" x2="13" y2="-4" stroke="#C9C0AC" strokeWidth="1.5" />
          </g>

          {/* Tank 4 */}
          <g transform="translate(1430, 212)">
            <rect x="0" y="0" width="20" height="16" rx="2" fill="#D3CBB9" />
            <ellipse cx="10" cy="2" rx="10" ry="2" fill="#C9C0AC" />
            <line x1="2" y1="16" x2="0" y2="23" stroke="#C9C0AC" strokeWidth="1.2" />
            <line x1="18" y1="16" x2="20" y2="23" stroke="#C9C0AC" strokeWidth="1.2" />
          </g>

          {/* Distant repetitive slit windows */}
          <g fill="#FAF8F4" opacity="0.35">
            <rect x="25" y="280" width="5" height="8" rx="1" />
            <rect x="35" y="280" width="5" height="8" rx="1" />
            <rect x="65" y="260" width="5" height="8" rx="1" />
            <rect x="75" y="260" width="5" height="8" rx="1" />
            <rect x="255" y="250" width="6" height="9" rx="1" />
            <rect x="270" y="250" width="6" height="9" rx="1" />
            <rect x="255" y="270" width="6" height="9" rx="1" />
            <rect x="270" y="270" width="6" height="9" rx="1" />
            <rect x="580" y="255" width="6" height="9" rx="1" />
            <rect x="595" y="255" width="6" height="9" rx="1" />
            <rect x="770" y="245" width="6" height="9" rx="1" />
            <rect x="785" y="245" width="6" height="9" rx="1" />
            <rect x="800" y="245" width="6" height="9" rx="1" />
            <rect x="1120" y="265" width="6" height="9" rx="1" />
            <rect x="1135" y="265" width="6" height="9" rx="1" />
            <rect x="1430" y="250" width="6" height="9" rx="1" />
            <rect x="1445" y="250" width="6" height="9" rx="1" />
          </g>

          {/* Soft atmospheric haze veil over far layer */}
          <rect x="0" y="220" width="1600" height="320" fill="url(#skyHaze)" />
        </g>

        {/* =====================================================================
            LAYER 2: MIDGROUND BACK (Dusty Sandstone: #C2B29F)
            Residential flats, cantilevers, stepped terraces, Mangalore-tiled roof slopes,
            vertical balcony railings, and window sunshade chajjas.
        ===================================================================== */}
        <g
          style={{
            transform: `translate3d(${l2X}px, ${l2Y}px, 0)`,
            transition: "transform 100ms ease-out",
          }}
          opacity="0.94"
        >
          {/* Main silhouette of 3-4 story flats */}
          <path
            fill="#C2B29F"
            d="
              M0,540 L0,320
              L35,320 L55,295 L115,295 L135,320 L160,320 L160,305 L215,305 L215,335
              L260,335 L260,290 L325,290 L325,310 L370,310 L395,285 L445,285 L470,310
              L515,310 L515,295 L575,295 L575,325 L620,325 L640,295 L705,295 L725,325
              L775,325 L775,285 L845,285 L845,315 L890,315 L915,290 L965,290 L990,315
              L1040,315 L1040,295 L1105,295 L1105,325 L1155,325 L1175,290 L1235,290 L1255,325
              L1305,325 L1305,295 L1370,295 L1370,320 L1420,320 L1445,290 L1495,290 L1520,320
              L1600,320 L1600,540 Z
            "
          />

          {/* Mangalore Clay Tile Roof Gables (Terracotta Slopes) */}
          {/* Roof 1 */}
          <polygon points="35,320 85,280 135,320" fill="#B3A28F" />
          <polygon points="35,320 85,280 135,320" fill="url(#mangalore-tile)" />
          <line x1="85" y1="280" x2="85" y2="274" stroke="#9E8D7B" strokeWidth="1.5" />

          {/* Roof 2 (Mangalore gable at x: 370..470) */}
          <polygon points="370,310 420,270 470,310" fill="#B3A28F" />
          <polygon points="370,310 420,270 470,310" fill="url(#mangalore-tile)" />
          <line x1="420" y1="270" x2="420" y2="264" stroke="#9E8D7B" strokeWidth="1.5" />

          {/* Roof 3 (Mangalore gable at x: 620..725) */}
          <polygon points="620,325 672,282 725,325" fill="#B3A28F" />
          <polygon points="620,325 672,282 725,325" fill="url(#mangalore-tile)" />

          {/* Roof 4 (x: 890..990) */}
          <polygon points="890,315 940,275 990,315" fill="#B3A28F" />
          <polygon points="890,315 940,275 990,315" fill="url(#mangalore-tile)" />

          {/* Roof 5 (x: 1420..1520) */}
          <polygon points="1420,320 1470,278 1520,320" fill="#B3A28F" />
          <polygon points="1420,320 1470,278 1520,320" fill="url(#mangalore-tile)" />

          {/* Architectural Balconies with Railings (Vertical slats) */}
          <g stroke="#9E8D7B" strokeWidth="1">
            {/* Balcony 1 */}
            <line x1="170" y1="315" x2="205" y2="315" />
            <line x1="170" y1="324" x2="205" y2="324" />
            <line x1="175" y1="315" x2="175" y2="324" />
            <line x1="182" y1="315" x2="182" y2="324" />
            <line x1="190" y1="315" x2="190" y2="324" />
            <line x1="198" y1="315" x2="198" y2="324" />

            {/* Balcony 2 */}
            <line x1="270" y1="305" x2="315" y2="305" />
            <line x1="270" y1="316" x2="315" y2="316" />
            <line x1="278" y1="305" x2="278" y2="316" />
            <line x1="288" y1="305" x2="288" y2="316" />
            <line x1="298" y1="305" x2="298" y2="316" />
            <line x1="308" y1="305" x2="308" y2="316" />

            {/* Balcony 3 */}
            <line x1="785" y1="300" x2="835" y2="300" />
            <line x1="785" y1="312" x2="835" y2="312" />
            <line x1="795" y1="300" x2="795" y2="312" />
            <line x1="808" y1="300" x2="808" y2="312" />
            <line x1="822" y1="300" x2="822" y2="312" />

            {/* Balcony 4 */}
            <line x1="1050" y1="308" x2="1095" y2="308" />
            <line x1="1050" y1="319" x2="1095" y2="319" />
            <line x1="1060" y1="308" x2="1060" y2="319" />
            <line x1="1072" y1="308" x2="1072" y2="319" />
            <line x1="1085" y1="308" x2="1085" y2="319" />

            {/* Balcony 5 */}
            <line x1="1315" y1="308" x2="1360" y2="308" />
            <line x1="1315" y1="319" x2="1360" y2="319" />
            <line x1="1325" y1="308" x2="1325" y2="319" />
            <line x1="1338" y1="308" x2="1338" y2="319" />
            <line x1="1350" y1="308" x2="1350" y2="319" />
          </g>

          {/* Arched Rajasthani Window Profiles on Midground Back */}
          <g fill="#A89784">
            <path d="M60,300 C60,295 65,291 70,291 C75,291 80,295 80,300 L80,312 L60,312 Z" />
            <path d="M90,300 C90,295 95,291 100,291 C105,291 110,295 110,300 L110,312 L90,312 Z" />
            <path d="M400,290 C400,284 405,280 410,280 C415,280 420,284 420,290 L420,302 L400,302 Z" />
            <path d="M428,290 C428,284 433,280 438,280 C443,280 448,284 448,290 L448,302 L428,302 Z" />
            <path d="M655,302 C655,296 660,292 666,292 C672,292 677,296 677,302 L677,316 L655,316 Z" />
            <path d="M925,295 C925,289 930,285 936,285 C942,285 947,289 947,295 L947,308 L925,308 Z" />
            <path d="M1455,296 C1455,290 1460,286 1466,286 C1472,286 1477,290 1477,296 L1477,310 L1455,310 Z" />
          </g>
        </g>

        {/* =====================================================================
            LAYER 3: MIDGROUND FRONT (Warm Terracotta-Slate: #7C6F64)
            Interconnected residential homes, projecting Rajasthani jharokhas,
            jaali lattice screen panels, stepped parapets, and exterior dog-leg stairs.
        ===================================================================== */}
        <g
          style={{
            transform: `translate3d(${l3X}px, ${l3Y}px, 0)`,
            transition: "transform 100ms ease-out",
          }}
          opacity="0.98"
        >
          {/* Main silhouette of interconnected homes */}
          <path
            fill="#7C6F64"
            d="
              M0,540 L0,360
              L40,360 L40,330 L105,330 L105,355 L150,355 L175,325 L235,325 L260,355
              L300,355 L300,320 L370,320 L370,345 L415,345 L435,315 L500,315 L520,345
              L565,345 L565,330 L630,330 L630,360 L675,360 L695,325 L765,325 L785,360
              L830,360 L830,325 L900,325 L900,350 L945,350 L965,318 L1030,318 L1050,350
              L1100,350 L1100,330 L1170,330 L1170,358 L1215,358 L1235,320 L1305,320 L1325,358
              L1370,358 L1370,328 L1440,328 L1440,355 L1485,355 L1505,320 L1570,320 L1590,355
              L1600,355 L1600,540 Z
            "
          />

          {/* Pitched Mangalore tiled roofs on midground homes */}
          {/* Roof A (x: 150..260) */}
          <polygon points="150,355 205,310 260,355" fill="#6B5F54" />
          <polygon points="150,355 205,310 260,355" fill="url(#mangalore-tile)" />
          <line x1="205" y1="310" x2="205" y2="302" stroke="#52473D" strokeWidth="1.8" />

          {/* Roof B (x: 415..520) */}
          <polygon points="415,345 467,302 520,345" fill="#6B5F54" />
          <polygon points="415,345 467,302 520,345" fill="url(#mangalore-tile)" />
          <line x1="467" y1="302" x2="467" y2="294" stroke="#52473D" strokeWidth="1.8" />

          {/* Roof C (x: 675..785) */}
          <polygon points="675,360 730,312 785,360" fill="#6B5F54" />
          <polygon points="675,360 730,312 785,360" fill="url(#mangalore-tile)" />
          <line x1="730" y1="312" x2="730" y2="304" stroke="#52473D" strokeWidth="1.8" />

          {/* Roof D (x: 945..1050) */}
          <polygon points="945,350 998,305 1050,350" fill="#6B5F54" />
          <polygon points="945,350 998,305 1050,350" fill="url(#mangalore-tile)" />
          <line x1="998" y1="305" x2="998" y2="297" stroke="#52473D" strokeWidth="1.8" />

          {/* Roof E (x: 1215..1325) */}
          <polygon points="1215,358 1270,310 1325,358" fill="#6B5F54" />
          <polygon points="1215,358 1270,310 1325,358" fill="url(#mangalore-tile)" />

          {/* Roof F (x: 1485..1590) */}
          <polygon points="1485,355 1538,308 1590,355" fill="#6B5F54" />
          <polygon points="1485,355 1538,308 1590,355" fill="url(#mangalore-tile)" />

          {/* Projecting Rajasthani Jharokha Balconies with Corbel Brackets */}
          {/* Jharokha 1 (x: 50..95) */}
          <g transform="translate(52, 336)">
            {/* Projecting oriel box */}
            <rect x="0" y="0" width="42" height="24" fill="#62564C" rx="1" />
            {/* Jaali lattice screen panels */}
            <rect x="3" y="3" width="36" height="18" fill="url(#jaali-mid)" />
            {/* Eaves hood */}
            <polygon points="-3,0 21,-5 45,0" fill="#52473D" />
            {/* Under-corbel stone brackets */}
            <path d="M4,24 L10,32 L16,24 Z M26,24 L32,32 L38,24 Z" fill="#52473D" />
          </g>

          {/* Jharokha 2 (x: 312..358) */}
          <g transform="translate(314, 328)">
            <rect x="0" y="0" width="44" height="25" fill="#62564C" rx="1" />
            <rect x="4" y="3" width="36" height="19" fill="url(#jaali-mid)" />
            <polygon points="-3,0 22,-5 47,0" fill="#52473D" />
            <path d="M5,25 L11,33 L17,25 Z M27,25 L33,33 L39,25 Z" fill="#52473D" />
          </g>

          {/* Jharokha 3 (x: 575..620) */}
          <g transform="translate(576, 335)">
            <rect x="0" y="0" width="44" height="24" fill="#62564C" rx="1" />
            <rect x="4" y="3" width="36" height="18" fill="url(#jaali-mid)" />
            <polygon points="-3,0 22,-5 47,0" fill="#52473D" />
            <path d="M5,24 L11,32 L17,24 Z M27,24 L33,32 L39,24 Z" fill="#52473D" />
          </g>

          {/* Jharokha 4 (x: 840..890) */}
          <g transform="translate(842, 332)">
            <rect x="0" y="0" width="46" height="25" fill="#62564C" rx="1" />
            <rect x="4" y="3" width="38" height="19" fill="url(#jaali-mid)" />
            <polygon points="-3,0 23,-5 49,0" fill="#52473D" />
            <path d="M5,25 L11,33 L17,25 Z M29,25 L35,33 L41,25 Z" fill="#52473D" />
          </g>

          {/* Jharokha 5 (x: 1110..1160) */}
          <g transform="translate(1112, 336)">
            <rect x="0" y="0" width="46" height="24" fill="#62564C" rx="1" />
            <rect x="4" y="3" width="38" height="18" fill="url(#jaali-mid)" />
            <polygon points="-3,0 23,-5 49,0" fill="#52473D" />
            <path d="M5,24 L11,32 L17,24 Z M29,24 L35,32 L41,24 Z" fill="#52473D" />
          </g>

          {/* Jharokha 6 (x: 1380..1430) */}
          <g transform="translate(1382, 335)">
            <rect x="0" y="0" width="46" height="25" fill="#62564C" rx="1" />
            <rect x="4" y="3" width="38" height="19" fill="url(#jaali-mid)" />
            <polygon points="-3,0 23,-5 49,0" fill="#52473D" />
            <path d="M5,25 L11,33 L17,25 Z M29,25 L35,33 L41,25 Z" fill="#52473D" />
          </g>

          {/* Jaali lattice balcony parapets */}
          <rect x="175" y="340" width="60" height="15" fill="url(#jaali-mid)" />
          <rect x="440" y="332" width="55" height="14" fill="url(#jaali-mid)" />
          <rect x="700" y="345" width="60" height="15" fill="url(#jaali-mid)" />
          <rect x="970" y="336" width="55" height="14" fill="url(#jaali-mid)" />
          <rect x="1240" y="342" width="60" height="15" fill="url(#jaali-mid)" />
        </g>

        {/* =====================================================================
            LAYER 4: FOREGROUND (Deep Charcoal-Forest: #1F2D2B)
            Detailed neighborhood streetscape facades, traditional doorway portals,
            carved wooden brackets, Mangalore tile gables, soft warm glowing amber windows
            (#FBBF24 with gentle pulse animation), and subtle emerald accents (#10B981).
        ===================================================================== */}
        <g
          style={{
            transform: `translate3d(${l4X}px, ${l4Y}px, 0)`,
            transition: "transform 100ms ease-out",
          }}
        >
          {/* Main detailed foreground facade silhouette */}
          <path
            fill="#1F2D2B"
            d="
              M0,540 L0,390
              L50,390 L85,348 L170,348 L205,390 L245,390 L275,355 L350,355 L380,390
              L425,390 L460,345 L545,345 L580,390 L620,390 L655,350 L735,350 L770,390
              L815,390 L850,345 L935,345 L970,390 L1010,390 L1045,352 L1125,352 L1160,390
              L1205,390 L1240,346 L1325,346 L1360,390 L1400,390 L1435,350 L1515,350 L1550,390
              L1600,390 L1600,540 Z
            "
          />

          {/* Mangalore Clay Tile Slanted Roof Gables on Foreground Row */}
          {/* Roof 1 (x: 50..205) */}
          <polygon points="46,392 128,335 209,392" fill="#182422" />
          <polygon points="46,392 128,335 209,392" fill="url(#mangalore-tile)" />
          {/* Ridge finial */}
          <path d="M125,335 L128,324 L131,335 Z" fill="#10B981" />

          {/* Roof 2 (x: 245..380) */}
          <polygon points="242,392 312,342 383,392" fill="#182422" />
          <polygon points="242,392 312,342 383,392" fill="url(#mangalore-tile)" />
          <path d="M310,342 L312,333 L314,342 Z" fill="#10B981" />

          {/* Roof 3 (x: 425..580) */}
          <polygon points="421,392 502,332 584,392" fill="#182422" />
          <polygon points="421,392 502,332 584,392" fill="url(#mangalore-tile)" />
          <path d="M499,332 L502,321 L505,332 Z" fill="#10B981" />

          {/* Roof 4 (x: 620..770) */}
          <polygon points="617,392 695,337 773,392" fill="#182422" />
          <polygon points="617,392 695,337 773,392" fill="url(#mangalore-tile)" />
          <path d="M693,337 L695,327 L697,337 Z" fill="#10B981" />

          {/* Roof 5 (x: 815..970) */}
          <polygon points="811,392 892,332 974,392" fill="#182422" />
          <polygon points="811,392 892,332 974,392" fill="url(#mangalore-tile)" />
          <path d="M889,332 L892,321 L895,332 Z" fill="#10B981" />

          {/* Roof 6 (x: 1010..1160) */}
          <polygon points="1007,392 1085,338 1163,392" fill="#182422" />
          <polygon points="1007,392 1085,338 1163,392" fill="url(#mangalore-tile)" />
          <path d="M1083,338 L1085,328 L1087,338 Z" fill="#10B981" />

          {/* Roof 7 (x: 1205..1360) */}
          <polygon points="1201,392 1282,334 1364,392" fill="#182422" />
          <polygon points="1201,392 1282,334 1364,392" fill="url(#mangalore-tile)" />
          <path d="M1279,334 L1282,323 L1285,334 Z" fill="#10B981" />

          {/* Roof 8 (x: 1400..1550) */}
          <polygon points="1397,392 1475,337 1553,392" fill="#182422" />
          <polygon points="1397,392 1475,337 1553,392" fill="url(#mangalore-tile)" />
          <path d="M1473,337 L1475,327 L1477,337 Z" fill="#10B981" />

          {/* Detailed Eaves Brackets under Roof Gables (Wooden todis) */}
          <g fill="#15211F">
            <polygon points="75,372 82,372 75,385" />
            <polygon points="100,358 107,358 100,371" />
            <polygon points="155,358 148,358 155,371" />
            <polygon points="180,372 173,372 180,385" />

            <polygon points="450,372 457,372 450,385" />
            <polygon points="475,358 482,358 475,371" />
            <polygon points="530,358 523,358 530,371" />
            <polygon points="555,372 548,372 555,385" />

            <polygon points="840,372 847,372 840,385" />
            <polygon points="865,358 872,358 865,371" />
            <polygon points="920,358 913,358 920,371" />
            <polygon points="945,372 938,372 945,385" />

            <polygon points="1230,372 1237,372 1230,385" />
            <polygon points="1255,358 1262,358 1255,371" />
            <polygon points="1310,358 1303,358 1310,371" />
            <polygon points="1335,372 1328,372 1335,385" />
          </g>

          {/* ===================================================================
              WARM AMBER GLOWING WINDOWS (#FBBF24 / #FDE68A with subtle pulse)
              Representing living homes with warm interior lights.
          =================================================================== */}
          <g>
            {/* House 1 Windows */}
            <g className="dg-amber-win-1">
              {/* Arched jharokha window */}
              <path
                d="M116,365 C116,357 122,351 128,351 C134,351 140,357 140,365 L140,382 L116,382 Z"
                fill="#FBBF24"
              />
              <rect x="80" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
              <rect x="158" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
            </g>

            {/* House 2 Windows */}
            <g className="dg-amber-win-2">
              <path
                d="M302,368 C302,361 307,356 312,356 C317,356 322,361 322,368 L322,384 L302,384 Z"
                fill="#FDE68A"
              />
              <rect x="265" y="418" width="16" height="24" rx="2" fill="#FBBF24" />
              <rect x="345" y="418" width="16" height="24" rx="2" fill="#FBBF24" />
            </g>

            {/* House 3 Windows */}
            <g className="dg-amber-win-1">
              <path
                d="M490,360 C490,352 496,346 502,346 C508,346 514,352 514,360 L514,378 L490,378 Z"
                fill="#FBBF24"
              />
              <rect x="450" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
              <rect x="535" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
            </g>

            {/* House 4 Windows */}
            <g className="dg-amber-win-2">
              <path
                d="M685,364 C685,357 690,352 695,352 C700,352 705,357 705,364 L705,380 L685,380 Z"
                fill="#FDE68A"
              />
              <rect x="645" y="418" width="16" height="25" rx="2" fill="#FBBF24" />
              <rect x="730" y="418" width="16" height="25" rx="2" fill="#FBBF24" />
            </g>

            {/* House 5 Windows (Center prominent home) */}
            <g className="dg-amber-win-1">
              <path
                d="M880,360 C880,352 886,346 892,346 C898,346 904,352 904,360 L904,378 L880,378 Z"
                fill="#FBBF24"
              />
              <rect x="840" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
              <rect x="925" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
            </g>

            {/* House 6 Windows */}
            <g className="dg-amber-win-2">
              <path
                d="M1075,364 C1075,357 1080,352 1085,352 C1090,352 1095,357 1095,364 L1095,380 L1075,380 Z"
                fill="#FDE68A"
              />
              <rect x="1035" y="418" width="16" height="25" rx="2" fill="#FBBF24" />
              <rect x="1120" y="418" width="16" height="25" rx="2" fill="#FBBF24" />
            </g>

            {/* House 7 Windows */}
            <g className="dg-amber-win-1">
              <path
                d="M1270,360 C1270,352 1276,346 1282,346 C1288,346 1294,352 1294,360 L1294,378 L1270,378 Z"
                fill="#FBBF24"
              />
              <rect x="1230" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
              <rect x="1315" y="415" width="18" height="26" rx="2" fill="#FBBF24" />
            </g>

            {/* House 8 Windows */}
            <g className="dg-amber-win-2">
              <path
                d="M1465,364 C1465,357 1470,352 1475,352 C1480,352 1485,357 1485,364 L1485,380 L1465,380 Z"
                fill="#FDE68A"
              />
              <rect x="1425" y="418" width="16" height="25" rx="2" fill="#FBBF24" />
              <rect x="1510" y="418" width="16" height="25" rx="2" fill="#FBBF24" />
            </g>
          </g>

          {/* Window mullion grid lines */}
          <g stroke="#1F2D2B" strokeWidth="1.2" opacity="0.65">
            <line x1="89" y1="415" x2="89" y2="441" />
            <line x1="80" y1="428" x2="98" y2="428" />
            <line x1="167" y1="415" x2="167" y2="441" />
            <line x1="158" y1="428" x2="176" y2="428" />

            <line x1="459" y1="415" x2="459" y2="441" />
            <line x1="450" y1="428" x2="468" y2="428" />
            <line x1="544" y1="415" x2="544" y2="441" />
            <line x1="535" y1="428" x2="553" y2="428" />

            <line x1="849" y1="415" x2="849" y2="441" />
            <line x1="840" y1="428" x2="858" y2="428" />
            <line x1="934" y1="415" x2="934" y2="441" />
            <line x1="925" y1="428" x2="943" y2="428" />

            <line x1="1239" y1="415" x2="1239" y2="441" />
            <line x1="1230" y1="428" x2="1248" y2="428" />
            <line x1="1324" y1="415" x2="1324" y2="441" />
            <line x1="1315" y1="428" x2="1333" y2="428" />
          </g>

          {/* ===================================================================
              SUBTLE EMERALD ACCENTS (#10B981)
              Arched doorway keystones, lintel bands, and entryway portals.
          =================================================================== */}
          <g>
            {/* Entry Portal 1 (x: 128) */}
            <path
              d="M118,485 L118,446 C118,438 123,433 128,433 C133,433 138,438 138,446 L138,485 Z"
              fill="#182422"
            />
            <path
              d="M116,446 C116,436 122,431 128,431 C134,431 140,436 140,446"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
            />
            <circle cx="128" cy="428" r="2.2" fill="#10B981" />

            {/* Entry Portal 2 (x: 502) */}
            <path
              d="M492,485 L492,446 C492,438 497,433 502,433 C507,433 512,438 512,446 L512,485 Z"
              fill="#182422"
            />
            <path
              d="M490,446 C490,436 496,431 502,431 C508,431 514,436 514,446"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
            />
            <circle cx="502" cy="428" r="2.2" fill="#10B981" />

            {/* Entry Portal 3 (x: 892 - Central Grand Haveli Doorway) */}
            <path
              d="M880,485 L880,444 C880,435 886,430 892,430 C898,430 904,435 904,444 L904,485 Z"
              fill="#182422"
            />
            <path
              d="M878,444 C878,433 885,427 892,427 C899,427 906,433 906,444"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.4"
            />
            <circle cx="892" cy="424" r="2.5" fill="#10B981" />

            {/* Entry Portal 4 (x: 1282) */}
            <path
              d="M1272,485 L1272,446 C1272,438 1277,433 1282,433 C1287,433 1292,438 1292,446 L1292,485 Z"
              fill="#182422"
            />
            <path
              d="M1270,446 C1270,436 1276,431 1282,431 C1288,431 1294,436 1294,446"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
            />
            <circle cx="1282" cy="428" r="2.2" fill="#10B981" />
          </g>

          {/* Foreground Balcony Jaali Lattice Screens */}
          <rect x="70" y="398" width="115" height="12" fill="url(#jaali-fore)" />
          <rect x="440" y="398" width="125" height="12" fill="url(#jaali-fore)" />
          <rect x="830" y="398" width="125" height="12" fill="url(#jaali-fore)" />
          <rect x="1220" y="398" width="125" height="12" fill="url(#jaali-fore)" />

          {/* Ground level threshold base across full width */}
          <rect x="0" y="485" width="1600" height="55" fill="#1F2D2B" />
        </g>
      </svg>
    </div>
  );
}
