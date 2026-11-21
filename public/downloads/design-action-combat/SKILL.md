---
name: design-action-combat
description: Design, implement, tune, or test readable tactical action combat for web games. Use for attack timing, guard and dodge windows, hit contact, posture, lock-on, weapons, boss phases, combat feedback, and deterministic combat tests.
---

# Design Action Combat

Treat combat as explicit state machines with visible, testable timing rather than animation-driven guesses.

## Specify every combat verb

For each player or enemy action, define: startup, active window, recovery, cancellation rules, resource cost, contact shape, damage/posture outcome, cooldown, and feedback. Make telegraph, danger, contact, and recovery readable at normal camera distance.

## Use authoritative outcomes

- Drive hits, blocks, parries, and interrupts from authoritative collision/contact events.
- Require direction, range, phase, and state validity before resolving an outcome.
- Apply each contact once using stable action and target identifiers.
- Keep visuals downstream of resolved simulation events.

## Tune for decisions

Give each defense a distinct purpose: spacing, dodge, timed guard, interruption, or resource trade. Avoid unpunishable attacks, recovery loops, unavoidable damage, and dominant spam. Boss phases must alter decision pressure without invalidating learned timing.

## Test combat deterministically

Cover early/late timing, wrong direction, out-of-range contact, multiple targets, interrupted actions, phase changes, cooldown boundaries, pause/frame step, equip swaps, and repeated inputs. Use seeded or queryable review scenarios instead of requiring long campaign playthroughs.

## Verify in play

Test at realistic frame rate and camera distance. Confirm that player intent, contact feedback, health/posture changes, sound/VFX, and target state agree. Check reduced motion and input alternatives before release.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/game-development/design-action-combat/SKILL.md
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
