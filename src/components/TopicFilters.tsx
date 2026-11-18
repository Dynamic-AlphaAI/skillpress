import { categories } from "@/lib/categories";
import type { Library } from "@/lib/types";
import { LibraryIcon } from "./LibraryIcons";
import s from "./TopicFilters.module.css";

export function TopicFilters({
  library,
  category,
  author,
  onFilter,
}: {
  library: Library;
  category: string;
  author: string;
  onFilter: (patch: { category?: string; author?: string }) => void;
}) {
  const topics = new Map<string, number>();
  const authors = new Map<string, number>();
  const onShelf = new Set(library.books.map((book) => book.category));
  for (const book of library.books) {
    if (author === "all" || author === book.source.authorId) {
      topics.set(book.category, (topics.get(book.category) ?? 0) + 1);
    }
    if (category === "all" || category === book.category) {
      authors.set(book.source.authorId, (authors.get(book.source.authorId) ?? 0) + 1);
    }
  }
  return (
    <div className={s.filters}>
      <label>
        <span>Topic</span>
        <select value={category} onChange={(e) => onFilter({ category: e.target.value })}>
          <option value="all">All topics</option>
          {categories
            .filter((topic) => onShelf.has(topic.id))
            .map((topic) => (
              <option key={topic.id} value={topic.id} disabled={!topics.has(topic.id)}>
                {topic.label} ({topics.get(topic.id) ?? 0})
              </option>
            ))}
        </select>
        <LibraryIcon name="down" size={14} />
      </label>
      <label>
        <span>Author</span>
        <select value={author} onChange={(e) => onFilter({ author: e.target.value })}>
          <option value="all">All authors</option>
          {library.authors.map((a) => (
            <option key={a.id} value={a.id} disabled={!authors.has(a.id)}>
              {a.name} ({authors.get(a.id) ?? 0})
            </option>
          ))}
        </select>
        <LibraryIcon name="down" size={14} />
      </label>
    </div>
  );
}
