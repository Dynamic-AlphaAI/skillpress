---
name: build-game-audio-feedback
description: Design or implement responsive audio feedback for a Three.js or web game. Use for action sounds, combat layers, music states, spatial audio, mix priorities, mute controls, accessibility, mobile audio unlock, and audio performance.
---

# Build Game Audio Feedback

Use audio to confirm player intent and combat state, not to add constant noise.

## Map feedback

Assign distinct cues for input accepted, windup, contact, block, miss, damage, interrupt, pickup, warning, death, and objective completion. Define priority so critical feedback remains audible during crowded encounters.

## Build for browsers

Unlock audio from a user gesture, respect mute/volume settings, release completed nodes, cap simultaneous voices, and provide subtitles or visual equivalents for meaningful cues. Change music by state with controlled transitions rather than restarts.

## Verify

Test first interaction, rapid actions, pause, tab/background return, mobile, muted state, and reduced motion/accessibility. Check memory and console health after a representative session.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/game-development/build-game-audio-feedback/SKILL.md
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
