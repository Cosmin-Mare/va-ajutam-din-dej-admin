import { useCallback, useEffect, useRef, useState } from "react";

export type AdminSaveStatus = "idle" | "saving" | "saved" | "error";

type Options<T> = {
  entityId: number | undefined;
  values: T;
  savedSnapshot: T | null;
  enabled: boolean;
  serialize: (v: T) => string;
  endpoint: string;
  buildRequestBody: (id: number, payload: T) => Record<string, unknown>;
  onSaveSuccess: (payload: T) => void;
  debounceMs?: number;
};

export function useAdminAutosave<T>({
  entityId,
  values,
  savedSnapshot,
  enabled,
  serialize,
  endpoint,
  buildRequestBody,
  onSaveSuccess,
  debounceMs = 1400,
}: Options<T>) {
  const [status, setStatus] = useState<AdminSaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);
  const onSaveSuccessRef = useRef(onSaveSuccess);
  onSaveSuccessRef.current = onSaveSuccess;

  const dirty =
    savedSnapshot != null && serialize(values) !== serialize(savedSnapshot);

  useEffect(() => {
    if (dirty && status === "saved") {
      setStatus("idle");
    }
  }, [dirty, status]);

  const doSave = useCallback(
    async (payload: T): Promise<boolean> => {
      if (!entityId || !enabled) return false;
      const myId = ++reqIdRef.current;
      setStatus("saving");
      setErrorMessage("");
      try {
        const r = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildRequestBody(entityId, payload)),
        });
        if (myId !== reqIdRef.current) return false;
        if (!r.ok) {
          const d = (await r.json().catch(() => ({}))) as { message?: string };
          setErrorMessage(d.message || "Salvare eșuată");
          setStatus("error");
          return false;
        }
        onSaveSuccessRef.current(payload);
        setStatus("saved");
        setLastSavedAt(Date.now());
        return true;
      } catch {
        if (myId !== reqIdRef.current) return false;
        setErrorMessage("Eroare de rețea");
        setStatus("error");
        return false;
      }
    },
    [entityId, enabled, endpoint, buildRequestBody]
  );

  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return doSave(values);
  }, [doSave, values]);

  const retry = useCallback(() => {
    void doSave(values);
  }, [doSave, values]);

  useEffect(() => {
    if (!dirty || !entityId || !enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void doSave(values);
    }, debounceMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [values, dirty, entityId, enabled, debounceMs, doSave]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return {
    dirty,
    status,
    errorMessage,
    lastSavedAt,
    saveNow,
    retry,
  };
}
