// Moved to src/pages/AppTracker.jsx — this file kept as a re-export shim.
export { default } from "./pages/AppTracker";
// ↓ original file content (unreachable — kept for reference during transition)
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import AuthScreen from "./AuthScreen";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function uid() { return Math.random().toString(36).slice(2, 9); }

function defaultArea() { return { events: [], nextSteps: [""], lastUpdated: null }; }

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+m - 1]} ${+d}, ${y}`;
}

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const baseInput = {
  width: "100%", boxSizing: "border-box",
  background: "#0E0E16", border: "1px solid #252530",
  borderRadius: 6, color: "#DDD", padding: "10px 13px",
  fontSize: 14, fontFamily: "Georgia, serif", outline: "none", display: "block",
};
const ghostBtn = {
  background: "transparent", border: "1px solid #252530",
  borderRadius: 5, color: "#bbb", cursor: "pointer",
  padding: "7px 14px", fontSize: 12, fontFamily: "monospace",
};

// ── EventModal ────────────────────────────────────────────────────────────────
function EventModal({ color, onSave, onClose, initial, isDone }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate]   = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [desc, setDesc]   = useState(initial?.description || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#13131D", border: `1px solid ${color}44`, borderRadius: 10,
        padding: "26px 26px 22px", width: 460, maxWidth: "92vw",
        boxShadow: `0 0 60px ${color}18`,
      }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", color, fontFamily: "monospace", textTransform: "uppercase", marginBottom: 16 }}>
          {isDone ? "✓ Mark as done" : initial ? "Edit event" : "Log event"}
        </div>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title..." style={baseInput} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...baseInput, marginTop: 10, colorScheme: "dark" }} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description — what happened, context for future you, what it means going forward..." rows={4} style={{ ...baseInput, marginTop: 10, resize: "vertical", lineHeight: 1.65 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={() => { if (title && date) onSave({ title, date, description: desc }); }} style={{ ...ghostBtn, background: color + "20", borderColor: color, color }}>
            {isDone ? "Add to timeline" : initial ? "Save changes" : "Add to timeline"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EventRow ──────────────────────────────────────────────────────────────────
function EventRow({ ev, color, isLast, onEdit, onDelete }) {
  const [hov, setHov]   = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", gap: 0, position: "relative" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0, marginRight: 22 }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", marginTop: 5, zIndex: 1, flexShrink: 0,
          background: hov ? color : color + "40", border: `2px solid ${color}`,
          transition: "background 0.15s",
        }} />
        {!isLast && <div style={{ flex: 1, width: 2, background: color + "25", minHeight: 28 }} />}
      </div>

      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 28, cursor: ev.description ? "pointer" : "default" }} onClick={() => ev.description && setOpen(o => !o)}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color, fontFamily: "monospace", letterSpacing: "0.06em", opacity: 0.75, flexShrink: 0 }}>
            {fmtDate(ev.date)}
          </span>
          <span style={{ fontSize: 15, color: hov ? "#FFF" : "#DEDAD4", transition: "color 0.15s" }}>
            {ev.title}
          </span>
          {ev.description && (
            <span style={{ fontSize: 10, color: "#bbb", fontFamily: "monospace", marginLeft: 2 }}>
              {open ? "▲" : "▼"}
            </span>
          )}
        </div>
        {open && ev.description && (
          <div style={{ fontSize: 13.5, color: "#bbb", lineHeight: 1.72, marginTop: 8, paddingRight: 80, borderLeft: `2px solid ${color}20`, paddingLeft: 14 }}>
            {ev.description}
          </div>
        )}
      </div>

      {hov && (
        <div style={{ display: "flex", gap: 5, alignItems: "flex-start", paddingTop: 2, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ ...ghostBtn, padding: "3px 9px", fontSize: 11 }}>edit</button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ ...ghostBtn, padding: "3px 9px", fontSize: 11, color: "#b04040", borderColor: "#b0404033" }}>×</button>
        </div>
      )}
    </div>
  );
}

// ── SortableStep ──────────────────────────────────────────────────────────────
function SortableStep({ id, idx, step, stepsLength, areaInfo, updateStep, removeStep, setDoneStep, addStep }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [hov, setHov] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragging ? "0 4px 20px rgba(0,0,0,0.5)" : "none",
        zIndex: isDragging ? 1 : 0,
        position: "relative",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          width: 14, flexShrink: 0, cursor: isDragging ? "grabbing" : "grab",
          color: areaInfo.color, fontSize: 14,
          opacity: hov ? 0.6 : 0,
          transition: "opacity 0.15s",
          userSelect: "none", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >⠿</div>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: areaInfo.color + "16", border: `1px solid ${areaInfo.color}50`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, color: areaInfo.color, fontFamily: "monospace",
        transition: "background 0.15s",
      }}>
        {idx + 1}
      </div>
      <input
        value={step}
        onChange={e => updateStep(idx, e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") addStep();
          if (e.key === "Backspace" && !step && stepsLength > 1) removeStep(idx);
        }}
        placeholder={idx === 0 ? "The first thing you'd do if you sat down right now..." : "Next step..."}
        style={{
          flex: 1, background: "#0E0E16", border: "1px solid #1E1E2A",
          borderRadius: 5, color: "#C5C2BC", padding: "9px 13px",
          fontSize: 14, fontFamily: "Georgia, serif", outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = areaInfo.color + "60"}
        onBlur={e => e.target.style.borderColor = "#1E1E2A"}
      />
      {step && (
        <button
          title="Mark done — adds to timeline"
          onClick={() => setDoneStep({ idx, title: step })}
          style={{
            background: "transparent", border: `1px solid ${areaInfo.color}40`,
            borderRadius: 4, color: areaInfo.color, cursor: "pointer",
            fontSize: 11, padding: "4px 9px", fontFamily: "monospace",
            flexShrink: 0, letterSpacing: "0.04em",
            transition: "background 0.15s, border-color 0.15s", lineHeight: 1.4,
          }}
          onMouseEnter={e => { e.target.style.background = areaInfo.color + "22"; e.target.style.borderColor = areaInfo.color; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = areaInfo.color + "40"; }}
        >✓ done</button>
      )}
      {stepsLength > 1 && (
        <button onClick={() => removeStep(idx)} style={{ background: "transparent", border: "none", color: "#bbb", cursor: "pointer", fontSize: 19, padding: "2px 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
      )}
    </div>
  );
}

// ── applyActions — pure state reducer for Claude action list ──────────────────
function applyActions(data, customAreas, actions) {
  let nextData = { ...data };
  let nextCA   = [...customAreas];

  for (const action of actions) {
    if (action.type === "create_area") {
      const colors = ["#FF8C69","#57C4E5","#B8E986","#FFB347","#DA70D6","#87CEEB","#FF6B35","#4ECDC4","#A78BFA"];
      const icons  = ["◆","◈","◉","◇","◎","◑","◐","◒","◓"];
      const id = "area_" + Date.now();
      nextCA = [...nextCA, { id, label: action.label, icon: icons[nextCA.length % icons.length], color: colors[nextCA.length % colors.length] }];
      nextData = { ...nextData, [id]: defaultArea() };
      continue;
    }

    const areaId = action.areaId;
    if (!areaId) continue;
    const area = nextData[areaId] || defaultArea();

    if (action.type === "add_event") {
      const events = [...(area.events || []), { id: uid(), title: action.title, date: action.date, description: action.description || "" }]
        .sort((a, b) => a.date.localeCompare(b.date));
      nextData = { ...nextData, [areaId]: { ...area, events, lastUpdated: new Date().toISOString() } };
    } else if (action.type === "add_step") {
      const steps = [...(area.nextSteps || [""]).filter(Boolean), action.text];
      nextData = { ...nextData, [areaId]: { ...area, nextSteps: steps, lastUpdated: new Date().toISOString() } };
    } else if (action.type === "complete_step") {
      const steps = (area.nextSteps || [""]).filter((_, i) => i !== action.stepIndex);
      const events = [...(area.events || []), { id: uid(), title: action.eventTitle, date: action.eventDate || new Date().toISOString().slice(0,10), description: action.eventDescription || "" }]
        .sort((a, b) => a.date.localeCompare(b.date));
      nextData = { ...nextData, [areaId]: { ...area, events, nextSteps: steps.length ? steps : [""], lastUpdated: new Date().toISOString() } };
    } else if (action.type === "remove_step") {
      const steps = (area.nextSteps || [""]).filter((_, i) => i !== action.stepIndex);
      nextData = { ...nextData, [areaId]: { ...area, nextSteps: steps.length ? steps : [""], lastUpdated: new Date().toISOString() } };
    }
  }

  return { nextData, nextCA };
}

// ── UpdateBar ─────────────────────────────────────────────────────────────────
function UpdateBar({ user, data, customAreas, isPro, onApply }) {
  const [text, setText]         = useState("");
  const [listening, setListen]  = useState(false);
  const [loading, setLoading]   = useState(false);
  const [summary, setSummary]   = useState(null);
  const [error, setError]       = useState(null);
  const [showUpgrade, setUpgrade]       = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [areaPrompt, setAreaPrompt] = useState(null); // { pendingActions, candidates }
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const streamRef   = useRef(null);
  const inputRef    = useRef(null);

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
        setLoading(true);
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
            setLoading(false);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          setError(e.message || "Transcription failed.");
          setLoading(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setListen(true);
    }).catch(() => {
      setError("Microphone permission denied.");
    });
  }

  function stopListen() {
    recorderRef.current?.stop();
    setListen(false);
  }

  async function submit(message) {
    if (!message.trim() || loading) return;
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
          {/* Mic button */}
          <button
            onClick={listening ? stopListen : startListen}
            title={listening ? "Stop recording" : "Speak an update"}
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
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

          {/* Text input */}
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(text); } }}
            placeholder={isPro ? "What's new? (speak or type an update…)" : "AI updates — Pro feature"}
            disabled={loading}
            style={{
              flex: 1, background: "#0E0E16",
              border: `1px solid ${loading ? color + "50" : "#1E1E2A"}`,
              borderRadius: 6, color: "#DDD", padding: "9px 13px",
              fontSize: 14, fontFamily: "Georgia, serif", outline: "none",
              transition: "border-color 0.15s",
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={e => e.target.style.borderColor = color + "60"}
            onBlur={e => e.target.style.borderColor = loading ? color + "50" : "#1E1E2A"}
          />

          {/* Send button */}
          <button
            onClick={() => submit(text)}
            disabled={loading || !text.trim()}
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: text.trim() && !loading ? color + "20" : "transparent",
              border: `1px solid ${text.trim() && !loading ? color : "#252530"}`,
              color: text.trim() && !loading ? color : "#444",
              cursor: text.trim() && !loading ? "pointer" : "default",
              fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {loading ? "…" : "↑"}
          </button>
        </div>
      </div>

      <style>{`@keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 ${color}40} 50%{box-shadow:0 0 0 6px ${color}00} }`}</style>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AppTracker() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(undefined); // undefined=loading, null=signed out
  const [data, setData]           = useState(null);
  const [customAreas, setCA]      = useState([]);
  const [active, setActive]       = useState(null);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [saved, setSaved]         = useState(false);
  const [doneStep, setDoneStep]   = useState(null);
  const [isPro, setIsPro]         = useState(false);
  const saveTimer = useRef();
  const stepIdsRef = useRef({ areaId: null, ids: [] });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Auth state listener
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  // Load user data from Firestore when auth state resolves
  useEffect(() => {
    if (user === undefined) return;
    if (!user) { setData(null); setCA([]); setActive(null); return; }
    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        const ca = d.customAreas || [];
        setData(d.areas || {});
        setCA(ca);
        setActive(ca.length > 0 ? ca[0].id : null);
        setIsPro(d.isPro === true);
      } else {
        setData({});
        setCA([]);
        setActive(null);
      }
    })();
  }, [user]);

  // Keep active pointing at a valid area if areas change
  useEffect(() => {
    if (customAreas.length > 0 && (!active || !customAreas.find(a => a.id === active))) {
      setActive(customAreas[0].id);
    }
  }, [customAreas, active]);

  // After sign-up/sign-in, redirect to Stripe if user came from the Plus CTA
  useEffect(() => {
    if (!user || data === null) return;
    if (isPro) { localStorage.removeItem("pendingCheckout"); return; }
    if (localStorage.getItem("pendingCheckout") !== "1") return;
    localStorage.removeItem("pendingCheckout");
    (async () => {
      try {
        const fns = getFunctions();
        const call = httpsCallable(fns, "createCheckoutSession");
        const origin = window.location.origin + "/app";
        const result = await call({ successUrl: origin + "?upgraded=1", cancelUrl: origin });
        window.location.href = result.data.url;
      } catch { /* silent — user can upgrade manually */ }
    })();
  }, [user, data, isPro]);

  function getArea(id) { return data?.[id] || defaultArea(); }

  function persist(nextData, nextCA) {
    if (!user) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await setDoc(doc(db, "users", user.uid), {
        areas: nextData,
        customAreas: nextCA ?? customAreas,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    }, 500);
  }

  function updateArea(id, patch) {
    const next = { ...data, [id]: { ...getArea(id), ...patch, lastUpdated: new Date().toISOString() } };
    setData(next);
    persist(next, customAreas);
  }

  function addEvent(ev) {
    const a = getArea(active);
    const events = [...(a.events || []), { id: uid(), ...ev }].sort((a, b) => a.date.localeCompare(b.date));
    updateArea(active, { events });
    setModal(false);
  }

  function saveEdit(ev) {
    const a = getArea(active);
    const events = (a.events || []).map(e => e.id === editing.id ? { ...e, ...ev } : e).sort((a, b) => a.date.localeCompare(b.date));
    updateArea(active, { events });
    setEditing(null);
  }

  function deleteEvent(id) {
    updateArea(active, { events: (getArea(active).events || []).filter(e => e.id !== id) });
  }

  function updateStep(idx, val) {
    const steps = [...(getArea(active).nextSteps || [""])];
    steps[idx] = val;
    updateArea(active, { nextSteps: steps });
  }
  function addStep() {
    updateArea(active, { nextSteps: [...(getArea(active).nextSteps || [""]), ""] });
  }
  function removeStep(idx) {
    stepIdsRef.current.ids = stepIdsRef.current.ids.filter((_, i) => i !== idx);
    const steps = (getArea(active).nextSteps || [""]).filter((_, i) => i !== idx);
    updateArea(active, { nextSteps: steps.length ? steps : [""] });
  }
  function reorderSteps(oldIdx, newIdx) {
    stepIdsRef.current.ids = arrayMove(stepIdsRef.current.ids, oldIdx, newIdx);
    updateArea(active, { nextSteps: arrayMove(getArea(active).nextSteps || [""], oldIdx, newIdx) });
  }

  function completeStep(idx, ev) {
    const a = getArea(active);
    const events = [...(a.events || []), { id: uid(), ...ev }].sort((a, b) => a.date.localeCompare(b.date));
    const steps = (a.nextSteps || [""]).filter((_, i) => i !== idx);
    updateArea(active, { events, nextSteps: steps.length ? steps : [""] });
    setDoneStep(null);
  }

  function handleAiApply(actions) {
    const { nextData, nextCA } = applyActions(data, customAreas, actions);
    setData(nextData);
    setCA(nextCA);
    persist(nextData, nextCA);
    // Sync stepIdsRef for any new areas
    stepIdsRef.current = { areaId: null, ids: [] };
  }

  function doAddArea() {
    if (!newAreaName.trim()) return;
    const colors = ["#FF8C69","#57C4E5","#B8E986","#FFB347","#DA70D6","#87CEEB","#FF6B35","#4ECDC4","#A78BFA"];
    const icons  = ["◆","◈","◉","◇","◎","◑","◐","◒","◓"];
    const id = "area_" + Date.now();
    const entry = { id, label: newAreaName.trim(), icon: icons[customAreas.length % icons.length], color: colors[customAreas.length % colors.length] };
    const updatedCA = [...customAreas, entry];
    setCA(updatedCA);
    setNewAreaName(""); setAddingArea(false); setActive(id);
    const next = { ...data, [id]: defaultArea() };
    setData(next);
    persist(next, updatedCA);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (user === undefined || (user && data === null)) return (
    <div style={{ minHeight: "100vh", background: "#0D0D12", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontFamily: "monospace", fontSize: 13 }}>
      loading...
    </div>
  );

  if (!user) return <AuthScreen />;

  // ── No areas yet ──────────────────────────────────────────────────────────
  if (customAreas.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0D12", color: "#E2E0DB", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 36px 0", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>{user.email}</span>
          <button onClick={() => signOut(auth).then(() => navigate("/"))} style={{ ...ghostBtn, fontSize: 11 }}>sign out</button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#bbb", textTransform: "uppercase", fontFamily: "monospace" }}>
            retiscape
          </div>
          {addingArea ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <input
                autoFocus value={newAreaName} onChange={e => setNewAreaName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") doAddArea(); if (e.key === "Escape") setAddingArea(false); }}
                placeholder="Area name..."
                style={{ ...baseInput, width: 200, padding: "8px 12px", fontSize: 13 }}
              />
              <button onClick={doAddArea} style={{ ...ghostBtn, padding: "7px 14px", fontSize: 12 }}>Create</button>
              <button onClick={() => setAddingArea(false)} style={{ background: "transparent", border: "none", color: "#bbb", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 400, color: "#bbb", letterSpacing: "-0.01em" }}>
                No areas yet
              </div>
              <div style={{ fontSize: 12, color: "#bbb", fontFamily: "monospace", marginBottom: 4 }}>
                Create your first area to start tracking.
              </div>
              <button onClick={() => setAddingArea(true)} style={{ ...ghostBtn, borderStyle: "dashed", padding: "9px 22px", fontSize: 13 }}>
                + create area
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Full app ──────────────────────────────────────────────────────────────
  const areaInfo = customAreas.find(a => a.id === active) || customAreas[0];
  const area     = getArea(areaInfo.id);
  const events   = [...(area.events || [])].sort((a, b) => a.date.localeCompare(b.date));
  const steps    = area.nextSteps || [""];

  // Stable IDs for dnd-kit — must not change on reorder or dnd-kit snaps back
  if (stepIdsRef.current.areaId !== areaInfo.id) {
    stepIdsRef.current = { areaId: areaInfo.id, ids: steps.map(() => uid()) };
  } else {
    while (stepIdsRef.current.ids.length < steps.length) stepIdsRef.current.ids.push(uid());
    if (stepIdsRef.current.ids.length > steps.length) stepIdsRef.current.ids.length = steps.length;
  }
  const stableStepIds = stepIdsRef.current.ids;

  const hasData = (id) => {
    const a = data[id];
    return a && ((a.events || []).length > 0 || (a.nextSteps || []).some(s => s));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D12", color: "#E2E0DB", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <div>
        <div style={{ padding: "28px 36px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#bbb", textTransform: "uppercase", fontFamily: "monospace" }}>
            retiscape
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {saved && <span style={{ fontSize: 11, color: "#4ECDC4", fontFamily: "monospace", letterSpacing: "0.08em" }}>✓ saved</span>}
            {area.lastUpdated && <span style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>updated {timeAgo(area.lastUpdated)}</span>}
            <span style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>{user.email}</span>
            <button onClick={() => signOut(auth).then(() => navigate("/"))} style={{ ...ghostBtn, fontSize: 11 }}>sign out</button>
          </div>
        </div>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 36px" }}>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 400, letterSpacing: "-0.02em", color: areaInfo.color, transition: "color 0.25s ease" }}>
            {areaInfo.icon}&ensp;{areaInfo.label}
          </h1>
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding: "20px 0 0" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 36px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {customAreas.map(a => (
          <button key={a.id} onClick={() => setActive(a.id)} style={{
            padding: "6px 14px",
            background: active === a.id ? a.color : "transparent",
            color: active === a.id ? "#0D0D12" : hasData(a.id) ? a.color : "#bbb",
            border: `1px solid ${active === a.id ? a.color : hasData(a.id) ? a.color + "55" : "#1E1E28"}`,
            borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "monospace",
            letterSpacing: "0.06em", fontWeight: active === a.id ? 700 : 400,
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5,
          }}>
            {a.icon} {a.label}
            {hasData(a.id) && active !== a.id && <span style={{ width: 4, height: 4, borderRadius: "50%", background: a.color }} />}
          </button>
        ))}

        {addingArea ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input autoFocus value={newAreaName} onChange={e => setNewAreaName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doAddArea(); if (e.key === "Escape") setAddingArea(false); }}
              placeholder="Area name..." style={{ ...baseInput, width: 130, padding: "5px 10px", fontSize: 12 }} />
            <button onClick={doAddArea} style={{ ...ghostBtn, padding: "5px 12px", fontSize: 12 }}>Add</button>
            <button onClick={() => setAddingArea(false)} style={{ background: "transparent", border: "none", color: "#bbb", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        ) : (
          <button onClick={() => setAddingArea(true)} style={{ ...ghostBtn, fontSize: 11, borderStyle: "dashed", padding: "5px 12px" }}>+ area</button>
        )}
      </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, padding: "32px 36px 56px", maxWidth: 780, width: "100%", boxSizing: "border-box", alignSelf: "center" }}>

        {/* Timeline header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#bbb", textTransform: "uppercase", fontFamily: "monospace" }}>
            Progress timeline
          </div>
          <button onClick={() => setModal(true)} style={{
            background: areaInfo.color + "18", border: `1px solid ${areaInfo.color}55`,
            borderRadius: 5, color: areaInfo.color, cursor: "pointer",
            padding: "7px 16px", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.06em",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.target.style.background = areaInfo.color + "30"}
            onMouseLeave={e => e.target.style.background = areaInfo.color + "18"}
          >
            + log event
          </button>
        </div>

        {/* Empty state */}
        {events.length === 0 && (
          <div style={{ paddingLeft: 38, paddingBottom: 32 }}>
            <div style={{ fontSize: 13, color: "#bbb", fontFamily: "monospace" }}>
              No events yet — click "log event" to start your timeline.
            </div>
          </div>
        )}

        {/* Events */}
        <div style={{ position: "relative" }}>
          {events.map((ev, idx) => (
            <EventRow
              key={ev.id}
              ev={ev}
              color={areaInfo.color}
              isLast={idx === events.length - 1}
              onEdit={() => setEditing(ev)}
              onDelete={() => deleteEvent(ev.id)}
            />
          ))}
        </div>

        {/* NEXT STEPS */}
        <div style={{ marginTop: events.length > 0 ? 4 : 0 }}>
          {events.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                <div style={{ width: 2, height: 20, background: areaInfo.color + "25" }} />
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: `2px dashed ${areaInfo.color}70`,
                  background: "transparent",
                }} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: areaInfo.color, textTransform: "uppercase", fontFamily: "monospace", opacity: 0.65 }}>
                Next steps
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#bbb", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 18 }}>
              Next steps
            </div>
          )}

          <div style={{ paddingLeft: events.length > 0 ? 38 : 0, display: "flex", flexDirection: "column", gap: 9 }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active: dragActive, over }) => {
                if (over && dragActive.id !== over.id) {
                  const oldIdx = stableStepIds.indexOf(dragActive.id);
                  const newIdx = stableStepIds.indexOf(over.id);
                  if (oldIdx !== -1 && newIdx !== -1) reorderSteps(oldIdx, newIdx);
                }
              }}
            >
              <SortableContext items={stableStepIds} strategy={verticalListSortingStrategy}>
                {steps.map((step, idx) => (
                  <SortableStep
                    key={stableStepIds[idx]}
                    id={stableStepIds[idx]}
                    idx={idx}
                    step={step}
                    stepsLength={steps.length}
                    areaInfo={areaInfo}
                    updateStep={updateStep}
                    removeStep={removeStep}
                    setDoneStep={setDoneStep}
                    addStep={addStep}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button onClick={addStep} style={{ ...ghostBtn, alignSelf: "flex-start", marginTop: 2, fontSize: 11, padding: "5px 13px" }}>
              + step
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {modal && <EventModal color={areaInfo.color} onSave={addEvent} onClose={() => setModal(false)} />}
      {editing && <EventModal color={areaInfo.color} onSave={saveEdit} onClose={() => setEditing(null)} initial={editing} />}
      {doneStep && (
        <EventModal
          color={areaInfo.color}
          onSave={(ev) => completeStep(doneStep.idx, ev)}
          onClose={() => setDoneStep(null)}
          initial={{ title: doneStep.title, date: new Date().toISOString().slice(0, 10), description: "" }}
          isDone
        />
      )}

      <div style={{ padding: "0 36px 8px", fontSize: 10, color: "#bbb", fontFamily: "monospace", letterSpacing: "0.1em" }}>
        auto-saves · tab to switch area · enter to add step · drag ⠿ to reorder
      </div>

      <UpdateBar
        user={user}
        data={data}
        customAreas={customAreas}
        isPro={isPro}
        onApply={handleAiApply}
      />
    </div>
  );
}
