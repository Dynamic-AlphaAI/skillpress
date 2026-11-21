---
name: build-game-inventory
description: Build or repair game inventory, loot, equipment, tooltips, drag-and-drop, persistence, and progression systems. Use for item schemas, pickup flows, stack rules, equipment slots, atomic swaps, save migration, and no-loss regression testing.
---

# Build Game Inventory

Use one typed, serializable item source of truth and make every transfer atomic.

## Define the item contract

Model stable IDs, item definitions, ownership, stack limits, equipment compatibility, effects, rarity, presentation data, and migration version separately. Runtime UI must reference definitions by ID rather than duplicate stats or descriptions.

## Implement transfers as transactions

For pickup, equip, unequip, swap, drag/drop, consume, and sell:

1. Validate source ownership and destination legality.
2. Compute the entire next inventory/equipment state.
3. Commit once or reject without changing either side.
4. Persist only after the committed state is valid.

Never remove an item before confirming a legal destination. Preserve item identity across a swap and prevent duplicate effect registration.

## Build usable UI

Expose slot compatibility, equipped state, quantity, tooltip facts, and failure feedback. Support keyboard and touch alternatives to drag-only interactions. Keep focus behavior, dialogs, and tooltips accessible.

## Test loss boundaries

Cover invalid destinations, full inventory, duplicate pickup, equip swap, mid-action swap, save/load, schema migration, reset/new game, tooltip updates, and repeated dispatch. Validate that total owned item identity is conserved except for explicit consumption or reward rules.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/game-development/build-game-inventory/SKILL.md
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
