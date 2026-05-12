import { useState, useEffect, useRef } from "react";
import { OG, TL, BG, DK, CB } from "../lib/utils";

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

export default function AnimatedDemo() {
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
      <style>{KEYFRAMES}</style>
      {/* Shell: correct height for current scale */}
      <div style={{
        width: "100%",
        height: scale * 420,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${DK}`,
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
