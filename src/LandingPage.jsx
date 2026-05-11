import { useState, useEffect, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const OG = "#FF6B35";   // primary orange
const TL = "#4ECDC4";   // teal accent
const PU = "#A78BFA";   // purple accent
const BG = "#0D0D12";   // background
const TX = "#E2E0DB";   // main text
const MU = "#666666";   // muted text
const BD = "#1E1E2A";   // border
const CB = "#0E0E16";   // card background
const DK = "#141420";   // dark border / divider

// ── CSS keyframes (injected into document) ────────────────────────────────────
const KEYFRAMES = `
  @keyframes demoFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes demoEntryIn {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes demoClickRipple {
    from { transform: translate(-4px,-4px) scale(1);   opacity: 1; }
    to   { transform: translate(-4px,-4px) scale(2.6); opacity: 0; }
  }
  @keyframes demoBlink {
    0%,49%  { opacity: 1; }
    50%,100%{ opacity: 0; }
  }
`;

// ── useIsMobile ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
  );
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

// ── FadeIn — scroll-triggered opacity + slide ─────────────────────────────────
function FadeIn({ children, delay = 0, style: outerStyle = {} }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      ...outerStyle,
    }}>
      {children}
    </div>
  );
}

// ── MockEventRow — one timeline entry inside the demo ─────────────────────────
function MockEventRow({ date, title, isNew }) {
  return (
    <div style={{
      display: "flex",
      animation: isNew ? "demoEntryIn 0.4s ease" : "none",
    }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        width: 12, flexShrink: 0, marginRight: 12,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", marginTop: 2, flexShrink: 0,
          background: isNew ? OG : `${OG}40`,
          border: `2px solid ${OG}`,
        }} />
        <div style={{ flex: 1, width: 2, background: `${OG}25`, minHeight: 14 }} />
      </div>
      <div style={{ paddingBottom: 12 }}>
        <span style={{ fontSize: 8, color: OG, opacity: 0.75, marginRight: 8, fontFamily: "monospace" }}>
          {date}
        </span>
        <span style={{ fontSize: 11, color: "#DEDAD4", fontFamily: "Georgia, serif" }}>
          {title}
        </span>
      </div>
    </div>
  );
}

