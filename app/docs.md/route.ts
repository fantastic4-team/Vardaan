import { docsMarkdown } from "@/lib/docs-content";
import { site } from "@/lib/site";

// The docs as a plain Markdown file, for copying into GitHub, Notion or a README.
export function GET() {
  return new Response(docsMarkdown(site.url), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'inline; filename="vardaan-docs.md"' },
  });
}
