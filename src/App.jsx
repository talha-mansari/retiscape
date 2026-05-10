import { useState, useEffect, useRef } from "react";

const AREAS = [
  { id: "atlas",    label: "Atlas App",           icon: "◆", color: "#FF6B35" },
  { id: "medtalk",  label: "Med Talk Blog",        icon: "◈", color: "#4ECDC4" },
  { id: "advocacy", label: "Advocacy / Club",      icon: "◉", color: "#A78BFA" },
  { id: "mcat",     label: "MCAT",                 icon: "◇", color: "#FBD148" },
  { id: "essays",   label: "Essays / Why Med",     icon: "◎", color: "#F9A8D4" },
  { id: "clinical", label: "Clinical / Shadowing", icon: "◑", color: "#6EE7B7" },
  { id: "muhsen",   label: "MUHSEN",               icon: "◐", color: "#FB923C" },
  { id: "wetlab",   label: "Wet Lab",              icon: "◒", color: "#94A3B8" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

const PREFILLED = {
  atlas: {
    events: [
      { id: uid(), date: "2025-09-01", title: "Atlas conceived", description: "Identified racial + gender disparities in special needs diagnoses as a solvable problem. Started researching the heuristic logic that would become the core of the tool." },
      { id: uid(), date: "2026-01-01", title: "Core heuristic logic built", description: "Heuristic logic for the diagnostic tool is complete and grounded in published research. Not yet scientifically formalized — need a faculty PI attached and methodology documented." },
    ],
    nextSteps: [
      "Identify and email 2–3 faculty PIs or research chairs to get scientific backing — URGENT",
      "Informally document your methodology now, even just a Google Doc",
      "Research how to access real diagnostic data (school district data, published datasets)",
      "Draft a school district pitch deck — what would a district need to see to pilot this?",
    ],
    lastUpdated: new Date().toISOString(),
  },
  medtalk: {
    events: [
      { id: uid(), date: "2024-06-01", title: "Med Talk Blog founded", description: "Started blog from scratch. Recruited first writers. Serving as founder, editor-in-chief, and team manager." },
      { id: uid(), date: "2024-12-01", title: "First major publication month", description: "December publication month. ~150–200 unique visitors. 20+ posts live. Team now includes 13–15 writers, editors, a graphics person, and social media." },
      { id: uid(), date: "2025-03-01", title: "3 PhD webinars completed", description: "Hosted postdocs to talk about their research journeys and science communication. Elevated the blog beyond a simple publication into a training pipeline for pre-meds." },
      { id: uid(), date: "2026-05-01", title: "April + May publication months ongoing", description: "130–200 unique visitors on publish months, ~70 on off-months. Blog is maturing. Next milestone: institutional backing from UCR School of Medicine." },
    ],
    nextSteps: [
      "Prep a one-pager with metrics for the UCR School of Medicine pitch",
      "Reach out to UCR SOM to schedule the pitch meeting",
      "Run a simple reader survey — even 10 responses helps the application story",
      "Get a faculty advisor or sponsor attached — this alone elevates the profile significantly",
    ],
    lastUpdated: new Date().toISOString(),
  },
  advocacy: {
    events: [
      { id: uid(), date: "2026-04-01", title: "Jose Medina Q&A at UCR", description: "Riverside County Supervisor District 1 (35-yr educator, newly elected) held a Q&A at UCR. Missed it — but can reach his office through whoever organized the event. He is still building his policy agenda." },
      { id: uid(), date: "2026-05-01", title: "Advocacy landscape mapped", description: "Identified key orgs to plug into: Riverside County SELPA, Inland Regional Center, Autism Society IE, Community Access Center, TASK. UCR SDRC identified as internal club partner. U of Arizona Student Disability Advocacy Club as the model to borrow from." },
    ],
    nextSteps: [
      "Email whoever organized the Jose Medina Q&A at UCR — ask for an intro to his office",
      "Contact UCR's SDRC (sdrc.ucr.edu) — meet about forming a student advocacy org in partnership",
      "Contact Riverside County SELPA (rcselpa.org) — find next community meeting and attend",
      "Look up UCR's process for registering a new student organization",
      "Contact Dr. Edwin Gomez's office (rcoe.us) — Riverside County Superintendent, direct path to special ed policy",
    ],
    lastUpdated: new Date().toISOString(),
  },
  mcat: {
    events: [
      { id: uid(), date: "2026-03-01", title: "Diagnostic MCAT taken", description: "Score: 499. Strong performance in CARS. Weak across bio, biochem, chem, and physics. Target score: 520+." },
      { id: uid(), date: "2026-05-03", title: "Content review underway", description: "Reviewing all sections except CARS through June 10 while taking minimum credits in school and running heavy extracurriculars." },
    ],
    nextSteps: [
      "LOCK IN your test date — work backwards from it now",
      "Don't test too soon after June 10 — need 6–8 weeks of full-length practice",
      "Late July / August is the realistic window",
      "Track content review by section — prioritize weakest areas outside of CARS",
    ],
    lastUpdated: new Date().toISOString(),
  },
  essays: {
    events: [
      { id: uid(), date: "2026-05-03", title: "Why Medicine narrative identified", description: "Core insight mapped out: you work with kids being misdiagnosed due to racial/gender bias and you are building a tool to fix it. The physician identity = diagnostic authority + technical + cultural competency. Narrative is identified but not yet drafted." },
    ],
    nextSteps: [
      "Start a running notes doc — write down specific BT/MUHSEN moments that moved you (this is your essay material)",
      "Draft a rough Why Medicine paragraph: BT work → misdiagnosis bias → Atlas → physician identity",
      "Identify the single most powerful anecdote from your clinical or community work",
      "Email UCR Health Professions Advising — understand the committee letter process for the 2027 cycle",
    ],
    lastUpdated: new Date().toISOString(),
  },
  clinical: {
    events: [
      { id: uid(), date: "2025-06-01", title: "IR shadowing started", description: "Interventional Radiology shadowing — high quality, physician-facing time. Ongoing. Planning to expand to other specialties." },
      { id: uid(), date: "2025-08-01", title: "Behavior Technician role started", description: "6 hrs/week with a Latino child deeper in Riverside. Direct care with an underserved population. Will reach 600+ hours by application time. Strong essay material." },
      { id: uid(), date: "2026-05-01", title: "EMT route ruled out", description: "Clinical story already strong — IR shadowing plus 600+ hours of BT covers the bases. Better to invest remaining time in Atlas, advocacy, and club rather than adding EMT hours. EMT cert held but not pursuing." },
    ],
    nextSteps: [
      "Identify 1–2 shadowing opportunities in pediatrics or neurology (directly relevant to special needs narrative)",
      "Use MUHSEN or BT network for warm physician intros",
      "Keep logging BT hours accurately — 600+ is the target",
      "Document specific moments from shadowing and BT for essays",
    ],
    lastUpdated: new Date().toISOString(),
  },
  muhsen: {
    events: [
      { id: uid(), date: "2025-01-01", title: "MUHSEN Coordinator role started", description: "20 hrs/week coordinating special needs events for the Muslim community across SoCal and the Inland Empire. Intersection of disability, Muslim identity, and underserved communities. Forms a coherent narrative alongside BT work." },
    ],
    nextSteps: [
      "Identify one specific MUHSEN event or moment worth writing about in essays",
      "Look for a leadership expansion — organizing a larger event, training other volunteers",
      "Document impact metrics: families served, events organized, attendees",
    ],
    lastUpdated: new Date().toISOString(),
  },
  wetlab: {
    events: [
      { id: uid(), date: "2024-09-01", title: "Wet lab started", description: "Joined wet lab. Not a passion area — treated strategically as a research credential. Will have ~1400 hours by application time, which checks the research box and lends credibility to Atlas." },
    ],
    nextSteps: [
      "Decide if you are staying in the lab until application — if not, plan the exit timeline",
      "Ask PI if there is any angle connecting the work to diagnostic tools, bias in research, or community health",
      "Make sure you can speak competently about the research in interviews even if it is not your passion",
    ],
    lastUpdated: new Date().toISOString(),
  },
};

const STORAGE_KEY = "app-tracker-v2";

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function saveLocal(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}
async function persistRemote(d) {
  try { if (window.storage) await window.storage.set(STORAGE_KEY, JSON.stringify(d)); } catch {}
}
async function loadRemote() {
  try {
    if (window.storage) {
      const r = await window.storage.get(STORAGE_KEY);
      if (r?.value) return JSON.parse(r.value);
    }
  } catch {}
  return null;
}

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
  borderRadius: 5, color: "#666", cursor: "pointer",
  padding: "7px 14px", fontSize: 12, fontFamily: "monospace",
};

// ── AddEventModal ─────────────────────────────────────────────────────────────
function EventModal({ color, onSave, onClose, initial, initialDate, isDone }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate]   = useState(initial?.date || initialDate || new Date().toISOString().slice(0, 10));
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
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description — what happened, context for future you, what it means for the application..." rows={4} style={{ ...baseInput, marginTop: 10, resize: "vertical", lineHeight: 1.65 }} />
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

// ── EventRow ─────────────────────────────────────────────────────────────────
function EventRow({ ev, color, isLast, onEdit, onDelete }) {
  const [hov, setHov]   = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", gap: 0, position: "relative" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {/* spine + dot */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0, marginRight: 22 }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", marginTop: 5, zIndex: 1, flexShrink: 0,
          background: hov ? color : color + "40", border: `2px solid ${color}`,
          transition: "background 0.15s",
        }} />
        {!isLast && <div style={{ flex: 1, width: 2, background: color + "25", minHeight: 28 }} />}
      </div>

      {/* content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 28, cursor: ev.description ? "pointer" : "default" }} onClick={() => ev.description && setOpen(o => !o)}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color, fontFamily: "monospace", letterSpacing: "0.06em", opacity: 0.75, flexShrink: 0 }}>
            {fmtDate(ev.date)}
          </span>
          <span style={{ fontSize: 15, color: hov ? "#FFF" : "#DEDAD4", transition: "color 0.15s" }}>
            {ev.title}
          </span>
          {ev.description && (
            <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace", marginLeft: 2 }}>
              {open ? "▲" : "▼"}
            </span>
          )}
        </div>
        {open && ev.description && (
          <div style={{ fontSize: 13.5, color: "#777", lineHeight: 1.72, marginTop: 8, paddingRight: 80, borderLeft: `2px solid ${color}20`, paddingLeft: 14 }}>
            {ev.description}
          </div>
        )}
      </div>

      {/* hover actions */}
      {hov && (
        <div style={{ display: "flex", gap: 5, alignItems: "flex-start", paddingTop: 2, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ ...ghostBtn, padding: "3px 9px", fontSize: 11 }}>edit</button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ ...ghostBtn, padding: "3px 9px", fontSize: 11, color: "#b04040", borderColor: "#b0404033" }}>×</button>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AppTracker() {
  const [data, setData]     = useState(null);
  const [customAreas, setCA] = useState([]);
  const [active, setActive]  = useState("atlas");
  const [modal, setModal]    = useState(false);
  const [editing, setEditing] = useState(null);
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [saved, setSaved]    = useState(false);
  const [doneStep, setDoneStep] = useState(null);
  const saveTimer = useRef();

  useEffect(() => {
    (async () => {
      const remote = await loadRemote();
      const local  = loadLocal();
      const stored = remote || local;
      if (stored?.areas && Object.keys(stored.areas).length > 0) {
        setData(stored.areas);
        setCA(stored.customAreas || []);
      } else {
        setData(PREFILLED);
      }
    })();
  }, []);

  const allAreas = [...AREAS, ...customAreas];

  function getArea(id) { return data?.[id] || defaultArea(); }

  function persist(nextData, nextCA) {
    const payload = { areas: nextData, customAreas: nextCA ?? customAreas };
    saveLocal(payload);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await persistRemote(payload);
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
    const a = getArea(active);
    updateArea(active, { events: (a.events || []).filter(e => e.id !== id) });
  }

  function updateStep(idx, val) {
    const a = getArea(active);
    const steps = [...(a.nextSteps || [""])];
    steps[idx] = val;
    updateArea(active, { nextSteps: steps });
  }
  function addStep() {
    const a = getArea(active);
    updateArea(active, { nextSteps: [...(a.nextSteps || [""]), ""] });
  }
  function removeStep(idx) {
    const a = getArea(active);
    const steps = (a.nextSteps || [""]).filter((_, i) => i !== idx);
    updateArea(active, { nextSteps: steps.length ? steps : [""] });
  }

  function completeStep(idx, ev) {
    const a = getArea(active);
    const events = [...(a.events || []), { id: uid(), ...ev }].sort((a, b) => a.date.localeCompare(b.date));
    const steps = (a.nextSteps || [""]).filter((_, i) => i !== idx);
    updateArea(active, { events, nextSteps: steps.length ? steps : [""] });
    setDoneStep(null);
  }

  function doAddArea() {
    if (!newAreaName.trim()) return;
    const colors = ["#FF8C69","#57C4E5","#B8E986","#FFB347","#DA70D6","#87CEEB"];
    const icons  = ["◆","◈","◉","◇","◎","◑","◐","◒","◓"];
    const id = "custom_" + Date.now();
    const entry = { id, label: newAreaName.trim(), icon: icons[customAreas.length % icons.length], color: colors[customAreas.length % colors.length] };
    const updatedCA = [...customAreas, entry];
    setCA(updatedCA);
    setNewAreaName(""); setAddingArea(false); setActive(id);
    const next = { ...data, [id]: defaultArea() };
    setData(next);
    persist(next, updatedCA);
  }

  if (!data) return (
    <div style={{ minHeight: "100vh", background: "#0D0D12", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontFamily: "monospace", fontSize: 13 }}>
      loading...
    </div>
  );

  const area     = getArea(active);
  const areaInfo = allAreas.find(a => a.id === active) || allAreas[0];
  const events   = [...(area.events || [])].sort((a, b) => a.date.localeCompare(b.date));
  const steps    = area.nextSteps || [""];

  const hasData = (id) => {
    const a = data[id];
    return a && ((a.events || []).length > 0 || (a.nextSteps || []).some(s => s));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D12", color: "#E2E0DB", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <div style={{ padding: "28px 36px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#383838", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 6 }}>
            Med School Application · 2027 Cycle
          </div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 400, letterSpacing: "-0.02em", color: areaInfo.color, transition: "color 0.25s ease" }}>
            {areaInfo.icon}&ensp;{areaInfo.label}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 11, color: "#4ECDC4", fontFamily: "monospace", letterSpacing: "0.08em" }}>✓ saved</span>}
          {area.lastUpdated && <span style={{ fontSize: 11, color: "#2C2C38", fontFamily: "monospace" }}>updated {timeAgo(area.lastUpdated)}</span>}
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding: "20px 36px 0", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {allAreas.map(a => (
          <button key={a.id} onClick={() => setActive(a.id)} style={{
            padding: "6px 14px",
            background: active === a.id ? a.color : "transparent",
            color: active === a.id ? "#0D0D12" : hasData(a.id) ? a.color : "#3A3A48",
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
            <button onClick={() => setAddingArea(false)} style={{ background: "transparent", border: "none", color: "#444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        ) : (
          <button onClick={() => setAddingArea(true)} style={{ ...ghostBtn, fontSize: 11, borderStyle: "dashed", padding: "5px 12px" }}>+ area</button>
        )}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, padding: "32px 36px 56px", maxWidth: 780, width: "100%", boxSizing: "border-box" }}>

        {/* Timeline header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#383838", textTransform: "uppercase", fontFamily: "monospace" }}>
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
            <div style={{ fontSize: 13, color: "#2A2A38", fontFamily: "monospace" }}>
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
          {/* connector row */}
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
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#383838", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 18 }}>
              Next steps
            </div>
          )}

          <div style={{ paddingLeft: events.length > 0 ? 38 : 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 3,
                  background: areaInfo.color + "16", border: `1px solid ${areaInfo.color}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: areaInfo.color, fontFamily: "monospace",
                }}>
                  {idx + 1}
                </div>
                <input
                  value={step}
                  onChange={e => updateStep(idx, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") addStep();
                    if (e.key === "Backspace" && !step && steps.length > 1) removeStep(idx);
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
                      flexShrink: 0, marginTop: 3, letterSpacing: "0.04em",
                      transition: "background 0.15s, border-color 0.15s",
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={e => { e.target.style.background = areaInfo.color + "22"; e.target.style.borderColor = areaInfo.color; }}
                    onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = areaInfo.color + "40"; }}
                  >✓ done</button>
                )}
                {steps.length > 1 && (
                  <button onClick={() => removeStep(idx)} style={{ background: "transparent", border: "none", color: "#252535", cursor: "pointer", fontSize: 19, padding: "2px 4px", lineHeight: 1, flexShrink: 0, marginTop: 4 }}>×</button>
                )}
              </div>
            ))}
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

      <div style={{ padding: "0 36px 20px", fontSize: 10, color: "#1E1E28", fontFamily: "monospace", letterSpacing: "0.1em" }}>
        auto-saves · tab to switch area · enter in a step field to add the next one
      </div>
    </div>
  );
}