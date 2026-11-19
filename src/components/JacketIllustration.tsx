import type { BookDesign } from "@/lib/designs";
import { SeriesEmblem } from "./CoverArt";

const n = (value: number) => Math.round(value * 10) / 10;
const sequence = (count: number) => Array.from({ length: count }, (_, i) => i);

/** Print artwork in a fixed 180 × 160 window, cropped by the jacket's layout. */
export function JacketIllustration({ design, seed }: { design: BookDesign; seed: number }) {
  const { accent, bg, ink, jacket } = design;
  if (!jacket) return null;
  const { illustration, spot } = jacket;
  if (design.series && !jacket.plate && seed % 3 === 0 && jacket.layout !== "bookplate" && jacket.layout !== "column") {
    return <SeriesEmblem design={design} seed={seed} />;
  }
  const shift = (seed >>> 12) % 25 - 12;
  const mirror = seed & 1 ? "translate(180 0) scale(-1 1)" : undefined;
  let drawing;
  switch (illustration) {
    case "leaves":
      drawing = <g transform={`rotate(${shift} 90 80)`}>
        <circle cx={125 + shift} cy="45" r="37" fill={spot} />
        <path d="M42 175Q80 112 113 -14" fill="none" stroke={ink} strokeWidth="2.3" />
        {sequence(9).map(i => {
          const x = 54 + i * 7, y = 146 - i * 17;
          const length = 23 + n(24 * Math.sin((i + 1) * Math.PI / 11)) + shift / 3;
          return <g key={i} transform={`translate(${x} ${y}) rotate(${i * 2 - 8})`}>
            <path d={`M0 0 Q-34 -5 -${length} -36 Q-14 -37 0 0`} fill={ink} />
            <path d={`M3 -5 Q8 -39 ${length + 4} -43 Q36 -13 3 -5`} fill={accent} />
            <path d="M-3 -3L-29 -24M6 -9L32 -31" fill="none" stroke={bg} strokeWidth=".8" />
          </g>;
        })}
      </g>;
      break;
    case "contours":
      drawing = <g>
        <circle cx={125 + shift} cy="46" r="32" fill={spot} />
        {sequence(13).map(i => {
          const points = sequence(49).map(j => {
            const a = j * Math.PI / 24;
            const radius = (11 + i * 6.8) * (1 + 0.17 * Math.sin(3 * a + shift) + 0.09 * Math.cos(5 * a + i / 16));
            return `${j ? "L" : "M"}${n(82 + shift + Math.cos(a) * radius)},${n(89 + Math.sin(a) * radius * 0.81)}`;
          }).join(" ");
          return <path key={i} d={points + "Z"} stroke={i % 4 ? ink : accent} strokeWidth={i % 4 ? 1.15 : 3} fill="none" />;
        })}
      </g>;
      break;
    case "weave":
      drawing = <g transform={`rotate(${shift - 14} 90 80)`}>
        {sequence(9).map(i => <path key={i} d={`M${i*25-24} -50v260`} stroke={accent} strokeWidth="15" />)}
        {sequence(7).map(j => <g key={j}>
          <path d={`M-50 ${j*28+2}h280`} stroke={ink} strokeWidth="13" />
          {sequence(5).map(i => <path key={i} d={`M${i*50+(j%2)*25-24} ${j*28-7}v18`} stroke={j % 3 ? accent : spot} strokeWidth="15" />)}
        </g>)}
      </g>;
      break;
    case "arches":
      drawing = <g>
        <circle cx={125 + shift} cy="38" r="29" fill={spot} />
        {sequence(6).map(i => <path key={i} d={`M${-8+i*10} 173V${90+i*2}a${82-i*10},${79-i*9} 0 0 1 ${164-i*20},0v86`} fill="none" stroke={i % 2 ? accent : ink} strokeWidth={i % 2 ? 4 : 7} />)}
        <path d="M20 160l120-42 45 15-81 29" fill={spot} />
      </g>;
      break;
    case "stairs":
      drawing = <g transform={`translate(${shift - 6} 0)`}>
        {sequence(7).map(i => {
          const x = 18 + i * 21, y = 118 - i * 15;
          return <g key={i}>
            <path d={`M${x} ${y}l24 -12 27 9 -24 13Z`} fill={spot} />
            <path d={`M${x} ${y}l27 10v75l-27 -10Z`} fill={ink} />
            <path d={`M${x+27} ${y+10}l24 -13v75l-24 13Z`} fill={accent} />
          </g>;
        })}
      </g>;
      break;
    case "orbits":
      drawing = <g transform={`rotate(${shift - 17} 90 80)`}>
        <circle cx="90" cy="80" r="56" fill={spot} />
        {sequence(10).map(i => <ellipse key={i} cx="90" cy="80" rx={8 + i*7.5} ry="64" fill="none" stroke={ink} strokeWidth={i % 3 ? 1.3 : 2.8} />)}
        <ellipse cx="90" cy="80" rx="101" ry="23" fill="none" stroke={accent} strokeWidth="7" />
        <circle cx="162" cy="64" r="8" fill={ink} />
      </g>;
      break;
    case "sheets":
      drawing = <g transform={`rotate(${shift - 8} 90 80)`}>
        {sequence(7).map(i => <g key={i} transform={`translate(${21 + i*8} ${45-i*4}) rotate(${i*3-13} 45 52)`}>
          <path d="M0 0h75l18 19v84H0Z" fill={[spot, accent, ink][i%3]} stroke={bg} strokeWidth="1.6" />
          <path d="M75 0v19h18" fill="none" stroke={bg} strokeWidth="1.4" />
          {i === 6 && sequence(6).map(j => <path key={j} d={`M12 ${34 + j*9}h${j===5?35:64}`} stroke={ink} strokeWidth="1.6" />)}
        </g>)}
      </g>;
      break;
    case "signals":
      drawing = <g>
        <circle cx={122 + shift} cy="45" r="37" fill={spot} />
        {sequence(19).map(i => {
          const height = 20 + Math.abs(Math.sin(i / 4.6 + shift / 8) * 49 + Math.sin(i / 3.1) * 39);
          return <path key={i} d={`M${i*10} 157v-${n(height)}`} stroke={i % 4 ? ink : accent} strokeWidth={i%4 ? 4 : 7} />;
        })}
        <path d={`M-8 113Q50 ${38 + shift} 85 75T187 18`} fill="none" stroke={accent} strokeWidth="3" />
      </g>;
  }
  const angle = (seed >>> 6) % 23 - 11;
  const scale = 0.93 + ((seed >>> 24) % 27) / 100;
  return <g transform={mirror}>
    <g transform={`translate(90 80) rotate(${angle}) scale(${scale}) translate(-90 -80)`}>{drawing}</g>
  </g>;
}
