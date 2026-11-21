---
name: atmosphere-background
description: "Create a dark atmospheric background with drifting vertical light folds, screen-blended glow, and a concentrated luminous corner or lower-edge bloom."
---

# Atmosphere Background Skill

## Use When
- Create a dark atmospheric background with drifting vertical light folds, screen-blended glow, and a concentrated luminous corner or lower-edge bloom.

## Workflow

## Scope
- Apply this only to the immersive background layer, not to the full page layout, typography, or unrelated WebGL/particle systems.
- Use it when the design needs a moody atmospheric backdrop with fluid light curtains or folds instead of geometric grids, blobs, or literal illustrations.

## Visual target
- Create a deep near-black background with soft vertical light folds drifting across the frame like illuminated fabric, fog sheets, or light curtains.
- Build the glow from multiple overlapping vertical bands so the background feels layered and spatial rather than flat.
- Let brightness accumulate more strongly toward one area, especially the lower right or lower edge, so the scene has a cinematic focal glow instead of uniform brightness.
- Keep the palette restrained: dark navy or charcoal base, then derive the glow from the design's primary color or strongest accent color. If no clear brand color exists, a cool cyan-blue atmosphere is acceptable.

## Implementation guidance
- Prefer canvas or shader-driven rendering for this effect instead of static CSS gradients when motion is required.
- Use multiple tall overlapping bands or folds with slow sine-wave drift so the structure reads as moving atmospheric light rather than hard columns.
- Use screen or additive-style blending so the overlapping folds brighten naturally where they cross.
- Shape each fold with vertical gradients that fade at the top and intensify toward the bottom or focal corner.
- Add a subtle radial glow overlay near the focal edge or corner to reinforce depth and the main luminous area.
- Motion should stay slow and meditative: gentle drift, slight intensity modulation, no noisy flicker or rapid pulsing.

## Tuning knobs
- Fold count: add or reduce the number of vertical folds depending on how dense the atmosphere should feel.
- Drift: control horizontal sway amplitude and speed to keep motion calm.
- Brightness focus: place the strongest glow near a corner, edge, or lower quadrant instead of spreading it evenly across the whole frame.
- Color: tint the folds with the active design accent while preserving a dark, premium base.
- Softness: adjust overlap width, gradient falloff, and post-glow strength so the background feels luminous but not washed out.

## Avoid
- Flat multi-stop gradients with no layered fold structure.
- Loud rainbow color transitions or bright full-frame glow that competes with foreground content.
- Hardcoded cyan if the design clearly uses another primary color.
- Fast turbulence, noisy particle motion, or obvious repeating patterns that break the calm atmospheric look.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/atmosphere-background/SKILL.md
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
