import { categories } from "./categories";
import type { Book } from "./types";

export interface RoomShelf {
  label: string;
  books: Book[];
  faceOutCount: number;
}

const sections = [
  { id: "studio", label: "Arts & Letters", paint: "#566449", runner: "#e3d8be" },
  { id: "workshop", label: "Engineering Workshop", paint: "#455e69", runner: "#9ec4d6" },
  { id: "research", label: "Research & Data", paint: "#705552", runner: "#dfa5a0" },
  { id: "operations", label: "Operations Room", paint: "#4d6760", runner: "#9ecdbb" },
  { id: "commerce", label: "Business & Commerce", paint: "#806443", runner: "#f0bf86" },
] as const satisfies readonly { id: (typeof categories)[number]["room"]; label: string; paint: string; runner: string }[];

export const baySpacing = 3.8;

export interface LibraryRoom {
  id: string;
  label: string;
  paint: string;
  runner: string;
  shelves: RoomShelf[];
  topics: string[];
  cases: number;
  rows: number;
  front: number;
  rear: number;
}

/** Doors meet at shared Z coordinates. Empty subjects and rooms take up no floor space. */
export function planRooms(books: Book[]): LibraryRoom[] {
  const rooms: LibraryRoom[] = [];
  let front = 5.4;
  for (const section of sections) {
    const shelves: RoomShelf[] = [];
    const topics: string[] = [];
    for (const category of categories) {
      if (category.room !== section.id) continue;
      const volumes = books.filter((book) => book.category === category.id);
      if (!volumes.length) continue;
      topics.push(category.label);
      const count = Math.ceil(volumes.length / 12);
      for (let i = 0; i < count; i++) {
        const row = volumes.slice(Math.floor(i * volumes.length / count), Math.floor((i + 1) * volumes.length / count));
        shelves.push({
          label: category.label + (count > 1 ? ` · ${i + 1}` : ""),
          books: row,
          faceOutCount: Math.min(row.length, Math.max(1, Math.floor((3.26 - row.length * 0.22) / 0.29))),
        });
      }
    }
    if (!shelves.length) continue;
    const cases = Math.ceil(shelves.length / 4);
    const rows = Math.ceil(cases / 2);
    const rear = front - (rows + 1) * baySpacing;
    rooms.push({ ...section, shelves, topics, cases, rows, front, rear });
    front = rear;
  }
  return rooms;
}
