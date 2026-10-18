import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { site } from "@/lib/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The image renderer has no serif fonts, so the wordmark is drawn from the real logo file.
async function asDataUrl(file: string) {
  const data = await readFile(path.join(process.cwd(), "public", "images", file));
  return `data:image/png;base64,${data.toString("base64")}`;
}

export default async function OpengraphImage() {
  const [logo, tree] = await Promise.all([asDataUrl("logo.png"), asDataUrl("tree.png")]);

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
          color: "#0b0b0b",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tree} width={146} height={162} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={640} height={110} alt="" style={{ marginTop: 40 }} />
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            border: "2px solid rgba(0,0,0,0.12)",
            borderRadius: 999,
            padding: "8px 22px",
            color: "rgba(0,0,0,0.6)",
          }}
        >
          The AI agent you can call for anything
        </div>
      </div>
    ),
    size,
  );
}
