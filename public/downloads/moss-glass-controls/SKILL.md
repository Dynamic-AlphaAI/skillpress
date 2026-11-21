---
name: moss-glass-controls
description: "Build Sylva-style dark glass action pills and woodland cards with an inset rim, pale icon well and a gradient that travels around the edge on hover."
---

# Moss Glass Controls

Build each action from a readable face, a one-pixel rim and an icon. Use a deep olive gradient, a faint warm top inset and a soft contact shadow. The elevated action can end in a circular ivory well with a dark directional glyph. Let a card inherit the same radii, outline color and light direction. Inset its image by about 8px.

Clip the rotating gradient to a border ring using two masks (content box and border box with exclude), or stack a solid face over a rotating undersurface. Run the gradient only while hovered or keyboard-focused. Keep the label, image and face stationary. A short perimeter pulse can begin at the pointer entry point. Idle surfaces need only the static rim. Give active press a small scale change over roughly 85ms and use a softer 150–220ms release.

Use a real anchor for navigation and a button for an in-page action. Keep a persistent visible focus outline, at least a 44px tap area, and a dark-enough local surface over bright water. Test via Tab and Space on a light and dark section. Disable continuous rim rotation with reduced motion and retain a still highlight.

Open [the interactive study](demo/index.html) to inspect the technique.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/ui/moss-glass-controls/SKILL.md
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
