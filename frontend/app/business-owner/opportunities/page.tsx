"use client";
import { useState, useEffect } from "react";
import { api, GapAnalysis } from "@/lib/api";
import Link from "next/link";

export default function OpportunitiesPage() {
  const [area, setArea] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [result, setResult] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.areas().then(r => setAreas(r.areas)).catch(() => {});
  }, []);

  const analyse = async () => {
    if (!area) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await api.gapAnalysis(area);
      setResult(r);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    setLoading(false);
  };

  const potentialColors: Record<string, string> = { High: "var(--success)", Medium: "var(--warning)", Low: "var(--danger)" };

  return (
    <div style={{ maxWidth: "960px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/business-owner" style={{ color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Owner Hub
        </Link>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-tertiary-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          <span className="gradient-text">Gap Analysis</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Find underserved categories and untapped opportunities in any Bengaluru area</p>
      </div>

      {/* Area picker */}
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>Select Area</label>
            <select id="area-select" className="input" value={area} onChange={e => setArea(e.target.value)}>
              <option value="">Choose an area…</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button id="gap-btn" className="btn-primary" onClick={analyse} disabled={loading || !area}>
            {loading ? "Analysing…" : "Find Gaps"}
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
          <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>{result.area}</h2>
            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{result.total_businesses} businesses indexed</span>
          </div>

          {result.opportunities.length === 0 ? (
            <div className="glass" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.75rem", display: "block" }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              No significant gaps found in {result.area} — market is well-covered!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {result.opportunities.map((opp, i) => (
                <div key={opp.category} className="glass" style={{ padding: "1.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-primary-dim), var(--accent-primary))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.78rem", fontWeight: 700, color: "white", flexShrink: 0,
                        fontFamily: "Outfit, sans-serif",
                        boxShadow: "0 2px 10px var(--accent-primary-glow)",
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", fontFamily: "Outfit, sans-serif" }}>{opp.category}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{opp.reason}</div>
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: `color-mix(in srgb, ${potentialColors[opp.potential]} 12%, transparent)`,
                      color: potentialColors[opp.potential],
                      border: `1px solid color-mix(in srgb, ${potentialColors[opp.potential]} 25%, transparent)`,
                      fontSize: "0.78rem",
                    }}>
                      {opp.potential} Potential
                    </span>
                  </div>

                  {/* Gap score bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", width: "65px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Gap Score</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${opp.gap_score}%` }} />
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-primary)", width: "42px", textAlign: "right", fontFamily: "Outfit, sans-serif" }}>{opp.gap_score}%</span>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.85rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <span>Current: <strong style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}>{opp.current_count}</strong></span>
                    <span>City avg: <strong style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}>{opp.city_avg_count.toFixed(1)}</strong></span>
                    {opp.avg_rating && <span>Area avg ★: <strong style={{ color: "#f59e0b", fontFamily: "Outfit, sans-serif" }}>{opp.avg_rating}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