// ── AnimatedDemo ──────────────────────────────────────────────────────────────
function AnimatedDemo() {
  const containerRef = useRef();
  const [scale, setScale]           = useState(1);
  const [phase, setPhase]           = useState(0);
  const [genomicsTab, setGenomicsTab]         = useState(false);
  const [genomicsActive, setGenomicsActive]   = useState(false);
  const [showModal, setShowModal]             = useState(false);
  const [showNewEntry, setShowNewEntry]       = useState(false);
  const [fieldFocused, setFieldFocused]       = useState(false);
  const [typedLen, setTypedLen]               = useState(0);
  const [clicking, setClicking]               = useState(false);
  const TYPED = "Follow up with PI by Friday";

  // Scale the 700×420 canvas to fit any container width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / 700));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Seamless animation loop
  useEffect(() => {
    let cancelled = false;
    const timers = [];
    let typingTimer = null;

    function sched(ms, fn) {
      const t = setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(t);
    }

    function clearAll() {
      timers.splice(0).forEach(clearTimeout);
      if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    }

    function doClick() {
      setClicking(true);
      const t = setTimeout(() => { if (!cancelled) setClicking(false); }, 300);
      timers.push(t);
    }

    function loop() {
      clearAll();
      if (cancelled) return;
      // Reset all demo state
      setPhase(0);
      setGenomicsTab(false); setGenomicsActive(false);
      setShowModal(false);   setShowNewEntry(false);
      setFieldFocused(false); setTypedLen(0); setClicking(false);

      sched(400,  () => setPhase(1));                                       // cursor glides to "+ new track"
      sched(1800, () => doClick());                                         // click
      sched(2050, () => setGenomicsTab(true));                              // "Genomics Lab" tab fades in
      sched(2300, () => { setGenomicsActive(true); setPhase(2); });         // tab activates (orange)
      sched(2750, () => setPhase(3));                                       // cursor glides to "+ log event"
      sched(4000, () => { doClick(); setShowModal(true); setPhase(4); });   // click → modal appears
      sched(4400, () => setPhase(5));                                       // cursor glides to "Add to timeline"
      sched(5700, () => doClick());                                         // click
      sched(6000, () => { setShowModal(false); setShowNewEntry(true); setPhase(6); }); // entry drops in
      sched(6900, () => setPhase(7));                                       // cursor glides to next steps
      sched(7800, () => { setFieldFocused(true); setPhase(8); });           // field focus
      sched(8300, () => {                                                   // typing starts
        let c = 0;
        typingTimer = setInterval(() => {
          if (cancelled) { clearInterval(typingTimer); return; }
          c++;
          setTypedLen(c);
          if (c >= TYPED.length) { clearInterval(typingTimer); typingTimer = null; }
        }, 70);
      });
      sched(10800, () => {                                                  // pause, then loop
        if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
        sched(1500, loop);
      });
    }

    loop();
    return () => { cancelled = true; clearAll(); };
  }, []);

  // Cursor target positions [x, y] within the 700×420 canvas
  const cursorPos = {
    0: [ 80, 210],  // neutral
    1: [606,  71],  // "+ new track" button
    2: [606,  71],  // tab just appeared
    3: [601, 113],  // "+ log event" button
    4: [601, 113],  // modal opening
    5: [444, 252],  // "Add to timeline" in modal
    6: [444, 252],  // modal closing
    7: [145, 258],  // next steps input field
    8: [145, 258],  // typing
  };
  const [cx, cy] = cursorPos[phase] || [80, 210];

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: 700, margin: "0 auto" }}>
      {/* Shell: correct height for current scale */}
      <div style={{
        width: "100%",
        height: scale * 420,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${BD}`,
        boxShadow: `0 8px 80px rgba(255,107,53,0.07), 0 0 0 1px ${DK}`,
      }}>
        {/* Fixed 700×420 canvas scaled to fit */}
        <div style={{
          width: 700, height: 420,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          background: BG,
          overflow: "hidden",
          userSelect: "none",
        }}>

          {/* ─── App header ─── */}
          <div style={{
            padding: "14px 20px 10px",
            borderBottom: `1px solid ${DK}`,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: "0.22em", color: "#252530", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 4 }}>
                retiscape
              </div>
              <div style={{ fontSize: 16, color: OG, fontFamily: "Georgia, serif", fontWeight: 400, letterSpacing: "-0.01em" }}>
                ◉&ensp;Biology Research
              </div>
            </div>
            <div style={{ fontSize: 9, color: "#252535", fontFamily: "monospace" }}>auto-saves</div>
          </div>

          {/* ─── Tab bar ─── */}
          <div style={{
            padding: "10px 20px",
            borderBottom: `1px solid ${DK}`,
            display: "flex", gap: 6, alignItems: "center",
          }}>
            <div style={{ padding: "4px 10px", background: OG, color: BG, borderRadius: 4, fontSize: 9, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.04em" }}>
              ◉ Biology Research
            </div>
            <div style={{ padding: "4px 10px", color: TL, border: `1px solid ${TL}44`, borderRadius: 4, fontSize: 9, fontFamily: "monospace" }}>
              ◆ MCAT Prep
            </div>
            {genomicsTab && (
              <div style={{
                padding: "4px 10px",
                background: genomicsActive ? OG : "transparent",
                color: genomicsActive ? BG : OG,
                border: `1px solid ${genomicsActive ? OG : OG + "55"}`,
                borderRadius: 4, fontSize: 9, fontFamily: "monospace",
                animation: "demoFadeIn 0.25s ease",
              }}>
                ◑ Genomics Lab
              </div>
            )}
            <div style={{
              marginLeft: "auto",
              padding: "4px 10px", color: "#3A3A48",
              border: "1px dashed #1E1E28", borderRadius: 4,
              fontSize: 9, fontFamily: "monospace",
            }}>
              + new track
            </div>
          </div>

          {/* ─── Body ─── */}
          <div style={{ padding: "14px 20px 0", height: "calc(100% - 92px)", boxSizing: "border-box", overflow: "hidden" }}>

            {/* Timeline header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 7, letterSpacing: "0.2em", color: "#383838", textTransform: "uppercase", fontFamily: "monospace" }}>
                Progress timeline
              </div>
              <div style={{ padding: "4px 10px", background: `${OG}18`, border: `1px solid ${OG}55`, borderRadius: 4, color: OG, fontSize: 8, fontFamily: "monospace" }}>
                + log event
              </div>
            </div>

            <MockEventRow date="Jan 15, 2026" title="First lab rotation" />
            <MockEventRow date="Mar 2, 2026"  title="Completed literature review" />
            {showNewEntry && (
              <MockEventRow date="May 10, 2026" title="Submitted research proposal" isNew />
            )}

            {/* Next steps */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 }}>
                  <div style={{ width: 2, height: 14, background: `${OG}25` }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px dashed ${OG}70` }} />
                </div>
                <div style={{ fontSize: 7, letterSpacing: "0.2em", color: OG, textTransform: "uppercase", fontFamily: "monospace", opacity: 0.65 }}>
                  Next steps
                </div>
              </div>

              <div style={{ paddingLeft: 22, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: `${OG}16`, border: `1px solid ${OG}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, color: OG, fontFamily: "monospace",
                }}>1</div>
                <div style={{
                  flex: 1, background: CB,
                  border: `1px solid ${fieldFocused ? OG + "60" : "#1E1E2A"}`,
                  borderRadius: 4, padding: "5px 8px",
                  fontSize: 10, color: "#C5C2BC", fontFamily: "Georgia, serif",
                  transition: "border-color 0.15s",
                  minHeight: 20, display: "flex", alignItems: "center", overflow: "hidden",
                }}>
                  {typedLen > 0 ? (
                    <>
                      {TYPED.slice(0, typedLen)}
                      <span style={{ animation: "demoBlink 0.9s step-end infinite", color: OG, opacity: 0.9, marginLeft: 1 }}>|</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#252535" }}>The first thing you'd do if you sat down right now...</span>
                      {fieldFocused && (
                        <span style={{ animation: "demoBlink 0.9s step-end infinite", color: OG, opacity: 0.7, marginLeft: 1 }}>|</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Modal overlay ─── */}
          {showModal && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.78)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "demoFadeIn 0.2s ease",
              zIndex: 50,
            }}>
              <div style={{
                background: "#13131D",
                border: `1px solid ${OG}44`,
                borderRadius: 8, padding: "18px 18px 14px",
                width: 280,
                boxShadow: `0 0 40px ${OG}18`,
              }}>
                <div style={{ fontSize: 7, letterSpacing: "0.2em", color: OG, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>
                  Log event
                </div>
                <div style={{ background: CB, border: "1px solid #252530", borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "#DDD", marginBottom: 7, fontFamily: "Georgia, serif" }}>
                  Submitted research proposal
                </div>
                <div style={{ background: CB, border: "1px solid #252530", borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "#888", marginBottom: 10, fontFamily: "Georgia, serif" }}>
                  May 10, 2026
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <div style={{ background: "transparent", border: "1px solid #252530", borderRadius: 4, color: "#666", padding: "5px 10px", fontSize: 9, fontFamily: "monospace" }}>
                    Cancel
                  </div>
                  <div style={{ background: `${OG}20`, border: `1px solid ${OG}`, borderRadius: 4, color: OG, padding: "5px 10px", fontSize: 9, fontFamily: "monospace" }}>
                    Add to timeline
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Animated cursor ─── */}
          <div style={{
            position: "absolute",
            left: cx, top: cy,
            transform: "translate(-2px, -4px)",
            transition: "left 0.75s cubic-bezier(0.25,0.46,0.45,0.94), top 0.75s cubic-bezier(0.25,0.46,0.45,0.94)",
            pointerEvents: "none",
            zIndex: 100,
          }}>
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
              <path
                d="M2 2L2 18L6.5 13.5L9.5 20.5L12 19.5L9 12.5L15 12.5L2 2Z"
                fill="white"
                stroke="rgba(0,0,0,0.45)"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            {clicking && (
              <div style={{
                position: "absolute", top: 0, left: 0,
                width: 24, height: 24, borderRadius: "50%",
                border: `2px solid ${OG}80`,
                animation: "demoClickRipple 0.35s ease-out forwards",
              }} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── LandingPage ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const isMobile = useIsMobile();

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
      <style>{KEYFRAMES}</style>

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
          Retiscape
        </span>
        <button style={ghostNavBtn}>Get started free</button>
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
          <button style={primaryBtn}>Get started free</button>
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
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#444" }}>/ forever</span>
              </div>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: MU, lineHeight: 1.82, marginBottom: 28, flex: 1, marginTop: 20 }}>
                Build your tracker manually. Unlimited tracks, events, and next steps. Yours forever.
              </p>
              <div>
                <button style={primaryBtn}>Get started free</button>
              </div>
            </div>
          </FadeIn>

          {/* Plus — Coming soon */}
          <FadeIn delay={200} style={{ flex: 1 }}>
            <div style={{
              ...card,
              height: "100%", display: "flex", flexDirection: "column",
              position: "relative",
              border: `1px solid ${PU}33`,
              boxShadow: `0 0 48px ${PU}08`,
            }}>
              {/* Badge */}
              <div style={{
                position: "absolute", top: 16, right: 16,
                fontSize: 9, letterSpacing: "0.14em", color: "#555",
                textTransform: "uppercase", fontFamily: "monospace",
                border: "1px solid #252535", borderRadius: 4, padding: "3px 8px",
              }}>
                Coming soon
              </div>

              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: PU, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 14 }}>
                Plus
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 40, color: TX, letterSpacing: "-0.03em", lineHeight: 1 }}>$4</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#444" }}>/ month</span>
              </div>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: MU, lineHeight: 1.82, marginBottom: 28, flex: 1, marginTop: 20 }}>
                Just talk. Tell Retiscape what you've been working on and AI updates your timeline automatically.
              </p>
              <div>
                <button disabled style={{
                  background: "transparent",
                  border: `1px solid ${PU}33`,
                  borderRadius: 6, color: "#444",
                  padding: isMobile ? "13px 26px" : "15px 32px",
                  fontSize: isMobile ? 14 : 15,
                  fontFamily: "Georgia, serif",
                  cursor: "default", letterSpacing: "-0.01em",
                  opacity: 0.55,
                }}>
                  Coming soon
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
          <button style={primaryBtn}>Get started free</button>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════ FOOTER */}
      <footer style={{
        borderTop: `1px solid ${DK}`,
        padding: isMobile ? "36px 24px" : "48px 48px",
        textAlign: "center",
      }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#444", lineHeight: 1.78, marginBottom: 14 }}>
          Built by a pre-med student who needed this. Made for anyone building something long-term.
        </p>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#252535", letterSpacing: "0.08em", margin: 0 }}>
          © 2026 Retiscape
        </p>
      </footer>
    </div>
  );
}
