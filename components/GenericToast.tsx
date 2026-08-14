"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning";

const shownToastKeys = new Set<string>();

export function GenericToast({
  visible,
  message,
  type = "success",
}: {
  visible: boolean;
  message: string;
  type?: ToastType;
}) {
  useEffect(() => {
    if (!visible) return;

    const key = `${type}:${message}`;
    if (shownToastKeys.has(key)) return;

    shownToastKeys.add(key);

    const methods: Record<ToastType, (message: string) => string | number> = {
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
    };

    methods[type](message);
  }, [message, type, visible]);

  useEffect(() => {
    if (visible) return;

    const key = `${type}:${message}`;
    shownToastKeys.delete(key);
  }, [message, type, visible]);

  return null;
}
