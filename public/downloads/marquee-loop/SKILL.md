---
name: marquee-loop
description: "Apply seamless infinite marquee loops using duplicated items."
---

# Marquee Skill

## Use When
- A design needs a seamless infinite loop for logos, testimonials, screenshots, tags, or short feature chips.

## Workflow
1. Duplicate the item sequence so the end and beginning match perfectly.
2. Animate the track with a linear transform from 0 to -50%.
3. Keep item widths stable to prevent jumps during the loop.
4. Mask or fade the edges when the marquee enters or exits a section.
5. Pause or slow the marquee on hover only when interaction is useful.
6. Respect prefers-reduced-motion with a static wrap or very slow movement.

## Guardrails
- Do not animate unique content that users must read carefully.
- Do not use large CPU-heavy shadows or filters on every moving item.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/marquee-loop/SKILL.md
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
