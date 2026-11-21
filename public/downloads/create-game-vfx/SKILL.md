---
name: create-game-vfx
description: Create readable, performance-safe Three.js game visual effects. Use for attacks, impacts, damage feedback, status effects, spell trails, particles, shaders, telegraphs, quality tiers, and reduced-motion alternatives.
---

# Create Game VFX

Make the gameplay meaning visible before adding spectacle.

## Specify

For every effect define trigger, owner, duration, gameplay meaning, camera-distance silhouette, color hierarchy, spawn cap, cleanup rule, and reduced-motion equivalent. Separate telegraph, contact, success, failure, and lingering status visuals.

## Implement safely

Pool short-lived objects, reuse materials/geometry, cap particles, and avoid per-frame allocation. Use additive/transparency sparingly around important UI and targets. Make cleanup idempotent so reset, death, and pause cannot leak effects.

## Verify

Test overlaps, multiple targets, rapid repetition, pause/resume, lowest quality, reduced motion, and touch viewports. Sample the live encounter for warnings, draw calls, frame time, and visual readability.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/game-development/create-game-vfx/SKILL.md
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
