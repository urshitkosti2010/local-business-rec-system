"use client";
import { useState, useEffect } from "react";
import { api, Business } from "@/lib/api";
import BusinessCard from "@/components/BusinessCard";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function BusinessDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  const [biz, setBiz] = useState<Business | null>(null);
  const [similar, setSimilar] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [b, s] = await Promise.all([
          api.business(id),
          api.similar(id).catch(() => ({ source: null as unknown as Business, similar: [] })),
        ]);
        setBiz(b);
        setSimilar(s.similar);
      } catch { setError("Business not found"); }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><div className="spinner" /></div>;
  if (error || !biz) return <div style={{ color: "var(--danger)", padding: "2rem" }}>{error || "Not found"}</div>;

  const cats = biz.categories ? biz.categories.split(",").map(c => c.trim()) : [];

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Back */}
      <Link href="/" style={{ color: "var(--text-muted)", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "1.75rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Search
      </Link>

      {/* Main card */}
      <div className="glass fade-up" style={{ padding: "2.25rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif" }}>{biz.name}</h1>
              {biz.is_successful === 1 && (
                <span className="badge badge-green" style={{ fontSize: "0.75rem" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "3px" }}><polyline points="20 6 9 17 4 12"/></svg>
                  Top Rated
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {biz.address || biz.area}, {biz.area}, Bengaluru
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2.8rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "#f59e0b", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {biz.stars.toFixed(1)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>{biz.review_count.toLocaleString()} reviews</div>
          </div>
        </div>

        <hr className="divider" />

        {/* Stats row */}
        <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>Status</div>
            <div style={{
              color: biz.is_open ? "var(--success)" : "var(--danger)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}>
              <span style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: biz.is_open ? "var(--success)" : "var(--danger)",
                boxShadow: biz.is_open ? "0 0 8px rgba(88,231,171,0.5)" : "0 0 8px rgba(255,110,132,0.5)",
              }} />
              {biz.is_open ? "Open" : "Closed"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>Area</div>
            <div style={{ fontWeight: 600 }}>{biz.area}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>Primary Type</div>
            <div style={{ fontWeight: 600 }}>{biz.primary_category}</div>
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {cats.map(c => <span key={c} className="badge badge-purple">{c}</span>)}
        </div>
      </div>

      {/* Similar businesses */}
      {similar.length > 0 && (
        <div className="fade-up">
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.25rem", fontFamily: "Outfit, sans-serif", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 12H8M12 8v8"/></svg>
            Similar Businesses
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem" }}>
            {similar.map(b => <BusinessCard key={b.business_id} biz={b} showSimilarity />)}
          </div>
        </div>
      )}
    </div>
  );
}
