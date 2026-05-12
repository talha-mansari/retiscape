import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useUserData(user) {
  const [data, setData] = useState(null);
  const [customAreas, setCA] = useState([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { setData(null); setCA([]); return; }
    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        const ca = d.customAreas || [];
        setData(d.areas || {});
        setCA(ca);
        setIsPro(d.isPro === true);
      } else {
        setData({});
        setCA([]);
      }
    })();
  }, [user]);

  return { data, setData, customAreas, setCA, isPro, setIsPro };
}
