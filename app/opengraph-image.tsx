import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            border: "2px solid rgba(0,0,0,0.12)",
            borderRadius: 999,
            padding: "8px 22px",
            color: "rgba(0,0,0,0.6)",
          }}
        >
          Beta · Early access
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 150, fontWeight: 800, fontFamily: "serif" }}>
          VARDAAN
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 34, color: "rgba(0,0,0,0.55)" }}>
          Join the waitlist for early access
        </div>
      </div>
    ),
    size,
  );
}
