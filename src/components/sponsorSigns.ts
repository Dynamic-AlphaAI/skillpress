import * as T from "three";
import { paintSponsorArtwork, sponsorPrintSize } from "./sponsorArtwork";
import type { SponsorCreative, SponsorSpot } from "@/lib/sponsors";

// Both faces of a hanging sign use the same print, each oriented toward the reader.
export function createSponsorSigns(scene: T.Scene, spots: SponsorSpot[], redraw: () => void) {
  const faces: T.Mesh<T.PlaneGeometry, T.MeshBasicMaterial>[] = [];
  const blank = new Map<string, T.MeshBasicMaterial>();
  const prints = new Map<string, T.MeshBasicMaterial>();
  let disposed = false;

  function print(spot: SponsorSpot, creative?: SponsorCreative) {
    const key = [spot.kind, spot.width, spot.height].join("/");
    const cached = !creative && blank.get(key);
    if (cached) return cached;
    const canvas = document.createElement("canvas");
    const { width: w, height: h } = sponsorPrintSize(spot);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const material = new T.MeshBasicMaterial({ map: texture, transparent: !creative && spot.kind === "wall" });
    if (!creative) {
      const hanging = spot.kind === "hanging";
      if (hanging) {
        ctx.fillStyle = "#303b33";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.strokeStyle = hanging ? "#978b66" : "#967657";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * .035, h * .075, w * .93, h * .85);
      ctx.fillStyle = hanging ? "#dfd3b7" : "#c2a686";
      ctx.textAlign = "center";
      ctx.font = "italic " + Math.min(w * .079, h * .20) + "px Georgia";
      ctx.fillText("Sponsor this spot", w / 2, h * .55);
      ctx.font = Math.min(w * .038, h * .085) + "px Georgia";
      ctx.fillText("Your logo here", w / 2, h * .73);
      blank.set(key, material);
    } else {
      paintSponsorArtwork(canvas, creative);
      const logoImage = new Image();
      logoImage.onload = () => {
        if (disposed || prints.get(spot.id) !== material) return;
        paintSponsorArtwork(canvas, creative, logoImage);
        texture.needsUpdate = true;
        redraw();
      };
      prints.set(spot.id, material);
      logoImage.src = creative.logo;
    }
    return material;
  }

  for (const spot of spots) {
    const geometry = new T.PlaneGeometry(spot.width, spot.height);
    const material = print(spot, spot.sponsor);
    for (const yaw of spot.kind === "hanging" ? [0, Math.PI] : [spot.yaw]) {
      const face = new T.Mesh(geometry, material);
      face.name = "sponsor/" + spot.id;
      face.userData.sponsorSpot = spot;
      face.userData.sponsorName = spot.sponsor?.name;
      face.rotation.y = yaw;
      face.position.set(spot.x, spot.y, spot.z + (spot.kind === "hanging" ? Math.cos(yaw) * .077 : 0));
      scene.add(face);
      faces.push(face);
    }
  }

  function disposeMaterial(material: T.MeshBasicMaterial) {
    material.map?.dispose();
    material.dispose();
  }
  return {
    faces,
    preview(spot: SponsorSpot, creative?: SponsorCreative) {
      creative ??= spot.sponsor;
      const lastPrint = prints.get(spot.id);
      if (lastPrint) disposeMaterial(lastPrint);
      prints.delete(spot.id);
      const material = print(spot, creative);
      for (const face of faces) if (face.userData.sponsorSpot.id === spot.id) {
        face.material = material;
        face.userData.sponsorName = creative?.name;
      }
      redraw();
    },
    dispose() {
      disposed = true;
      for (const geometry of new Set(faces.map(face => face.geometry))) geometry.dispose();
      for (const material of [...blank.values(), ...prints.values()]) disposeMaterial(material);
    },
  };
}
