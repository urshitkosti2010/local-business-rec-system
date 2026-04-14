"use client";
import { useState, useEffect, useCallback } from "react";
import { api, Business, PlatformStats } from "@/lib/api";
import BusinessCard from "@/components/BusinessCard";

const statIcons = [
  <svg key="biz" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><rect x="2" y="7" width="20" height="5" rx="1"/></svg>,
  <svg key="rev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  <svg key="area" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  <svg key="cat" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  <svg key="avg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
];
const statColors = ["#ba9eff", "#53ddfc", "#9bffce", "#fb923c", "#f59e0b"];

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass" style={{ padding: "1.25rem 1.5rem", flex: 1, minWidth: "155px" }}>
      <div style={{ color, marginBottom: "0.5rem", opacity: 0.8 }}>{icon}</div>
      <div style={{ fontSize: "1.7rem", fontWeight: 800, color, fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.areas().then(r => setAreas(r.areas)).catch(() => {});
    api.categories().then(r => setCats(r.categories.slice(0, 60))).catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true); setError(""); setSearched(true);
    try {
      const r = await api.search(query, category || undefined, area || undefined);
      setBusinesses(r.businesses);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [query, category, area]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") doSearch(); };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Hero */}
      <div style={{ marginBottom: "2.75rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1.1, marginBottom: "0.85rem" }}>
          <span className="gradient-text">Discover Bengaluru</span><br />
          <span style={{ color: "var(--text-primary)" }}>Businesses & Hotspots</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "540px", lineHeight: 1.6 }}>
          AI-powered insights across {stats?.total_businesses?.toLocaleString() ?? "…"} businesses.
          Find the best spots, hidden gems, and market opportunities.
        </p>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.25rem" }} className="fade-up">
          <StatCard label="Businesses" value={stats.total_businesses.toLocaleString()} icon={statIcons[0]} color={statColors[0]} />
          <StatCard label="Reviews" value={(stats.total_reviews / 1000).toFixed(0) + "K"} icon={statIcons[1]} color={statColors[1]} />
          <StatCard label="Areas" value={String(stats.total_areas)} icon={statIcons[2]} color={statColors[2]} />
          <StatCard label="Categories" value={String(stats.total_categories)} icon={statIcons[3]} color={statColors[3]} />
          <StatCard label="Avg Rating" value={String(stats.avg_rating)} icon={statIcons[4]} color={statColors[4]} />
        </div>
      )}

      {/* Search bar */}
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "2.25rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            id="search-input"
            className="input"
            style={{ flex: "2", minWidth: "180px" }}
            placeholder="Search business name or type…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <select className="input" style={{ flex: 1, minWidth: "150px" }} value={area} onChange={e => setArea(e.target.value)}>
            <option value="">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="input" style={{ flex: 1, minWidth: "150px" }} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button id="search-btn" className="btn-primary" onClick={doSearch} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}

      {!searched && !loading && (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "4rem 0" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", opacity: 0.3, display: "block" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <p style={{ maxWidth: "360px", margin: "0 auto", lineHeight: 1.6 }}>Search above to discover businesses — or head to <a href="/trending" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>Trending</a> to see what's popular.</p>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div className="spinner" />
        </div>
      )}

      {searched && !loading && businesses.length === 0 && !error && (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "3rem" }}>No results found</div>
      )}

      {businesses.length > 0 && (
        <div className="fade-up">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            {businesses.length} results
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
            {businesses.map(b => <BusinessCard key={b.business_id} biz={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}
