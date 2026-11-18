import { readCatalog, readEdition } from "@/lib/library";

export function generateStaticParams() {
  return readCatalog().books.map(({ id }) => ({ id }));
}

export async function GET(_request: Request, context: RouteContext<"/editions/[id]">) {
  const { id } = await context.params;
  const html = readEdition(id);
  if (html === null) return new Response(null, { status: 404 });
  return Response.json({ html });
}
