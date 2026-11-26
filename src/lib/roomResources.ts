export interface BookPosition {
  x: number;
  y: number;
  z: number;
}

/** Keep graphics memory bounded as the catalogue grows, including in the main hall. */
export function nearbyBooks<T extends { position: BookPosition }>(books: T[], eye: BookPosition, limit: number, radius: number): T[] {
  const distance = (book: T) => (book.position.x - eye.x) ** 2 + (book.position.y - eye.y) ** 2 + (book.position.z - eye.z) ** 2;
  return books.map(book => ({ book, distance: distance(book) }))
    .filter(item => item.distance <= radius ** 2)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit).map(item => item.book);
}

/** Avoid simultaneous image decodes spiking a phone's memory. */
export function artworkQueue(limit: number) {
  const waiting: { task: () => Promise<void>; signal: AbortSignal }[] = [];
  let active = 0;
  let disposed = false;
  function drain() {
    while (!disposed && active < limit && waiting.length) {
      const item = waiting.shift()!;
      if (item.signal.aborted) continue;
      active++;
      void Promise.resolve().then(() => {
        if (!item.signal.aborted) return item.task();
      }).catch(() => { /* A missing image keeps the book's printed base colour. */ }).finally(() => {
        active--;
        drain();
      });
    }
  }
  return {
    add(task: () => Promise<void>, signal: AbortSignal) {
      if (disposed || signal.aborted) return;
      waiting.push({ task, signal });
      drain();
    },
    dispose() { disposed = true; waiting.length = 0; },
  };
}
