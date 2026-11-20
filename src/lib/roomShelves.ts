import { groundRows, stackShelves } from "./roomLadder.ts";
import { categories } from "./categories.ts";
import type { Book } from "./types";

export interface RoomShelf {
  label: string;
  books: Book[];
  faceOutCount: number;
  upper?: boolean;
}

const sections = [
  { id: "studio", label: "Arts & Letters", paint: "#566449", runner: "#e3d8be" },
  { id: "workshop", label: "Engineering Workshop", paint: "#455e69", runner: "#9ec4d6" },
  { id: "research", label: "Research & Planning", paint: "#705552", runner: "#dfa5a0" },
  { id: "operations", label: "Operations Room", paint: "#4d6760", runner: "#9ecdbb" },
  { id: "commerce", label: "Business & Commerce", paint: "#806443", runner: "#f0bf86" },
  { id: "gallery", label: "Design Gallery", paint: "#774f63", runner: "#e0afc1" },
  { id: "models", label: "AI & Model Lab", paint: "#3d6267", runner: "#91cbc4" },
  { id: "archive", label: "Data Archive", paint: "#605674", runner: "#b8a7d4" },
  { id: "mobile", label: "Mobile Studio", paint: "#6d5b42", runner: "#e5cc92" },
  { id: "infrastructure", label: "Infrastructure Room", paint: "#44526d", runner: "#a5b9d9" },
] as const satisfies readonly { id: (typeof categories)[number]["room"]; label: string; paint: string; runner: string }[];

export interface LibraryRoom {
  id: string;
  label: string;
  paint: string;
  runner: string;
  shelves: RoomShelf[];
  topics: string[];
  stacks: RoomShelf[][];
}

type Section = Pick<LibraryRoom, "id" | "label" | "paint" | "runner">;

function makeRoom(section: Section): LibraryRoom {
  return { ...section, shelves: [], topics: [], stacks: [] };
}

function shelve(room: LibraryRoom, label: string, books: Book[]) {
  if (!books.length) return;
  room.topics.push(label);
  const count = Math.ceil(books.length / (room.id === "hall" ? 5 : 12));
  for (let i = 0; i < count; i++) {
    const row = books.slice(Math.floor(i * books.length / count), Math.floor((i + 1) * books.length / count));
    room.shelves.push({
      label: label + (count > 1 ? ` · ${i + 1}` : ""),
      books: row,
      faceOutCount: Math.min(row.length, Math.max(1, Math.floor((3.26 - row.length * 0.22) / 0.29))),
    });
  }
}

export function planRooms(books: Book[]): LibraryRoom[] {
  if (!books.length) return [];
  const hall = makeRoom({ id: "hall", label: "Main Reading Hall", paint: "#65705a", runner: "#dfc6a3" });
  const wings = sections.map(makeRoom);
  for (const category of categories) {
    const volumes = books.filter((book) => book.category === category.id);
    if (!volumes.length) continue;
    // Sample across the whole topic so newer, unranked books also reach the entrance.
    const hallBooks: Book[] = [], wingBooks: Book[] = [];
    volumes.forEach((book, i) => {
      if (books.length > 12 && i % 4 === 3) wingBooks.push(book);
      else hallBooks.push(book);
    });
    shelve(hall, category.label, hallBooks);
    const wing = wings.find((room) => room.id === category.room)!;
    shelve(wing, category.label, wingBooks);
  }
  const rooms = [hall, ...wings.filter((room) => room.shelves.length)];
  for (const room of rooms) {
    room.stacks = stackShelves(room.shelves, room === hall);
    for (const stack of room.stacks) {
      for (const shelf of stack.slice(groundRows)) shelf.upper = true;
    }
  }
  return rooms;
}
