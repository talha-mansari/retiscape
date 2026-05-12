import { useState } from "react";
import { baseInput, ghostBtn } from "../lib/utils";

export default function EventModal({ color, onSave, onClose, initial, isDone }) {
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
