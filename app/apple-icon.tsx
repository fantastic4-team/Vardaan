import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The home-screen icon reuses the favicon artwork, drawn full-bleed (iOS rounds the corners itself).
export default async function AppleIcon() {
  const svg = (await readFile(path.join(process.cwd(), "app", "icon.svg"), "utf8")).replaceAll('rx="14"', 'rx="0"');
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} width={180} height={180} alt="" />
    ),
    size,
  );
}
