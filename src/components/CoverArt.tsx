import type { ReactNode } from "react";
import { hashString, type BookDesign } from "@/lib/designs";

/** Deterministic PRNG so server and client render identical art. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Ctx {
  a: Area;
  d: BookDesign;
  rng: () => number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function grid({ a, d }: Ctx) {
  const m = a.w / 4;
  const { x, y } = a;
  return (
    <g>
      <rect x={x} y={y + m * 0.9} width={m * 2} height={m * 2} fill={d.accent} />
      <circle cx={x + m * 2.85} cy={y + m * 1.25} r={m * 1.15} fill={d.ink} />
      <path
        d={`M ${x + m * 2} ${y + a.h} a ${m} ${m} 0 0 1 ${m * 2} 0 Z`}
        fill={d.accent}
      />
      <line x1={x} x2={x + a.w} y1={y + m * 3.25} y2={y + m * 3.25} stroke={d.ink} strokeWidth={1} />
      <line x1={x + m * 2} x2={x + m * 2} y1={y} y2={y + a.h} stroke={d.accent} strokeWidth={0.8} />
      <circle cx={x + m * 0.95} cy={y + m * 3.75} r={m * 0.45} fill="none" stroke={d.ink} strokeWidth={1.2} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={i}
          x={x + m * 0.35 + (i % 3) * m * 0.32}
          y={y + m * 0.15 + Math.floor(i / 3) * m * 0.22}
          width={m * 0.12}
          height={m * 0.12}
          fill={d.ink}
        />
      ))}
      <rect x={x + m * 3.35} y={y + m * 2.6} width={m * 0.65} height={m * 0.18} fill={d.ink} />
    </g>
  );
}

function branches({ a, d, rng }: Ctx) {
  const lines: ReactNode[] = [];
  const tips: ReactNode[] = [];
  const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    lines.push(
      <line
        key={lines.length}
        x1={r1(x)}
        y1={r1(y)}
        x2={r1(x2)}
        y2={r1(y2)}
        stroke={d.accent}
        strokeWidth={r1(0.35 + depth * 0.22)}
        strokeLinecap="round"
      />,
    );
    if (depth === 0) {
      if (rng() > 0.55) tips.push(<circle key={tips.length} cx={r1(x2)} cy={r1(y2)} r={1.3} fill={d.accent} />);
      return;
    }
    const spread = 0.36 + rng() * 0.18;
    grow(x2, y2, ang - spread + (rng() - 0.5) * 0.12, len * (0.7 + rng() * 0.08), depth - 1);
    grow(x2, y2, ang + spread + (rng() - 0.5) * 0.12, len * (0.7 + rng() * 0.08), depth - 1);
  };
  grow(a.x + a.w / 2, a.y + a.h, -Math.PI / 2, a.h * 0.27, 8);
  return (
    <g>
      <line x1={a.x + 20} x2={a.x + a.w - 20} y1={a.y + a.h} y2={a.y + a.h} stroke={d.accent} strokeWidth={0.6} opacity={0.6} />
      {lines}
      {tips}
    </g>
  );
}

function slides({ a, d }: Ctx) {
  const w = a.w * 0.72;
  const h = w * 0.5625;
  const layers = 5;
  const ox = a.x + (a.w - w) / 2 - 22;
  const oy = a.y + a.h - h - 18;
  return (
    <g transform={`rotate(-7 ${a.x + a.w / 2} ${a.y + a.h / 2})`}>
      {Array.from({ length: layers }, (_, i) => {
        const k = layers - 1 - i;
        const sx = ox + k * 11;
        const sy = oy - k * 17;
        const front = k === 0;
        return (
          <g key={i}>
            <rect
              x={sx}
              y={sy}
              width={w}
              height={h}
              fill={front ? d.accent : d.bg}
              stroke={d.ink}
              strokeWidth={front ? 0 : 1}
            />
            {front && (
              <g fill={d.bg}>
                <rect x={sx + 12} y={sy + 12} width={w * 0.45} height={6} />
                <rect x={sx + 12} y={sy + 26} width={w * 0.3} height={2.5} opacity={0.8} />
                <rect x={sx + 12} y={sy + 33} width={w * 0.34} height={2.5} opacity={0.8} />
                <rect x={sx + 12} y={sy + 40} width={w * 0.26} height={2.5} opacity={0.8} />
                {[0.35, 0.55, 0.45, 0.8, 0.65].map((v, j) => (
                  <rect key={j} x={sx + w * 0.58 + j * 9} y={sy + h - 12 - v * (h - 30)} width={6} height={v * (h - 30)} />
                ))}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function folds({ a, d }: Ctx) {
  const pw = a.w * 0.42;
  const ph = pw * 1.3;
  const px = a.x + a.w / 2;
  const py = a.y + a.h + 24;
  const angles = [-38, 38, -25, 25, -12, 12, 0];
  return (
    <g>
      {angles.map((deg, i) => {
        const top = deg === 0;
        const x = px - pw / 2;
        const y = py - ph - 30;
        const f = pw * 0.22;
        return (
          <g key={i} transform={`rotate(${deg} ${px} ${py})`}>
            <path
              d={`M ${x} ${y} H ${x + pw - f} L ${x + pw} ${y + f} V ${y + ph} H ${x} Z`}
              fill={top ? d.ink : d.bg}
              stroke={d.accent}
              strokeWidth={top ? 0 : 0.9}
            />
            <path d={`M ${x + pw - f} ${y} V ${y + f} H ${x + pw}`} fill={top ? d.accent : "none"} stroke={d.accent} strokeWidth={0.9} />
            {Array.from({ length: 6 }, (_, j) => (
              <line
                key={j}
                x1={x + 10}
                x2={x + pw - (j === 5 ? pw * 0.45 : 12)}
                y1={y + f + 12 + j * 9}
                y2={y + f + 12 + j * 9}
                stroke={top ? d.bg : d.accent}
                strokeWidth={top ? 1.6 : 0.8}
                opacity={top ? 0.85 : 0.5}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function lines({ a, d, rng }: Ctx) {
  const rows = 13;
  const gap = (a.h - 10) / rows;
  const out: ReactNode[] = [];
  for (let i = 0; i < rows; i++) {
    const y = a.y + 6 + i * gap;
    const paraEnd = i === 4 || i === 9 || i === rows - 1;
    const indent = i === 0 || i === 5 || i === 10 ? 26 : 0;
    const len = paraEnd ? a.w * (0.35 + rng() * 0.3) : a.w - indent;
    out.push(<rect key={`l${i}`} x={a.x + indent} y={y} width={len - indent * 0} height={3.4} rx={1.7} fill={d.ink} opacity={0.88} />);
    if (i === 2 || i === 7) {
      const sx = a.x + a.w * (0.2 + rng() * 0.3);
      const sw = a.w * 0.28;
      out.push(<rect key={`s${i}`} x={sx} y={y - 1.6} width={sw} height={6.6} fill={d.bg} />);
      out.push(<rect key={`d${i}`} x={sx} y={y} width={sw} height={3.4} rx={1.7} fill={d.accent} opacity={0.55} />);
      out.push(<line key={`x${i}`} x1={sx - 2} x2={sx + sw + 2} y1={y + 1.7} y2={y + 1.7} stroke={d.accent} strokeWidth={1.2} />);
    }
    if (i === 3 || i === 11) {
      const sx = a.x + a.w * (0.1 + rng() * 0.4);
      const sw = a.w * 0.24;
      out.push(<rect key={`i${i}`} x={sx} y={y} width={sw} height={3.4} rx={1.7} fill={d.accent} />);
      out.push(<line key={`u${i}`} x1={sx} x2={sx + sw} y1={y + 6.5} y2={y + 6.5} stroke={d.accent} strokeWidth={0.9} />);
    }
  }
  return (
    <g>
      <line x1={a.x - 10} x2={a.x - 10} y1={a.y + gap * 2 - 4} y2={a.y + gap * 4 + 8} stroke={d.accent} strokeWidth={1.4} />
      <line x1={a.x - 10} x2={a.x - 10} y1={a.y + gap * 11 - 4} y2={a.y + gap * 12 + 8} stroke={d.accent} strokeWidth={1.4} />
      {out}
    </g>
  );
}

function targets({ a, d }: Ctx) {
  const x = a.x + 6;
  const y = a.y + 14;
  const w = a.w - 12;
  const h = a.h - 34;
  const btn = { x: x + w * 0.56, y: y + h * 0.72, w: w * 0.32, h: 16 };
  const input = { x: x + w * 0.3, y: y + h * 0.42, w: w * 0.6, h: 14 };
  const t1 = { x: input.x + input.w * 0.2, y: input.y + input.h / 2 };
  const t2 = { x: btn.x + btn.w / 2, y: btn.y + btn.h / 2 };
  const crosshair = (cx: number, cy: number, key: string) => (
    <g key={key} stroke={d.accent} strokeWidth={1.1} fill="none">
      <circle cx={cx} cy={cy} r={11} />
      <circle cx={cx} cy={cy} r={2} fill={d.accent} />
      <line x1={cx - 17} x2={cx - 6} y1={cy} y2={cy} />
      <line x1={cx + 6} x2={cx + 17} y1={cy} y2={cy} />
      <line x1={cx} x2={cx} y1={cy - 17} y2={cy - 6} />
      <line x1={cx} x2={cx} y1={cy + 6} y2={cy + 17} />
    </g>
  );
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke={d.ink} strokeWidth={1.2} />
      <line x1={x} x2={x + w} y1={y + 16} y2={y + 16} stroke={d.ink} strokeWidth={1} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 10 + i * 9} cy={y + 8} r={2.4} fill={d.ink} opacity={0.8} />
      ))}
      <rect x={x + 44} y={y + 5} width={w - 56} height={6} rx={3} fill={d.ink} opacity={0.25} />
      <rect x={x + 8} y={y + 26} width={w * 0.2} height={h - 36} fill={d.ink} opacity={0.14} />
      <rect x={input.x} y={y + 28} width={w * 0.45} height={7} fill={d.ink} opacity={0.75} />
      <rect x={input.x} y={y + 42} width={w * 0.55} height={3} fill={d.ink} opacity={0.4} />
      <rect x={input.x} y={input.y} width={input.w} height={input.h} rx={2} fill="none" stroke={d.ink} strokeWidth={1} />
      <rect x={btn.x} y={btn.y} width={btn.w} height={btn.h} rx={2} fill={d.ink} />
      <path
        d={`M ${t1.x} ${t1.y} C ${t1.x - 30} ${t1.y + 50}, ${t2.x - 60} ${t2.y + 10}, ${t2.x} ${t2.y}`}
        fill="none"
        stroke={d.accent}
        strokeWidth={1.2}
        strokeDasharray="2 4"
        strokeLinecap="round"
      />
      {crosshair(t1.x, t1.y, "a")}
      {crosshair(t2.x, t2.y, "b")}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${x + 14} ${y + h * 0.55 + i * 16} l 3.5 3.5 l 6.5 -7`}
          fill="none"
          stroke={d.accent}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

function cells({ a, d }: Ctx) {
  const cols = 6;
  const rows = 8;
  const cw = a.w / cols;
  const top = a.y + 22;
  const ch = (a.h - 22) / rows;
  const heights = [2, 3, 3, 5, 6, 8];
  return (
    <g>
      <text x={a.x} y={a.y + 9} fontFamily="var(--font-mono)" fontSize={8.5} fill={d.ink} opacity={0.9}>
        fx =SUM(B2:B9)
      </text>
      {heights.map((hgt, c) =>
        Array.from({ length: hgt }, (_, r) => (
          <rect
            key={`${c}-${r}`}
            x={a.x + c * cw + 1}
            y={top + (rows - 1 - r) * ch + 1}
            width={cw - 2}
            height={ch - 2}
            fill={d.accent}
            opacity={r === hgt - 1 ? 1 : 0.55 + r * 0.05}
          />
        )),
      )}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line key={`v${i}`} x1={a.x + i * cw} x2={a.x + i * cw} y1={top} y2={top + rows * ch} stroke={d.ink} strokeWidth={0.6} opacity={0.45} />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line key={`h${i}`} x1={a.x} x2={a.x + a.w} y1={top + i * ch} y2={top + i * ch} stroke={d.ink} strokeWidth={0.6} opacity={0.45} />
      ))}
      <rect x={a.x + cw * 4} y={top + ch * 1} width={cw} height={ch} fill="none" stroke={d.ink} strokeWidth={1.6} />
    </g>
  );
}

function network({ a, d, rng }: Ctx) {
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2;
  const inner = Array.from({ length: 7 }, (_, i) => {
    const t = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return { x: r1(cx + Math.cos(t) * 62), y: r1(cy + Math.sin(t) * 62) };
  });
  const outer = Array.from({ length: 14 }, (_, i) => {
    const t = (i / 14) * Math.PI * 2 - Math.PI / 2 + 0.2;
    const rad = 92 + rng() * 6;
    return { x: r1(cx + Math.cos(t) * rad), y: r1(cy + Math.sin(t) * rad) };
  });
  return (
    <g>
      {[62, 94].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={d.ink} strokeWidth={0.5} opacity={0.25} />
      ))}
      {outer.map((o, i) => {
        const n = inner[Math.floor(i / 2) % inner.length];
        return <line key={`o${i}`} x1={n.x} y1={n.y} x2={o.x} y2={o.y} stroke={d.ink} strokeWidth={0.6} strokeDasharray="2 2.5" opacity={0.7} />;
      })}
      {inner.map((n, i) => (
        <line key={`s${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={i % 3 === 0 ? d.accent : d.ink} strokeWidth={1} />
      ))}
      {outer.map((o, i) => (
        <circle key={`d${i}`} cx={o.x} cy={o.y} r={2.2} fill={d.ink} />
      ))}
      {inner.map((n, i) => (
        <rect key={`n${i}`} x={n.x - 6} y={n.y - 6} width={12} height={12} fill={i % 3 === 0 ? d.accent : d.bg} stroke={d.ink} strokeWidth={1.1} />
      ))}
      <circle cx={cx} cy={cy} r={19} fill={d.accent} />
      <circle cx={cx} cy={cy} r={26} fill="none" stroke={d.accent} strokeWidth={0.8} />
    </g>
  );
}

/** Marbled-paper flow field; fills the whole area. */
function marble({ a, d }: Ctx) {
  const palette = d.extra ?? [d.accent, d.ink, d.bg];
  const count = Math.max(24, Math.round(a.w / 3.4));
  const paths: ReactNode[] = [];
  for (let i = -6; i < count + 6; i++) {
    let x = a.x + (i / count) * a.w;
    const seed = i * 0.37;
    let p = `M ${r1(x)} ${a.y - 10}`;
    for (let y = a.y - 10; y <= a.y + a.h + 10; y += 6) {
      const ny = y / 360;
      x += Math.sin(ny * 9 + seed * 0.9) * 2.1 + Math.cos(x * 0.035 + ny * 5) * 1.6 + Math.sin(ny * 21 + x * 0.02) * 0.9;
      p += ` L ${r1(x)} ${y}`;
    }
    const color = palette[((Math.floor((i + 6) / 3) % palette.length) + palette.length) % palette.length];
    paths.push(<path key={i} d={p} fill="none" stroke={color} strokeWidth={4.2} strokeLinejoin="round" />);
  }
  return <g>{paths}</g>;
}

