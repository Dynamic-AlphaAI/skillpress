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

export interface LibraryRoom {
  id: string;
  label: string;
  paint: string;
  runner: string;
  shelves: RoomShelf[];
  topics: string[];
  cases: number;
}

type Section = Pick<LibraryRoom, "id" | "label" | "paint" | "runner">;

function makeRoom(section: Section): LibraryRoom {
  return { ...section, shelves: [], topics: [], cases: 0 };
}

function shelve(room: LibraryRoom, label: string, books: Book[]) {
  if (!books.length) return;
  room.topics.push(label);
  const count = Math.ceil(books.length / 12);
  for (let i = 0; i < count; i++) {
    const row = books.slice(Math.floor(i * books.length / count), Math.floor((i + 1) * books.length / count));
    room.shelves.push({
      label: label + (count > 1 ? ` · ${i + 1}` : ""),
      books: row,
      faceOutCount: Math.min(row.length, Math.max(1, Math.floor((3.26 - row.length * 0.22) / 0.29))),
    });
  }
  room.cases = Math.ceil(room.shelves.length / (room.id === "hall" ? 3 : 4));
}

export function planRooms(books: Book[]): LibraryRoom[] {
  if (!books.length) return [];
  const hall = makeRoom({ id: "hall", label: "Main Reading Hall", paint: "#65705a", runner: "#dfc6a3" });
  const wings = sections.map(makeRoom);
  for (const category of categories) {
    const volumes = books.filter((book) => book.category === category.id);
    if (!volumes.length) continue;
    const featured = books.length <= 12 ? volumes.length : Math.min(6, Math.ceil(volumes.length / 4));
    shelve(hall, category.label, volumes.slice(0, featured));
    const wing = wings.find((room) => room.id === category.room)!;
    shelve(wing, category.label, volumes.slice(featured));
  }
  return [hall, ...wings.filter((room) => room.cases > 0)];
}
