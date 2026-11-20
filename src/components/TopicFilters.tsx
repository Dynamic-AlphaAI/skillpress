import { platforms, resolvePlatform, type Collection } from "@/lib/platforms";
import type { Book, Library } from "@/lib/types";
import { LibraryIcon } from "./LibraryIcons";
import s from "./TopicFilters.module.css";

export function TopicFilters({
  library,
  matches = library.books,
  category,
  author,
  platform,
  onPlatform,
  onFilter,
}: {
  library: Library;
  matches?: Book[];
  category: string;
  author: string;
  platform: Collection;
  onPlatform: (value: Collection) => void;
  onFilter: (patch: { category?: string; author?: string }) => void;
}) {
  const authors = new Map<string, number>();
  for (const book of matches) {
    if (category === "all" || category === book.category) {
      authors.set(book.source.authorId, (authors.get(book.source.authorId) ?? 0) + 1);
    }
  }
  return (
    <div className={s.filters}>
      <label>
        <span>AI platform</span>
        <select aria-label="AI platform" value={platform} onChange={e => onPlatform(resolvePlatform(e.target.value))}>
          <option value="all">Any platform</option>
          {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
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
