import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const tree = await readFile(path.join(process.cwd(), "public", "images", "tree.png"));
  const src = `data:image/png;base64,${tree.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={138} height={154} alt="" />
      </div>
    ),
    size,
  );
}
