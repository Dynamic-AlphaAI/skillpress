---
name: woodland-chapter-cameras
description: "Stage a live Three.js valley with a creek, instanced trees and layered fog across a hero, story chapter and footer using distinct scroll-driven camera poses."
---

# Woodland Chapter Cameras

Build the terrain around a winding creek centerline. Sample that same height field when placing tree roots, boulders, grass clumps and camera rails. Give the near banks recognizable branch silhouettes. Use grouped tree instances farther away, varied by crown ratio, lean and spacing. Keep a distant ridge behind an unplanted gap so the fog has an interval to reveal.

Use one seeded world and renderer. Define an eye position, target and lens for each chapter. Look across the water in the opening, across a clearing for the story and above the trees for the closing wordmark. Drive the active pose with section progress. Damp the target in seconds and snap to the intended pose on a deep link. If two views must coexist, use clipped viewports or retain the outgoing frame during the handoff.

Let depth and elevation control the light in the valley. Keep the near branch sharp. Shore contact, a darker creek bed, a changing Fresnel term and a displaced reflection establish water depth. Render reflections at a smaller resolution when GPU time is tight. Where pricing calls for blur, cache just its background.

Measure frame intervals through chapter boundaries, with an entrance directly at the footer as well as from the top. Share geometry and decoded textures. Stop hidden views and support a deliberately composed still pose for reduced motion.

Open [the interactive study](demo/index.html) to inspect the technique.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/3d/woodland-chapter-cameras/SKILL.md
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
