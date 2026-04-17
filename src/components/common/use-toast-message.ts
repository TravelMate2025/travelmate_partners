"use client";

import { useEffect, useRef } from "react";

import { showToast } from "@/components/common/toast";

export function useToastMessage(message: string) {
  const prev = useRef("");

  useEffect(() => {
    if (!message || message === prev.current) {
      return;
    }
    prev.current = message;
    showToast({ message });
  }, [message]);
}
