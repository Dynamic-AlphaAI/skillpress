import { loadLibrary, readSkillFile } from "@/lib/library";
import { createIndex } from "@/lib/search";

export function GET() {
  const index = createIndex(loadLibrary().books, (id) => readSkillFile(id).content);
  return Response.json(index);
}
