import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TravelMate Partner console preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f7faf8",
          color: "#10201a",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, Helvetica, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "76px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              background: "#0f6b4f",
              borderRadius: "18px",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 800,
              padding: "18px 24px",
            }}
          >
            TravelMate Partner
          </div>
          <div style={{ color: "#527065", fontSize: 28, fontWeight: 700 }}>Stays + Transfers</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, maxWidth: 920 }}>
            Grow your travel business from one partner console.
          </div>
          <div style={{ color: "#3d5d51", fontSize: 34, lineHeight: 1.28, maxWidth: 860 }}>
            Onboard, verify, publish inventory, track bookings, and manage settlements with TravelMate.
          </div>
        </div>
        <div style={{ display: "flex", gap: "18px" }}>
          {["Onboarding", "Inventory", "Reports", "Settlements"].map((label) => (
            <div
              key={label}
              style={{
                border: "2px solid #b9d8c8",
                borderRadius: "999px",
                color: "#1e4f3e",
                fontSize: 26,
                fontWeight: 700,
                padding: "14px 22px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
