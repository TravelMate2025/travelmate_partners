"use client";

import { useEffect, useMemo, useState } from "react";

import { toastEventName, type ToastKind, type ToastPayload } from "@/components/common/toast";

type ToastItem = {
  id: string;
  message: string;
  kind: ToastKind;
};

const MAX_TOASTS = 4;

export function ToastCenter() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const custom = event as CustomEvent<ToastPayload>;
      if (!custom.detail?.id || !custom.detail.message) {
        return;
      }
      const next: ToastItem = {
        id: custom.detail.id,
        message: custom.detail.message,
        kind: custom.detail.kind ?? "info",
      };

      setItems((prev) => [next, ...prev].slice(0, MAX_TOASTS));

      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== next.id));
      }, 4200);
    }

    const name = toastEventName();
    window.addEventListener(name, onToast as EventListener);
    return () => {
      window.removeEventListener(name, onToast as EventListener);
    };
  }, []);

  const rendered = useMemo(
    () =>
      items.map((item) => (
        <li
          key={item.id}
          className={`tm-toast tm-toast-${item.kind}`}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium">{item.message}</p>
        </li>
      )),
    [items],
  );

  if (items.length === 0) {
    return null;
  }

  return <ul className="tm-toast-stack">{rendered}</ul>;
}
