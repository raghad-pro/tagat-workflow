import { ImageResponse } from "next/og";
import { SEO_COPY, SITE_NAME } from "@/config/seo";

export const runtime = "edge";
export const alt = SEO_COPY.en.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b1118 0%, #0f2a33 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#25C6DA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              color: "#0b1118",
            }}
          >
            W
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Manage your projects and unite your team in one place
          </div>
          <div style={{ fontSize: 30, color: "#a7c4cb", lineHeight: 1.35, maxWidth: 1000 }}>
            Projects, sprints, tasks, timesheets, invoices and meetings — for agile teams.
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#25C6DA" }}>workflownets.com</div>
      </div>
    ),
    size
  );
}
