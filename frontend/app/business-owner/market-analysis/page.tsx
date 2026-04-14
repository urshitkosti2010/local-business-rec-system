"use client";
import { useState, useEffect } from "react";
import { api, MarketAnalysis } from "@/lib/api";
import Link from "next/link";

const AREA_COORDS: Record<string, [number, number]> = {
  "Koramangala": [12.9279, 77.6271], "Indiranagar": [12.9784, 77.6408],
  "MG Road": [12.9756, 77.6099], "HSR Layout": [12.9116, 77.6389],
  "Whitefield": [12.9698, 77.7499], "Electronic City": [12.8458, 77.6603],
  "BTM Layout": [12.9166, 77.6101], "Jayanagar": [12.9252, 77.5938],
  "Marathahalli": [12.9591, 77.7010], "Sadashivanagar": [13.0072, 77.5744],
  "JP Nagar": [12.9063, 77.5850], "Rajajinagar": [12.9921, 77.5538],
  "Malleshwaram": [13.0038, 77.5715], "Basavanagudi": [12.9429, 77.5748],
  "Hebbal": [13.0350, 77.5970], "Bellandur": [12.9257, 77.6767],
  "Sarjapur Road": [12.9094, 77.6841], "RT Nagar": [13.0228, 77.5937],
  "Yelahanka": [13.1007, 77.5963], "Banashankari": [12.9255, 77.5468],
  "Vijayanagar": [12.9719, 77.5330], "Wilson Garden": [12.9401, 77.5978],
  "Domlur": [12.9609, 77.6387], "Hennur": [13.0452, 77.6384],
  "Bannerghatta Road": [12.8880, 77.5970],
};

function getCoords(area: string) { return AREA_COORDS[area] ?? [12.9716, 77.5946]; }

const SATURATION_COLOR = (s: number) => s > 70 ? "var(--danger)" : s > 40 ? "var(--warning)" : "var(--success)";

const metricIcons = [
  <svg key="comp" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><rect x="2" y="7" width="20" height="5" rx="1"/></svg>,
  <svg key="star" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  <svg key="chat" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
  <svg key="trend" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
];

export default function MarketAnalysisPage() {
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState(2);
  const [areas, setAreas] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [result, setResult] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.areas().then(r => setAreas(r.areas)).catch(() => {});
    api.categories().then(r => setCats(r.categories.slice(0, 60))).catch(() => {});
  }, []);

  const run = async () => {
    if (!area || !category) return;
    setLoading(true); setError(""); setResult(null);
    const [lat, lng] = getCoords(area);
    try {
      const r = await api.marketAnalysis({ latitude: lat, longitude: lng, category, area_name: area, radius_km: radius });
      setResult(r);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "960px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/business-owner" style={{ color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Owner Hub
        </Link>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          <span className="gradient-text">Market Analysis</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Analyse competition density, demand and saturation for any category in Bengaluru</p>
      </div>

      {/* Form */}
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "0.75rem", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>Area</label>
            <select className="input" value={area} onChange={e => setArea(e.target.value)}>
              <option value="">Select area…</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category…</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>Radius</label>
            <select className="input" style={{ width: "95px" }} value={radius} onChange={e => setRadius(+e.target.value)}>
              <option value={1}>1 km</option>
              <option value={2}>2 km</option>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
            </select>
          </div>
          <button id="analyse-btn" className="btn-primary" onClick={run} disabled={loading || !area || !category}>
            {loading ? "Analysing…" : "Analyse"}
          </button>
        </div>
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        {error}
      </div>}
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><div className="spinner" /></div>}

      {result && (
        <div className="fade-up">
          {/* Saturation overview */}
          <div className="glass" style={{ padding: "1.75rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>{result.category} in {result.location}</h3>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>within {result.radius_km} km radius</div>
              </div>
              <span className="badge" style={{
                background: `color-mix(in srgb, ${SATURATION_COLOR(result.analysis.saturation_score)} 12%, transparent)`,
                color: SATURATION_COLOR(result.analysis.saturation_score),
                border: `1px solid color-mix(in srgb, ${SATURATION_COLOR(result.analysis.saturation_score)} 25%, transparent)`,
                fontSize: "0.85rem", padding: "6px 14px",
              }}>
                {result.analysis.density_level} Density
              </span>
            </div>

            <div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Market Saturation</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: SATURATION_COLOR(result.analysis.saturation_score), fontFamily: "Outfit, sans-serif" }}>{result.analysis.saturation_score}%</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: "1.5rem" }}>
              <div className="progress-fill" style={{ width: `${result.analysis.saturation_score}%`, background: SATURATION_COLOR(result.analysis.saturation_score) }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1.25rem" }}>
              {[
                { label: "Competitors", value: String(result.analysis.total_competitors), icon: metricIcons[0] },
                { label: "Avg Rating", value: result.analysis.avg_competitor_rating ? result.analysis.avg_competitor_rating.toFixed(1) + " ★" : "N/A", icon: metricIcons[1] },
                { label: "Total Reviews", value: result.analysis.total_area_reviews.toLocaleString(), icon: metricIcons[2] },
                { label: "Demand", value: result.analysis.demand_indicator, icon: metricIcons[3] },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ color: "var(--accent-primary)", marginBottom: "0.35rem", display: "flex", justifyContent: "center" }}>{s.icon}</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem", padding: "0.85rem 1.1rem", background: "rgba(186,158,255,0.05)", borderRadius: "12px", fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: "0.5rem", lineHeight: 1.6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "3px", flexShrink: 0 }}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
              {result.analysis.recommendation}
            </div>
          </div>

          {/* Top competitors */}
          {result.top_competitors.length > 0 && (
            <div className="glass" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", fontFamily: "Outfit, sans-serif" }}>Top Competitors</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {result.top_competitors.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: i < result.top_competitors.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", width: "20px", fontFamily: "Outfit, sans-serif" }}>{i + 1}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          {c.area}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#f59e0b", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>{c.rating.toFixed(1)} ★</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.reviews.toLocaleString()} reviews</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
