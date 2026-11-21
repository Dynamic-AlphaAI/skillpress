---
name: perching-butterfly
description: "Animate a small 3D butterfly that banks in flight, approaches an actual plant surface, settles with hinged wings and takes off when disturbed."
---

# Perching Butterfly

Parent the thorax and four wing surfaces to a body group. Place wing pivots at the thorax and mirror their local flapping axes. Shape the leading and trailing edges separately. Bend the hindwings slightly later than the forewings. Keep a leg or underside reference point for contact.

Store the perch in the plant's local coordinates. Calculate it from an upward face or branch sample, offset along the surface normal to clear the moss, and update its world pose after any plant transform. When landed, bring the feet to that anchor and preserve a readable dorsal angle. Blend orientations with quaternions and a time-based damping factor.

Move the butterfly through four states. Cruise between nearby waypoints, approach on a shallow curve, settle with smaller wing beats, then take off on a short upward arc. Derive banking from turn rate. Allow the pointer near the perched insect to trigger one takeoff, with hysteresis or a cooldown. A brief landing timeout should steer the insect home without causing a position jump.

Force a landing during review. Orbit past a side view and check for floating feet, backwards approach, crossed wing hinges, and penetration on takeoff. Under reduced motion present the butterfly perched with open wings.

Open [the interactive study](demo/index.html) to inspect the technique.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/3d/perching-butterfly/SKILL.md
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
