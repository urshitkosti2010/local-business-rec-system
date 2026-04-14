"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const consumerItems = [
  { href: "/", label: "Discover", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  )},
  { href: "/trending", label: "Trending", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
  )},
  { href: "/recommendations", label: "For You", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  )},

];

const ownerItems = [
  { href: "/business-owner", label: "Owner Hub", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>
  )},
  { href: "/business-owner/market-analysis", label: "Market Analysis", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
  )},
  { href: "/business-owner/predict", label: "Success Predictor", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  )},
  { href: "/business-owner/opportunities", label: "Opportunities", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
  )},
];

function NavItem({
  href, label, icon, active, sub = false,
}: { href: string; label: string; icon: React.ReactNode; active: boolean; sub?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: sub ? "0.5rem 0.85rem 0.5rem 1.1rem" : "0.6rem 0.85rem",
        borderRadius: "8px",
        fontSize: sub ? "0.835rem" : "0.875rem",
        fontWeight: active ? 500 : 400,
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        background: active ? "var(--bg-card)" : "transparent",
        borderLeft: active ? "3px solid var(--indigo)" : "3px solid transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        marginBottom: "1px",
      }}>
        <span style={{
          color: active ? "var(--indigo)" : "var(--text-muted)",
          display: "flex",
          flexShrink: 0,
        }}>
          {icon}
        </span>
        {label}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    return path === href || path.startsWith(href + "/");
  };

  return (
    <aside style={{
      width: "240px",
      minHeight: "100vh",
      background: "var(--bg-low)",
      borderRight: "1px solid var(--border)",
      padding: "1.5rem 0.75rem",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: "2rem", padding: "0 0.75rem" }}>
        <div style={{
          fontSize: "1.25rem",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.03em",
        }}>
          BLR Intel
        </div>
        <div style={{
          fontSize: "0.67rem",
          color: "var(--text-muted)",
          marginTop: "2px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}>
          Bengaluru Business
        </div>
      </div>

      {/* Consumer section */}
      <div className="section-label" style={{ marginBottom: "0.35rem" }}>Consumer</div>
      {consumerItems.map(item => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
        />
      ))}

      {/* Owner section */}
      <div className="section-label" style={{ margin: "1.25rem 0 0.35rem" }}>Business Owner</div>
      {ownerItems.map((item, i) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
          sub={i > 0}
        />
      ))}

      {/* Footer */}
      <div style={{
        marginTop: "auto",
        padding: "1rem 0.75rem 0",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "4px" }}>
          <div style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--teal)",
            animation: "pulseGlow 2.5s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 500 }}>Online</span>
        </div>
        <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", opacity: 0.8 }}>Powered by Yelp Dataset</div>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "1px", opacity: 0.5 }}>Remapped to Bengaluru</div>
      </div>
    </aside>
  );
}
