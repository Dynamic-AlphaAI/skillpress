---
name: scroll-mesh-survey
description: "Scrub a narrow topology scan across a visible 3D object and its companion editorial figures. Use when a scroll gesture should disclose surface structure in both directions."
---

# Scroll Mesh Survey

Keep a legible solid silhouette at rest. Put a line mesh made from the same geometry under the same transformed parent as the shaded surface. For an already-visible object, alpha-blend just the lines at the wavefront. Reuse the geometry across passes and share any deformation uniforms so swaying tips stay registered.

Drive the front with section position. A practical progress value is `clamp((viewportHeight - sectionTop) / (viewportHeight + sectionHeight), 0, 1)`. Work in one coordinate system for both meshes. Project the vertex onto a normalized scan axis, then compare its coordinate with a front interpolated between the measured extremes. A radial version compares distance to an off-center origin. Use a soft band around that distance and let the line intensity settle after scrolling stops.

For an image-only companion figure, reveal the registered contour drawing through the same moving band. For editable prices and text, keep the original text node accessible and place any outline copy in an aria-hidden overlay. Reserve the bright response for the edges of the object.

Test by scrolling halfway, reversing, dwelling, and resizing. The outline should retrace the same surface without a flash, an opaque wipe, or rays crossing empty space. Reduced motion leaves the complete solid visible.

Open [the interactive study](demo/index.html) to inspect the technique.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/scroll-mesh-survey/SKILL.md
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
