import MiniSearch, { type Options } from "minisearch";
import { categoryById } from "./categories";
import type { Book } from "./types";

function words(text: string) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]+(?:\+\+|#)?/gu) ?? [];
}

export const searchOptions = {
  fields: ["title", "names", "publisher", "topic", "description", "headings", "text"],
  tokenize: words,
  searchOptions: {
    combineWith: "AND",
    prefix: (term) => term.length >= 2,
    boost: { title: 12, names: 8, topic: 5, publisher: 5, description: 4, headings: 2 },
  },
} satisfies Options;

export function createIndex(books: Book[], readText?: (id: string) => string) {
  const index = new MiniSearch(searchOptions);
  index.addAll(books.map((book) => ({
    id: book.id,
    title: book.design.title,
    names: [book.skillName, book.slug, book.originalTitle].join(" "),
    topic: categoryById(book.category)?.label ?? "",
    publisher: [book.source.author, book.source.repo, book.source.series].join(" "),
    description: [book.design.subtitle, book.description].join(" "),
    headings: book.headings.map((h) => h.text).join(" "),
    text: readText?.(book.id) ?? "",
  })));
  return index;
}

export function findBooks(index: MiniSearch, byId: Map<string, Book>, query: string) {
  const terms = words(query).join(" ");
  if (!terms) return query.trim() ? [] : [...byId.values()].sort((a, b) => a.rank - b.rank);
  let hits = index.search(terms);
  if (!hits.length) {
    hits = index.search(terms, { fuzzy: (term) => term.length >= 5 ? 1 : false });
  }
  const matches = hits.flatMap(({ id, score }) => {
    const book = byId.get(id);
    if (!book) return [];
    const exact = [book.design.title, book.skillName, book.slug].some((name) => words(name).join(" ") === terms);
    return [{ book, exact, score }];
  });
  return matches.sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score || a.book.rank - b.book.rank)
    .map(({ book }) => book);
}
