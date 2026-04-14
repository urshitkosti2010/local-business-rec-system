import { Business } from "@/lib/api";
import Link from "next/link";

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: "var(--amber)", fontSize: "0.82rem", letterSpacing: "1px" }}>
      {"★".repeat(full)}
      {half ? "★" : ""}
      {"☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
      <span style={{ color: "var(--text-secondary)", marginLeft: "5px", fontSize: "0.78rem", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

export default function BusinessCard({ biz, showSimilarity }: { biz: Business; showSimilarity?: boolean }) {
  const catList = biz.categories
    ? biz.categories.split(",").slice(0, 2).map(c => c.trim())
    : [];

  return (
    <Link href={`/business/${biz.business_id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "18px 20px",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-light)";
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card-high)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <h3 style={{
            fontSize: "0.93rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.35,
            flex: 1,
            marginRight: "0.5rem",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {biz.name}
          </h3>
          {/* Open/Closed badge — teal for open */}
          <span style={{
            fontSize: "0.67rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "2px 8px",
            borderRadius: "20px",
            flexShrink: 0,
            background: biz.is_open ? "var(--teal-alpha)" : "var(--danger-alpha)",
            color: biz.is_open ? "var(--teal)" : "var(--danger)",
            border: `1px solid ${biz.is_open ? "rgba(45,212,191,0.2)" : "rgba(248,113,113,0.2)"}`,
          }}>
            {biz.is_open ? "Open" : "Closed"}
          </span>
        </div>

        {/* Location */}
        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.55rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {biz.area}, Bengaluru
        </div>

        {/* Stars */}
        <div style={{ marginBottom: "0.6rem" }}>
          <Stars rating={biz.stars} />
          <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)", marginLeft: "5px" }}>
            ({biz.review_count.toLocaleString()} reviews)
          </span>
        </div>

        {/* Category pills — muted, no colors */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "auto" }}>
          {catList.map(cat => (
            <span key={cat} style={{
              background: "var(--bg-card-highest)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              padding: "2px 9px",
              borderRadius: "20px",
              fontSize: "0.67rem",
              fontWeight: 500,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              fontFamily: "Inter, sans-serif",
            }}>
              {cat}
            </span>
          ))}
          {biz.is_successful === 1 && (
            <span style={{
              background: "var(--indigo-alpha)",
              color: "var(--indigo)",
              border: "1px solid rgba(124,106,247,0.2)",
              padding: "2px 9px",
              borderRadius: "20px",
              fontSize: "0.67rem",
              fontWeight: 600,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}>
              Top
            </span>
          )}
          {showSimilarity && biz.similarity_score !== undefined && (
            <span style={{
              background: "var(--bg-card-highest)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              padding: "2px 9px",
              borderRadius: "20px",
              fontSize: "0.67rem",
              fontWeight: 500,
            }}>
              {Math.round(biz.similarity_score * 100)}% match
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
