"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return createPortal(
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
      <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
      <span>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onDone, 300); }} className="ml-1 text-slate-400 hover:text-white">
        <X size={14} />
      </button>
    </div>,
    document.body
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  let nextId = 0;

  function showToast(message: string) {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message }]);
  }

  function ToastContainer() {
    return (
      <>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} onDone={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </>
    );
  }

  return { showToast, ToastContainer };
}
