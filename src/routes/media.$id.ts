import { createFileRoute } from "@tanstack/react-router";

async function photoResponse(id: string, request: Request) {
  if (!/^(?:[a-f0-9]{32}|[a-f0-9]{64})$/.test(id)) {
    return new Response("Photo introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const [photo] = await sql<{ bytes: Uint8Array; content_type: string }>`
    select bytes, content_type from catalog_photos where id = ${id}
  `;
  if (!photo) {
    return new Response("Photo introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const etag = `"${id}"`;
  const headers = {
    "Content-Type": photo.content_type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    ETag: etag,
  };
  if (
    request.headers.get("if-none-match")?.split(",")
      .some((value) => value.trim().replace(/^W\//, "") === etag)
  ) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(request.method === "HEAD" ? null : new Uint8Array(photo.bytes), {
    headers: { ...headers, "Content-Length": String(photo.bytes.byteLength) },
  });
}

export const Route = createFileRoute("/media/$id")({
  server: {
    handlers: {
      GET: ({ params, request }) => photoResponse(params.id, request),
      HEAD: ({ params, request }) => photoResponse(params.id, request),
    },
  },
});
