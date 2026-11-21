---
name: unicorn-studio
description: Use when embedding and customizing Unicorn Studio interactive animations on the web (embed, responsive sizing, performance, layering with UI, fallbacks).
---

# Unicorn Studio — No-code WebGL Scenes (Embed/SDK) Skill

## When to use
- Designers want custom WebGL visuals without hand-coding shaders/three.js
- You need “designed” effects layered with text/images/video, with built-in interactivity
- Site builders: Framer, Webflow, Wix, Figma Sites, etc.

## What it is
- A scene editor (layers + effects + events) that exports:
  - Embed via Unicorn Studio SDK (small JS library)
  - Or JSON/code export for faster/self-hosted loading (plan-dependent)

## Key embed patterns
- Load SDK (can be in `<head>` or footer depending on above-the-fold):
  - UMD from jsDelivr (versioned)
  - Call `UnicornStudio.init()` once DOM is ready
- Add attributes to a container element:
  - `data-us-project="PROJECT_ID"`
  - Optional performance/behavior params:
    - `data-us-scale` (render scale)
    - `data-us-dpi` (resolution multiplier)
    - `data-us-fps` (cap FPS)
    - `data-us-lazyload="true"`
    - `data-us-production="true"`
  - Optional JSON source:
    - `data-us-project-src="https://.../scene.json.txt"`

## Events (authoring-side)
- Appear (entrance), Scroll (progress/velocity), Hover, Mousemove
- Use events for “feels interactive” without writing JS.

## Common pitfalls
- Container has no defined dimensions → scene won’t display
  - Ensure the element with `data-us-project` has width/height.
- Too many scenes on one page → WebGL context limits + memory
  - Prefer <10 scenes/page; WebGL context max ~16.
- Performance on low-end devices
  - Use `data-us-scale`/`data-us-dpi`/`data-us-fps`; reduce dynamic layers/effects.
- Site builder preview limitations
  - Many builders won’t render in edit mode; must preview/publish to see it.

## Quick recipes

### 1) Basic embed container
```html
<div style="width: 100%; height: 420px" data-us-project="YOUR_PROJECT_ID"></div>
```

### 2) Performance-first embed
```html
<div
  style="width: 100%; height: 420px"
  data-us-project="YOUR_PROJECT_ID"
  data-us-lazyload="true"
  data-us-production="true"
  data-us-scale="0.75"
  data-us-dpi="1.25"
  data-us-fps="45"
></div>
```

## What to ask the user
- Target platform: Webflow / Framer / coded site?
- Is the scene above-the-fold? (affects script placement and lazyload)
- Mobile support requirement + acceptable quality/FPS
- Number of scenes on the page and whether JSON export is available


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/unicorn-studio/SKILL.md
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
