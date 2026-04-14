"use client";
import { useEffect, useState } from "react";
import { api, PlatformStats } from "@/lib/api";
import Link from "next/link";

const ownerTools = [
  {
    href: "/business-owner/market-analysis",
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
    title: "Market Analysis",
    desc: "Analyse competitor density, saturation and demand in any Bengaluru area",
    color: "var(--accent-secondary)",
  },
  {
    href: "/business-owner/predict",
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    title: "Success Predictor",
    desc: "Get an AI-powered probability score before opening your business",
    color: "var(--accent-primary)",
  },
  {
    href: "/business-owner/opportunities",
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-tertiary-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
    title: "Gap Analysis",
    desc: "Uncover underserved categories and untapped opportunities by area",
    color: "var(--accent-tertiary-dim)",
  },
];

export default function OwnerDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => { api.stats().then(setStats).catch(() => {}); }, []);

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2.75rem" }}>
        <h1 style={{ fontSize: "2.6rem", fontWeight: 800, marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>
          <span className="gradient-text">Business Owner Hub</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "560px", lineHeight: 1.6 }}>
          Intelligence tools powered by ML models trained on real business data — remapped to Bengaluru.
        </p>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="glass fade-up" style={{ padding: "1.75rem", marginBottom: "2.25rem" }}>
          <h3 style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem", fontWeight: 600 }}>Platform Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1.5rem" }}>
            {[
              { label: "Businesses indexed", value: stats.total_businesses.toLocaleString(), color: "var(--accent-primary)" },
              { label: "Total reviews", value: (stats.total_reviews / 1000).toFixed(0) + "K", color: "var(--accent-secondary)" },
              { label: "Areas covered", value: String(stats.total_areas), color: "var(--accent-tertiary-dim)" },
              { label: "Business categories", value: String(stats.total_categories), color: "#fb923c" },
              { label: "Avg city rating", value: String(stats.avg_rating) + " ★", color: "#f59e0b" },
              { label: "Success rate", value: stats.success_rate + "%", color: "var(--success)" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(275px, 1fr))", gap: "1.25rem" }}>
        {ownerTools.map(tool => (
          <Link key={tool.href} href={tool.href} style={{ textDecoration: "none" }}>
            <div className="glass" style={{ padding: "2rem", height: "100%", cursor: "pointer", display: "flex", flexDirection: "column" }}>
              <div style={{ marginBottom: "1rem" }}>{tool.icon}</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.6rem", fontFamily: "Outfit, sans-serif" }}>{tool.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65, flex: 1 }}>{tool.desc}</p>
              <div style={{
                marginTop: "1.5rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                color: tool.color,
                fontSize: "0.85rem",
                fontWeight: 600,
              }}>
                Launch tool
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
