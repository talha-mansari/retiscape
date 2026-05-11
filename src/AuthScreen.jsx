import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(friendlyError(err.code));
      setLoading(false);
    }
  }

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

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
          <div style={{ flex: 1, height: 1, background: "#252530" }} />
          <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.08em" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#252530" }} />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: loading ? "#1A1A26" : "#E2E0DB18",
            border: "1px solid #E2E0DB30", borderRadius: 5,
            color: "#E2E0DB", cursor: loading ? "default" : "pointer",
            padding: "11px 0", fontSize: 13, fontFamily: "Georgia, serif",
            letterSpacing: "0.04em", transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: 18, textAlign: "center" }}>
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
