import { ImageResponse } from "next/og";

export const alt = "Misbah Salam — The Brand Strategist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#090a0a",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 56, height: 64, display: "flex", border: "3px solid #ffffff" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 25, fontWeight: 700, letterSpacing: 7 }}>MISBAH SALAM</span>
          <span style={{ marginTop: 9, fontSize: 14, letterSpacing: 5 }}>THE BRAND STRATEGIST</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 950 }}>
        <span style={{ color: "#68a8f2", fontSize: 21, fontWeight: 700, letterSpacing: 3 }}>
          BRAND STRATEGY · POSITIONING · ADVISORY
        </span>
        <span style={{ marginTop: 24, fontSize: 64, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
          Build a brand customers choose—and competitors cannot copy.
        </span>
      </div>
      <div style={{ width: 190, height: 7, display: "flex", background: "#2874d4" }} />
    </div>,
    size,
  );
}
