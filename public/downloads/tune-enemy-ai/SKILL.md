---
name: tune-enemy-ai
description: Build, debug, balance, or test combat enemy AI for playable action games. Use for aggro, target selection, navigation, spacing, attack choices, telegraphs, retreats, boss behavior, behavior-state machines, and deterministic AI regression tests.
---

# Tune Enemy AI

Make enemy choices legible, bounded, and reproducible.

## Model decisions explicitly

Use a small state machine or utility layer with named states such as idle, investigate, pursue, reposition, windup, attack, recover, stagger, retreat, and defeated. State transitions must state their prerequisites, exit conditions, minimum dwell time, and cooldown effects.

## Separate perception, intent, and motion

1. Gather observable inputs: distance, line of sight, target state, occupancy, threat, health, and timers.
2. Select one intention from constrained legal actions.
3. Move and animate toward that intent without rewriting the decision mid-action.

Use authoritative collision and navigation results for movement success. Do not derive them from rendered pose or assumed path completion.

## Preserve fair combat

Telegraph attacks before their active window. Prevent instant turn-and-hit behavior, perpetual chase, clipped attacks through blockers, and repeated recovery spam. Add spacing and commitment so the player can read and answer each enemy archetype.

## Test the decision surface

Create deterministic fixtures for target acquisition, target loss, obstruction, path failure, close-range pressure, multiple enemies, retaliation, interrupt, stagger, boss phase, and reset. Assert transitions and outcomes, not only final positions. Run a real browser encounter after automated tests.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/game-development/tune-enemy-ai/SKILL.md
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
