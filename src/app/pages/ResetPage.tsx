import { useEffect, useState } from "react";
import { getSupabaseClient } from "../utils/supabaseClient";

export default function ResetPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Clear all localStorage
    localStorage.clear();
    
    // Sign out from Supabase
    getSupabaseClient().auth.signOut().catch(console.error);

    // Clear all sessionStorage
    sessionStorage.clear();

    // Delete IndexedDB
    const req = indexedDB.deleteDatabase("SppdFilesDB");
    req.onsuccess = () => {
      setDone(true);
    };
    req.onerror = () => {
      setDone(true);
    };
    req.onblocked = () => {
      setDone(true);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f9fb",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "3rem",
          borderRadius: "1.5rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        {done ? (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>âœ…</div>
            <h2 style={{ color: "#00475e", marginBottom: "0.5rem" }}>
              Reset Berhasil!
            </h2>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Semua data localStorage dan IndexedDB telah dibersihkan.
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                background: "#00475e",
                color: "white",
                borderRadius: "0.75rem",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Kembali ke Login
            </a>
          </>
        ) : (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>â³</div>
            <h2 style={{ color: "#00475e" }}>Membersihkan data...</h2>
          </>
        )}
      </div>
    </div>
  );
}
