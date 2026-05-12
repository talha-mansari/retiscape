import { useState } from "react";
import { fmtDate, ghostBtn } from "../lib/utils";

export default function EventRow({ ev, color, isLast, onEdit, onDelete }) {
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
