---
name: glass-dark-ui
description: Build dark-mode glassmorphism interfaces with readable contrast, frosted surfaces, and gradient borders using a pseudo-element mask. Use when asked for glass cards, frosted dark hero sections, blur panels, or dark UI systems with gradient/glow borders.
---

# Glass Dark UI Skill

## Workflow
1. Confirm environment (`HTML/CSS`, Tailwind, or React) and target surface (`hero`, `dashboard`, `modal`, `card`).
2. Define dark UI tokens first (background, glass fill, border glow, primary text, muted text).
3. Build frosted panels with `backdrop-filter`, transparent dark fill, and subtle inner highlight.
4. Apply the masked gradient border (`.border-gradient::before`) to key surfaces.
5. Add restrained depth (shadow + glow) and clear hover/focus states.
6. Validate contrast and mobile behavior before finalizing.

## Base Tokens
Use these as defaults and tune per brand.

```css
:root {
  --bg-0: #020617;
  --bg-1: #0b1220;
  --glass-fill: rgba(15, 23, 42, 0.45);
  --glass-fill-strong: rgba(15, 23, 42, 0.62);
  --text-main: #e2e8f0;
  --text-muted: #94a3b8;
  --accent: #60a5fa;
}
```

## Glass Panel Pattern

```css
.glass-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  background-color: var(--glass-fill);
  border-radius: 24px;
  box-shadow: 0 20px 48px rgba(2, 6, 23, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
}
```

## Border Gradient Pattern

```css
.border-gradient {
  position: relative;
}

.border-gradient::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  background: linear-gradient(
    145deg,
    rgba(148, 163, 184, 0.28) 0%,
    rgba(96, 165, 250, 0.36) 45%,
    rgba(168, 85, 247, 0.3) 70%,
    rgba(148, 163, 184, 0.18) 100%
  );
  pointer-events: none;
}
```

## Tailwind Usage Pattern

```html
<section class="relative rounded-3xl border-gradient bg-slate-950/45 backdrop-blur-xl p-8 shadow-[0_20px_48px_rgba(2,6,23,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]">
  <h2 class="text-slate-100 text-2xl font-semibold">Frosted Panel</h2>
  <p class="text-slate-400 mt-2">Dark glass card with masked gradient border.</p>
</section>
```

## Dark Mode Checklist
- Keep body text at least `#cbd5e1` on dark glass surfaces.
- Avoid pure black overlays over blur; use deep navy/charcoal alpha instead.
- Limit glow radius/intensity to preserve readability.
- Ensure focus rings are visible (`outline` or bright border state).
- Add fallback for non-blur environments: stronger solid background (`--glass-fill-strong`).

## Common Requests This Skill Should Handle
- "Create a dark glass hero section with glowing border cards."
- "Convert this bright UI to dark glassmorphism without losing contrast."
- "Add border gradient glow to a frosted navbar/card/modal."
- "Make my dark dashboard feel premium with glass panels and subtle depth."


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/glass-dark-ui/SKILL.md
Author: Meng To
MIT License

Copyright (c) 2026 Meng To

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->
