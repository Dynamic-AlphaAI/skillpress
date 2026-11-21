---
name: 3d-sky-rays
description: Add sun shafts and crepuscular rays to a Three.js or equivalent 3D scene, using scene occlusion, a projected sun position, controlled foreground spill, and scalable post-processing. Use for rays of light from the sky, sunlight through trees or roofs, and golden-hour architectural scenes.
---

# 3D Sky Rays

Make the light appear to travel through gaps in the scene. Roof edges and foliage should shape the shafts as the camera moves.

## Fit the existing renderer

Inspect the renderer version, render targets, alpha usage, depth path, tone mapping, and post-processing order. Keep the existing WebGL or WebGPU backend. The shader recipe below describes a WebGL screen-space effect; implement the equivalent in the project's node/render pipeline when using WebGPU.

Use one normalized world-space direction pointing **toward the sun** for the sky, ray source, and directional lighting. If the art direction deliberately offsets the visible sun from the lighting sun, document and control that offset in one place.

## Build an occlusion-aware ray pass

1. Render scene color in linear HDR. Obtain a mask identifying open sky: white for sky, black for opaque occluders. Match foliage alpha cutouts and vertex motion in the mask pass so leaves do not become solid rectangles.
2. A dedicated sky mask is the portable default. Reusing scene alpha is an optimization only when every preceding pass preserves its meaning: sky alpha 0, opaque geometry alpha 1. Transparent glass, particles, canvas compositing, and AO can break that convention; inspect the mask directly.
3. Project a point along the sun direction from the camera. Reject a source behind the camera before using projected coordinates. Convert NDC to UV with `uv = ndc.xy * 0.5 + 0.5`; account for the pipeline's texture orientation.
4. For each ray-buffer pixel, march toward the sun UV. Sample sky visibility multiplied by sky brightness above an HDR threshold. Accumulate decaying samples and divide by the sum of weights so sample-count changes do not change exposure.
5. Reject UVs outside the mask texture. Fade the effect as the sun moves far off-screen; clamping samples to the edge creates bright bands. A small overscan margin is useful for a sun just outside the frame.
6. Composite the ray color additively into linear scene color before the final tone-map/output transform. Preserve the input alpha if later passes need it.

Core accumulation, expressed as pseudocode:

```text
step = (pixelUV - sunUV) * density / sampleCount
sampleUV = pixelUV - step * jitter
sum = 0; weightSum = 0; weight = 1
repeat sampleCount times:
    sampleUV -= step
    if sampleUV is inside the texture:
        energy = max(luminance(scene(sampleUV)) - threshold, 0)
        sum += min(energy, energyCap) * skyMask(sampleUV) * weight
    weightSum += weight
    weight *= decay
rays = sum / max(weightSum, epsilon)
```

Use aspect-correct distance from the source for radial falloff. Keep any angular variation broad and subtle; the scene occlusion should provide most of the structure. On opaque foreground surfaces, attenuate the screen-space overlay strongly so wood and stone retain contrast. This is an artistic approximation, not a substitute for depth-integrated volumetric scattering.

## Tune appearance before cost

Start with a low sun, warm neutral tint, visible gaps, and restrained intensity. View from behind a roofline and through a canopy. Whiteout usually means excessive intensity or a bad mask, not insufficient bloom.

Use roughly 24–48 samples and a half-resolution ray buffer as a starting experiment; increase only when visible banding warrants it. Seijaku's reference uses 72 samples, which is a reference choice rather than a required quality floor. Smooth noise jitter can reduce bands, but animated jitter can shimmer; use stable noise for still or reduced-motion views unless temporal accumulation is available.

Skip the pass when its contribution is zero. Resize its buffers with the drawing buffer, dispose replaced targets, and measure its incremental GPU/frame cost with rays enabled and disabled. Avoid synchronous GPU readback in the render loop.

## Verify

- Roofs and leaf silhouettes visibly interrupt shafts; no rectangular foliage halos.
- Turning away from the sun removes the effect without a mirrored source or flash.
- Entering an interior preserves surface contrast; unrelated emissive objects do not become suns.
- Camera orbit, portrait resize, dusk, and a static reduced-motion frame remain stable.
- Desktop and mobile checks include shader errors, frame time, and the actual ray-buffer size.

## Reference

Read [REFERENCES.md](REFERENCES.md) for the source and renderer documentation. In Seijaku, inspect `GodRayShader`, `makePost`, and the projected-source update. Its alpha-mask convention depends on its complete render pipeline; do not transplant that assumption alone.


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/3d/3d-sky-rays/SKILL.md
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
