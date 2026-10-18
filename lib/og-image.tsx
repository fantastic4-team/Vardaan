import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const ogSize = { width: 1200, height: 630 };

const read = (...parts: string[]) => readFile(path.join(process.cwd(), ...parts));

// Shared by the Open Graph and Twitter images. The wordmark comes from the real logo file, and
// text is set in Inter like the rest of the site (the renderer needs .woff, not .woff2).
export async function renderOgImage() {
  const [logo, tree, inter] = await Promise.all([
    read("public", "images", "logo.png"),
    read("public", "images", "tree.png"),
    read("node_modules", "@fontsource", "inter", "files", "inter-latin-500-normal.woff"),
  ]);
  const dataUrl = (buf: Buffer) => `data:image/png;base64,${buf.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontFamily: "Inter",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl(tree)} width={146} height={162} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl(logo)} width={560} height={96} alt="" style={{ marginTop: 40 }} />
        <div style={{ display: "flex", marginTop: 36, fontSize: 30, color: "#a9a9a9" }}>
          The AI agent you can call for anything.
        </div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Inter", data: inter, weight: 500, style: "normal" }] },
  );
}
