import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useIsMobile } from "../hooks/useIsMobile";
import FadeIn from "../components/FadeIn";
import AnimatedDemo from "../components/AnimatedDemo";
import { OG, TL, PU, BG, TX, MU, BD, CB, DK } from "../lib/utils";

export default function LandingPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      if (u) navigate("/app", { replace: true });
    });
  }, [navigate]);

  function startCheckout() {
    localStorage.setItem("pendingCheckout", "1");
    navigate("/app");
  }

  // Shared style objects computed once per render
  const sec = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: isMobile ? "72px 24px" : "112px 48px",
  };

  const label = {
    fontSize: 10,
    letterSpacing: "0.22em",
    color: OG,
    textTransform: "uppercase",
    fontFamily: "monospace",
    marginBottom: 18,
  };

  const h2 = {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    fontSize: isMobile ? 28 : 38,
    letterSpacing: "-0.02em",
    color: TX,
    margin: "0 0 20px",
    lineHeight: 1.2,
  };

  const body = {
    fontFamily: "Georgia, serif",
    fontSize: isMobile ? 15 : 17,
    color: MU,
    lineHeight: 1.85,
    margin: 0,
  };

  const primaryBtn = {
    background: OG,
    color: BG,
    border: "none",
    borderRadius: 6,
    padding: isMobile ? "13px 26px" : "15px 32px",
    fontSize: isMobile ? 14 : 15,
    fontFamily: "Georgia, serif",
    cursor: "pointer",
    letterSpacing: "-0.01em",
    display: "inline-block",
    transition: "opacity 0.15s",
  };

  const ghostNavBtn = {
    background: "transparent",
    border: "1px solid #2A2A38",
    borderRadius: 5,
    color: "#888",
    cursor: "pointer",
    padding: "9px 18px",
    fontSize: 12,
    fontFamily: "monospace",
    letterSpacing: "0.05em",
    transition: "border-color 0.15s, color 0.15s",
  };

  const card = {
    background: CB,
    border: `1px solid ${BD}`,
    borderRadius: 10,
    padding: isMobile ? "24px" : "28px 28px 32px",
    boxSizing: "border-box",
  };

  return (
    <div style={{ background: BG, color: TX, fontFamily: "Georgia, serif", minHeight: "100vh" }}>

      {/* ════════════════════════════════════════ NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 999,
        background: `${BG}F0`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${DK}`,
        padding: isMobile ? "16px 24px" : "20px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxSizing: "border-box",
      }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 18 : 22, letterSpacing: "-0.02em", color: TX, fontWeight: 400 }}>
          retiscape
        </span>
        <button style={ghostNavBtn} onClick={() => navigate("/app")}>Get started free</button>
      </nav>

      {/* ════════════════════════════════════════ HERO */}
      <section style={{ ...sec, paddingTop: isMobile ? 80 : 140, paddingBottom: isMobile ? 56 : 80, textAlign: "center" }}>
        <FadeIn>
          <h1 style={{
            fontFamily: "Georgia, serif", fontWeight: 400,
            fontSize: isMobile ? 36 : 62,
            letterSpacing: isMobile ? "-0.02em" : "-0.03em",
            lineHeight: 1.1, color: TX,
            margin: "0 auto 26px",
            maxWidth: 700,
          }}>
            Your entire journey,<br />in one place.
          </h1>
        </FadeIn>
        <FadeIn delay={110}>
          <p style={{ ...body, maxWidth: 540, margin: "0 auto 44px", textAlign: "center", fontSize: isMobile ? 15 : 18, color: "#888" }}>
            A timeline tracker for students building something long-term — med school applications, law school portfolios, creative careers, anything.
          </p>
        </FadeIn>
        <FadeIn delay={220}>
          <button style={primaryBtn} onClick={() => navigate("/app")}>Get started free</button>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════ ANIMATED DEMO */}
      <section style={{
        maxWidth: 780, margin: "0 auto",
        padding: isMobile ? "0 16px 72px" : "0 48px 108px",
      }}>
        <FadeIn>
          <AnimatedDemo />
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════ WHY IT EXISTS */}
      <section style={{ ...sec, borderTop: `1px solid ${DK}` }}>
        <FadeIn>
          <div style={label}>About</div>
          <h2 style={h2}>Built for the long game</h2>
        </FadeIn>
        <FadeIn delay={120}>
          <p style={{ ...body, maxWidth: 620 }}>
            You're doing a lot. Research, volunteering, classes, applications — all at once, over years. Retiscape gives all of it a home so nothing gets lost and future-you always knows where to pick back up.
          </p>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════ VALUE PROPS */}
      <section style={{ ...sec, borderTop: `1px solid ${DK}`, paddingTop: isMobile ? 64 : 88 }}>
        <div style={{ display: "flex", gap: isMobile ? 16 : 20, flexDirection: isMobile ? "column" : "row" }}>
          {[
            {
              icon: "◈",
              title: "Overview each of your tracks",
              body: "See everything you're working on in one place, organized by area of your life.",
            },
            {
              icon: "◎",
              title: "Outline your next steps",
              body: "Every track ends with what comes next, so you never lose the thread when you switch focus.",
            },
            {
              icon: "◑",
              title: "Switch without losing momentum",
              body: "Jump between research, volunteering, essays, and classes without forgetting where you left off.",
            },
          ].map(({ icon, title, body: cardBody }, i) => (
            <FadeIn key={title} delay={i * 100} style={{ flex: 1 }}>
              <div style={{ ...card, height: "100%" }}>
                <div style={{ fontSize: 22, color: OG, marginBottom: 16, lineHeight: 1 }}>{icon}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 16 : 17, color: TX, marginBottom: 12, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                  {title}
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: MU, lineHeight: 1.78 }}>
                  {cardBody}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════ WHO IT'S FOR */}
      <section style={{ ...sec, borderTop: `1px solid ${DK}` }}>
        <FadeIn>
          <div style={label}>Who it's for</div>
        </FadeIn>
        <div style={{ display: "flex", gap: isMobile ? 12 : 14, flexDirection: isMobile ? "column" : "row", marginTop: 8 }}>
          {[
            { type: "Pre-med",    color: OG,        desc: "ECs, shadowing, MCAT prep, personal statements" },
            { type: "Law school", color: TL,        desc: "Internships, clinics, writing samples, recommendations" },
            { type: "Research",   color: PU,        desc: "Lab hours, proposals, publications, presentations" },
            { type: "Creative",   color: "#FFB347", desc: "Portfolio, commissions, exhibitions, client work" },
          ].map(({ type, color, desc }, i) => (
            <FadeIn key={type} delay={i * 80} style={{ flex: 1 }}>
              <div style={{
                background: "transparent",
                border: `1px solid ${color}33`,
                borderRadius: 10, padding: "20px 22px",
                boxSizing: "border-box", height: "100%",
              }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", color, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>
                  {type}
                </div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.72, fontFamily: "Georgia, serif" }}>
                  {desc}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════ FREE VS PLUS */}
      <section style={{ ...sec, borderTop: `1px solid ${DK}` }}>
        <FadeIn>
          <div style={label}>Plans</div>
        </FadeIn>
        <div style={{ display: "flex", gap: isMobile ? 16 : 24, flexDirection: isMobile ? "column" : "row", marginTop: 8 }}>

          {/* Free */}
          <FadeIn delay={100} style={{ flex: 1 }}>
            <div style={{ ...card, height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: OG, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 14 }}>
                Free
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 40, color: TX, letterSpacing: "-0.03em", lineHeight: 1 }}>$0</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>/ forever</span>
              </div>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: MU, lineHeight: 1.82, marginBottom: 28, flex: 1, marginTop: 20 }}>
                Build your tracker manually. Unlimited tracks, events, and next steps. Yours forever.
              </p>
              <div>
                <button style={primaryBtn} onClick={() => navigate("/app")}>Get started free</button>
              </div>
            </div>
          </FadeIn>

          {/* Plus */}
          <FadeIn delay={200} style={{ flex: 1 }}>
            <div style={{
              ...card,
              height: "100%", display: "flex", flexDirection: "column",
              border: `1px solid ${PU}33`,
              boxShadow: `0 0 48px ${PU}08`,
            }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: PU, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 14 }}>
                Plus
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 40, color: TX, letterSpacing: "-0.03em", lineHeight: 1 }}>$4</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>/ month</span>
              </div>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: MU, lineHeight: 1.82, marginBottom: 28, flex: 1, marginTop: 20 }}>
                Just talk. Tell Retiscape what you've been working on and AI updates your timeline automatically.
              </p>
              <div>
                <button
                  onClick={startCheckout}
                  style={{
                    background: `${PU}18`,
                    border: `1px solid ${PU}99`,
                    borderRadius: 6, color: PU,
                    padding: isMobile ? "13px 26px" : "15px 32px",
                    fontSize: isMobile ? 14 : 15,
                    fontFamily: "Georgia, serif",
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${PU}28`}
                  onMouseLeave={e => e.currentTarget.style.background = `${PU}18`}
                >
                  Get started →
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════════════════════════════ FINAL CTA */}
      <section style={{ ...sec, borderTop: `1px solid ${DK}`, textAlign: "center" }}>
        <FadeIn>
          <h2 style={{
            fontFamily: "Georgia, serif", fontWeight: 400,
            fontSize: isMobile ? 30 : 48,
            letterSpacing: isMobile ? "-0.02em" : "-0.03em",
            lineHeight: 1.12, color: TX,
            margin: "0 auto 18px", maxWidth: 580,
          }}>
            Start tracking your journey today.
          </h2>
          <p style={{ ...body, textAlign: "center", margin: "0 auto 40px", maxWidth: 420, fontSize: 15, color: "#888" }}>
            Free forever. No credit card. Built by a student, for students.
          </p>
          <button style={primaryBtn} onClick={() => navigate("/app")}>Get started free</button>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════ FOOTER */}
      <footer style={{
        borderTop: `1px solid ${DK}`,
        padding: isMobile ? "36px 24px" : "48px 48px",
        textAlign: "center",
      }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#888", lineHeight: 1.78, marginBottom: 14 }}>
          Built by a pre-med student who needed this. Made for anyone building something long-term.
        </p>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#666", letterSpacing: "0.08em", margin: 0 }}>
          © 2026 Retiscape
        </p>
      </footer>
    </div>
  );
}
