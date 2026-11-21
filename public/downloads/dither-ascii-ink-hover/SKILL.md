---
name: dither-ascii-ink-hover
description: Reveal warm dither dots and ASCII marks beneath the pointer on an illustration using intersecting CSS masks. Use for a printed, holographic inspection effect with a one-pass scan.
---

# Dither and ASCII Ink Hover

Intersect a small repeating ink plate with a soft pointer-centred aperture. The plate stays fixed while the aperture moves across it. The stable registration makes the marks read as print already present in the picture.

Extracted from the Folvra studio ledger. Open the [working example](demo/index.html) and its [recreation prompt](demo/PROMPT.md).

## Make the plate

Use a transparent tile with two scales of clustered dither and a sparse alphabet such as . : + / =. Preserve empty areas and vary mark density. The specimen includes its original ledger-screen.png. For a different identity, create a matching monochrome print texture.

## Separate the two masks

Wrap the painting in a positioned element. Cover it with a pointer-events:none pseudo-element or aria-hidden layer. Use the tile as mask-image one and a radial-gradient as mask-image two. Repeat only the tile and set mask-composite: intersect. Folvra starts with a 164 × 107 CSS-pixel ellipse, opaque around 8%, partially transparent around 42%, fading by its outside edge.

## Aim and tint

Read the pointer against the current bounding rect. Write x and y percentages on the wrapper and reuse one animation frame for changing coordinates. Use sand on dark paint and umber on light paper. Keep the base paint visible. If strokes crawl across the image, stop moving the tile offset with the cursor.

## Give the scan an end

Run one diagonal inspection pass on entry or explicit activation and settle to a steady ink reveal. Around 1.3–1.55 seconds fits this scale. Clear the hover state on exit or cancellation. Use a real toggle to expose a fixed comparison on touch or keyboard. Under reduced motion show the steady plate. For reflections that follow the surface angle, use Relight Painted Surfaces.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/dither-ascii-ink-hover/SKILL.md
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
