export function uid() { return Math.random().toString(36).slice(2, 9); }

export function defaultArea() { return { events: [], nextSteps: [""], lastUpdated: null }; }

export function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+m - 1]} ${+d}, ${y}`;
}

export function timeAgo(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export function applyActions(data, customAreas, actions) {
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

export const baseInput = {
  width: "100%", boxSizing: "border-box",
  background: "#0E0E16", border: "1px solid #252530",
  borderRadius: 6, color: "#DDD", padding: "10px 13px",
  fontSize: 14, fontFamily: "Georgia, serif", outline: "none", display: "block",
};

export const ghostBtn = {
  background: "transparent", border: "1px solid #252530",
  borderRadius: 5, color: "#bbb", cursor: "pointer",
  padding: "7px 14px", fontSize: 12, fontFamily: "monospace",
};

// Landing page design tokens shared across LandingPage and AnimatedDemo
export const OG = "#FF6B35";
export const TL = "#4ECDC4";
export const PU = "#A78BFA";
export const BG = "#0D0D12";
export const TX = "#E2E0DB";
export const MU = "#888888";
export const BD = "#1E1E2A";
export const CB = "#0E0E16";
export const DK = "#141420";
