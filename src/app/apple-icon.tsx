import { ImageResponse } from "next/og";

// Home-screen icon: the same three pips as icon.svg. iOS rounds the corners
// itself, so the background is full-bleed. ImageResponse can't read CSS
// tokens, so these are the globals.css OKLCH values converted to hex.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const pip = { width: 40, height: 40 };

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "#12202f",
        }}
      >
        <div style={{ ...pip, borderRadius: "50%", background: "#f9d544" }} />
        <div style={{ ...pip, borderRadius: "50%", background: "#62bbf5" }} />
        <div style={{ ...pip, borderRadius: 14, background: "#b682ed" }} />
      </div>
    ),
    size
  );
}
