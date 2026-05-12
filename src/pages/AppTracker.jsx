import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { uid, defaultArea, timeAgo, ghostBtn, applyActions } from "../lib/utils";
import { useAuthState } from "../hooks/useAuthState";
import { useUserData } from "../hooks/useUserData";
import AuthScreen from "./AuthScreen";
import EventModal from "../components/EventModal";
import EventRow from "../components/EventRow";
import SortableStep from "../components/SortableStep";
import UpdateBar from "../components/UpdateBar";

export default function AppTracker() {
  const navigate = useNavigate();
  const user = useAuthState();
  const { data, setData, customAreas, setCA, isPro, setIsPro } = useUserData(user);

  const [active, setActive]       = useState(null);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [saved, setSaved]         = useState(false);
  const [doneStep, setDoneStep]   = useState(null);
  const [hoveredTab, setHoveredTab]       = useState(null);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [areaNameDraft, setAreaNameDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // area id
  const saveTimer = useRef();
  const stepIdsRef = useRef({ areaId: null, ids: [] });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Reset active on sign-out
  useEffect(() => {
    if (!user) setActive(null);
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

  function startRenameArea(id, label) {
    setEditingAreaId(id);
    setAreaNameDraft(label);
  }

  function saveRenameArea() {
    if (!areaNameDraft.trim()) { cancelRenameArea(); return; }
    const updatedCA = customAreas.map(a => a.id === editingAreaId ? { ...a, label: areaNameDraft.trim() } : a);
    setCA(updatedCA);
    persist(data, updatedCA);
    setEditingAreaId(null);
  }

  function cancelRenameArea() {
    setEditingAreaId(null);
    setAreaNameDraft("");
  }

  function deleteArea(id) {
    const updatedCA = customAreas.filter(a => a.id !== id);
    const nextData = { ...data };
    delete nextData[id];
    setCA(updatedCA);
    setData(nextData);
    if (active === id) setActive(updatedCA[0]?.id || null);
    persist(nextData, updatedCA);
    setConfirmDelete(null);
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
                style={{ width: "100%", boxSizing: "border-box", background: "#0E0E16", border: "1px solid #252530", borderRadius: 6, color: "#DDD", padding: "8px 12px", fontSize: 13, fontFamily: "Georgia, serif", outline: "none", display: "block" }}
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
        {customAreas.map(a => {
          const isActive = active === a.id;
          const isEditing = editingAreaId === a.id;
          const isHovered = hoveredTab === a.id;
          return (
            <div
              key={a.id}
              style={{ display: "flex", alignItems: "center", gap: 3 }}
              onMouseEnter={() => setHoveredTab(a.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={areaNameDraft}
                  onChange={e => setAreaNameDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") saveRenameArea();
                    if (e.key === "Escape") cancelRenameArea();
                  }}
                  onBlur={saveRenameArea}
                  style={{
                    padding: "5px 10px", background: a.color + "18",
                    border: `1px solid ${a.color}`, borderRadius: 4,
                    color: a.color, fontSize: 12, fontFamily: "monospace",
                    outline: "none", minWidth: 60,
                    width: Math.max(60, areaNameDraft.length * 8),
                  }}
                />
              ) : (
                <button
                  onClick={() => setActive(a.id)}
                  style={{
                    padding: "6px 14px",
                    background: isActive ? a.color : "transparent",
                    color: isActive ? "#0D0D12" : hasData(a.id) ? a.color : "#bbb",
                    border: `1px solid ${isActive ? a.color : hasData(a.id) ? a.color + "55" : "#1E1E28"}`,
                    borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "monospace",
                    letterSpacing: "0.06em", fontWeight: isActive ? 700 : 400,
                    transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  {a.icon} {a.label}
                  {hasData(a.id) && !isActive && <span style={{ width: 4, height: 4, borderRadius: "50%", background: a.color }} />}
                </button>
              )}
              {isActive && isHovered && !isEditing && (
                <>
                  <button
                    onClick={() => startRenameArea(a.id, a.label)}
                    title="Rename area"
                    style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: 12, padding: "3px 4px", lineHeight: 1, fontFamily: "monospace" }}
                  >✎</button>
                  <button
                    onClick={() => setConfirmDelete(a.id)}
                    title="Delete area"
                    style={{ background: "transparent", border: "none", color: "#b04040", cursor: "pointer", fontSize: 15, padding: "3px 4px", lineHeight: 1 }}
                  >×</button>
                </>
              )}
            </div>
          );
        })}

        {addingArea ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input autoFocus value={newAreaName} onChange={e => setNewAreaName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doAddArea(); if (e.key === "Escape") setAddingArea(false); }}
              placeholder="Area name..." style={{ width: "100%", boxSizing: "border-box", background: "#0E0E16", border: "1px solid #252530", borderRadius: 6, color: "#DDD", padding: "5px 10px", fontSize: 12, fontFamily: "Georgia, serif", outline: "none", display: "block" }} />
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
      {confirmDelete && (() => {
        const target = customAreas.find(a => a.id === confirmDelete);
        return target ? (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
            onClick={() => setConfirmDelete(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#13131D", border: "1px solid #b0404044", borderRadius: 10,
              padding: "26px 26px 22px", width: 400, maxWidth: "92vw",
              boxShadow: "0 0 60px rgba(176,64,64,0.12)",
            }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#b04040", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 16 }}>
                Delete area
              </div>
              <div style={{ fontSize: 14, color: "#DEDAD4", lineHeight: 1.7, marginBottom: 22 }}>
                Delete <span style={{ color: target.color, fontWeight: 500 }}>{target.icon} {target.label}</span>? This will permanently remove the area and all its events and next steps.
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmDelete(null)} style={ghostBtn}>Cancel</button>
                <button onClick={() => deleteArea(confirmDelete)} style={{ ...ghostBtn, background: "#b0404020", borderColor: "#b04040", color: "#b04040" }}>
                  Delete area
                </button>
              </div>
            </div>
          </div>
        ) : null;
      })()}
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
