import type { Book, Library } from "./types";

export const platforms = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "codex", label: "Codex" },
  { id: "claude", label: "Claude" },
  { id: "grok", label: "Grok" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "cursor", label: "Cursor" },
  { id: "gemini", label: "Gemini" },
  { id: "copilot", label: "GitHub Copilot" },
] as const;

export type Platform = (typeof platforms)[number]["id"];
export type Collection = Platform | "all";
export const platformLabel = (id: Platform) => platforms.find(p => p.id === id)!.label;
export const resolvePlatform = (value: string | null): Collection => platforms.find(p => p.id === value)?.id ?? "all";

export function inCollection(book: Book, platform: Collection) {
  return platform === "all" || book.platforms.includes(platform) || book.covers.includes(platform);
}

export function collectionCredit(book: Book, platform: Collection) {
  if (platform === "all") return book.source.author;
  const role = book.platforms.includes(platform) ? "Runs in" : "Covers";
  return `${book.source.author} · ${role} ${platformLabel(platform)}`;
}

export function scopeLibrary(library: Library, platform: Collection): Library {
  if (platform === "all") return library;
  const books = library.books.filter(book => inCollection(book, platform));
  const counts = new Map<string, number>();
  for (const book of books) counts.set(book.source.authorId, (counts.get(book.source.authorId) ?? 0) + 1);
  const authors = library.authors.filter(a => counts.has(a.id)).map(a => ({ ...a, count: counts.get(a.id)! }));
  return { ...library, books, authors };
}
