"use client";
import { useState, useEffect, useCallback, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   Usage:
     const { addToast } = useNotifications();
     addToast({ type: "success", title: "Done!", message: "Bed reserved." });
═══════════════════════════════════════════════ */

const NotificationContext = createContext(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Fallback for components outside provider — silent no-op
    return { addToast: () => {} };
  }
  return ctx;
}

const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const STYLES = {
  success: { bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "#86efac", color: "#15803d", iconBg: "#16a34a" },
  error:   { bg: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "#fca5a5", color: "#b91c1c", iconBg: "#ef4444" },
  warning: { bg: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "#fcd34d", color: "#a16207", iconBg: "#f59e0b" },
  info:    { bg: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "#93c5fd", color: "#1d4ed8", iconBg: "#3b82f6" },
};

function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const s = STYLES[toast.type] || STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 320);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 320);
  };

  return (
    <div
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: "16px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
        maxWidth: "380px",
        width: "100%",
        backdropFilter: "blur(12px)",
        animation: exiting
          ? "toastOut 0.32s cubic-bezier(0.16,1,0.3,1) forwards"
          : "toastIn 0.38s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        cursor: "pointer",
        transition: "transform 0.15s",
      }}
      onClick={handleDismiss}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: s.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          flexShrink: 0,
          boxShadow: `0 4px 12px ${s.iconBg}40`,
        }}
      >
        {ICONS[toast.type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: "13px",
              color: s.color,
              lineHeight: 1.3,
            }}
          >
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p
            style={{
              margin: toast.title ? "3px 0 0" : 0,
              fontSize: "12px",
              color: `${s.color}cc`,
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "6px",
          background: "rgba(0,0,0,0.06)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          color: s.color,
          flexShrink: 0,
          marginTop: "2px",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
      >
        ✕
      </button>
    </div>
  );
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // keep max 5
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <>
          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateX(40px) scale(0.95); }
              to   { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes toastOut {
              from { opacity: 1; transform: translateX(0) scale(1); }
              to   { opacity: 0; transform: translateX(40px) scale(0.95); }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              pointerEvents: "none",
            }}
          >
            {toasts.map((t) => (
              <div key={t.id} style={{ pointerEvents: "auto" }}>
                <Toast toast={t} onDismiss={dismiss} />
              </div>
            ))}
          </div>
        </>
      )}
    </NotificationContext.Provider>
  );
}
