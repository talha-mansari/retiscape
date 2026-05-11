import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

const baseInput = {
  width: "100%", boxSizing: "border-box",
  background: "#0E0E16", border: "1px solid #252530",
  borderRadius: 6, color: "#DDD", padding: "10px 13px",
  fontSize: 14, fontFamily: "Georgia, serif", outline: "none", display: "block",
};

function friendlyError(code) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password": return "Incorrect email or password.";
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/invalid-email": return "Invalid email address.";
    case "auth/too-many-requests": return "Too many attempts. Please try again later.";
    default: return "Something went wrong. Please try again.";
  }
}

export default function AuthScreen() {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D12", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ width: 360, maxWidth: "90vw" }}>
        <div style={{ marginBottom: 42, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#666", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>
            progress tracker
          </div>
          <div style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", color: "#E2E0DB" }}>
            retiscape
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoFocus
            style={baseInput}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={baseInput}
          />
          {error && (
            <div style={{ fontSize: 12, color: "#c05050", fontFamily: "monospace", padding: "8px 13px", background: "#c0505012", borderRadius: 5, border: "1px solid #c0505030" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              background: loading ? "#1A1A26" : "#E2E0DB18",
              border: "1px solid #E2E0DB30",
              borderRadius: 5, color: "#E2E0DB", cursor: loading ? "default" : "pointer",
              padding: "11px 0", fontSize: 13, fontFamily: "Georgia, serif",
              letterSpacing: "0.04em", transition: "background 0.15s",
            }}
          >
            {loading ? "·  ·  ·" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <button
            onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); }}
            style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.04em" }}
          >
            {mode === "login" ? "No account? Sign up →" : "Have an account? Log in →"}
          </button>
        </div>
      </div>
    </div>
  );
}
