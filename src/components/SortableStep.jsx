import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableStep({ id, idx, step, stepsLength, areaInfo, updateStep, removeStep, setDoneStep, addStep }) {
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
