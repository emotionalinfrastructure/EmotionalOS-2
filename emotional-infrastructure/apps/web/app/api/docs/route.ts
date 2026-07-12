import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Serves the monorepo's real docs/*.md files -- not placeholder content.
// process.cwd() is apps/web when run via `next dev`/`next start`, so the
// docs directory is two levels up. DOCS_DIR overrides this for the Docker
// image, where the standalone server layout differs (see apps/web/Dockerfile).
const DOCS_DIR = process.env.DOCS_DIR || path.join(process.cwd(), "..", "..", "docs");

export async function GET() {
  try {
    const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".md")).sort();
    const docs = await Promise.all(
      files.map(async (file) => ({
        name: file,
        content: await readFile(path.join(DOCS_DIR, file), "utf-8"),
      })),
    );
    return NextResponse.json({ docs });
  } catch (err) {
    return NextResponse.json({ docs: [], error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
