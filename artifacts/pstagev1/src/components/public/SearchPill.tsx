import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

export function SearchPill() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    setLocation(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(12, 12, 14, 0.12)",
        borderRadius: 10,
        padding: "6px 6px 6px 16px",
        maxWidth: 480,
      }}
    >
      <Search size={16} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
      <input
        type="text"
        placeholder="Salon, prestation, ville…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize: 14,
          color: "#0C0C0E",
          backgroundColor: "transparent",
        }}
      />
      <button
        type="submit"
        style={{
          height: 32,
          paddingLeft: 14,
          paddingRight: 14,
          backgroundColor: "var(--accent)",
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: 500,
          borderRadius: 9999,
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
          transition: "opacity 140ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
      >
        Rechercher
      </button>
    </form>
  );
}
