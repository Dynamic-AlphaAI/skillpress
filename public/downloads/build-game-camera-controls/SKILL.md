---
name: build-game-camera-controls
description: Implement or tune Three.js game cameras. Use for isometric framing, follow behavior, orbit/zoom limits, occlusion, lock-on, camera shake, touch camera controls, and camera regression tests.
---

# Build Game Camera Controls

Keep gameplay readable before making the camera cinematic. Define one authoritative target, camera bounds, zoom range, collision/occlusion policy, and reduced-motion behavior.

## Implement

- Smooth position and look-at targets independently; never bind the camera directly to jittery render state.
- Preserve player, immediate threat, objective, and interaction cues in frame at the intended distance.
- Clamp orbit, pitch, and zoom; prevent walls or props from hiding the player without making geometry invisible globally.
- Treat lock-on, scripted moments, and shake as temporary modifiers layered over the base camera.
- On touch, separate camera gesture zones from movement/action controls and provide reset framing.

## Verify

Test corners, tall props, tunnels, multiple enemies, lock-on switching, pause, reduced motion, portrait, and landscape. Confirm no camera behavior breaks targeting, UI, or performance.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/game-development/build-game-camera-controls/SKILL.md
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
