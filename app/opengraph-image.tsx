import { renderOgImage, ogSize } from "@/lib/og-image";
import { site } from "@/lib/site";

export const alt = site.title;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
