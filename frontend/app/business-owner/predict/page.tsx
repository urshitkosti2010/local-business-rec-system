"use client";
import { useState, useEffect } from "react";
import { api, SuccessPrediction } from "@/lib/api";
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

function GaugeMeter({ probability }: { probability: number }) {
  const color = probability >= 70 ? "var(--success)" : probability >= 50 ? "var(--warning)" : "var(--danger)";
  const circumference = 2 * Math.PI * 52;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 0" }}>
      <svg width="150" height="95" viewBox="0 0 150 95">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--danger)" />
            <stop offset="50%" stopColor="var(--warning)" />
            <stop offset="100%" stopColor="var(--success)" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={circumference / 2} strokeLinecap="round" transform="rotate(180,75,75)" />
        <circle cx="75" cy="75" r="52" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={circumference / 2 + (circumference / 2) * (1 - probability / 100)}
          strokeLinecap="round" transform="rotate(180,75,75)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="75" y="72" textAnchor="middle" fill={color} fontSize="24" fontWeight="800" fontFamily="Outfit, sans-serif">{probability}%</text>
        <text x="75" y="88" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="Inter, sans-serif" letterSpacing="0.1em">SUCCESS PROB.</text>
      </svg>
    </div>
  );
}

export default function PredictPage() {
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState(2);
  const [areas, setAreas] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [result, setResult] = useState<SuccessPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.areas().then(r => setAreas(r.areas)).catch(() => {});
    api.categories().then(r => setCats(r.categories.slice(0, 60))).catch(() => {});
  }, []);

  const predict = async () => {
    if (!area || !category) return;
    setLoading(true); setError(""); setResult(null);
    const [lat, lng] = getCoords(area);
    try {
      const r = await api.predictSuccess({ latitude: lat, longitude: lng, category, area, radius_km: radius });
      setResult(r);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    setLoading(false);
  };

  const riskColors: Record<string, string> = { Low: "var(--success)", Medium: "var(--warning)", High: "var(--danger)" };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/business-owner" style={{ color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Owner Hub
        </Link>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <span className="gradient-text">Success Predictor</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>ML-powered success probability for your planned business location</p>
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
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", display: "block", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>Business Type</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select type…</option>
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
          <button id="predict-btn" className="btn-primary" onClick={predict} disabled={loading || !area || !category}>
            {loading ? "Predicting…" : "Predict"}
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
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            {/* Gauge card */}
            <div className="glass pulse-glow" style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <GaugeMeter probability={result.success_probability} />
              <span className="badge" style={{
                background: `color-mix(in srgb, ${riskColors[result.risk_level]} 12%, transparent)`,
                color: riskColors[result.risk_level],
                border: `1px solid color-mix(in srgb, ${riskColors[result.risk_level]} 25%, transparent)`,
                fontSize: "0.82rem", padding: "5px 14px", marginTop: "0.5rem",
              }}>
                {result.risk_level} Risk
              </span>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>
                Confidence: {result.confidence}%
              </p>
            </div>

            {/* Recommendation */}
            <div className="glass" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.85rem", fontFamily: "Outfit, sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Verdict
              </h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1.5rem", lineHeight: 1.65 }}>
                {result.recommendation}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                {[
                  { label: "Nearby Competitors", value: String(result.competitor_count) },
                  { label: "Avg Competitor Rating", value: (result.avg_competitor_rating?.toFixed(1) ?? "N/A") + " ★" },
                  { label: "Area Total Reviews", value: result.area_total_reviews.toLocaleString() },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Factors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div className="glass" style={{ padding: "1.35rem" }}>
              <h4 style={{ fontSize: "0.88rem", color: "var(--success)", fontWeight: 700, marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "Outfit, sans-serif" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Positive Signals
              </h4>
              {result.positive_factors.map((f, i) => (
                <div key={i} style={{ fontSize: "0.84rem", color: "var(--text-secondary)", padding: "0.4rem 0", borderBottom: i < result.positive_factors.length - 1 ? "1px solid var(--border)" : "none", lineHeight: 1.5 }}>{f}</div>
              ))}
            </div>
            <div className="glass" style={{ padding: "1.35rem" }}>
              <h4 style={{ fontSize: "0.88rem", color: "var(--danger)", fontWeight: 700, marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "Outfit, sans-serif" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                Risk Factors
              </h4>
              {result.negative_factors.map((f, i) => (
                <div key={i} style={{ fontSize: "0.84rem", color: "var(--text-secondary)", padding: "0.4rem 0", borderBottom: i < result.negative_factors.length - 1 ? "1px solid var(--border)" : "none", lineHeight: 1.5 }}>{f}</div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="glass" style={{ padding: "1.35rem" }}>
            <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "Outfit, sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
              Recommendations
            </h4>
            {result.suggestions.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "0.6rem", padding: "0.4rem 0", borderBottom: i < result.suggestions.length - 1 ? "1px solid var(--border)" : "none", fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--accent-primary)", flexShrink: 0, fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>{i + 1}.</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
