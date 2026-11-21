---
name: generate-ledger-logo-register
description: Generate a family of original fictional wordmarks on a Seedream contact sheet, extract transparent assets, and present them as a partner or studio logo register.
---

# Generate a Ledger Logo Register

Design the family on one extraction sheet. Give each brand its own type construction and silhouette, then carry the independent transparent marks into a ledger with meaningful metadata.

Extracted from the Folvra studio ledger. Open the [working example](demo/index.html) and its [recreation prompt](demo/PROMPT.md).

## Prepare the commission

Write a list of invented names, exact capitalization, discipline and one distinct visual idea per name. Check that each name stays legible around 90px wide. Folvra used the primary wordmark and symbol in the first row, then six partners in three more rows. Treat supplied real brands as supplied artwork.

## Generate for extraction

Use the exact [production prompt](references/generation-prompt.md) as a replaceable template. Request black ink on pure white, two equal columns by four equal rows, generous padding and a fixed reading order. Keep sheet labels, drawn gridlines, texture and presentation mockups out of the artwork. Folvra used Seedream 5.5 in Fil. Follow the selected provider’s normal generation and cost workflow.

## Inspect and cut

Read every name letter by letter against the manifest before cropping. Check the grid boundaries and the smallest counters. A misspelling warrants a targeted replacement of its cell. Use scripts/extract_sheet.py with the sheet and an ordered JSON list of output stems. It estimates the ink bounds per cell, preserves antialiasing as alpha, trims the white and exports independent lossless marks. Open them over both light and dark backgrounds to check the edges.

## Typeset the register

Use an ordered list. Give each row or folio an index, accessible brand name and its discipline. Size the logo by the shape of its ink, retaining its aspect ratio. Use the same optical band for most marks and let unusually thin or tall symbols breathe. Check the sequence on mobile and provide alt text for every identity. The Company Logos skill covers existing brands and icon libraries.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/generate-ledger-logo-register/SKILL.md
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
