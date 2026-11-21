---
name: gsap
description: Use when you need to add or debug professional web animations with GSAP (timelines, ScrollTrigger, stagger, transforms) in HTML/CSS/JS/React. Includes patterns for smooth motion, performance, and common pitfalls.
---

# GSAP (GreenSock) — Web Animation Skill

## When to use
- High-quality UI/motion design: entrances, micro-interactions, page transitions
- Timeline-based sequences (vs. scattered CSS transitions)
- Scroll-driven storytelling (with ScrollTrigger)
- Complex easing, staggering, orchestration across many elements

## Key concepts & APIs
- Tweens:
  - `gsap.to(targets, vars)`
  - `gsap.from(targets, vars)`
  - `gsap.fromTo(targets, fromVars, toVars)`
- Timelines:
  - `const tl = gsap.timeline({ defaults, repeat, yoyo, paused })`
  - Chain: `tl.to(...).from(...).addLabel('x').add(() => ...)`
  - Position parameter: absolute `1.2`, relative `"+=0.5"`, overlap `"-=0.3"`, label `"intro"`
- Eases: `ease: "power2.out"`, `"expo.inOut"`, `"elastic.out(1, 0.3)"`
- Staggers: `stagger: 0.05` or `{ each, from: "start|center|end|random", grid }`
- Performance-friendly properties:
  - Prefer transforms (`x`, `y`, `scale`, `rotation`) and opacity (`autoAlpha`)
- ScrollTrigger (plugin):
  - `gsap.registerPlugin(ScrollTrigger)`
  - Inline: `gsap.to(".box", { scrollTrigger: ".box", x: 500 })`
  - Advanced: `scrollTrigger: { trigger, start, end, scrub, pin, snap, markers }`
  - Standalone: `ScrollTrigger.create({ trigger, start, end, onUpdate, onToggle })`

## Common pitfalls (and fixes)
- Animating layout properties (top/left/width/height) → jank
  - Use transforms, add `will-change: transform`, avoid forced reflow.
- ScrollTrigger “not firing” due to wrong trigger sizing/overflow containers
  - Ensure trigger exists, has height, and check scroll container (nested scrolling needs config).
- Not cleaning up in SPA/React
  - Use `gsap.context()` and revert on unmount; kill triggers (`ScrollTrigger.getAll().forEach(t => t.kill())`) if needed.
- FOUC / measuring before fonts/images load
  - Initialize after layout is stable; run `ScrollTrigger.refresh()` after images load.

## Quick recipes

### 1) Hero entrance (stagger)
```js
gsap.from(".hero [data-anim]", {
  y: 24,
  autoAlpha: 0,
  duration: 0.8,
  ease: "power2.out",
  stagger: 0.06,
});
```

### 2) Sequenced timeline
```js
const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.6 } });
tl.from(".nav", { y: -20, autoAlpha: 0 })
  .from(".hero-title", { y: 30, autoAlpha: 0 }, "-=0.2")
  .from(".hero-cta", { scale: 0.95, autoAlpha: 0 }, "-=0.2");
```

### 3) Scroll-scrub pinned section
```js
gsap.registerPlugin(ScrollTrigger);

gsap.timeline({
  scrollTrigger: {
    trigger: ".story",
    start: "top top",
    end: "+=800",
    scrub: 1,
    pin: true,
  },
}).to(".story .panel", { xPercent: -200 });
```

## What to ask the user (if requirements unclear)
- Is this a static site or SPA (React/Next/Vue)? Any page transitions?
- Do we need scroll-driven sections (pin/scrub/snap)?
- Performance constraints (mobile support, reduced motion)?


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/gsap/SKILL.md
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
