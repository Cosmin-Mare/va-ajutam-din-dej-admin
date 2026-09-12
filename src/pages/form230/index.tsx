import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import {
  FORM230_STATUS_LABEL,
  FORM230_STATUSES,
  form230TaxYear,
  type Form230Status,
} from "@/lib/form230-config";
import type { Form230ListRow } from "@/lib/form230-config";
import styles from "./form230.module.css";

async function downloadPost(url: string, body: object, fallbackName: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(j.message || "Export eșuat");
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  const m = cd?.match(/filename="([^"]+)"/);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = m?.[1] || fallbackName;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Form230ListPage() {
  const defaultYear = form230TaxYear();
  const [taxYear, setTaxYear] = useState(defaultYear);
  const [status, setStatus] = useState<Form230Status | "all">("all");
  const [rows, setRows] = useState<Form230ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [nrBorderou, setNrBorderou] = useState("1");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ taxYear: String(taxYear), status });
      const res = await fetch(`/api/form230/list?${params}`);
      const data = (await res.json()) as { rows?: Form230ListRow[]; message?: string };
      if (!res.ok) throw new Error(data.message || "Nu am putut încărca formularele.");
      setRows(data.rows ?? []);
      setSelected({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }, [taxYear, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  const yearOptions = [defaultYear + 1, defaultYear, defaultYear - 1, defaultYear - 2];

  return (
    <AdminLayout title="Formular 230">
      <div className={styles.wrap}>
        <p className={styles.intro}>
          Formularele primite pe site. CNP-ul este mascat în listă. Datele complete apar doar în
          detaliu, după autentificare. Exportul Excel conține CNP-ul întreg — tratează fișierul ca
          document intern.
        </p>
        <div className={styles.filters}>
          <div className={styles.field}>
            <label htmlFor="taxYear">An fiscal</label>
            <select
              id="taxYear"
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Form230Status | "all")}
            >
              <option value="all">Toate</option>
              {FORM230_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {FORM230_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onChange={(e) => {
                      const on = e.target.checked;
                      const next: Record<string, boolean> = {};
                      if (on) for (const r of rows) next[r.id] = true;
                      setSelected(next);
                    }}
                    aria-label="Selectează tot"
                  />
                </th>
                <th>Nume</th>
                <th>CNP</th>
                <th>Localitate</th>
                <th>Durată</th>
                <th>Status</th>
                <th>Data</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Se încarcă…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>Nu există formulare pentru acest an.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(selected[r.id])}
                        onChange={(e) =>
                          setSelected((s) => ({ ...s, [r.id]: e.target.checked }))
                        }
                        aria-label={`Selectează ${r.nume} ${r.prenume}`}
                      />
                    </td>
                    <td>
                      {r.nume} {r.prenume}
                    </td>
                    <td className={styles.mono}>{r.cnpMasked}</td>
                    <td>
                      {r.localitate}
                      {r.judet ? `, ${r.judet}` : ""}
                    </td>
                    <td>{r.durationYears === "1" ? "1 an" : "2 ani"}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[r.status]}`}>
                        {FORM230_STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString("ro-RO")}</td>
                    <td>
                      <Link href={`/form230/${r.id}`}>Detaliu</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footerBar}>
          <span>{selectedIds.length} selectate</span>
          <div className={styles.field}>
            <label htmlFor="nrBorderou">Nr. borderou</label>
            <input
              id="nrBorderou"
              value={nrBorderou}
              onChange={(e) => setNrBorderou(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={busy || selectedIds.length === 0}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await downloadPost(
                  "/api/form230/export-xml",
                  { ids: selectedIds, nrBorderou, markIncluded: true },
                  "B230.xml"
                );
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : "XML eșuat");
              } finally {
                setBusy(false);
              }
            }}
          >
            Generează XML B230
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            disabled={busy || selectedIds.length === 0}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await downloadPost("/api/form230/export-zip", { ids: selectedIds }, "pdf.zip");
              } catch (e) {
                setError(e instanceof Error ? e.message : "ZIP eșuat");
              } finally {
                setBusy(false);
              }
            }}
          >
            ZIP PDF-uri
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            disabled={busy || selectedIds.length === 0}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await downloadPost(
                  "/api/form230/export-excel",
                  { ids: selectedIds },
                  "formular230.xlsx"
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "Excel eșuat");
              } finally {
                setBusy(false);
              }
            }}
          >
            Excel verificare
          </button>
          <select
            disabled={busy || selectedIds.length === 0}
            defaultValue=""
            onChange={async (e) => {
              const next = e.target.value as Form230Status | "";
              e.target.value = "";
              if (!next) return;
              setBusy(true);
              setError("");
              try {
                const res = await fetch("/api/form230/status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ids: selectedIds, status: next }),
                });
                if (!res.ok) throw new Error("Nu am putut actualiza statusul.");
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Eroare status");
              } finally {
                setBusy(false);
              }
            }}
          >
            <option value="">Marchează ca…</option>
            {FORM230_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FORM230_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </AdminLayout>
  );
}
