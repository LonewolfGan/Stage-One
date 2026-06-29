import { useIsMobile } from "@/hooks/use-mobile";
import { PenWritingText } from "@/components/ui/PenWritingText";

export function HeroSection() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        backgroundColor: "var(--canvas)",
        paddingTop: isMobile ? 140 : 200,
        paddingBottom: isMobile ? 80 : 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* ── Headline with pen-writing animation ── */}
      <h1
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontSize: isMobile ? "clamp(36px, 10vw, 52px)" : "clamp(52px, 6.5vw, 84px)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "var(--ink)",
          maxWidth: 900,
          margin: isMobile ? "0 auto 64px" : "0 auto 96px",
          paddingInline: 20,
          wordBreak: "keep-all",
          hyphens: "none",
        }}
      >
        <PenWritingText duration={6} delay={0.6}>
          {"Votre prochain rendez\u2011vous beauté sans attendre"}
        </PenWritingText>
      </h1>

      {/* ── Large hero image — hidden on mobile ── */}
      {!isMobile && (
        <div
          style={{
            width: "100%",
            maxWidth: 1400,
            paddingInline: 20,
            marginInline: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "clamp(400px, 55vw, 780px)",
              borderRadius: 40,
              overflow: "hidden",
              backgroundColor: "rgba(12,12,14,0.04)",
              position: "relative",
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2574&auto=format&fit=crop"
              alt="Salon de beauté"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(12,12,14,0.15) 0%, transparent 50%)",
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
