"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Kind = "success" | "error";
type ToastItem = { id: number; kind: Kind; message: string };
type Notify = (message: string, kind?: Kind) => void;

const ToastContext = createContext<Notify>(() => {});

/** Success/error notifications for every save, edit and delete. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback<Notify>(
    (message, kind = "success") => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {mounted
        ? createPortal(
            <div className="toast-stack" aria-live="polite">
              {items.map((t) => (
                <div key={t.id} className={`toast toast-${t.kind}`} role={t.kind === "error" ? "alert" : "status"}>
                  <span className="toast-icon" aria-hidden>
                    {t.kind === "success" ? "✓" : "!"}
                  </span>
                  <p>{t.message}</p>
                  <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