function swatches({ a, d }: Ctx) {
  const palette = d.extra ?? [d.accent];
  const names = ["#d97757", "#6a9bcc", "#788c5d", "#b0aea5", "#141413"];
  const bh = 24;
  const top = a.y + a.h - palette.length * (bh + 4);
  return (
    <g>
      <text x={a.x} y={top - 22} fontFamily="var(--font-serif)" fontSize={72} fill={d.ink} letterSpacing={-2}>
        Aa
      </text>
      <text x={a.x + a.w} y={top - 30} textAnchor="end" fontFamily="var(--font-mono)" fontSize={7.5} fill={d.ink} opacity={0.7}>
        POPPINS / LORA
      </text>
      {palette.map((c, i) => (
        <g key={c}>
          <rect x={a.x + i * 14} y={top + i * (bh + 4)} width={a.w - i * 14} height={bh} fill={c} />
          <text
            x={a.x + a.w - 6}
            y={top + i * (bh + 4) + bh - 8}
            textAnchor="end"
            fontFamily="var(--font-mono)"
            fontSize={7.5}
            fill={i >= 3 ? (i === 4 ? d.bg : d.ink) : d.bg}
          >
            {names[i] ?? c}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Short flow-field strokes, like a p5.js sketch mid-run. */
function particles({ a, d, rng }: Ctx) {
  const palette = d.extra ?? [d.accent, d.ink];
  const field = (x: number, y: number) => Math.sin(x * 0.021 + 1.3) * 1.6 + Math.cos(y * 0.018 - x * 0.006) * 1.4;
  const strokes: ReactNode[] = [];
  for (let i = 0; i < 230; i++) {
    let x = a.x - 10 + rng() * (a.w + 20);
    let y = a.y + rng() * a.h;
    let p = `M ${r1(x)} ${r1(y)}`;
    const steps = 10 + Math.floor(rng() * 26);
    for (let k = 0; k < steps; k++) {
      const t = field(x, y);
      x += Math.cos(t) * 2.6;
      y += Math.sin(t) * 2.6;
      if (y < a.y - 4 || y > a.y + a.h + 4) break;
      p += ` L ${r1(x)} ${r1(y)}`;
    }
    strokes.push(
      <path
        key={i}
        d={p}
        fill="none"
        stroke={palette[Math.floor(rng() * palette.length)]}
        strokeWidth={r1(0.5 + rng() * 1.2)}
        strokeLinecap="round"
        opacity={r1(0.55 + rng() * 0.45)}
      />,
    );
  }
  return <g>{strokes}</g>;
}

/** An editor window with a few real lines of SDK code. */
function code({ a, d }: Ctx) {
  const lh = 12.5;
  const tokens: [string, "k" | "s" | "p" | "c"][][] = [
    [["import", "k"], [" anthropic", "p"]],
    [],
    [["client", "p"], [" = anthropic.", "p"], ["Anthropic", "k"], ["()", "p"]],
    [["msg", "p"], [" = client.messages.", "p"], ["create", "k"], ["(", "p"]],
    [["    model", "p"], ["=MODEL,", "p"]],
    [["    max_tokens", "p"], ["=", "p"], ["1024", "s"], [",", "p"]],
    [["    tools", "p"], ["=[search],", "p"]],
    [["    messages", "p"], ["=[{", "p"], ['"role"', "s"], [": ", "p"], ['"user"', "s"], [",", "p"]],
    [["               ", "p"], ['"content"', "s"], [": ", "p"], ['"Hello"', "s"], ["}],", "p"]],
    [[")", "p"]],
    [["# stream, cache, and count tokens", "c"]],
  ];
  const color = { k: d.accent, s: "#B9E3C6", p: d.ink, c: d.ink };
  const top = a.y + 8;
  return (
    <g>
      <rect x={a.x - 4} y={a.y - 8} width={a.w + 8} height={tokens.length * lh + 34} rx={5} fill="#000" opacity={0.22} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={a.x + 6 + i * 8} cy={a.y + 1} r={2.2} fill={d.ink} opacity={0.5} />
      ))}
      {tokens.map((line, i) => (
        <g key={i}>
          <text x={a.x + 4} y={top + 16 + i * lh} fontFamily="var(--font-mono)" fontSize={6.5} fill={d.ink} opacity={0.35}>
            {String(i + 1).padStart(2, " ")}
          </text>
          <text x={a.x + 18} y={top + 16 + i * lh} fontFamily="var(--font-mono)" fontSize={7.4} xmlSpace="preserve">
            {line.map(([t, kind], j) => (
              <tspan key={j} fill={color[kind]} opacity={kind === "c" ? 0.5 : 1}>
                {t}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      <rect x={a.x + 18} y={top + 16 + tokens.length * lh - 7} width={4.5} height={9} fill={d.accent} />
    </g>
  );
}

/** A sprite sheet: one bounce, nine frames. */
function frames({ a, d }: Ctx) {
  const gap = 9;
  const size = Math.min((a.w - gap * 2) / 3, (a.h - gap * 2) / 3);
  const ox = a.x + (a.w - (size * 3 + gap * 2)) / 2;
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const fx = ox + (i % 3) * (size + gap);
        const fy = a.y + Math.floor(i / 3) * (size + gap);
        const t = i / 8;
        const h = Math.abs(Math.cos(t * Math.PI * 2)) * 0.62;
        const squash = h < 0.08 ? 1.35 : 1;
        const by = fy + size - 12 - h * (size - 26);
        const bx = fx + size * (0.22 + t * 0.56);
        return (
          <g key={i}>
            <rect x={r1(fx)} y={r1(fy)} width={r1(size)} height={r1(size)} rx={4} fill="none" stroke={d.ink} strokeWidth={1.1} />
            <line x1={r1(fx + 6)} x2={r1(fx + size - 6)} y1={r1(fy + size - 6)} y2={r1(fy + size - 6)} stroke={d.ink} strokeWidth={0.7} opacity={0.5} />
            <ellipse cx={r1(bx)} cy={r1(fy + size - 6)} rx={r1(5 + (1 - h) * 3)} ry={1.6} fill={d.ink} opacity={0.25} />
            <ellipse cx={r1(bx)} cy={r1(by)} rx={r1(6 * squash)} ry={r1(6 / squash)} fill={d.accent} />
            <text x={r1(fx + 4)} y={r1(fy + 9)} fontFamily="var(--font-mono)" fontSize={6} fill={d.ink} opacity={0.7}>
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The theme presets as rows of colour chips. */
function chips({ a, d }: Ctx) {
  const rows = d.named ?? [{ name: "Theme", colors: [d.accent, d.ink, d.bg, d.ink] }];
  const gap = 3.5;
  const rh = (a.h - gap * (rows.length - 1)) / rows.length;
  const labelW = 74;
  const cw = (a.w - labelW - gap * 3) / 4;
  return (
    <g>
      {rows.map((row, i) => {
        const y = a.y + i * (rh + gap);
        return (
          <g key={row.name}>
            <text x={a.x} y={r1(y + rh / 2 + 2.4)} fontFamily="var(--font-mono)" fontSize={6.4} fill={d.ink} opacity={0.85}>
              {row.name.toUpperCase()}
            </text>
            {row.colors.map((c, j) => (
              <rect key={j} x={r1(a.x + labelW + j * (cw + gap))} y={r1(y)} width={r1(cw)} height={r1(rh)} rx={1.5} fill={c} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/** Isometric building blocks — components stacked into an app. */
function blocks({ a, d }: Ctx) {
  const s = a.w / 6.2;
  const iso = (gx: number, gy: number, gz: number) => ({
    x: a.x + a.w / 2 + (gx - gy) * s * 0.866,
    y: a.y + a.h * 0.42 + (gx + gy) * s * 0.5 - gz * s,
  });
  const cube = (gx: number, gy: number, gz: number, hot: boolean, key: string) => {
    const p = iso(gx, gy, gz);
    const h = s;
    const w = s * 0.866;
    const top = `M ${r1(p.x)} ${r1(p.y - h / 2)} l ${r1(w)} ${r1(h / 2)} l ${r1(-w)} ${r1(h / 2)} l ${r1(-w)} ${r1(-h / 2)} Z`;
    const left = `M ${r1(p.x - w)} ${r1(p.y)} l ${r1(w)} ${r1(h / 2)} l 0 ${r1(h)} l ${r1(-w)} ${r1(-h / 2)} Z`;
    const right = `M ${r1(p.x + w)} ${r1(p.y)} l ${r1(-w)} ${r1(h / 2)} l 0 ${r1(h)} l ${r1(w)} ${r1(-h / 2)} Z`;
    return (
      <g key={key}>
        <path d={left} fill={d.ink} opacity={0.5} />
        <path d={right} fill={d.ink} opacity={0.28} />
        <path d={top} fill={hot ? d.accent : d.ink} opacity={hot ? 1 : 0.92} />
      </g>
    );
  };
  const layout: [number, number, number, boolean][] = [
    [0, 2, 0, false], [1, 2, 0, false], [2, 2, 0, false],
    [0, 1, 0, false], [2, 1, 0, true],
    [0, 0, 0, false], [1, 0, 0, false], [2, 0, 0, false],
    [0, 1, 1, false], [1, 1, 1, true], [0, 0, 1, false],
    [0, 0, 2, true],
  ];
  const ordered = [...layout].sort((p, q) => p[2] - q[2] || p[0] + p[1] - (q[0] + q[1]));
  return <g>{ordered.map(([x, y, z, hot], i) => cube(x, y, z, hot, `c${i}`))}</g>;
}

/** Overlapping speech bubbles, one of them an announcement. */
function bubbles({ a, d }: Ctx) {
  const bubble = (x: number, y: number, w: number, h: number, fill: string, text: string, lines: number, tail: "l" | "r", key: string) => (
    <g key={key}>
      <path
        d={`M ${x + 8} ${y} h ${w - 16} q 8 0 8 8 v ${h - 16} q 0 8 -8 8 h ${tail === "r" ? -(w * 0.18) : -(w - 16 - w * 0.3)} l ${tail === "r" ? 4 : -2} 12 l -14 -12 h ${tail === "r" ? -(w - 16 - w * 0.18 - 10) : -(w * 0.3 - 12)} q -8 0 -8 -8 v ${-(h - 16)} q 0 -8 8 -8 Z`}
        fill={fill}
        stroke={fill === "none" ? d.ink : "none"}
        strokeWidth={1.2}
      />
      {Array.from({ length: lines }, (_, i) => (
        <rect key={i} x={x + 12} y={y + 12 + i * 9} width={(w - 24) * (i === lines - 1 ? 0.55 : 1)} height={3.2} rx={1.6} fill={text} opacity={0.85} />
      ))}
    </g>
  );
  return (
    <g>
      {bubble(a.x, a.y + 6, a.w * 0.72, 64, d.ink, d.bg, 4, "l", "a")}
      {bubble(a.x + a.w * 0.3, a.y + 84, a.w * 0.7, 50, d.accent, d.bg, 3, "r", "b")}
      {bubble(a.x + a.w * 0.06, a.y + 150, a.w * 0.55, 40, "none", d.ink, 2, "l", "c")}
      <text x={a.x + a.w - 8} y={a.y + 52} textAnchor="end" fontFamily="var(--font-serif)" fontSize={44} fill={d.accent}>
        !
      </text>
    </g>
  );
}

/** Three versions of the same page, the latest marked up. */
function drafts({ a, d }: Ctx) {
  const pw = a.w * 0.62;
  const ph = a.h * 0.78;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const x = a.x + i * (a.w - pw) / 2;
        const y = a.y + (2 - i) * 0 + i * (a.h - ph) / 2;
        const latest = i === 2;
        return (
          <g key={i} opacity={latest ? 1 : 0.45 + i * 0.2}>
            <rect x={r1(x)} y={r1(y)} width={r1(pw)} height={r1(ph)} fill={latest ? d.ink : d.bg} stroke={d.ink} strokeWidth={1} />
            <rect x={r1(x + 8)} y={r1(y - 8)} width={18} height={9} fill={latest ? d.accent : d.ink} />
            <text x={r1(x + 10.5)} y={r1(y - 1.5)} fontFamily="var(--font-mono)" fontSize={6.5} fill={d.bg}>
              v{i + 1}
            </text>
            {Array.from({ length: 11 }, (_, j) => {
              const ly = y + 14 + j * 10.5;
              const lw = (pw - 20) * (j % 4 === 3 ? 0.5 : 1);
              const insert = latest && (j === 2 || j === 7);
              return (
                <g key={j}>
                  <rect x={r1(x + 10)} y={r1(ly)} width={r1(lw)} height={3} rx={1.5} fill={latest ? (insert ? d.accent : d.bg) : d.ink} opacity={latest ? 0.9 : 0.6} />
                  {insert && <line x1={r1(x + 10)} x2={r1(x + 10 + lw)} y1={r1(ly + 6)} y2={r1(ly + 6)} stroke={d.accent} strokeWidth={0.9} />}
                </g>
              );
            })}
            {latest && (
              <g>
                <circle cx={r1(x + pw + 2)} cy={r1(y + 36)} r={7} fill={d.accent} />
                <line x1={r1(x + pw - 6)} x2={r1(x + pw - 2)} y1={r1(y + 36)} y2={r1(y + 36)} stroke={d.accent} strokeWidth={1} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Ascending steps with a dotted route to a flag. */
function steps({ a, d }: Ctx) {
  const n = 6;
  const sw = a.w / n;
  const sh = (a.h - 64) / n;
  const base = a.y + a.h;
  const pts = Array.from({ length: n }, (_, i) => ({ x: a.x + sw * (i + 0.5), y: base - sh * (i + 1) - 10 }));
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={r1(a.x + i * sw)} y={r1(base - sh * (i + 1))} width={r1(sw - 2)} height={r1(sh * (i + 1))} fill={d.ink} opacity={0.18 + i * 0.12} />
      ))}
      <path
        d={pts.map((p, i) => `${i ? "L" : "M"} ${r1(p.x)} ${r1(p.y)}`).join(" ")}
        fill="none"
        stroke={d.accent}
        strokeWidth={1.4}
        strokeDasharray="2 4"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={r1(p.x)} cy={r1(p.y)} r={i === n - 1 ? 0 : 3.2} fill={d.accent} />
      ))}
      <line x1={r1(pts[n - 1].x)} x2={r1(pts[n - 1].x)} y1={r1(pts[n - 1].y)} y2={r1(pts[n - 1].y - 34)} stroke={d.ink} strokeWidth={1.4} />
      <path d={`M ${r1(pts[n - 1].x)} ${r1(pts[n - 1].y - 34)} l 20 6 l -20 6 Z`} fill={d.accent} />
    </g>
  );
}

/** A magnifier over a page, finding the question in it. */
function lens({ a, d }: Ctx) {
  const light = d.extra?.[0] ?? "#fff";
  const cx = a.x + a.w * 0.58;
  const cy = a.y + a.h * 0.42;
  const r = a.w * 0.26;
  const rows = 12;
  const gap = (a.h - 6) / rows;
  return (
    <g>
      {Array.from({ length: rows }, (_, i) => (
        <rect key={i} x={a.x} y={r1(a.y + i * gap)} width={a.w * (i % 5 === 4 ? 0.5 : 1)} height={3.2} rx={1.6} fill={d.ink} opacity={0.32} />
      ))}
      <circle cx={r1(cx)} cy={r1(cy)} r={r1(r)} fill={light} />
      {[-2, -1, 0, 1, 2].map((k) => (
        <rect key={k} x={r1(cx - r * 0.72)} y={r1(cy + k * 12 - 2.6)} width={r1(r * (k === 1 ? 0.8 : 1.44))} height={5.2} rx={2.6} fill={d.ink} opacity={k === 1 ? 1 : 0.6} />
      ))}
      <circle cx={r1(cx)} cy={r1(cy)} r={r1(r)} fill="none" stroke={d.ink} strokeWidth={3.2} />
      <line x1={r1(cx + r * 0.72)} y1={r1(cy + r * 0.72)} x2={r1(cx + r * 1.35)} y2={r1(cy + r * 1.35)} stroke={d.ink} strokeWidth={7} strokeLinecap="round" />
      <text x={r1(cx + r * 0.95)} y={r1(cy - r * 0.6)} fontFamily="var(--font-serif)" fontSize={44} fill={d.ink}>
        ?
      </text>
      <text x={a.x + 4} y={a.y + a.h - 10} fontFamily="var(--font-serif)" fontSize={24} fill={d.ink} opacity={0.55}>
        ?
      </text>
    </g>
  );
}

/** A series emblem: a sunburst whose rays and rings change with the volume, around its numeral. */
function series({ a, d }: Ctx) {
  const vol = d.volume ?? 1;
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2 + 4;
  const R = Math.min(a.w, a.h) / 2 - 2;
  const rays = 10 + vol * 2;
  const rings = 1 + (vol % 3);
  const turn = vol * 9;
  return (
    <g>
      <g transform={`rotate(${turn} ${r1(cx)} ${r1(cy)})`}>
        {Array.from({ length: rays }, (_, i) => {
          const t = (i / rays) * Math.PI * 2;
          const inner = R * 0.5;
          const outer = R * (i % 2 ? 0.86 : 1);
          return (
            <line
              key={i}
              x1={r1(cx + Math.cos(t) * inner)}
              y1={r1(cy + Math.sin(t) * inner)}
              x2={r1(cx + Math.cos(t) * outer)}
              y2={r1(cy + Math.sin(t) * outer)}
              stroke={d.ink}
              strokeWidth={i % 2 ? 0.7 : 1.3}
              opacity={i % 2 ? 0.45 : 0.8}
            />
          );
        })}
      </g>
      {Array.from({ length: rings }, (_, i) => (
        <circle key={i} cx={r1(cx)} cy={r1(cy)} r={r1(R * (0.44 - i * 0.05))} fill="none" stroke={d.accent} strokeWidth={i ? 0.7 : 1.6} />
      ))}
      <circle cx={r1(cx)} cy={r1(cy)} r={r1(R * 0.3)} fill={d.accent} />
      <text
        x={r1(cx)}
        y={r1(cy + R * 0.12)}
        textAnchor="middle"
        fontFamily="var(--font-serif)"
        fontSize={r1(R * 0.36)}
        fill={d.bg}
      >
        {vol}
      </text>
    </g>
  );
}

/* ---- Marketing Skills: one sub-motif per topic, varied per book by its seed. ---- */

function funnel({ a, d, rng }: Ctx) {
  const tiers = 4 + Math.floor(rng() * 2);
  const cx = a.x + a.w / 2;
  const top = a.y + 26;
  const th = (a.h - 46) / tiers;
  const width = (t: number) => a.w * (0.94 - 0.66 * t);
  return (
    <g>
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={`d${i}`} cx={r1(cx + (rng() - 0.5) * a.w * 0.8)} cy={r1(a.y + 4 + rng() * 16)} r={1.8} fill={d.ink} opacity={0.7} />
      ))}
      {Array.from({ length: tiers }, (_, i) => {
        const y0 = top + i * th;
        const w0 = width(i / tiers);
        const w1 = width((i + 1) / tiers);
        const last = i === tiers - 1;
        return (
          <path
            key={i}
            d={`M ${r1(cx - w0 / 2)} ${r1(y0)} H ${r1(cx + w0 / 2)} L ${r1(cx + w1 / 2)} ${r1(y0 + th - 4)} H ${r1(cx - w1 / 2)} Z`}
            fill={last ? d.accent : d.ink}
            opacity={last ? 1 : 0.16 + i * 0.14}
          />
        );
      })}
      <circle cx={r1(cx)} cy={r1(top + tiers * th + 8)} r={3} fill={d.accent} />
    </g>
  );
}

function quote({ a, d, rng }: Ctx) {
  const rows = 7;
  return (
    <g>
      <text x={a.x - 4} y={a.y + 86} fontFamily="var(--font-serif)" fontSize={128} fill={d.accent}>
        “
      </text>
      {Array.from({ length: rows }, (_, i) => {
        const y = a.y + 96 + i * 13;
        const w = a.w * (i === rows - 1 ? 0.45 : 0.78 + rng() * 0.22);
        const hot = i === 2;
        return (
          <g key={i}>
            <rect x={a.x} y={r1(y)} width={r1(w)} height={4} rx={2} fill={d.ink} opacity={0.85} />
            {hot && <line x1={a.x} x2={r1(a.x + w * 0.6)} y1={r1(y + 8)} y2={r1(y + 8)} stroke={d.accent} strokeWidth={1.4} />}
          </g>
        );
      })}
    </g>
  );
}

function search({ a, d, rng }: Ctx) {
  const rows = 4;
  return (
    <g>
      <rect x={a.x} y={a.y + 6} width={a.w} height={26} rx={13} fill="none" stroke={d.ink} strokeWidth={1.4} />
      <rect x={a.x + 14} y={a.y + 17} width={a.w * 0.48} height={4} rx={2} fill={d.ink} opacity={0.75} />
      <circle cx={a.x + a.w - 22} cy={a.y + 18} r={6} fill="none" stroke={d.accent} strokeWidth={2} />
      <line x1={a.x + a.w - 17.5} y1={a.y + 23} x2={a.x + a.w - 12} y2={a.y + 28} stroke={d.accent} strokeWidth={2.4} strokeLinecap="round" />
      {Array.from({ length: rows }, (_, i) => {
        const y = a.y + 50 + i * 36;
        const first = i === 0;
        return (
          <g key={i} opacity={first ? 1 : 0.85 - i * 0.12}>
            {first && <rect x={a.x - 8} y={y - 3} width={2.5} height={30} fill={d.accent} />}
            <text x={a.x} y={y + 6} fontFamily="var(--font-mono)" fontSize={7} fill={d.ink} opacity={0.7}>
              {i + 1}.
            </text>
            <rect x={a.x + 14} y={y} width={r1(a.w * (0.55 + rng() * 0.3))} height={5} rx={2.5} fill={first ? d.accent : d.ink} />
            <rect x={a.x + 14} y={y + 10} width={r1(a.w * 0.3)} height={2.6} rx={1.3} fill={d.ink} opacity={0.5} />
            <rect x={a.x + 14} y={y + 17} width={r1(a.w * (0.6 + rng() * 0.25))} height={2.6} rx={1.3} fill={d.ink} opacity={0.35} />
          </g>
        );
      })}
    </g>
  );
}

function broadcast({ a, d, rng }: Ctx) {
  const ox = a.x + 14;
  const oy = a.y + a.h / 2;
  const spread = (0.85 + rng() * 0.25) * (Math.PI / 3);
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const r = 26 + i * 22;
        const x1 = ox + Math.cos(-spread) * r;
        const y1 = oy + Math.sin(-spread) * r;
        const x2 = ox + Math.cos(spread) * r;
        const y2 = oy + Math.sin(spread) * r;
        return (
          <path
            key={i}
            d={`M ${r1(x1)} ${r1(y1)} A ${r} ${r} 0 0 1 ${r1(x2)} ${r1(y2)}`}
            fill="none"
            stroke={i % 3 === 1 ? d.accent : d.ink}
            strokeWidth={i % 3 === 1 ? 3 : 1.4}
            strokeLinecap="round"
            opacity={1 - i * 0.08}
          />
        );
      })}
      <circle cx={ox} cy={oy} r={10} fill={d.accent} />
      <circle cx={ox} cy={oy} r={16} fill="none" stroke={d.ink} strokeWidth={1} />
    </g>
  );
}

function abtest({ a, d, rng }: Ctx) {
  const pw = (a.w - 14) / 2;
  const panel = (x: number, label: string, winner: boolean) => {
    const bars = Array.from({ length: 5 }, (_, i) => 0.25 + rng() * 0.5 + (winner && i === 4 ? 0.25 : 0));
    const base = a.y + a.h - 8;
    const bw = (pw - 24) / 5;
    return (
      <g key={label}>
        <rect x={x} y={a.y + 4} width={pw} height={a.h - 4} fill="none" stroke={d.ink} strokeWidth={1.1} opacity={0.6} />
        <text x={x + 10} y={a.y + 36} fontFamily="var(--font-serif)" fontSize={30} fill={winner ? d.accent : d.ink}>
          {label}
        </text>
        <line x1={x + 10} x2={x + pw - 10} y1={base} y2={base} stroke={d.ink} strokeWidth={0.8} opacity={0.6} />
        {bars.map((v, i) => {
          const h = Math.min(1, v) * (a.h - 70);
          return (
            <rect
              key={i}
              x={r1(x + 12 + i * bw)}
              y={r1(base - h)}
              width={r1(bw - 4)}
              height={r1(h)}
              fill={winner && i === 4 ? d.accent : d.ink}
              opacity={winner && i === 4 ? 1 : 0.55}
            />
          );
        })}
      </g>
    );
  };
  return (
    <g>
      {panel(a.x, "A", false)}
      {panel(a.x + pw + 14, "B", true)}
    </g>
  );
}

function loop({ a, d, rng }: Ctx) {
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2;
  const r = Math.min(a.w, a.h) * 0.36;
  const start = rng() * Math.PI * 2;
  const pt = (t: number, rr = r) => ({ x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr });
  const arc = (t0: number, t1: number, color: string, key: string) => {
    const p0 = pt(t0);
    const p1 = pt(t1);
    const tip = pt(t1 + 0.12);
    const l = pt(t1 - 0.02, r - 8);
    const o = pt(t1 - 0.02, r + 8);
    return (
      <g key={key}>
        <path d={`M ${r1(p0.x)} ${r1(p0.y)} A ${r1(r)} ${r1(r)} 0 0 1 ${r1(p1.x)} ${r1(p1.y)}`} fill="none" stroke={color} strokeWidth={5} />
        <path d={`M ${r1(l.x)} ${r1(l.y)} L ${r1(tip.x)} ${r1(tip.y)} L ${r1(o.x)} ${r1(o.y)} Z`} fill={color} />
      </g>
    );
  };
  return (
    <g>
      <circle cx={r1(cx)} cy={r1(cy)} r={r1(r * 0.6)} fill="none" stroke={d.ink} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
      {arc(start, start + Math.PI - 0.35, d.ink, "a")}
      {arc(start + Math.PI, start + Math.PI * 2 - 0.35, d.accent, "b")}
      {[0.5, 1.6, 2.7, 3.8, 4.9].map((t, i) => {
        const p = pt(start + t, r * 0.6);
        return <circle key={i} cx={r1(p.x)} cy={r1(p.y)} r={3.2} fill={d.ink} />;
      })}
    </g>
  );
}

function curve({ a, d, rng }: Ctx) {
  const k = 2.2 + rng() * 1.6;
  const pts = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const v = (Math.exp(k * t) - 1) / (Math.exp(k) - 1);
    return { x: a.x + t * a.w, y: a.y + a.h - 8 - v * (a.h - 20) };
  });
  return (
    <g>
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`h${i}`} x1={a.x} x2={a.x + a.w} y1={r1(a.y + 6 + i * ((a.h - 14) / 5))} y2={r1(a.y + 6 + i * ((a.h - 14) / 5))} stroke={d.ink} strokeWidth={0.5} opacity={0.3} />
      ))}
      <path
        d={`M ${pts.map((p) => `${r1(p.x)} ${r1(p.y)}`).join(" L ")} L ${a.x + a.w} ${a.y + a.h - 8} L ${a.x} ${a.y + a.h - 8} Z`}
        fill={d.ink}
        opacity={0.12}
      />
      <path d={`M ${pts.map((p) => `${r1(p.x)} ${r1(p.y)}`).join(" L ")}`} fill="none" stroke={d.ink} strokeWidth={2} />
      {pts.map((p, i) => (
        <circle key={i} cx={r1(p.x)} cy={r1(p.y)} r={i === pts.length - 1 ? 6 : 2.6} fill={i === pts.length - 1 ? d.accent : d.ink} />
      ))}
    </g>
  );
}

function matrix({ a, d, rng }: Ctx) {
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2;
  const dots = Array.from({ length: 16 }, () => ({ x: a.x + 10 + rng() * (a.w - 20), y: a.y + 10 + rng() * (a.h - 20) }));
  return (
    <g>
      <rect x={r1(cx)} y={a.y} width={r1(a.w / 2)} height={r1(a.h / 2)} fill={d.accent} opacity={0.22} />
      <rect x={a.x} y={a.y} width={a.w} height={a.h} fill="none" stroke={d.ink} strokeWidth={1} opacity={0.5} />
      <line x1={r1(cx)} x2={r1(cx)} y1={a.y} y2={a.y + a.h} stroke={d.ink} strokeWidth={1.4} />
      <line x1={a.x} x2={a.x + a.w} y1={r1(cy)} y2={r1(cy)} stroke={d.ink} strokeWidth={1.4} />
      {dots.map((p, i) => (
        <circle key={i} cx={r1(p.x)} cy={r1(p.y)} r={2.4} fill={d.ink} opacity={0.75} />
      ))}
      <circle cx={r1(cx + a.w * 0.3)} cy={r1(cy - a.h * 0.28)} r={7} fill={d.accent} />
      <circle cx={r1(cx + a.w * 0.3)} cy={r1(cy - a.h * 0.28)} r={12} fill="none" stroke={d.accent} strokeWidth={1} />
    </g>
  );
}

function pipeline({ a, d, rng }: Ctx) {
  const stages = 4;
  const sw = a.w / stages;
  const h = a.h * 0.42;
  const y = a.y + (a.h - h) / 2;
  const counts = [14, 9, 5, 2 + Math.floor(rng() * 2)];
  return (
    <g>
      {Array.from({ length: stages }, (_, i) => {
        const x = a.x + i * sw;
        const last = i === stages - 1;
        return (
          <g key={i}>
            <path
              d={`M ${r1(x)} ${r1(y)} H ${r1(x + sw - 10)} L ${r1(x + sw + 4)} ${r1(y + h / 2)} L ${r1(x + sw - 10)} ${r1(y + h)} H ${r1(x)} L ${r1(x + 14)} ${r1(y + h / 2)} Z`}
              fill={last ? d.accent : d.ink}
              opacity={last ? 1 : 0.2 + i * 0.16}
            />
            {Array.from({ length: counts[i] }, (_, j) => (
              <circle
                key={j}
                cx={r1(x + 18 + (j % 3) * 8)}
                cy={r1(y - 14 - Math.floor(j / 3) * 8)}
                r={2.3}
                fill={last ? d.accent : d.ink}
                opacity={0.85}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

const marketingVariants: Record<string, (ctx: Ctx) => ReactNode> = { funnel, quote, search, broadcast, abtest, loop, curve, matrix, pipeline };

function marketing(ctx: Ctx) {
  return <>{(marketingVariants[ctx.d.variant ?? "funnel"] ?? funnel)(ctx)}</>;
}

const motifs = {
  marketing,
  series,
  grid,
  branches,
  slides,
  folds,
  lines,
  targets,
  cells,
  network,
  marble,
  swatches,
  particles,
  code,
  frames,
  chips,
  blocks,
  bubbles,
  drafts,
  steps,
  lens,
};

export function CoverArt({ slug, design, width = 240, height = 360 }: { slug: string; design: BookDesign; width?: number; height?: number }) {
  const rng = mulberry32(hashString(slug));
  const full = design.motif === "marble";
  const pad = 22;
  const area: Area = full
    ? { x: 0, y: 0, w: width, h: height }
    : design.titleAt === "top"
      ? { x: pad, y: height * 0.4, w: width - pad * 2, h: height * 0.6 - pad - 8 }
      : // Leave room for a kicker line (series or topic) across the top.
        { x: pad, y: pad + 6 + (design.kicker || design.series ? 14 : 0), w: width - pad * 2, h: height * 0.6 - pad - (design.kicker || design.series ? 14 : 0) };
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={width} height={height} fill={design.bg} />
      {motifs[design.motif]({ a: area, d: design, rng })}
    </svg>
  );
}

/** Narrow slice of an all-over pattern, for spines. */
export function SpineArt({ slug, design }: { slug: string; design: BookDesign }) {
  const rng = mulberry32(hashString(slug) ^ 0x9e37);
  return (
    <svg viewBox="0 0 60 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={60} height={360} fill={design.bg} />
      {motifs[design.motif]({ a: { x: 0, y: 0, w: 60, h: 360 }, d: design, rng })}
    </svg>
  );
}
