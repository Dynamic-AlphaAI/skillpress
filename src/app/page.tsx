import { Press } from "@/components/Press";
import { loadLibrary } from "@/lib/library";

/** Fully static: the library is read at build time and the URL is read in the browser. */
export default function Home() {
  return <Press library={loadLibrary()} />;
}
