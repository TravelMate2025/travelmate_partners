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
          background: "#edf3ff",
          color: "#14233f",
          display: "flex",
          fontFamily: "Verdana, Arial, Helvetica, sans-serif",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#033d89",
            borderBottomRightRadius: "220px",
            display: "flex",
            height: "100%",
            left: 0,
            position: "absolute",
            top: 0,
            width: "58%",
          }}
        />
        <div
          style={{
            background: "#fd6e1d",
            borderRadius: "999px",
            display: "flex",
            height: 250,
            position: "absolute",
            right: -74,
            top: -86,
            width: 250,
          }}
        />
        <div
          style={{
            background: "rgba(255,255,255,0.7)",
            borderRadius: "999px",
            display: "flex",
            height: 460,
            position: "absolute",
            right: -120,
            bottom: -210,
            width: 460,
          }}
        />
        <div
          style={{
            alignItems: "stretch",
            display: "flex",
            height: "100%",
            justifyContent: "space-between",
            padding: "64px 70px",
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 610,
            }}
          >
            <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
              <div
                style={{
                  alignItems: "center",
                  background: "#ffffff",
                  borderRadius: 22,
                  color: "#033d89",
                  display: "flex",
                  fontSize: 32,
                  fontWeight: 900,
                  height: 72,
                  justifyContent: "center",
                  width: 72,
                }}
              >
                TM
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ color: "#ffffff", fontSize: 34, fontWeight: 800 }}>TravelMate Partner</div>
                <div style={{ color: "#bdd3f5", fontSize: 22, fontWeight: 700 }}>Stays + Transfers</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ color: "#ffffff", fontSize: 72, fontWeight: 900, lineHeight: 1.03 }}>
                Grow your travel business from one console.
              </div>
              <div style={{ color: "#d9e7fb", fontSize: 30, fontWeight: 600, lineHeight: 1.34 }}>
                Onboard, verify, publish inventory, track bookings, and manage settlements with TravelMate.
              </div>
            </div>

            <div style={{ display: "flex", gap: 14 }}>
              {["Onboarding", "Inventory", "Bookings", "Payouts"].map((label) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    borderRadius: "999px",
                    color: "#ffffff",
                    fontSize: 22,
                    fontWeight: 800,
                    padding: "12px 18px",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              alignItems: "stretch",
              alignSelf: "center",
              background: "#ffffff",
              border: "1px solid rgba(3,61,137,0.15)",
              borderRadius: 30,
              boxShadow: "0 36px 80px rgba(3, 61, 137, 0.22)",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              height: 464,
              padding: 28,
              width: 420,
            }}
          >
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
              <div style={{ color: "#14233f", fontSize: 24, fontWeight: 900 }}>Partner console</div>
              <div
                style={{
                  background: "#eaf8f0",
                  borderRadius: "999px",
                  color: "#197348",
                  fontSize: 18,
                  fontWeight: 900,
                  padding: "8px 14px",
                }}
              >
                Live
              </div>
            </div>

            <div style={{ display: "flex", gap: 14 }}>
              {[
                ["Listings", "128", "#033d89"],
                ["Bookings", "42", "#fd6e1d"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  style={{
                    background: "#f4f7fc",
                    border: "1px solid #d9e4f4",
                    borderRadius: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: 18,
                    width: 174,
                  }}
                >
                  <div style={{ color: "#4d607f", fontSize: 18, fontWeight: 800 }}>{label}</div>
                  <div style={{ color, fontSize: 44, fontWeight: 900 }}>{value}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#f4f7fc",
                border: "1px solid #d9e4f4",
                borderRadius: 22,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 20,
              }}
            >
              <div style={{ color: "#14233f", fontSize: 20, fontWeight: 900 }}>Inventory health</div>
              {[
                ["Verified stays", "82%", "#033d89", 260],
                ["Transfer coverage", "68%", "#fd6e1d", 214],
                ["Ready for payout", "91%", "#197348", 292],
              ].map(([label, value, color, width]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ color: "#4d607f", fontSize: 16, fontWeight: 800 }}>{label}</div>
                    <div style={{ color: "#14233f", fontSize: 16, fontWeight: 900 }}>{value}</div>
                  </div>
                  <div style={{ background: "#dce6f5", borderRadius: "999px", display: "flex", height: 11 }}>
                    <div style={{ background: color, borderRadius: "999px", display: "flex", width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
