import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import EntityImageEditor from "@/components/EntityImageEditor";
import form from "@/styles/form.module.css";
import pe from "@/styles/postEditor.module.css";
import { useAdminAutosave } from "@/hooks/useAdminAutosave";
import { jsonSerialize, type MemberFormPayload } from "@/hooks/entityFormTypes";

interface Member {
  id: number;
  name: string;
  status: string;
  link: string;
  is_council: boolean;
  photoUrl?: string;
}

function formatSavedTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export default function EditMember() {
  const [member, setMember] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [link, setLink] = useState("");
  const [isCouncil, setIsCouncil] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<MemberFormPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [manualBusy, setManualBusy] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const parsed = typeof id === "string" ? Number.parseInt(id, 10) : undefined;
  const numericId = parsed != null && !Number.isNaN(parsed) ? parsed : undefined;

  const values = useMemo<MemberFormPayload>(
    () => ({ name, status, link, is_council: isCouncil }),
    [name, status, link, isCouncil]
  );

  const onSaveSuccess = useCallback((payload: MemberFormPayload) => {
    setSavedSnapshot(payload);
    setMember((m) =>
      m
        ? {
            ...m,
            name: payload.name,
            status: payload.status,
            link: payload.link,
            is_council: payload.is_council,
          }
        : m
    );
    setIsCouncil(payload.is_council);
  }, []);

  const buildMemberBody = useCallback(
    (entityId: number, v: MemberFormPayload) => ({
      id: entityId,
      name: v.name,
      status: v.status,
      link: v.link,
      is_council: v.is_council,
    }),
    []
  );

  const { dirty, status: saveStatus, errorMessage, lastSavedAt, saveNow, retry } = useAdminAutosave({
    entityId: numericId,
    values,
    savedSnapshot,
    enabled: !isLoading && !loadError && member != null && savedSnapshot != null,
    serialize: jsonSerialize,
    endpoint: "/api/member/edit",
    buildRequestBody: buildMemberBody,
    onSaveSuccess,
    debounceMs: 1400,
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      void fetchMember(id);
    }
  }, [id]);

  const fetchMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/member/get?id=${memberId}`);
      if (response.ok) {
        const data = (await response.json()) as Member;
        setMember(data);
        setName(data.name);
        setStatus(data.status);
        setIsCouncil(data.is_council);
        setLink(data.link);
        setSavedSnapshot({
          name: data.name,
          status: data.status,
          link: data.link,
          is_council: data.is_council,
        });
        setLoadError("");
      } else {
        setLoadError("Membrul nu a putut fi încărcat.");
      }
    } catch (error) {
      console.error("Error fetching member:", error);
      setLoadError("A apărut o eroare la încărcare.");
    } finally {
      setIsLoading(false);
    }
  };

  const refetchMember = () => {
    if (id && typeof id === "string") {
      void fetchMember(id);
    }
  };

  const onManualSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setManualBusy(true);
    try {
      await saveNow();
    } finally {
      setManualBusy(false);
    }
  };

  const statusLine = (() => {
    if (saveStatus === "saving") {
      return <span className={`${pe.toolbarStatus} ${pe.toolbarStatusSaving}`}>Se salvează…</span>;
    }
    if (saveStatus === "error") {
      return (
        <span className={`${pe.toolbarStatus} ${pe.toolbarStatusError}`}>
          {errorMessage}
          <button type="button" className={pe.retryBtn} onClick={() => retry()}>
            Reîncearcă
          </button>
        </span>
      );
    }
    if (saveStatus === "saved" && lastSavedAt != null) {
      return (
        <span className={`${pe.toolbarStatus} ${pe.toolbarStatusSaved}`}>
          Salvat la {formatSavedTime(lastSavedAt)}
        </span>
      );
    }
    if (dirty) {
      return (
        <span className={pe.toolbarStatus}>
          Modificări nesalvate — se salvează automat după ce încetezi să tastezi.
        </span>
      );
    }
    return <span className={pe.toolbarStatus}>Totul e salvat.</span>;
  })();

  if (isLoading) {
    return (
      <AdminLayout title="Membru">
        <div className={form.loading}>Se încarcă…</div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Membru">
        <div className={form.errorPage} role="alert">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (!member || numericId == null) {
    return (
      <AdminLayout title="Membru">
        <div className={form.errorPage} role="alert">
          Membru inexistent.
        </div>
      </AdminLayout>
    );
  }

  const saveDisabled =
    manualBusy || saveStatus === "saving" || (!dirty && saveStatus !== "error");

  return (
    <AdminLayout title="Editare membru">
      <div className={pe.pageWrap}>
        <div className={pe.toolbar} role="region" aria-label="Salvare">
          {statusLine}
          <div className={pe.toolbarActions}>
            <Link href="/" className={pe.linkQuiet}>
              ← Listă
            </Link>
            <Link href="/member/create" className={pe.linkQuiet}>
              + Membru nou
            </Link>
            <button
              type="submit"
              form="vad-member-form"
              className={pe.saveNowBtn}
              disabled={saveDisabled}
            >
              {manualBusy || saveStatus === "saving" ? "Se salvează…" : "Salvează acum"}
            </button>
          </div>
        </div>

        <h1 className={pe.heroTitle} style={{ marginBottom: "1rem" }}>
          Editare membru
          <span
            style={{
              fontWeight: 500,
              fontSize: "0.85rem",
              color: "var(--vad-muted)",
              marginLeft: "0.5rem",
            }}
          >
            #{numericId}
          </span>
        </h1>

        <div className={pe.layoutGrid}>
          <form
            id="vad-member-form"
            className={pe.formCard}
            onSubmit={(e) => void onManualSave(e)}
          >
            <div className={form.form}>
              <div className={form.formGroup}>
                <label htmlFor="name">Nume</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Numele afișat pe site"
                  autoComplete="off"
                />
                <span className={pe.fieldHint}>Poți completa ulterior; salvarea e automată.</span>
              </div>
              <div className={form.formGroup}>
                <label htmlFor="status">Rol / statut</label>
                <input
                  type="text"
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="ex. voluntar, coordonator…"
                />
              </div>
              <div className={form.formGroup}>
                <label className={form.checkboxLabel} htmlFor="is_council">
                  <input
                    type="checkbox"
                    id="is_council"
                    checked={isCouncil}
                    onChange={(e) => setIsCouncil(e.target.checked)}
                  />
                  Membru al consiliului
                </label>
              </div>
              <div className={form.formGroup}>
                <label htmlFor="link">Link Facebook (opțional)</label>
                <input
                  type="url"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.facebook.com/…"
                />
              </div>
            </div>
          </form>

          <aside className={pe.sideCard} aria-label="Fotografie">
            <p className={pe.sideCardHint}>
              Poza de profil se încarcă aici. Textul din stânga are salvare automată după ce încetezi
              să tastezi.
            </p>
            <EntityImageEditor
              entity="member"
              id={numericId}
              photoUrl={member.photoUrl}
              onUpdate={refetchMember}
            />
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
