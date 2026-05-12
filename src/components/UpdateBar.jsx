import { useState, useRef, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function UpdateBar({ user, data, customAreas, isPro, onApply }) {
  const [text, setText]         = useState("");
  const [listening, setListen]  = useState(false);
  const [loading, setLoading]   = useState(false);
  const [summary, setSummary]   = useState(null);
  const [error, setError]       = useState(null);
  const [showUpgrade, setUpgrade]       = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [areaPrompt, setAreaPrompt] = useState(null); // { pendingActions, candidates }
  const [transcribing, setTranscribing] = useState(false);
  const [dotPhase, setDotPhase] = useState(0);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const streamRef   = useRef(null);
  const inputRef    = useRef(null);

  const dots = ['.', '..', '...', '..'][dotPhase];
  useEffect(() => {
    if (!transcribing && !loading) { setDotPhase(0); return; }
    const id = setInterval(() => setDotPhase(p => (p + 1) % 4), 350);
    return () => clearInterval(id);
  }, [transcribing, loading]);

  function startListen() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone not supported in this browser.");
      return;
    }
    setError(null);
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result.split(",")[1];
            const fns = getFunctions();
            const call = httpsCallable(fns, "transcribeAudio");
            const result = await call({ audioBase64: base64, mimeType: recorder.mimeType });
            if (result.data.transcript) {
              setText(t => (t + " " + result.data.transcript).trim());
            }
            setTranscribing(false);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          setError(e.message || "Transcription failed.");
          setTranscribing(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
      setListen(true);
    }).catch(() => {
      setError("Microphone permission denied.");
    });
  }

  function stopListen() {
    recorderRef.current?.stop();
    clearInterval(recTimerRef.current);
    setRecSeconds(0);
    setListen(false);
  }

  async function submit(message) {
    if (!message.trim() || loading || transcribing) return;
    if (!isPro) { setUpgrade(true); return; }

    setLoading(true); setError(null); setSummary(null);
    try {
      const fns = getFunctions();
      const call = httpsCallable(fns, "processUpdate");
      const result = await call({ message, projectState: { areas: data, customAreas } });
      const { needsAreaSelection, candidates, actions, summary: s } = result.data;

      if (needsAreaSelection && candidates?.length > 0) {
        setAreaPrompt({ pendingActions: actions, candidates });
      } else {
        onApply(actions);
        setSummary(s || "Done.");
        setText("");
        setTimeout(() => setSummary(null), 4000);
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function resolveArea(areaId) {
    const filled = areaPrompt.pendingActions.map(a => ({ ...a, areaId: a.areaId || areaId }));
    onApply(filled);
    setSummary("Updated.");
    setText("");
    setAreaPrompt(null);
    setTimeout(() => setSummary(null), 4000);
  }

  const color = "#FF6B35";

  return (
    <>
      {/* Area disambiguation overlay */}
      {areaPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
          onClick={() => setAreaPrompt(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#13131D", border: "1px solid #FF6B3544", borderRadius: 10, padding: "24px", width: 360, maxWidth: "92vw" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#FF6B35", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 14 }}>
              Which area?
            </div>
            <div style={{ fontSize: 13, color: "#bbb", marginBottom: 18 }}>
              This update could apply to multiple areas. Pick one:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {areaPrompt.candidates.map(id => {
                const a = customAreas.find(ca => ca.id === id);
                if (!a) return null;
                return (
                  <button key={id} onClick={() => resolveArea(id)} style={{
                    background: a.color + "14", border: `1px solid ${a.color}55`,
                    borderRadius: 6, color: a.color, cursor: "pointer",
                    padding: "10px 16px", fontSize: 13, fontFamily: "Georgia, serif",
                    textAlign: "left", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = a.color + "28"}
                    onMouseLeave={e => e.currentTarget.style.background = a.color + "14"}
                  >
                    {a.icon} {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
          onClick={() => setUpgrade(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#13131D", border: "1px solid #A78BFA44", borderRadius: 10, padding: "28px 28px 24px", width: 360, maxWidth: "92vw", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>✦</div>
            <div style={{ fontSize: 16, color: "#E2E0DB", marginBottom: 10, fontWeight: 400 }}>Pro feature</div>
            <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.7, marginBottom: 20 }}>
              AI-powered updates are available on the Pro plan. Tell Claude what happened and it updates your tracks automatically.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => setUpgrade(false)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, color: "#888", cursor: "pointer", padding: "9px 18px", fontSize: 13, fontFamily: "monospace" }}>
                Not now
              </button>
              <button
                disabled={checkoutLoading}
                onClick={async () => {
                  setCheckoutLoading(true);
                  try {
                    const fns = getFunctions();
                    const call = httpsCallable(fns, "createCheckoutSession");
                    const origin = window.location.origin + window.location.pathname;
                    const result = await call({ successUrl: origin + "?upgraded=1", cancelUrl: origin });
                    window.location.href = result.data.url;
                  } catch (e) {
                    setError(e.message || "Could not start checkout.");
                    setUpgrade(false);
                  } finally {
                    setCheckoutLoading(false);
                  }
                }}
                style={{ background: "#A78BFA20", border: "1px solid #A78BFA", borderRadius: 6, color: "#A78BFA", cursor: checkoutLoading ? "default" : "pointer", padding: "9px 24px", fontSize: 13, fontFamily: "monospace", opacity: checkoutLoading ? 0.6 : 1 }}
              >
                {checkoutLoading ? "Loading…" : "Upgrade to Pro →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bar */}
      <div style={{ position: "sticky", bottom: 0, background: "#0D0D12", borderTop: "1px solid #1E1E2A", padding: "14px 36px 16px" }}>
        {summary && (
          <div style={{ fontSize: 11, color: "#4ECDC4", fontFamily: "monospace", marginBottom: 8, letterSpacing: "0.06em" }}>
            ✓ {summary}
          </div>
        )}
        {error && (
          <div style={{ fontSize: 11, color: "#b04040", fontFamily: "monospace", marginBottom: 8 }}>
            {error}
          </div>
        )}
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Mic button + timer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <button
              onClick={listening ? stopListen : startListen}
              title={listening ? "Stop recording" : "Speak an update"}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: listening ? color + "25" : "transparent",
                border: `1px solid ${listening ? color : "#252530"}`,
                color: listening ? color : "#666",
                cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
                animation: listening ? "micPulse 1.4s ease-in-out infinite" : "none",
              }}
            >
              {listening ? "⏹" : "🎙"}
            </button>
            {listening && (
              <div style={{ fontSize: 9, fontFamily: "monospace", color: color, letterSpacing: "0.05em" }}>
                {`${Math.floor(recSeconds / 60)}:${String(recSeconds % 60).padStart(2, "0")}`}
              </div>
            )}
          </div>

          {/* Text input */}
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              ref={inputRef}
              value={transcribing || loading ? `loading${dots}` : text}
              onChange={e => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(text); } }}
              placeholder={isPro ? "What's new? (speak or type an update…)" : "AI updates — Pro feature"}
              disabled={loading || transcribing}
              readOnly={loading || transcribing}
              rows={1}
              style={{
                width: "100%", background: "#0E0E16", resize: "none", overflow: "hidden",
                border: `1px solid ${(loading || transcribing) ? color + "50" : "#1E1E2A"}`,
                borderRadius: 6, color: "#DDD", padding: "9px 13px",
                fontSize: 14, fontFamily: "Georgia, serif", outline: "none",
                transition: "border-color 0.15s", boxSizing: "border-box",
                opacity: (loading || transcribing) ? 0.6 : 1, lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = color + "60"}
              onBlur={e => e.target.style.borderColor = (loading || transcribing) ? color + "50" : "#1E1E2A"}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => submit(text)}
            disabled={loading || transcribing || !text.trim()}
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: text.trim() && !loading && !transcribing ? color + "20" : "transparent",
              border: `1px solid ${text.trim() && !loading && !transcribing ? color : "#252530"}`,
              color: text.trim() && !loading && !transcribing ? color : "#444",
              cursor: text.trim() && !loading && !transcribing ? "pointer" : "default",
              fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`@keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 ${color}40} 50%{box-shadow:0 0 0 6px ${color}00} }`}</style>
    </>
  );
}
