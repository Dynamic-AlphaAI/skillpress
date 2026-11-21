---
name: threejs
description: Use when building or debugging interactive 3D scenes on the web with Three.js (scene/camera/renderer, lights/materials, GLTF loading, controls, performance). Helpful for designers shipping 3D UI moments.
---

# Three.js — WebGL 3D Scenes Skill

## When to use
- Real 3D: product spins, interactive hero scenes, shaders/material effects, 3D data viz
- You need full control beyond “background effects”
- You can budget time for asset pipeline + performance tuning

## Core mental model
- Create:
  - `Scene` (root graph)
  - `Camera` (Perspective/Orthographic)
  - `Renderer` (`WebGLRenderer`)
  - `Mesh` = `Geometry` + `Material`
  - Lights (if using non-unlit materials)
- Render loop:
  - `requestAnimationFrame(animate)`
  - Update time-based animations, controls, mixers, then `renderer.render(scene, camera)`

## Key APIs/patterns
- Setup:
  - `const renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha })`
  - `renderer.setSize(width, height, false)`
  - `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- Camera:
  - `camera.aspect = width / height; camera.updateProjectionMatrix()`
- Scene graph:
  - `scene.add(object)` / `object.position/rotation/scale`
- Loading assets:
  - `GLTFLoader` (models), `TextureLoader` (images), `DRACOLoader` (compressed glTF)
- Controls (common):
  - `OrbitControls` (debug/product), `PointerLockControls` (FPS), custom pointer handlers
- Cleanup (important in SPAs):
  - `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, `renderer.dispose()`
  - Remove event listeners; cancel RAF.

## Common pitfalls
- Not handling resize → stretched/cropped rendering
- Too high devicePixelRatio → mobile GPU meltdown
- Leaking WebGL resources (not disposing) → crashes after route changes
- Loading huge textures/models → slow start; use compressed textures, Draco/KTX2, smaller maps
- Using too many lights/shadows → expensive; fake lighting with baked textures when possible

## Quick recipes

### 1) Minimal spinning cube
```js
import * as THREE from "three";

const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 4);

const geom = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({ color: 0x7c3aed });
const mesh = new THREE.Mesh(geom, mat);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(2, 2, 2);
scene.add(dir);

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

function animate(t) {
  mesh.rotation.y = t * 0.0006;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

### 2) Respect reduced motion
- If `prefers-reduced-motion: reduce`, render a still frame (no RAF) or slow updates.

## What to ask the user
- Is this decorative (hero) or functional 3D (product viewer)?
- Target devices: mobile? older iPhones?
- Asset format availability (glTF, HDRI, textures) and file size constraints
- Accessibility/reduced motion requirements


<!-- Edition source: https://github.com/MengTo/Skills/blob/3ec2dc0857d36e45d032d10063f62f2c773329a3/agent-skills/web-design/threejs/SKILL.md
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
