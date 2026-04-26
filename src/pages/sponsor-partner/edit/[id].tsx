import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import EntityImageEditor from "@/components/EntityImageEditor";
import form from "@/styles/form.module.css";
import pe from "@/styles/postEditor.module.css";
import { useAdminAutosave } from "@/hooks/useAdminAutosave";
import { jsonSerialize, type SponsorPartnerFormPayload } from "@/hooks/entityFormTypes";

interface Row {
  id: number;
  name: string;
  websiteUrl: string;
  role: "sponsor" | "partner";
  sortKey: number;
  logoUrl?: string;
}

function formatSavedTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export default function EditSponsorPartner() {
  const [row, setRow] = useState<Row | null>(null);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [role, setRole] = useState<"sponsor" | "partner">("sponsor");
  const [sortKey, setSortKey] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState<SponsorPartnerFormPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [manualBusy, setManualBusy] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const parsed = typeof id === "string" ? Number.parseInt(id, 10) : undefined;
  const numericId = parsed != null && !Number.isNaN(parsed) ? parsed : undefined;

  const values = useMemo<SponsorPartnerFormPayload>(() => {
    const sk = Number.isNaN(sortKey) ? 0 : sortKey;
    return { name, websiteUrl, role, sortKey: sk };
  }, [name, websiteUrl, role, sortKey]);

  const onSaveSuccess = useCallback((payload: SponsorPartnerFormPayload) => {
    setSavedSnapshot(payload);
    setRow((r) =>
      r
        ? {
            ...r,
            name: payload.name,
            websiteUrl: payload.websiteUrl,
            role: payload.role,
            sortKey: payload.sortKey,
          }
        : r
    );
    setRole(payload.role);
    setSortKey(payload.sortKey);
  }, []);

  const buildBody = useCallback((entityId: number, v: SponsorPartnerFormPayload) => {
    return {
      id: entityId,
      name: v.name,
      websiteUrl: v.websiteUrl,
      role: v.role,
      sortKey: v.sortKey,
    };
  }, []);

  const { dirty, status: saveStatus, errorMessage, lastSavedAt, saveNow, retry } = useAdminAutosave({
    entityId: numericId,
    values,
    savedSnapshot,
    enabled: !isLoading && !loadError && row != null && savedSnapshot != null,
    serialize: jsonSerialize,
    endpoint: "/api/sponsor-partner/edit",
    buildRequestBody: buildBody,
    onSaveSuccess,
    debounceMs: 1400,
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      void fetchRow(id);
    }
  }, [id]);

  const fetchRow = async (qid: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sponsor-partner/get?id=${qid}`);
      if (response.ok) {
        const data = (await response.json()) as Row;
        setRow(data);
        setName(data.name);
        setWebsiteUrl(data.websiteUrl);
        setRole(data.role);
        setSortKey(data.sortKey);
        setSavedSnapshot({
          name: data.name,
          websiteUrl: data.websiteUrl,
          role: data.role,
          sortKey: data.sortKey,
        });
        setLoadError("");
      } else {
        setLoadError("Înregistrarea nu a putut fi încărcată.");
      }
    } catch (error) {
      console.error("Error fetching sponsor/partener:", error);
      setLoadError("A apărut o eroare la încărcare.");
    } finally {
      setIsLoading(false);
    }
  };

  const refetchRow = () => {
    if (id && typeof id === "string") {
      void fetchRow(id);
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
      <AdminLayout title="Sponsor / partener">
        <div className={form.loading}>Se încarcă…</div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Sponsor / partener">
        <div className={form.errorPage} role="alert">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (!row || numericId == null) {
    return (
      <AdminLayout title="Sponsor / partener">
        <div className={form.errorPage} role="alert">
          Înregistrare inexistentă.
        </div>
      </AdminLayout>
    );
  }

  const saveDisabled =
    manualBusy || saveStatus === "saving" || (!dirty && saveStatus !== "error");

  return (
    <AdminLayout title="Sponsor / partener">
      <div className={pe.pageWrap}>
        <div className={pe.toolbar} role="region" aria-label="Salvare">
          {statusLine}
          <div className={pe.toolbarActions}>
            <Link href="/" className={pe.linkQuiet}>
              ← Listă
            </Link>
            <Link href="/sponsor-partner/create?role=sponsor" className={pe.linkQuiet}>
              + Sponsor nou
            </Link>
            <Link href="/sponsor-partner/create?role=partner" className={pe.linkQuiet}>
              + Partener nou
            </Link>
            <button
              type="submit"
              form="vad-sponsor-form"
              className={pe.saveNowBtn}
              disabled={saveDisabled}
            >
              {manualBusy || saveStatus === "saving" ? "Se salvează…" : "Salvează acum"}
            </button>
          </div>
        </div>

        <h1 className={pe.heroTitle} style={{ marginBottom: "1rem" }}>
          Sponsor / partener
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
            id="vad-sponsor-form"
            className={pe.formCard}
            onSubmit={(e) => void onManualSave(e)}
          >
            <div className={form.form}>
              <div className={form.formGroup}>
                <label htmlFor="name">Nume (afișat pe site)</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. Denumire firmă sau asociație"
                  autoComplete="off"
                />
                <span className={pe.fieldHint}>
                  Alege dacă e în lista de sponsori sau parteneri mai jos.
                </span>
              </div>
              <div className={form.formGroup}>
                <label htmlFor="role">Afișare</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "sponsor" | "partner")}
                >
                  <option value="sponsor">Sponsori (grila de sus pe site)</option>
                  <option value="partner">Parteneri (grila de jos)</option>
                </select>
              </div>
              <div className={form.formGroup}>
                <label htmlFor="sortKey">Ordine în listă</label>
                <input
                  type="number"
                  id="sortKey"
                  value={sortKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setSortKey(0);
                      return;
                    }
                    const n = Number.parseFloat(v);
                    setSortKey(Number.isNaN(n) ? 0 : n);
                  }}
                  min={0}
                  step={1}
                />
                <span className={pe.fieldHint}>Numere mai mici apar primii. La fel ca pe pagina publică /parteneri.</span>
              </div>
              <div className={form.formGroup}>
                <label htmlFor="websiteUrl">Site web (opțional)</label>
                <input
                  type="url"
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://…"
                />
                <span className={pe.fieldHint}>
                  Dacă lipsește protocolul, se adaugă https:// la salvare.
                </span>
              </div>
            </div>
          </form>

          <aside className={pe.sideCard} aria-label="Logo">
            <p className={pe.sideCardHint}>
              Logo pe site. Textul din stânga are salvare automată după ce încetezi să tastezi.
            </p>
            <EntityImageEditor
              entity="sponsor_partner"
              id={numericId}
              logoUrl={row.logoUrl}
              onUpdate={refetchRow}
            />
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
