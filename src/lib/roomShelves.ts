import { categories } from "./categories";
import type { Book } from "./types";

export interface RoomShelf {
  label: string;
  books: Book[];
  faceOutCount: number;
}

/** Balance each subject across shelves so a thirteenth book never sits alone. */
export function planShelves(books: Book[]): RoomShelf[] {
  return categories.flatMap((category) => {
    const volumes = books.filter((book) => book.category === category.id);
    const count = Math.ceil(volumes.length / 12);
    return Array.from({ length: count }, (_, index) => {
      const start = Math.floor((index * volumes.length) / count);
      const end = Math.floor(((index + 1) * volumes.length) / count);
      const row = volumes.slice(start, end);
      const faceOutCount = Math.min(row.length, Math.max(1, Math.floor((3.26 - row.length * 0.22) / 0.29)));
      return {
        label: category.label + (count > 1 ? ` · ${index + 1}` : ""),
        books: row,
        faceOutCount,
      };
    });
  });
}
