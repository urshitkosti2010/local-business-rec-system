"use client";
import { useState, useEffect } from "react";
import { api, Business } from "@/lib/api";
import BusinessCard from "@/components/BusinessCard";

export default function RecommendationsPage() {
  const [userId, setUserId] = useState("");
  const [sampleUsers, setSampleUsers] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.sampleUsers().then(r => setSampleUsers(r.users)).catch(() => {});
  }, []);

  const getRecommendations = async () => {
    if (!userId.trim()) return;
    setLoading(true); setError(""); setSearched(true);
    try {
      const r = await api.recommend(userId.trim());
      setRecommendations(r.recommendations);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get recommendations. User may not have enough reviews.");
      setRecommendations([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ marginBottom: "2.25rem" }}>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span className="gradient-text">Personalised For You</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          SVD collaborative filtering recommendations based on your review history
        </p>
      </div>

      {/* Input section */}
      <div className="glass" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
            Enter your User ID
          </label>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              id="user-id-input"
              className="input"
              placeholder="Paste your user ID…"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && getRecommendations()}
            />
            <button id="recommend-btn" className="btn-primary" onClick={getRecommendations} disabled={loading || !userId.trim()}>
              {loading ? "Loading…" : "Get Picks"}
            </button>
          </div>
        </div>

        {sampleUsers.length > 0 && (
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Try a sample user ID:
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {sampleUsers.slice(0, 5).map(u => (
                <button
                  key={u}
                  className="btn-ghost"
                  style={{ fontSize: "0.72rem", padding: "5px 12px", fontFamily: "monospace" }}
                  onClick={() => setUserId(u)}
                >
                  {u.slice(0, 12)}…
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fade-up" style={{
          background: "rgba(255,110,132,0.08)",
          border: "1px solid rgba(255,110,132,0.2)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          color: "var(--danger)",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <div className="spinner" />
        </div>
      )}

      {searched && !loading && recommendations.length === 0 && !error && (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "3rem" }}>
          No recommendations found for this user.
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="fade-up">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>
            {recommendations.length} personalised picks
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
            {recommendations.map(b => <BusinessCard key={b.business_id} biz={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}
