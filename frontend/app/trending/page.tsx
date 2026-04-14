"use client";
import { useState, useEffect } from "react";
import { api, Business } from "@/lib/api";
import BusinessCard from "@/components/BusinessCard";

export default function TrendingPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(12);

  const load = async (l: number) => {
    setLoading(true);
    try {
      const r = await api.trending(l);
      setBusinesses(r.businesses);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(limit); }, [limit]);

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span className="gradient-text">Trending Now</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Top-rated businesses with the most engagement across Bengaluru
          </p>
        </div>
        <select
          className="input"
          style={{ width: "130px" }}
          value={limit}
          onChange={e => setLimit(+e.target.value)}
        >
          <option value={12}>Top 12</option>
          <option value={20}>Top 20</option>
          <option value={30}>Top 30</option>
          <option value={50}>Top 50</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
          {businesses.map((b, i) => (
            <div key={b.business_id} style={{ position: "relative" }}>
              <div style={{
                position: "absolute", top: "-10px", left: "-10px", zIndex: 10,
                width: "34px", height: "34px", borderRadius: "50%",
                background: i < 3
                  ? "linear-gradient(135deg, #f59e0b, #fb923c)"
                  : "linear-gradient(135deg, var(--accent-primary-dim), var(--accent-primary))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.78rem", fontWeight: 700, color: "white",
                boxShadow: i < 3
                  ? "0 2px 12px rgba(245,158,11,0.35)"
                  : "0 2px 12px var(--accent-primary-glow)",
                fontFamily: "Outfit, sans-serif",
              }}>
                {i + 1}
              </div>
              <BusinessCard biz={b} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
